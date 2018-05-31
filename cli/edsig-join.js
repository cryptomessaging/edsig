#!/usr/bin/env node

const storage = require('./storage')
const net = require('./net')
const util = require('./util')

const DEBUG = false;

let program = require('commander')

program
    .arguments('<viewurl>')
    .option('-p, --persona <pid>', 'Use this persona to authorize post')
    .option('-n, --nickname <nickname>', 'Use this nickname to authorize post')
    .action( doAction )
    .parse(process.argv);

function doAction(viewurl) {
    recordService(viewurl)
    .then( service => {
        console.log( 'Joined service', JSON.stringify(service,null,4), 'at', viewurl );
        return postPersona(service);
    }).then( postResult => {
        if( postResult )
            console.log( 'Added persona', JSON.stringify(postResult.persona,null,4), 'at', postResult.viewurl );
    }).catch(err => {
        util.signalError(err);
    });   
}

async function recordService(viewurl) {
    if( DEBUG ) console.log( 'recordService()' );
    viewurl = net.normalizeServiceUrl(viewurl); // remove trailing slash if any
    let newService = await net.fetchServiceInfo(viewurl);

    // fetch my list of all services I'm active with
    let services = storage.loadServices();

    // some sanity...
    if( !services.active )
        services.active = {};
    else if( typeof services.active !== 'object' )
        util.signalError( new Error("Invalid 'active' property in services.json; Must be an object!" ) );
    
    // add or replace service information and save
    services.active[viewurl] = {
        updated: new Date(),
        viewurl: viewurl,
        service: newService
    };
    storage.saveServices(services);

    return services.active[viewurl];
}

// if a persona was specified by either --persona or --nickname options, then post 
// to service we just joined
// returns { url:, persona:, res:, body: }
async function postPersona(service) {
    if( DEBUG ) console.log( 'postPersona()', service );
    let persona;
    if( program.persona ) {
        persona = storage.findPersonaByPid( program.persona );
    } else if( program.nickname ) {
        persona = storage.findPersonaByNickname( program.nickname );
    } else
        // no persona specified, so we are done
        return;

    if( !persona ) {
        util.signalError( new Error('Could not find specified persona') );
        return;
    }

    let body = Buffer.from( JSON.stringify(persona,null,4) );
    let result = await net.putPersonaFile(persona.pid,service,'persona.json',body,"application/json"); 
    result.persona = persona;
    return result;
}