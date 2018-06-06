const util = require('./util');
const { Signature, VerificationResult } = require('./models');

module.exports = {
    createAuthorization: createAuthorization,
    addAuthorization: addAuthorization,
    verifyRequestSignature: verifyRequestSignature
};

/** 
 * Verify an HTTP request signature that was signed using an EdSig authorization header.
 * @param {string} path - pathname of request including query string.  I.e. http://mydomain.com/pathname?querystring
 * @req {HttpRequest} req - Node like Request structure containing method, headers, and body proeprties
 * @return {VerificationResult} - when authorization succeeds, or null when no authorization header presented
 * @throws Error when authorization header is present, but signature check fails
 */
function verifyRequestSignature(path,req) {
    // crack open the authorization header to get the public key and signature
    let authorization = Signature.parse(req.headers,'authorization');
    if( !authorization )
        return;  // it's ok!

    // make sure content-length and x-content-hash match body
    util.addContentHeaders(req.headers,req.body);

    // verify specific EdSig request headers
    let summaryBytes = reqSummaryToBytes( req.method, path, req.headers );
    let success = authorization.pubkey.verify(summaryBytes, authorization.sighex);

    if( global.VERBOSE) console.log( 'Verified?', success );
    if( success )
        return new VerificationResult( authorization.keypath[0] );
    else
        throw new util.CodedError([4],'EdSig authorization check failed' );
}

/**
 * Convert HTTP request method, path, and certain headers to a Buffer. Format of
 *  Buffer is "METHOD path\nheader1value\nheader2value\n...headerNvalue"
 * @param {string} method - HTTP method, i.e. GET, POST, PUT
 * @param {string} path - pathname, including query string if any.
 * @param {object} headers - Simple map of header names to values.  All header names must be lower case.
 * @return {Buffer} Summary string of request, as "METHOD path\nheader1value\nheader2value\n...headerNvalue"
 * @private
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

    if( global.DEBUG ) console.log( 'reqSummaryToBytes()', message );
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
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]]].  When keypath is not provided, the keypair pid is used.
 */
function createAuthorization( path, req, keypair, keypath ) {
    // if there is a body, add the x-content-hash and content-length headers
    util.addContentHeaders(req.headers,req.body) 

    // Convert request summary to bytes and sign
    var summaryBytes = reqSummaryToBytes( req.method, path, req.headers );
    var sigbytes = Buffer.from( keypair.sign(summaryBytes).toBytes() );

    if( !keypath ) {
        // extract public key bytes to make a simple <pid> path
        let pubbytes = Buffer.from( keypair.getPublic() );
        keypath = util.base64url(pubbytes);
    }

    let edsig = 'EdSig kp=' + keypath + ',sig=' + util.base64url(sigbytes);
    if( global.VERBOSE) console.log( 'Created authorization:', edsig );
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
