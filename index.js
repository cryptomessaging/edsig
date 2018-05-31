const crc32c = require('fast-crc32c')
const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')

const DEBUG = false;

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

// path
// req { body:Buffer, method:, headers: }
// returns null OR { type:'edsig', pid:<base64url> })
// throws Error on signature failure
function verifyRequestSignature(path,req) {
    // crack open the authorization header to get the public key and signature
    let authorization = parseSignature(req.headers,'authorization');
    if(!authorization)
        return;  // it's ok!

    // verify specific EdSig request headers and CRC32C of body (if present)
    let summaryBytes = reqSummaryToBytes( path, req );
    let success = authorization.pubkey.verify(summaryBytes, authorization.sighex);

    if( DEBUG) console.log( 'Verified?', success );
    if( success )
        return { type:'edsig', pid:authorization.keypath[0] };
    else
        throw new CodedError([4],'EdSig authorization check failed' );
}

// convert HTTP request to a Buffer
// path
// req { body:Buffer, method:, headers: }
function reqSummaryToBytes(path,req) {

    // Some systems don't pass through the content length...
    ensureContentLengthHeader(req.headers,req.body);

    // message is "METHOD path\nheader1value\nheader2value\n...header3value"  (NOTE: NO trailing \n)
    const signHeaders = [
        'content-length',
        'content-type',
        'date',
        'host',
        'x-content-hash' ];     // order is important!
    let message = req.method + ' ' + path;
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
// path - pathname[?querystring]
// req { body:Buffer, method:, headers: }
// keypair is elliptic keypair
// Keypath is <pid>[@host1[,host2]...][:subkey]
function createAuthorization( path, req, keypair, keypath ) {
    // do a crc32c of the body and add to request
    const bodyHash = crc32c.calculate( req.body );
    req.headers['x-content-hash'] = 'CRC32C ' + bodyHash.toString(16);

    // Convert request summary to bytes and sign
    var summaryBytes = reqSummaryToBytes( path, req );
    var sigbytes = Buffer.from( keypair.sign(summaryBytes).toBytes() );

    if( !keypath ) {
        // extract public key bytes to make a simple <pid> path
        let pubbytes = Buffer.from( keypair.getPublic() );
        keypath = base64url(pubbytes);
    }

    let edsig = 'EdSig kp=' + keypath + ',sig=' + base64url(sigbytes);
    if( DEBUG) console.log( 'Created authorization', edsig );
    return edsig;
}

function addAuthorization( path, req, keypair, keypath ) {
    req.headers.authorization = createAuthorization( path, req, keypair, keypath );
}

//
// Certification is provided by the owner of content
//

// path of request, WILL be used for verification if the x-content-path was specified
// req = { body:Buffer, headers: }
// returns { type:'edsig', headers:, pid: }
function verifyContentSignature(path,req) {
    let body = req.body;

    // use a copy of the headers to avoid polluting the source
    let headers = normalizeHeaders( copyHeaders(req.headers) );
    let summaryBytes = contentSummaryToBytes( headers, body );

    // crack open the certification header to get the public key and signature
    let certification = parseSignature(headers,'x-certification');
    if(!certification)
        throw new CodedError([4],'Missing required header: X-Certification' );

    // verify specific EdSig request headers and CRC32C of body (if present)
    let success = certification.pubkey.verify(summaryBytes, certification.sighex);

    if( DEBUG) console.log( 'Certified?', success );
    if( success )
        return { type:'edsig', headers:headers, pid:certification.keypath[0] };
    else
        throw new CodedError([4],'EdSig certification check failed' );
}

// headers { content-length:, content-type:, x-created:, x-content-hash:,x-content-path }
// body: Buffer
function contentSummaryToBytes(headers,body) {
    // Seems Lambda doesn't pass this through... so make sure we have it
    ensureContentLengthHeader(headers,body);

    // message is "header1value\nheader2value\n...header3value"  (NOTE: NO trailing \n)
    const signHeaders = [
        //'content-length',
        'content-type',
        'x-created',
        'x-content-hash',
        'x-content-path' ];     // order is important!
    let message = headers['content-length'];
    signHeaders.forEach(name => {
        let value = headers[name] || '';
        message += '\n' + value;
    });

    if( DEBUG ) console.log( 'contentSummaryToBytes()', headers, message );
    return Buffer.from( message );
}

// keypath is optional
function createCertification( contentPath, body, headers, keypair, keypath ) {
    // do a crc32c of the body and add to request
    if( !headers['x-content-hash'] ) {
        const bodyHash = crc32c.calculate( body );
        headers['x-content-hash'] = 'CRC32C ' + bodyHash.toString(16);
    }

    if( !headers['x-created'] )
        headers['x-created'] = (new Date()).toISOString();

    if( contentPath )
        headers['x-content-path'] = contentPath;

    // Convert request to bytes and sign
    let summaryBytes = contentSummaryToBytes( headers, body );
    let sigbytes = Buffer.from( keypair.sign(summaryBytes).toBytes() );

    if( !keypath ) {
        // extract public key bytes
        let pubbytes = Buffer.from( keypair.getPublic() );
        keypath = base64url(pubbytes);
    }

    let edcert = 'EdSig kp=' + keypath + ',sig=' + base64url(sigbytes);
    if( DEBUG) console.log( 'Created certification', edcert );
    return edcert;
}

// contentPath - optional path to anchor content within url
// req { body:Buffer, headers: }
// keypair is required
// keypath is optional
// Modifies the req.headers by adding the x-certification header and other headers as necessary
function addCertification( contentPath, req, keypair, keypath ) {
    req.headers['x-certification'] = createCertification( contentPath, req.body, req.headers, keypair, keypath );
}

//
// Util
//

// copy ALL headers
function copyHeaders(headers) {
    let result = {};
    Object.keys(headers).forEach( k => {
        if( headers[k] ) result[k] = headers[k];
    });
    return result;
}

const CONTENT_SIGNATURE_HEADERS = [
        'x-certification',
        'content-length',
        'content-type',
        'x-created',
        'x-content-hash',
        'x-content-path' ];

// Amazon only supports x-amz-meta- headers, so add back the original values
// AND filter out the non-signature headers
function normalizeHeaders(headers) {
    Object.keys(headers).forEach( k=>{
        let lowkey = k.toLowerCase();
        if( lowkey.indexOf('x-amz-meta-') == 0 ) {
            let newkey = 'x-' + lowkey.substring('x-amz-meta-'.length);
            headers[newkey] = headers[k];
        }

        if( !CONTENT_SIGNATURE_HEADERS.includes(k) )
            delete headers[k];   
    });

    return headers;
}

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
