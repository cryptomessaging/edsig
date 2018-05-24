#!/usr/bin/env node

const request = require('request')
const fs = require('fs')
const path = require('path')
const { URL } = require('url'); // Node 8!
const edsig = require('../index')
const util = require('../util')
const DEBUG = true;

let program = require('commander')

program
    .arguments('[baseurl]')
    .option('-p, --persona [pid]', 'Use this persona to authorize post')
    .option('-n, --nickname [nickname]', 'Use this nickname to authorize post')
    .action( doAction )
    .parse(process.argv);

function doAction(baseurl) {
    recordService(baseurl)
    .then( service => {
        return postPersona(service);
    }).catch(err => {
        util.signalError(err);
    });   
}

//
// Post persona
//

// if a persona was specified by either --persona or --nickname options, then post 
// to service we just joined
async function postPersona(service) {
    //if( DEBUG ) console.log( 'postPersona()', service );
    let persona;
    if( program.persona ) {
        persona = util.findPersonaByPid( program.persona );

    } else if( program.nickname ) {
        persona = util.findPersonaByNickname( program.nickname );
    } else
        // no persona specified, so we are done
        return;

    if( !persona ) {
        util.signalError( new Error('Could not find specified persona') );
        return;
    }

    const controllerUrl = service.service.controller.url;
    const viewpath = 'personas/' + persona.pid + '/persona.json';
    const url = new URL( viewpath, controllerUrl );

    // create HTTP request with both authorization and certification
    const secrets = util.loadPersonaSecrets( persona.pid );
    const keypair = edsig.keypairFromSecret( secrets.root.secret );
    let body = Buffer.from( JSON.stringify(persona,null,4) );
    let req = {
        body: body,
        method: 'POST',
        originalUrl: url.pathname,
        headers: {
            "content-type": "application/json",
            "content-length": body.length,
            host: determineHost(controllerUrl),
            date: new Date().toISOString(),
        }
    };
    edsig.addAuthorization( req, keypair );
    edsig.addCertification( '/' + viewpath, req, keypair );

    console.log('foo');

    // post request to server
    const options = {
        method:'POST',
        body: body,
        url: url.href,
        headers: req.headers
    };
    return httpRequest(options);
}

// then( {res:, body:} )
function httpRequest(options) {
    console.log( 'httpRequest()', options );
    return new Promise((resolve,reject)=>{
        request( options, (err,res,body) => {
            if(err)
                reject(err);
            else if( res.statusCode != 200 )
                reject( new Error('statusCode: ' + res.statusCode ) );
            else
                resolve( {res:res, body:body} );
        });
    });
}

function determineHost(url) {
    const parsed = new URL( url );
    if( parsed.protocol == 'http' && parsed.port == 80 )
        return parsed.hostname;
    if( parsed.protocol == 'https' && parsed.port == 443 )
        return parsed.hostname;
    else
        return parsed.host;
}

//
// Record service
//

async function recordService(baseurl) {
    console.log( 'recordService()' );
    baseurl = normalizeBaseUrl(baseurl);
    let newService = await fetchServiceInfo(baseurl);

    // fetch my list of all services I'm active with
    let services = util.loadServices();

    // some sanity...
    if( !services.active )
        services.active = {};
    else if( typeof services.active !== 'object' )
        util.signalError( new Error("Invalid 'active' property in services.json; Must be an object!" ) );
    
    // add or replace service information and save
    services.active[baseurl] = {
        updated: new Date(),
        service: newService
    };
    util.saveServices(services);

    //console.log( 'Updated services', JSON.stringify(services,null,4), 'at', util.SERVICES_FILEPATH );
    return services.active[baseurl];
}

// NOTE: baseurl may be top level on the site, OR a few directories deep...
function fetchServiceInfo(baseurl) {
    return new Promise((resolve,reject)=>{
        const options = { url:new URL( 'service.json', baseurl ).href };
        request( options, (err,res,body) => {
            if(err)
                reject(err);
            else if( res.statusCode != 200 )
                reject( new Error('statusCode: ' + res.statusCode + ' for ' + serviceurl ) );
            else
                resolve( JSON.parse(body) );
        });
    });
}

//
// Util
//

function normalizeBaseUrl(url) {
    if( url.endsWith('/') )
        return url.substring(0,url.length-1);
    else
        return url;
}