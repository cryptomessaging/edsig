const request = require('request')
const { URL } = require('url') // Node 8!
const edsig = require('../index')
const util = require('./util')
const storage = require('./storage')

const DEBUG = false;

module.exports = {
    putPersonaFile: putPersonaFile,
    httpRequest: httpRequest,
    fetchServiceInfo: fetchServiceInfo,
    determineHost: determineHost,
    ensureTrailingSlash: ensureTrailingSlash,
    normalizeServiceUrl: normalizeServiceUrl
};

// pid - is root pid (for now, later a full keypath)
// service - is the full service object from our local .cryptomessaging dir
// subPersonaPath - is the PATH below the controller url + personas + pid, it's 
// relative to the posters persona directory and CANNOT start with a slash.
// file - a Buffer
async function putPersonaFile(pid,service,subPersonaPath,file,contentType) {

    // RELATIVE (no leading slash) path under controller URL
    const viewpath = 'personas/' + pid + '/' + subPersonaPath;

    // What is the base URL of the controller for this edge cache?
    // (Requires trailing slash)
    const controllerUrl = ensureTrailingSlash( service.service.controller.url );

    // create HTTP request with both authorization and certification
    const url = new URL( viewpath, controllerUrl );
    if( DEBUG ) console.log( 'Created', url, 'from', viewpath, controllerUrl );
    const secrets = storage.loadPersonaSecrets( pid );
    const keypair = edsig.keypairFromSecret( secrets.root.secret );
    let req = {
        body: file,
        method: 'POST',
        originalUrl: url.pathname,
        headers: {
            "content-type": contentType.toLowerCase(),
            "content-length": file.length,
            host: determineHost(controllerUrl),
            date: new Date().toISOString()
        }
    };
    edsig.addAuthorization( req, keypair );
    edsig.addCertification( '/' + viewpath, req, keypair );

    // post request to server
    const options = {
        method:'POST',
        body: file,
        url: url.href,
        headers: req.headers
    };
    return httpRequest(options);
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
                resolve( {res:res, body:body} );
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
    if( url.endsWith('/') )
        return url;
    else
        return url + '/';
}

// remove any trailing slash
function normalizeServiceUrl(url) {

}