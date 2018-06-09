#!/usr/bin/env node

const fs = require('fs')
const util = require('./util')
const Options = require('./options')
const net = require('./net')
const { URL } = require('url') // Node 8!

var program = Options.setup( require('commander') )
let acted;
program
    .arguments('<url> [filename]')
    .description('Get a file from a cryptomessaging service')
    .option('--save-certificate <filename>', 'Save the certificate')
    .action(function(url,filename) {
        acted = true;
        handleAction(url,filename).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

if( !acted )
    program.help();

/**
 * @param {string} url to fetch file from.  Can be a full url, or a path.
 * @param {filename} 
 */
async function handleAction(url,filename) {
    // lookup service, if any
    let { persona, service } = new Options(program);

    // if there's a nickname, enforce dependencies and craft url
    if( persona ) {
        // this option requires the service to be specified as -s
        // AND the url to be relative
        if( !service )
            throw new Error( 'The --nickname option requires the --service option' );

        if( url.indexOf('://') > -1 )
            throw new Error( 'The --nickname option cannot be used with full URLs' );

        url = 'personas/' + persona.pid + '/' + url;
    }

    let result = await net.getFile(url,service);

    // write the certificate to a file?
    if( program.saveCertificate ) {
        if( result.certified ) {
            fs.writeFileSync( program.saveCertificate, JSON.stringify(result.certified, null, 4) );
            if( global.VERBOSE )
                console.log( 'Wrote certificate to:', program.saveCertificate );
        } else
            throw new Error('File was not certified');
    }
    
    if( global.DEBUG )
        console.log( 'Content:', result.body );
    else if( !filename )
        console.log( result.body );
    else {
        // write result to disk
        fs.writeFileSync( filename, result.body );
        if( global.VERBOSE )
            console.log( 'Wrote file to:', filename );
    }
}
