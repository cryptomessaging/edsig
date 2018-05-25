const crc32c = require('fast-crc32c')
const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')

const DEBUG = true;

module.exports = {
    keypairFromSecret: keypairFromSecret,
    verifyRequestSignature: verifyRequestSignature,
    addAuthorization: addAuthorization,
    verifyContentSignature: verifyContentSignature,
    addCertification: addCertification,
    base64url: base64url,
    CodedError: CodedError
};

function keypairFromSecret(secret) {
    let buf = Buffer.from( secret, 'base64' );    // actually base64url
    return ec.keyFromSecret(buf);    
}

//
// Authorization is used to verify who is making an HTTP request
//

// req { body:, method:, originalUrl:, headers: }
// returns null OR { type:'edsig', pid:<base64url> })
// throws Error on signature failure
function verifyRequestSignature(req) {
    // crack open the authorization header to get the public key and signature
    let authorization = parseSignature(req.headers,'authorization');
    if(!authorization)
        return;  // it's ok!

    // verify specific EdSig request headers and CRC32C of body (if present)
    let reqbytes = reqSummaryToBytes( req );
    let success = authorization.pubkey.verify(reqbytes, authorization.sighex);

    if( DEBUG) console.log( 'Verified?', success );
    if( success )
        return { type:'edsig', pid:authorization.keypath[0] };
    else
        throw new CodedError([4],'EdSig authorization check failed' );
}

// convert HTTP request to a Buffer
// req { body:, method:, originalUrl:, headers: }
function reqSummaryToBytes(req) {

    ensureContentLengthHeader(req.headers,req.body);

    // do a crc32c of the body and add to request
    if( !req.headers['x-content-hash'] ) {
        const bodyHash = crc32c.calculate( req.body );
        req.headers['x-content-hash'] = 'CRC32C ' + bodyHash.toString(16);
    }

    // message is "METHOD path\nheader1value\nheader2value\n...header3value"  (NOTE: NO trailing \n)
    const signHeaders = [
        'content-length',
        'content-type',
        'date',
        'host',
        'x-content-hash' ];     // order is important!
    let message = req.method + ' ' + req.originalUrl;
    signHeaders.forEach(name => {
        let value = req.headers[name] || '';
        message += '\n' + value;
    });

    if( DEBUG ) console.log( 'reqSummaryToBytes()', message );
    return Buffer.from( message );
}

// Amazon Lambda appears to not be passing in content-length, so
// if it's missing, add it back in
function ensureContentLengthHeader(headers,body) {
    if( headers['content-length'] || !body )
        return;

    const length = body.length;
    console.log( 'WARNING: headers missing content-length, adding length of ', length );
    headers['content-length'] = length;
}

// Create an authorization header value from the given Node Request object and an EC keypair
// req { body:, method:, originalUrl:, headers: }
// keypair is elliptic keypair
// Keypath is <pid>[@host1[,host2]...][:subkey]
function createAuthorization( req, keypair, keypath ) {
    // Convert request summary to bytes and sign
    var msg = reqSummaryToBytes( req );
    var sigbytes = Buffer.from( keypair.sign(msg).toBytes() );

    if( !keypath ) {
        // extract public key bytes
        let pubbytes = Buffer.from( keypair.getPublic() );
        keypath = base64url(pubbytes);
    }

    let edsig = 'EdSig kp=' + keypath + ',sig=' + base64url(sigbytes);
    if( DEBUG) console.log( 'Created authorization', edsig );
    return edsig;
}

function addAuthorization( req, keypair, keypath ) {
    req.headers.authorization = createAuthorization( req, keypair, keypath );
}

//
// Certification is provided by the owner of content
//

// pathname is from http://hostname/<pathname>?querystring...
// req = { body:, headers: }
// returns { type:'edsig', pid: }
function verifyContentSignature(pathname,req) {
    let body = req.body;
    let headers = {
        "content-type": req.headers['content-type'],
        "x-created": req.headers['x-created']
    };
    if( req.headers['content-length'] )
        headers['content-length'] = req.headers['content-length'];
    
    let contentbytes = contentSummaryToBytes( pathname, body, headers );

    // crack open the certification header to get the public key and signature
    let certification = parseSignature(req.headers,'x-certification');
    if(!certification)
        throw new CodedError([4],'Missing required header: X-Certification' );

    // verify specific EdSig request headers and CRC32C of body (if present)
    let success = certification.pubkey.verify(contentbytes, certification.sighex);

    if( DEBUG) console.log( 'Certified?', success );
    if( success )
        return { type:'edsig', pid:certification.keypath[0] };
    else
        throw new CodedError([4],'EdSig certification check failed' );
}

// convert content summary(CRC of body,headers,path) to byte Buffer
// headers { content-length, content-type, x-created }
function contentSummaryToBytes(pathname,body,headers) {
    if( DEBUG ) console.log( 'contentSummaryToBytes()', pathname, body, headers );

    ensureContentLengthHeader(headers,body);

    // do a crc32c of the body and add to request
    if( !headers['x-content-hash'] ) {
        const bodyHash = crc32c.calculate( body );
        headers['x-content-hash'] = 'CRC32C ' + bodyHash.toString(16);
    }

    if( !headers['x-created'] )
        headers['x-created'] = (new Date()).toISOString();

    // IMPORTANT to anchor the content to a place in the filesystem
    // message is "pathname\nheader1value\nheader2value\n...header3value"  (NOTE: NO trailing \n)
    const signHeaders = [
        'content-length',
        'content-type',
        'x-created',
        'x-content-hash' ];     // order is important!
    let message = pathname;
    signHeaders.forEach(name => {
        let value = headers[name] || '';
        message += '\n' + value;
    });

    if( DEBUG ) console.log( 'contentSummaryToBytes()', message );
    return Buffer.from( message );
}

