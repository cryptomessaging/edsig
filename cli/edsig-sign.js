#!/usr/bin/env node

const fs = require('fs')
const mime = require('mime-types')

const util = require('./util')
const edsig = require('../index')
const Options = require('./options')

let program = Options.setup( require('commander') )
let acted;
program
    .arguments('<filename> [path]')
    .action(function(filename,path) {
        acted = true;
        handleAction(filename,path).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

if( !acted )
    program.help();

async function handleAction(filename,path) {
    let options = new Options(program);

    if( !options.persona )
        throw new Error( 'Please specify a persona with -k or -n to certify this file' );

    if( global.VERBOSE )
        console.log( 'Using persona:', options.persona );

    let file = fs.readFileSync( filename );

    let contentType = mime.lookup( filename );
    if( global.VERBOSE )
        console.log( 'Guessing content-type of', contentType, 'for file', filename );

    const keypath = options.keypath.toString();
    let certificate = edsig.createContentCertificate(file,contentType,options.keypair,keypath,path)
    console.log( util.stringify( certificate ) );
}