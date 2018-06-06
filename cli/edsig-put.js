#!/usr/bin/env node

const request = require('request')
const fs = require('fs')
const path = require('path')
const util = require('./util')
const net = require('./net')
const edsig = require('../index')

const HOME_DIR = require('os').homedir();
const PERSONAS_DIR = path.join( HOME_DIR, '.cryptomessaging', 'personas' );

let program = require('commander')

program
    .arguments('<url> <filepath>')
    .option('-p, --persona <pid>', 'Use this persona to authorize post')
    .option('-n, --nickname <nickname>', 'Use this nickname to authorize post')
    .option('-s, --service <service>', 'Service to send file to, for relative urls')
    .option('-v, --verbose', 'Verbose mode for debugging')
    .option('-d, --debug', 'Ultra verbose mode for debugging')
    .action(function(url,filepath) {
        util.setupLogging( program );

        doAction(url,filepath,program)
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

function doAction(url,filepath,program) {
    // find service to post to
    let serviceName = program.service;
    let service = serviceName && storage.findServiceByName( serviceName );

    // find persona to authorize post
    let persona;
    if( program.persona )
        persona = findPersonaByPid( program.persona );
    else if( program.nickname )
        persona = findPersonaByNickname( program.nickname );
    else
        throw new Error( 'Please specify a persona or nickname to authorize this post' );

    if( global.VERBOSE )
        console.log( 'Using persona:', persona );

    let pid = persona.pid;
    let path = 'personas/' + pid + '/' + url;
    let file = fs.readFileSync(filename);
    let contentType = "text/html";
    let contentPath = null;

    await net.putFile(pid,service,path,file,contentType,contentPath);
}