// keypath is optional
function createCertification( pathname, body, headers, keypair, keypath ) {
    //console.log( 'createCertification()', pathname, body, headers );
    // Convert request to bytes and sign
    var msg = contentSummaryToBytes( pathname, body, headers );
    var sigbytes = Buffer.from( keypair.sign(msg).toBytes() );

    if( !keypath ) {
        // extract public key bytes
        let pubbytes = Buffer.from( keypair.getPublic() );
        keypath = base64url(pubbytes);
    }

    let edcert = 'EdSig kp=' + keypath + ',sig=' + base64url(sigbytes);
    if( DEBUG) console.log( 'Created certification', edcert );
    return edcert;
}

// pathname is from http://hostname/<pathname>?querystring...
// req { body:, headers: }
// keypair is required
// keypath is optional
// Modifies the req.headers by adding the x-certification header
function addCertification( pathname, req, keypair, keypath ) {
    req.headers['x-certification'] = createCertification( pathname, req.body, req.headers, keypair, keypath );
}

//
// Util
//

// result = NULL or { pubkey:, sighex:, keypath:[ root/pid, child, ... ] }
function parseSignature(headers,name) {
    const signature = headers[name];
    if( !signature ) {
        if( DEBUG) console.log( 'No', name, 'header' );
        return;
    }

    const authFields = signature.split(/\s+/);
    if( authFields[0] != 'EdSig' ) {
        throw new net.ServerError([4],'Unsupported auth scheme ' + authFields[0] + ' in ' + name );
    } else if( authFields.length < 2 ) {
        throw new net.ServerError([4],'Missing required second EdSig parameter for ' + name );
    }

    // extract public key from authorization header
    const kvset = asKVset( authFields[1] );
    const keypath = kvset.kp.split(':'); // rootkey[:sigkey]
    const rootkey = keypath[0]; // NOTE: rootkey and pid are the same thing
    const pubhex = Buffer.from(rootkey, 'base64').toString('hex');  // ec wants hex, so convert from base64url to hex 
    const pubkey = ec.keyFromPublic(pubhex, 'hex');

    // extract 512 bit request signature from authorization header
    const sighex = Buffer.from( kvset.sig, 'base64' ).toString('hex'); 

    return {
        pubkey: pubkey,
        sighex: sighex,
        keypath: keypath
    };
}

// Convert a base64 buffer to a base64url string
// + becomes -, / becomes _, trailing = are removed
// More info at https://tools.ietf.org/html/rfc4648#section-5
// NOTE: Buffer() correctly decodes base64url, so we just need this encode function.
function base64url(buffer){
    let base64 = buffer.toString('base64');    // convert bytes in buffer to 'normal' base64

    // replace web/url unsafe characters and remove trailing '='
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');

    return base64url;
}

function clean(y) {
    return y && trim(y);
}

function trim(x) {
    return x && x.replace(/^\s+|\s+$/gm,'');
}

function asKVset(s) {
    var result = {};
    s.split(',').forEach(function(x){
        var p = x.indexOf('=');
        if( p > -1 ) {
            var key = clean(x.substring(0,p));
            var value = trim(x.substring(p + 1));
            value && (result[key] = value);
        }
    });

    return result;
}

//
// Signals
//

//
// Errors are coded with an integer array.  The leftmost/first number
// is the most significant, with each subsequent number having less
// significance.
//
// The first number is designed to correspond to the major classes
// of HTTP status codes:
// 2 => 2xx, OK status codes
// 4 => 4xx, Request failed due to incorrect client call
// 5 => 5xx, Request failed because of a server error
//

function CodedError(code,message,details) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;

    this.code = code;           // if set, gets used to generate HTTP status code
    this.message = message;     // user friendly(ish) message
    this.details = details;     // techie/support details, if any
}
require('util').inherits(CodedError, Error);

/* Use this method when we DON'T have an Error object
exports.signalNotOk = function(req,res,code,message,details) {
    var err = { code:code, message:message, details:details };
    log(req,code,err);
    res.status(code[0]*100).json({failure:err});
}

// Use this method when we have an Error object
exports.signalError = function(req,res,err) {
    if( err instanceof ServerError && err.code ) {
        log(req,err.code,err);
        res.status( err.code[0]*100).json({failure:err});
    } else {
        log(req,500,err);
        var failure = { code:500, message:err.toString() };
        res.status( 500 ).json( {failure:failure} );
    }
}*/

/*
function log(req,code,err) {
    const details = {
        code:code,
        url:req.originalUrl,
        headers:req.headers,
        auth:req.auth,
        body:req.body    
    }
    console.log( new Date(), 'ERROR:', details, JSON.stringify(err) );
}*/