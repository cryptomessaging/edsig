#!/usr/bin/env node

const fs = require('fs')
const util = require('./util')
const Options = require('./options')
const net = require('./net')
const { URL } = require('url') // Node 8!
var program = require('commander')

program
    .arguments('<url>')
    .description('Get a file from a cryptomessaging service')
    .option('-s, --service <service>', 'Service to get file from, for relative urls')
    .option('-n, --nickname <nickname>', 'Nickname of persona to fetch file from')
    .option('-p, --pid <pid>', 'Persona id' )
    .option('-c, --certificate <certificate>', 'Save the certificate')
    .option('-v, --verbose', 'Verbose mode for debugging')
    .option('-d, --debug', 'Ultra verbose mode for debugging')
    .action(function(url) {
        doAction(url,program)
        .then( result => {
            if( global.VERBOSE )
                console.log( 'Content:', result.body );
            else
                console.log( result.body );
        }).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

async function doAction(url,program) {
    // lookup service, if any
    let { persona, service } = new Options(program);

    // if there's a nickname, enforce dependencies and craft url
    if( persona ) {
        // this option requires the service to be specified as -s
        // AND the url to be relative
        if( !service )
            throw new Error( 'The --nickname option requires the --service option' );

        if( url.indexOf('://') > -1 )
            throw new Error('The --nickname option cannot be used with full URLs' );

        url = 'personas/' + persona.pid + '/' + url;
    }

    let result = await net.getFile(url,service);

    // write the certificate to a file?
    if( program.certificate ) {
        if( result.certified ) {
            fs.writeFileSync( program.certificate, JSON.stringify(result.certified, null, 4) );
            if( global.VERBOSE )
                console.log( 'Wrote certificate to:', program.certificate );
        } else
            throw new Error('File was not certified');
    }
    
    return result; 
}
