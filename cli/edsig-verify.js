#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const storage = require('./storage')
const util = require('./util')
const edsig = require('../index')()
const Options = require('./options')

let program = Options.setup( require('commander') )
let acted;
program
    .arguments('<filename> <certification> [path]')
    .action(function(filename,certification,path) {
        acted = true;
        handleAction(filename,certification,path).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

if( !acted )
    program.help();

async function handleAction(filename,certification,path) {
    let options = new Options(program);

    let file = fs.readFileSync( filename );

    // convert certification to HttpRequest like object
    let cert = fs.readFileSync( certification );
    cert = JSON.parse( cert );
    let req = {
        body: file,
        headers: cert.headers
    };

    let certificate = edsig.verifyCertification(path,req);
    console.log( 'Certified?', certificate ? 'true' : 'false' );
}