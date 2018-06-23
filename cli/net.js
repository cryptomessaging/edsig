const request = require('request')
const { URL } = require('url') // Node 8!
const keycheck = require('../core/keycheck')()
const edsig = require('../index')()
const util = require('./util')
const storage = require('./storage')

module.exports = {
    getFile: getFile,
    putFile: putFile,
    putPersonaFile: putPersonaFile,
    putKeyring: putKeyring,
    httpRequest: httpRequest,
    fetchServiceInfo: fetchServiceInfo,
    determineHost: determineHost,
    ensureTrailingSlash: ensureTrailingSlash,
    normalizeServiceUrl: normalizeServiceUrl
};

/**
 * Get a file and ensure the certification is valid.
 * @param {string} url - either full URL or relative path when service is provided
 * @param {object} service - optional service to resolve relative urls with the view url
 * @return {headers,body,certified} On success.
 * @throws {Error} on network or certification problems.
 */
async function getFile(url,service) {
    let options = {
        encoding: null
    };
    if( service ) {
        let viewUrl = extractViewUrl(service);
        options.url = new URL(url,viewUrl).href;
    } else {
        options.url = url;  // assume its a full url
    }

    let {res,body} = await httpRequest(options);
    let certified = edsig.verifyCertification(options.url,res); // make sure declared keys are verified

    const host = new URL(options.url).host; // include persona service that content came from to check for subkey
    await keycheck.checkKeypath( certified.keypath, [host] );

    return {
        headers: res.headers,
        body: body,
        certified: certified
    }; 
}

/**
 * Publish a persona to a service.
 * @param {object} persona - Persona to publish
 * @param {object} service - Service to publish to.
 */
async function putPersonaFile(persona,service) {
    // For the persona, always use the master key?
    const secrets = storage.loadSecrets( persona.pid );
    const keypair = edsig.keypairFromSecret( secrets.master.secret );

    const file = Buffer.from( util.stringify(persona) );
    const viewpath = 'personas/' + persona.pid + '/persona.json';
    const result = await putFile( keypair, persona.pid, service, viewpath, file, 'application/json', viewpath );
    console.log( 'Persona published to:', result.viewurl );
    return result;
}

/**
 * Publish a persona keyring to a service.
 * @param {string} pid - id of persona to publish
 * @param {object} service - Service to publish to.
 */
async function putKeyring(pid,service) {
    const secrets = storage.loadSecrets( pid );
    
    // use master key for signing
    const keypair = edsig.keypairFromSecret( secrets.master.secret );

    // find each subkey and upload
    let promises = [];
    Object.keys( secrets.subkeys ).forEach( id => {
        let subkey = secrets.subkeys[id];
        delete subkey.secret;

        // do them in parallel
        promises.push( putSubkey(pid,subkey,keypair,service) );
    });

    await Promise.all( promises );
}

async function putSubkey(pid,subkey,keypair,service) {
    const viewpath = 'personas/' + pid + '/keyring/subkey(' + subkey.id + ').json';
    const file = Buffer.from( util.stringify(subkey) );
    const result = await putFile( keypair, pid, service, viewpath, file, 'application/json', viewpath );
    console.log( 'Keyring published to:', result.viewurl );   
}

/**
 * Push a file onto a service.
 * @param {Keypair} keypair
 * @param {string} keypath
 * @param {object} service - OPTIONAL, the full service object from our local .cryptomessaging dir
 * @param {string} path - full url when no service, or relative path under the provided service
 * @param {Buffer} file - a Buffer containing the file
 * @param {string} contentType - MIME content type
 * @param {string} certificationPath - OPTIONAL partial path (or full url) used when creating content certification
 * @param {object} certification - OPTIONAL full ContentCertification object 
 */
