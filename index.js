const crc32c = require('fast-crc32c')
const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')

const DEBUG = false;

module.exports = {
    createPersona: createPersona,
    keypairFromSecret: keypairFromSecret,
    verifyRequestSignature: verifyRequestSignature,
    addAuthorization: addAuthorization,
    verifyContentSignature: verifyContentSignature,
    addCertification: addCertification,
    base64url: base64url,
    CodedError: CodedError
};

//
// Prototypes that provide subsets of Node objects
//

/**
 * Provides a subset of the Node.js Request Module, which is useful for
 * passing around basic HTTP request values.
 */
class HttpRequest {
    /**
     * Create an HttpRequest.
     * @param {string} method - POST, GET, etc.
     * @param {object} headers - Simple map of HTTP header names to values
     * @param {Buffer} body - Content of request.  Can be null or a string.
     */
    constructor(method,headers,body) {
        this.method = method;
        this.headers = headers;
        this.body = body;
    }
}

//
// Authorization is used to verify who is making an HTTP request
//

/** Verification result from both verifyRequestSignature()
 * and verifyContentSignature() methods. 
 */
class EdsigVerification {
    /**
     * Create an EdSig verification for the given pid.
     * @param {string} pid - A base64url encoded public key
     */
    constructor(pid) {
        this.type = 'edsig';
        this.pid = pid;
    }
}

/** 
 * Verify an HTTP request signature.
 * @param {string} path - pathname of request including query string
 * @req {HttpRequest} req - Node like Request structure containing method, headers, and body proeprties
 * @return {EdsigVerification} - when authorization succeeds, or null when no authorization header presented
 * @throws Error when authorization header is present, but signature check fails
 */
function verifyRequestSignature(path,req) {
    // crack open the authorization header to get the public key and signature
    let authorization = Signature.parse(req.headers,'authorization');
    if( !authorization )
        return;  // it's ok!

    // make sure content-length and x-content-hash match body
    addContentHeaders(req.headers,req.body);

    // verify specific EdSig request headers
    let summaryBytes = reqSummaryToBytes( req.method, path, req.headers );
    let success = authorization.pubkey.verify(summaryBytes, authorization.sighex);

    if( DEBUG) console.log( 'Verified?', success );
    if( success )
        return { type:'edsig', pid:authorization.keypath[0] };
    else
        throw new CodedError([4],'EdSig authorization check failed' );
}

/**
 * Convert HTTP request method, path, and certain headers to a Buffer. Format of
    buffer is "METHOD path\nheader1value\nheader2value\n...headerNvalue"
 * @param {string} method - HTTP method, i.e. GET, POST, PUT
 * @param {string} path - pathname, including query string if any.
 * @param {object} headers - Simple map of header names to values.
 * @return {Buffer} Summary string of rewquest.
 */
function reqSummaryToBytes(method,path,headers) {
    const SIGNATURE_HEADERS = [
        'content-length',
        'content-type',
        'date',
        'host',
        'x-content-hash' ];     // order is important!
    let message = method + ' ' + path;
    SIGNATURE_HEADERS.forEach(name => {
        let value = headers[name] || '';
        message += '\n' + value;
    });

    if( DEBUG ) console.log( 'reqSummaryToBytes()', message );
    return Buffer.from( message );
}

//
// Create an authorization for an HTTP request
//

/**
 * Create an authorization header value from the given Node Request object and an
 * elliptic curve keypair.
 * @param {string} path - "/pathname[?querystring]"
 * @param {HttpRequest} req - Node.js like Request including method, headers, and body properties.
 * @param {Keypair} keypair - an elliptic curve keypair
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used.
 */
