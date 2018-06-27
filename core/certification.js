const util = require('./util');
const { Signature } = require('./models');

module.exports = options => {
    module.options = options;

    return {
        addCertificationHeaders: addCertificationHeaders,
        mergeCertificationHeaders: mergeCertificationHeaders,
        createContentCertificate: createContentCertificate,
        verifyCertification: verifyCertification
    }
};

/** 
 * Certification result from both verifyCertification() that is suitable for converting
 * to JSON.
 */
class ContentCertificate{
    /**
     * Create an EdSig verification result for the given pid.
     * @param {string} keypath - Keypath used to create certification.  Can also be a Keypath object.
     *  signed the request or content.  Can be a simple pid, or a complex pid:pid@
     * @param {map} headers - HTTP headers used to verify content certification.
     */
    constructor(keypath,headers) {
        this.type = 'edsig';
        this.keypath = keypath.toString();
        this.headers = headers;
    }
}

/**
 * Verify that the x-certification header contains a valid Edwards signature for the given content
 *  and headers.
 * @param {string} path - pathname of request. WILL be used for verification if the x-content-path was specified
 * @param {HttpRequest} req - Node.js Request like object containing the headers
 * @return {ContentCertificate} on success, null when no 'x-certification' header presented.
 * @throws {CodedError} When the certification header does not match the request content.
 */
function verifyCertification(path,req) {
    util.normalizeHeaders( req.headers );
    util.addContentHeaders( req.headers, req.body );
    let summaryBytes = contentSummaryToBytes( req.headers, req.body );

    // crack open the certification header to get the public key and signature
    let certification = Signature.parse(req.headers,'x-certification');
    if( !certification ) {
        if( global.VERBOSE )
            console.log( 'Certification: None provided' );
        return null;
    }

    // verify specific EdSig request headers and SHA3-256 of body (if present)
    let success = certification.pubkey.verify(summaryBytes, certification.sighex);
    if( !success )
        throw new util.CodedError([4],'EdSig certification check failed' );

    let result = new ContentCertificate( certification.keypath, filter( req.headers ) );
    if( global.VERBOSE )
        console.log( 'Certification:', util.stringify( result ) ); 
    return result;
}

/**
 * Create a certification for a file.
 * @param {Buffer} file - a Buffer containing the file
 * @param {string} contentType
 * @param {Keypair} keypair - Keypair from secret
 * @param {string} keypath - OPTIONAL keypath
 * @param {string} contentPath - OPTIONAL anchor path used by the certificate
 * @return {ContentCertificate} Headers containing x-certification value and other required headers.
 */
function createContentCertificate(file,contentType,keypair,keypath,contentPath) {
    let req = {
        body: file,
        headers: {
            "content-type": contentType.toLowerCase()
        }
    };

    if( !keypath )
        keypath = util.keypairToPid( keypair );

    // OK for contentPath to be null
    addCertificationHeaders( contentPath, req.headers, req.body, keypair, keypath );
    return new ContentCertificate( keypath, req.headers );
}

/**
 * Create a certification header value.
 * @param {string} contentPath - OPTIONAL path to anchor content within url
 * @param {object} headers - HTTP headers
 * @param {Buffer} body
 * @param {Keypair} keypair - an elliptic curve keypair
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used.
 */
function addCertificationHeaders( contentPath, headers, body, keypair, keypath ) {
    // do a crc32c of the body and add to request
    util.addContentHeaders(headers,body);

    if( !headers['x-content-created'] )
        headers['x-content-created'] = (new Date()).toISOString();

    if( contentPath )
        headers['x-content-path'] = contentPath;

    // Convert request to bytes and sign
    let summaryBytes = contentSummaryToBytes( headers, body );
    let sigbytes = Buffer.from( keypair.sign(summaryBytes).toBytes() );

    if( !keypath )
        keypath = util.keypairToPid( keypair );

    let edcert = 'EdSig kp=' + keypath + ';sig=' + util.base64url(sigbytes);
    if( global.VERBOSE)
        console.log( 'Created certification', edcert );
    headers['x-certification'] = edcert;
}

/**
 * Use an existing content certification to certify the request content.
 * @param {ContentCertification} certification
 * @param {HttpRequest} req
 */
function mergeCertificationHeaders( certification, req ) {
    util.addContentHeaders( req.headers, req.body );

    // make sure certificate headers match the body
    if( req.headers['content-length'] != certification.headers['content-length'] )
        throw new Error( 'File content length does not match supplied Certification' );
    if( req.headers['digest'] != certification.headers['digest'] )
        throw new Error( 'File digest does not match supplied Certification' );

    req.headers['x-content-created'] = certification.headers['x-content-created'];
    req.headers['x-content-path'] = certification.headers['x-content-path']; 
    req.headers['x-certification'] = certification.headers['x-certification']; 

    if( global.VERBOSE)
        console.log( 'Added certification', req.headers['x-certification'] );
}

/**
 * Convert the headers and body to a content summary string that can be signed or verified.  The
 * following headers are used for the summary: content-length, digest, x-content-created,
 * and x-content-path.
 * @param {object} headers
 * @param {Buffer} body
 * @return {Buufer} of the form "headername1: value\nheadername2: value\n...headernameN: value"  (NOTE: NO trailing \n)
 * @private
 */
function contentSummaryToBytes(headers,body) {
    const signHeaders = [
        //'content-length',
        'digest',
        'x-content-created',
        'x-content-path' ];     // order is important!
    let message = 'content-length: ' + headers['content-length'];
    signHeaders.forEach(name => {
        let value = headers[name] || '';
        message += '\n' + value;
    });

    if( global.DEBUG ) console.log( 'contentSummaryToBytes()', headers, message );
    return Buffer.from( message );
}

const CONTENT_SIGNATURE_HEADERS = [
        'content-length',
        'digest',
        'x-certification',
        'x-content-created',
        'x-content-path' ];

function filter(headers) {
    return CONTENT_SIGNATURE_HEADERS.reduce( (result,name) => {
        if( headers[name] )
            result[name] = headers[name];
        return result;
    },{});
}