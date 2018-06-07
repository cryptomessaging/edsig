#!/usr/bin/env node

const request = require('request')
const fs = require('fs')
const path = require('path')
const util = require('./util')
const net = require('./net')
const edsig = require('../index')
const Options = require('./options')

const HOME_DIR = require('os').homedir();
const PERSONAS_DIR = path.join( HOME_DIR, '.cryptomessaging', 'personas' );

let program = Options.setup( require('commander') )
let acted;
program
    .arguments('<url> <filepath>')
    .action(function(url,filepath) {
        acted = true;
        handleAction(url,filepath).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

function handleAction(url,filepath,program) {
    let options = new Options(program);

    if( !options.persona )
        throw new Error( 'Please specify a persona or nickname to authorize this post' );

        


    if( global.VERBOSE )
        console.log( 'Using persona:', options.persona );

    let pid = persona.pid;
    let path = 'personas/' + pid + '/' + url;
    let file = fs.readFileSync(filename);
    let contentType = "text/html";
    let contentPath = path;

    let result = await net.putFile(pid,options.service,path,file,contentType,contentPath);
    console.log( 'Posted to:', result.viewurl );
}