function createAuthorization( path, req, keypair, keypath ) {
    // if there is a body, add the x-content-hash and content-length headers
    addContentHeaders(req.headers,req.body) 

    // Convert request summary to bytes and sign
    var summaryBytes = reqSummaryToBytes( req.method, path, req.headers );
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

/**
 * Add an authorization header value to the provided req.headers map.
 * @param {string} path - "/pathname[?querystring]"
 * @param {HttpRequest} req - Node.js like Request including method, headers, and body properties.
 * @param {Keypair} keypair - an elliptic curve keypair
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used.
 */
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
    addContentHeaders(headers,body);
    let summaryBytes = contentSummaryToBytes( headers, body );

    // crack open the certification header to get the public key and signature
    let certification = Signature.parse(headers,'x-certification');
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

/**
 * Convert the headers and body to a content summary string that can be signed or verified.  The
 * following headers are used for the summary: content-length, content-type, x-created,
 * x-content-hash, and x-content-path.
 * @param {object} headers
 * @param {Buffer} body
 * @return {string}
 */
function contentSummaryToBytes(headers,body) {
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

/**
 * Create a certification header value.
 * @param {string} contentPath - OPTIONAL path to anchor content within url
 * @param {Buffer} body
 * @param {object} headers - HTTP headers
 * @param {Keypair} keypair - an elliptic curve keypair
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used.
 */
function createCertification( contentPath, body, headers, keypair, keypath ) {
    // do a crc32c of the body and add to request
    addContentHeaders(headers,body);

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

/**
 * Modifies the req.headers by adding the x-certification header and other headers as necessary
 * @param {string} contentPath - OPTIONAL path to anchor content within url
 * @param {HttpRequest} req
 * @param {Keypair} keypair - an elliptic curve keypair
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used.
 */
function addCertification( contentPath, req, keypair, keypath ) {
    req.headers['x-certification'] = createCertification( contentPath, req.body, req.headers, keypair, keypath );
}

//
// Util
//

/**
 * Add the content-length and x-content-hash HTTP headers for the given body.
 * @param {object} headers
 * @param {Buffer} body
 */
function addContentHeaders(headers,body) {
    headers['content-length'] = body ? body.length : 0;
    headers['x-content-hash'] = hashBody( body );
}

/**
 * Provides an HTTP ready representation of the CRC32C hash of the body.
 * @param {Buffer} body - Body can be a buffer or string
 * @return {string}
 */
function hashBody(body) {
    if( !body )
        body = new Buffer();
    else if( typeof body === 'string' )
        body = Buffer.from( body );
    else if( body instanceof Buffer )
        ;
    else
        throw new CodedError([5],'Body is not a Buffer or String, but a ' + typeof body );

    //let empty = crc32c.calculate( new Buffer() ).toString(16);
    //console.log( 'empty', empty );

    return 'CRC32C ' + crc32c.calculate( body ).toString(16);
}

/**
 * Copy all headers.
 * @poaram {object} headers - map of key/value pairs.
 * @return A simple copy of the map.
 */
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

/**
 * Amazon only supports x-amz-meta- headers, so add back the original values
 * AND filter out the non-signature headers.
 * @param {object} headers - map of heaver name to values, including Amazon specific x-amz-meta ones.
 * @return The provided map.
 */
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

/** Contains the parsed values from an EdSig signature header */
class Signature {
    /**
     * Create an EdSig Signature from the parsed values.
     * @param {Keypair} pubkey - Public Elliptic keypair
     * @param {} sighex - The signature in hexadecimal
     * @param {string} keypath - A simple pid, or complex <pid>:<subkey>@host1,host2,..hostN
     */
    constructor(pubkey,sighex,keypath) {
        this.pubkey = pubkey;
        this.sighex = sighex;
        this.keypath = keypath;
    }

    /**
     * Parse an EdSig authorization or x-certification header in the form "EdSig kp=<keypath>,sig=<base64url signature>"
     * @param {object} headers - HTTP header map
     * @param {string} name - name of HTTP header to parse, 'authorization' or 'x-certification'
     * @return {Signature} or null
     * @throws Error When an unsupported auth scheme is found, or required parameters are missing.
     */
    static parse(headers,name) {
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

        return new Signature(pubkey, sighex, keypath );
    }
}

/**
 * Convert a base64 buffer to a base64url string.
 * The character + becomes -, / becomes _, trailing = are removed
 * More info at https://tools.ietf.org/html/rfc4648#section-5
 * NOTE: Buffer() correctly decodes base64url, so we just need this encode function.
 * @param {Buffer} buffer
 * @return {string} base64url representation of buffer
 */
function base64url(buffer){
    let base64 = buffer.toString('base64');    // convert bytes in buffer to 'normal' base64

    // replace web/url unsafe characters and remove trailing '='
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
    return base64url;
}

/**
 * Trim the whitespace off a string.  If the string is null simply return null.
 * @param {string} y
 * @return {string} 
 */
function clean(y) {
    return y && trim(y);
}

/**
 * Trim the whitespace off a string.  If the string is null simply return null.
 * @param {string} y
 * @return {string} 
 */
function trim(x) {
    return x && x.replace(/^\s+|\s+$/gm,'');
}

/** 
 * Convert a string of the form key1=value1,key2=value2
 */
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

/**
 * Create a persona and secrets from a nickname and optional secret.
 * @param {string} nickname
 * @param {Buffer} secret - OPTIONAL, when not provided a new secret is created
 * @return {Persona,Secrets}
 */
function createPersona(nickname,secret) {
    if( !secret )
        secret = randomBytes(32);
    const keypair = ec.keyFromSecret(secret);
    const pid = base64url( Buffer.from( keypair.getPublic() ) );
    
    let persona = {
        pid: pid,
        nickname: nickname
    };

    let secrets = {
        root: {
            type: "ed25519",
            secret: base64url( Buffer.from( secret ) )
        }
    };

    return { persona:persona, secrets:secrets };
}

/**
 * Convert a base64url encoded Edwards elliptic curve secret into a Keypair.
 * @param {string} secret - base64url encoded secret
 * @return {Keypair}
 */
function keypairFromSecret(secret) {
    let buf = Buffer.from( secret, 'base64' );    // actually base64url
    return ec.keyFromSecret(buf);    
}

/**
 * Errors are coded with an integer array.  The leftmost/first number
 * is the most significant, with each subsequent number having less
 * significance.
 *
 * The first number is designed to correspond to the major classes
 * of HTTP status codes:
 * 2 => 2xx, OK status codes
 * 4 => 4xx, Request failed due to incorrect client call
 * 5 => 5xx, Request failed because of a server error
 * 
 * @param {array} code - array of numbers
 * @param {string} message - End user readable message describing error
 * @param {array} details - Technical support readable details about error, useful for
 *  passing to tech support so they can resolve the users issue.
 */
function CodedError(code,message,details) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;

    this.code = code;           // if set, gets used to generate HTTP status code
    this.message = message;     // user friendly(ish) message
    this.details = details;     // techie/support details, if any
}
require('util').inherits(CodedError, Error);
