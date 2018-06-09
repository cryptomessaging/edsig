#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const storage = require('./storage')
const util = require('./util')
const edsig = require('../index')
const Options = require('./options')

const HOME_DIR = require('os').homedir();
const PERSONAS_DIR = path.join( HOME_DIR, '.cryptomessaging', 'personas' );

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

async function handleAction(filename,path) {
    let options = new Options(program);

    if( !options.persona )
        throw new Error( 'Please specify a persona or nickname to certify this file' );

    if( global.VERBOSE )
        console.log( 'Using persona:', options.persona );

    let pid = options.persona.pid;
    let secrets = storage.loadPersonaSecrets(pid);
    let keypair = edsig.keypairFromSecret( secrets.root.secret );

    let file = fs.readFileSync( filename );
    let contentPath = path;

    let contentType = mime.lookup( filename );
    if( global.VERBOSE )
        console.log( 'Guessing content-type of', contentType, 'for file', filename );

    //let certificate = await net.signFile(pid,file,contentType,contentPath);
    edsig.createContentCertificate(file,contentType,keypair,pid,contentPath)
    console.log( util.stringify( certificate ) );
}