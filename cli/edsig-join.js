#!/usr/bin/env node

const storage = require('./storage')
const net = require('./net')
const util = require('./util')
const Options = require('./options')

let program = Options.setup( require('commander') )
let acted;
program
    .arguments('<viewurl>')
    .action( viewurl => {
        acted = true;
        handleAction(viewurl).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

if( !acted )
    program.help();

async function handleAction(viewurl) {
    let options = new Options(program);
    let service = await recordService(viewurl);
    if( options.persona )
        await net.putPersonaFile(options.persona,service);
}

/**
 * Fetch the service configuration and save locally.
 */
async function recordService(viewurl) {
    viewurl = net.normalizeServiceUrl(viewurl); // remove trailing slash if any
    let newService = await net.fetchServiceInfo(viewurl);

    // fetch my list of all services I'm active with
    let services = storage.loadServices();

    // some sanity...
    if( !services.active )
        services.active = {};
    else if( typeof services.active !== 'object' )
        throw new Error("Invalid 'active' property in services.json; Must be an object!" );
    
    // add or replace service information and save
    services.active[viewurl] = {
        updated: new Date(),
        viewurl: viewurl,
        service: newService
    };
    storage.saveServices(services);

    let service = services.active[viewurl];
    if( global.DEBUG )
        console.log( 'Joined service:', util.stringify(service), 'at', viewurl );
    else
        console.log( 'Joined service:', service.service.name, 'at', viewurl );

    return service;
}
