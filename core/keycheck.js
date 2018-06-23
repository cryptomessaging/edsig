const { Keypath } = require('./models')
const request = require('request')
const edsig = require('../index')()

/**
 * Options can provide a personaHosts property with an array of hostnames.
 */
module.exports = options => {
    module.options = options;
    return {
        checkKeypath: checkKeypath
    }
}

/**
 * Determine if a subkey is still valid.
 * @param subkey
 * @return {boolean} true if valid
 */
function isValid(subkey) {
    const now = new Date();
    const valid = subkey.valid;
    if( !valid )
        return true;    // no valid range means ALWAYS valid!

    if( valid.from ) {
        const from = new Date( valid.from );
        if( from > now )
            return false; // not valid yet
    }
    if( valid.to ) {
        const to = new Date( valid.to );
        if( to < now )
            return false; // has expired
    }

    return true;
}

/**
 * Checks the subkey in a keypath.
 * @param {string} keypath
 * @param {Array} default_hosts - OPTIONAL
 * @return {boolean} True when the subkey is found and within valid dates.
 * @throws {Error} when subkey is not valid.
 */
async function checkKeypath(keypath,default_hosts) {
    if( global.DEBUG )
        console.log( 'keycheck()', keypath );
    let { keys, hosts } = new Keypath( keypath );   // parse keypath

    if( keys.length == 1 )
        return true;    // master keys/persona ids don't need to be verified = SUCCESS!

    // are any hosts suggested?
    if( default_hosts )
        hosts = hosts.concat(default_hosts);    // add the defaults to the end of the list
    if( hosts.length == 0 )
        throw new Error( 'checkKeypath() found no hosts to fetch subkeys from', keypath );

    for( var i = 0; i < hosts.length; i++ ) {
        try {
            const {url,res,subkey} = await fetchSubkey(hosts[i],keys);
            if( isValid(subkey) )
                return true;
            else if( global.VERBOSE )
                console.log( 'Subkey from', url, 'was invalid:', subkey );  
        } catch( err ) {
            if( global.DEBUG )
                console.error( err );
            else if( global.VERBOSE )
                console.log( 'Error:', err.name, ': ', err.message );
        }
    }

    // ran out of hosts to try...
    throw new Error( 'checkKeypath() failed to find valid subkey from hosts', hosts, 'for keypath', keypath );
}

/**
 * For a given host and master and subkey, fetch the subkey from the persona service.  This function
 * ensures the subkey is certified using only the persona master key.
 * @param {string} host of the form hostname[:port]
 * @param {Array} keys - master and subkey, must be two.
 * @return {url,res,subkey}
 * @throws {Error} on networking problems
 */
async function fetchSubkey(host,keys) {
    const port = parsePort(host);
    const protocol = port == 443 || port == 8443 ? 'https' : 'http';
    const options = {
        url: protocol + '://' + host + '/personas/' + keys[0] + '/keyring/subkey(' + keys[1] + ').json'
    };
    const {url,res,body} = await httpRequest(options);
    let certified = edsig.verifyCertification(options.url,res); // make sure declared keys are verified
    if( !certified )
        throw new Error('Subkey must be certified, but is not:', options.url);
    const keypath = new Keypath( certified.keypath );
    if( keypath.keys.length != 1 )
        throw new Error('Subkey content must be signed with ONLY the persona master key, and not a subkey:', certified.keypath.toString() );
    
    const subkey = JSON.parse(body);
    return { url:url, res:res, subkey:subkey };
}

function parsePort(host) {
    const tokens = host.split(':');
    return tokens.length < 2 ? 443 : tokens[1]; // default to HTTPS
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
                    console.log( 'Warning: Body for', options.url, 'code', res.statusCode, 'is', body );
                reject( new Error('statusCode: ' + res.statusCode + ' for ' + options.url ) );
            } else {
                if( global.DEBUG )
                    console.log( 'Body length', body.length, 'body', body, 'res', res );
                resolve( {url:options.url, res:res, body:body} );
            }
        });
    });
}