async function putFile(keypair,keypath,service,path,file,contentType,certificationPath,certification) {

    // What is the base URL of the controller for this edge cache?
    // (Requires trailing slash)
    const controllerUrl = ensureTrailingSlash( service.service.controller.url );

    // create HTTP request with both authorization and certification
    // path MUST NOT have leading slash
    const url = new URL( path, controllerUrl );
    if( global.DEBUG ) console.log( 'Created', url, 'from', path, controllerUrl );

    let req = {
        body: file,
        method: 'POST',
        path: url.path,
        headers: {
            "content-type": contentType.toLowerCase(),
            "content-length": file.length,
            host: determineHost(controllerUrl),
            date: new Date().toISOString()
        }
    };
    edsig.addAuthorization( url.pathname, req, keypair, keypath );

    if( certification )
        edsig.mergeCertificationHeaders( certification, req );
    else
        edsig.addCertificationHeaders( certificationPath || path, req.headers, req.body, keypair, keypath ); 

    // post request to server
    const options = {
        method:'POST',
        body: file,
        url: url.href,
        headers: req.headers
    };

    let result = await httpRequest(options);
    result.viewurl = new URL( path, service.viewurl ).href;
    return result;
}

/**
 * Promisified request()
 * @param {object} options
 * @return {Promise} returning url, res, and body properties.
 * @throws Error when response status is not 200
 */
function httpRequest(options) {
    if( global.DEBUG )
        console.log( 'HTTP Request:', options );
    else if( global.VERBOSE )
        console.log( 'HTTP Request:', options.url );

    return new Promise((resolve,reject)=>{
        request( options, (err,res,body) => {
            if(err)
                reject(err);
            else if( res.statusCode != 200 ) {
                if( body )
                    console.log( 'Body for', options.url, 'code', res.statusCode, 'is', body );
                reject( new Error('statusCode: ' + res.statusCode + ' for ' + options.url ) );
            } else {
                if( global.DEBUG )
                    console.log( 'Body length', body.length, 'body', body, 'res', res );
                resolve( {url:options.url, res:res, body:body} );
            }
        });
    });
}

// services have a 'view' set of endpoints to facilitate read-only edge
// caching, and may have a 'controller' set of endpoints for writing data
// and other interactive HTTP requests.

// baseViewUrl MUST be a URL with no pathname or query string.
function fetchServiceInfo(baseViewUrl) {
    return new Promise((resolve,reject)=>{
        const options = { url:new URL( 'service.json', baseViewUrl ).href };
        if( global.DEBUG ) console.log('fetchServiceInfo() options', options );
        request( options, (err,res,body) => {
            if(err)
                reject(err);
            else if( res.statusCode != 200 ) {
                if( body )
                    console.log( 'Body for', options.url, 'code', res.statusCode, 'is', body );
                reject( new Error('statusCode: ' + res.statusCode + ' for ' + options.url ) );
            } else
                resolve( JSON.parse(body) );
        });
    });
}

//
// Util
//

function extractControllerUrl(service) {
    if( !service.service
     || !service.service.controller
     || !service.service.controller.url )
        throw new Error('Service is missing controller.url', service );
    return ensureTrailingSlash( service.service.controller.url );
}

function extractViewUrl(service) {
    if( !service.viewurl )
        throw new Error('Service is missing viewurl', service );
    return ensureTrailingSlash( service.viewurl );
}

// Provides only the hostname lowercased when on standard
// ports, or the hostname:port for all others.
function determineHost(url) {
    const parsed = new URL( url );
    if( parsed.protocol == 'http' && parsed.port == 80 )
        return parsed.hostname.toLowerCase();
    if( parsed.protocol == 'https' && parsed.port == 443 )
        return parsed.hostname.toLowerCase();
    else
        return parsed.host.toLowerCase();
}

// Make sure url has a trailing slash (otherwise URL will think
// its a file and replace it during merges)
function ensureTrailingSlash(url) {
    return url.endsWith('/') ? url : url + '/';
}

// remove any trailing slash
function normalizeServiceUrl(url) {
    if( url.endsWith('/') )
        return url.substring(0,url.length-1);
    else
        return url;
}
