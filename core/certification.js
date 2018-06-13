const util = require('./util');
const { Signature } = require('./models');

module.exports = {
    //addCertificationHeaders: addCertificationHeaders,
    addCertification: addCertification,
    createContentCertificate: createContentCertificate,
    verifyCertification: verifyCertification
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
            console.log( 'Certified? No' );
        return null;
    }

    // verify specific EdSig request headers and CRC32C of body (if present)
    let success = certification.pubkey.verify(summaryBytes, certification.sighex);
    if( !success )
        throw new util.CodedError([4],'EdSig certification check failed' );

    let result = new ContentCertificate( certification.keypath, filter( req.headers ) );
    if( global.VERBOSE )
        console.log( 'Certified?', JSON.stringify( result, null, 4 ) ); 
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
    addCertification( { contentPath: contentPath }, req, keypair );
    return new ContentCertificate( keypath, req.headers );
}

/**
 * Modifies the req.headers by adding the x-certification header and other headers as necessary
 * @param {ContentCertification} certification - OPTIONAL either a contentPath, or a full ContentCertification object
 * @param {HttpRequest} req
 * @param {Keypair} keypair - an elliptic curve keypair
 * @param {string} keypath - OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used.
 */
function addCertification( certification, req, keypair, keypath ) {
    if( !certification )
        addCertificationHeaders( null, req.headers, req.body, keypair, keypath );
    else if( certification.contentPath )
        addCertificationHeaders( certification.contentPath, req.headers, req.body, keypair, keypath ); 
    else
        mergeCertificationHeaders( certification, req ) 
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
    if( req.headers['content-type'] != certification.headers['content-type'] )
        throw new Error( 'File content type does not match supplied Certification' );
    if( req.headers['x-content-hash'] != certification.headers['x-content-hash'] )
        throw new Error( 'File content hash does not match supplied Certification' );

    req.headers['x-content-created'] = certification.headers['x-content-created'];
    req.headers['x-content-path'] = certification.headers['x-content-path']; 
    req.headers['x-certification'] = certification.headers['x-certification']; 

    if( global.VERBOSE)
        console.log( 'Added certification', req.headers['x-certification'] );
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
        'x-content-created',
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

const CONTENT_SIGNATURE_HEADERS = [
        'x-certification',
        'content-length',
        'content-type',
        'x-content-created',
        'x-content-hash',
        'x-content-path' ];

function filter(headers) {
    return CONTENT_SIGNATURE_HEADERS.reduce( (result,name) => {
        if( headers[name] )
            result[name] = headers[name];
        return result;
    },{});
}