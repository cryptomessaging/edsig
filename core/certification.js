const util = require('./util');
const { Signature, VerificationResult } = require('./models');

module.exports = {
    createCertification: createCertification,
    addCertification: addCertification,
    verifyContentSignature: verifyContentSignature
};

const CONTENT_SIGNATURE_HEADERS = [
        'x-certification',
        'content-length',
        'content-type',
        'x-created',
        'x-content-hash',
        'x-content-path' ];

/**
 * Verify that the x-certification header contains a valid Edwards signature.
 * @param {string} path - pathname of request. WILL be used for verification if the x-content-path was specified
 * @param {HttpRequest} req - Node.js Request like object containing the headers
 * @return {VerificationResult} on success, null when no 'x-certification' header presented.
 * @throws {CodedError} When the certification header does not match the request content.
 */
function verifyContentSignature(path,req) {
    util.normalizeHeaders( req.headers );
    util.addContentHeaders( req.headers, req.body);
    let summaryBytes = contentSummaryToBytes( req.headers, req.body );

    // crack open the certification header to get the public key and signature
    let certification = Signature.parse(req.headers,'x-certification');
    if(!certification)
        return null;

    // verify specific EdSig request headers and CRC32C of body (if present)
    let success = certification.pubkey.verify(summaryBytes, certification.sighex);
    if( !success )
        throw new util.CodedError([4],'EdSig certification check failed' );

    let result = new VerificationResult( certification.keypath[0] );
    result.headers = filter( req.headers );
    return result;
}

function filter(headers) {
    return CONTENT_SIGNATURE_HEADERS.reduce( (result,name) => {
        if( headers[name] )
            result[name] = headers[name];
        return result;
    },{});
}

/**
 * Convert the headers and body to a content summary string that can be signed or verified.  The
 * following headers are used for the summary: content-length, content-type, x-created,
 * x-content-hash, and x-content-path.
 * @param {object} headers
 * @param {Buffer} body
 * @return {Buufer} of the form "header1value\nheader2value\n...headerNvalue"  (NOTE: NO trailing \n)
 * @private
 */
function contentSummaryToBytes(headers,body) {
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

    if( global.DEBUG ) console.log( 'contentSummaryToBytes()', headers, message );
    return Buffer.from( message );
}

/**
 * Create a certification header value.
 * @param {string} contentPath - OPTIONAL path to anchor content within url
 * @param {object} headers - HTTP headers
 * @param {Buffer} body
 * @param {Keypair} keypair - an elliptic curve keypair
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used.
 */
function createCertification( contentPath, headers, body, keypair, keypath ) {
    // do a crc32c of the body and add to request
    util.addContentHeaders(headers,body);

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
        keypath = util.base64url(pubbytes);
    }

    let edcert = 'EdSig kp=' + keypath + ',sig=' + util.base64url(sigbytes);
    if( global.VERBOSE) console.log( 'Created certification', edcert );
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
    req.headers['x-certification'] = createCertification( contentPath, req.headers, req.body, keypair, keypath );
}