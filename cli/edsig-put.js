#!/usr/bin/env node

const request = require('request')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const util = require('./util')
const net = require('./net')
const edsig = require('../index')
const Options = require('./options')

const HOME_DIR = require('os').homedir();
const PERSONAS_DIR = path.join( HOME_DIR, '.cryptomessaging', 'personas' );

let program = Options.setup( require('commander') )
let acted;
program
    .arguments('<filename> <url>')
    .option('--certification <filepath>', 'An .edcert certification file')
    .action(function(filename,url) {
        acted = true;
        handleAction(filename,url).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

async function handleAction(filename,url) {
    let options = new Options(program);

    if( !options.persona )
        throw new Error( 'Please specify a persona or nickname to authorize this post' );

    if( global.VERBOSE )
        console.log( 'Using persona:', options.persona );

    let pid = options.persona.pid;
    let path = 'personas/' + pid + '/' + url;
    let file = fs.readFileSync( filename );
    
    let contentType;
    let certificationPath;
    let certification;
    if( program.certification ) {
        let json = fs.readFileSync( program.certification );
        certification = JSON.parse( json );
        contentType = certification.headers['content-type'];
    } else {
        certificationPath = path;
        contentType = mime.lookup( filename );
        if( global.VERBOSE )
            console.log( 'Guessing content-type of', contentType, 'for file', filename );
    }
    
    let result = await net.putFile(pid,options.service,path,file,contentType,certificationPath,certification);
    console.log( 'Posted to:', result.viewurl );
}