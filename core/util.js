const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')
const crc32c = require('fast-crc32c')
const { randomBytes } = require('crypto')

module.exports = {
    createPersona: createPersona,
    keypairFromSecret: keypairFromSecret,
    addContentHeaders: addContentHeaders,
    base64url: base64url,
    normalizeHeaders: normalizeHeaders,
    asKVset: asKVset,
    CodedError: CodedError
};

//
// Headers
//

/**
 * Add the content-length and x-content-hash HTTP headers for the given body.
 * @param {object} headers
 * @param {Buffer} body
 * @private
 */
function addContentHeaders(headers,body) {
    headers['content-length'] = body ? body.length : 0;
    headers['x-content-hash'] = hashBody( body );
}

/**
 * Amazon only supports x-amz-meta- prefixed custom headers, so convert back to the original header names.
 * @param {object} headers - map of header name to values, including Amazon specific x-amz-meta- ones.
 * @return {object} The modified version of the header map that was passed into this method.
 * @private
 */
function normalizeHeaders(headers) {
    Object.keys(headers).forEach( k=>{
        let lowkey = k.toLowerCase();
        if( lowkey.indexOf('x-amz-meta-') == 0 ) {
            let newkey = 'x-' + lowkey.substring('x-amz-meta-'.length);
            headers[newkey] = headers[k];
        } 
    });

    return headers;
}

/**
 * Create a persona and secrets from a nickname and optional secret.
 * @param {string} nickname
 * @param {Buffer} secret - OPTIONAL, when not provided a new secret is created
 * @return {object} result - containing the persona and secrets
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

//
// Crypto
//

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
 * Provides an HTTP ready representation of the CRC32C hash of the body.
 * @param {Buffer} body - Body can be a buffer or string
 * @return {string}
 * @private
 */
function hashBody(body) {
    if( !body )
        body = new Buffer();
    else if( typeof body === 'string' )
        body = Buffer.from( body );
    else if( body instanceof Buffer )
        ;   // perfect that way it came!
    else
        throw new CodedError([5],'Body is not a Buffer or String, but a ' + typeof body );

    return 'CRC32C ' + crc32c.calculate( body ).toString(16);
}

//
// Strings, etc.
//

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
 * @param {string} x
 * @return {string} 
 * @private
 */
function trim(x) {
    return x && x.replace(/^\s+|\s+$/gm,'');
}

/** 
 * Convert a string of the form key1=value1,key2=value2 to an object with same properties.
 * @param {string} s - Source key-value set.
 * @return {object} The result as an object representing the map.
 * @private
 */
function asKVset(s) {
    var result = {};
    s.split(',').forEach( x => {
        var p = x.indexOf('=');
        if( p > -1 ) {
            var key = trim(x.substring(0,p));
            var value = trim(x.substring(p + 1));
            value && (result[key] = value);
        }
    });

    return result;
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
