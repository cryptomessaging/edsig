const request = require('request')
const { URL } = require('url') // Node 8!
const edsig = require('../index')
const util = require('./util')
const storage = require('./storage')

const DEBUG = false;

module.exports = {
    getFile: getFile,
    putPersonaFile: putPersonaFile,
    httpRequest: httpRequest,
    fetchServiceInfo: fetchServiceInfo,
    determineHost: determineHost,
    ensureTrailingSlash: ensureTrailingSlash,
    normalizeServiceUrl: normalizeServiceUrl
};

//
// Persona wrappers around get and put files
//

// pid - is root pid (for now, later a full keypath)
// service - is the full service object from our local .cryptomessaging dir
// subPersonaPath - is the PATH below the controller url + personas + pid, it's 
// relative to the posters persona directory and CANNOT start with a slash.
// file - a Buffer
// contentPath - OPTIONAL anchor point for the certificate
async function putPersonaFile(pid,service,subPersonaPath,file,contentType,contentPath) {
    // RELATIVE (no leading slash) path under controller URL
    const viewpath = 'personas/' + pid + '/' + subPersonaPath;
    return putFile(pid,service,viewpath,file,contentType,contentPath);
}


//
// Get files from services
//

// path - either full URL or relative path when service is provided
// service - optional service to resolve relative urls
async function getFile(url,service) {
    let options = {};
    if( service ) {
        let controllerUrl = extractControllerUrl(service);
        options.url = new URL(url,controllerUrl).href;
    } else {
        options.url = url;  // assume its a full url
    }
    let {res,body} = await httpRequest(options);
    let certified = edsig.verifyContentSignature(options.url,res);
    return {
        headers: res.headers,
        body: body,
        certified: certified
    }; 
}

// pid - is root pid (for now, later a full keypath)
// service - is the full service object from our local .cryptomessaging dir
// path - path under the service
//      relative to the posters persona directory and CANNOT start with a slash.
// file - a Buffer
// contentPath - OPTIONAL anchor point for the certificate
async function putFile(pid,service,path,file,contentType,contentPath) {

    // What is the base URL of the controller for this edge cache?
    // (Requires trailing slash)
    const controllerUrl = ensureTrailingSlash( service.service.controller.url );

    // create HTTP request with both authorization and certification
    // path MUST NOT have leading slash
    const url = new URL( path, controllerUrl );
    if( DEBUG ) console.log( 'Created', url, 'from', path, controllerUrl );
    const secrets = storage.loadPersonaSecrets( pid );
    const keypair = edsig.keypairFromSecret( secrets.root.secret );
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
    edsig.addAuthorization( url.pathname, req, keypair );

    // OK for contentPath to be null
    edsig.addCertification( contentPath, req, keypair );

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

// Promisified request()
// options { url: ... }
// .then( {res:, body:} )
// throws Error when response status code NOT 200
function httpRequest(options) {
    if( DEBUG ) console.log( 'httpRequest()', options );
    return new Promise((resolve,reject)=>{
        request( options, (err,res,body) => {
            if(err)
                reject(err);
            else if( res.statusCode != 200 ) {
                if( body )
                    console.log( 'Body for', options.url, 'code', res.statusCode, 'is', body );
                reject( new Error('statusCode: ' + res.statusCode + ' for ' + options.url ) );
            } else
                resolve( {url:options.url, res:res, body:body} );
        });
    });
}

// services have a 'view' set of endpoints to facilitate read-only edge
// caching, and may have a 'controller' set of endpoints for writing data
// and other interactive HTTP requests.

// baseViewUrl MUST be a URL with no pathname or query string.
function fetchServiceInfo(baseViewUrl) {
    if( DEBUG ) console.log('fetchServiceInfo()',baseViewUrl);
    return new Promise((resolve,reject)=>{
        const options = { url:new URL( 'service.json', baseViewUrl ).href };
        if( DEBUG ) console.log('request() options', options );
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