#!/usr/bin/env node

const request = require('request')
const fs = require('fs')
const path = require('path')

const edsig = require('../index')

const HOME_DIR = require('os').homedir();
const PERSONAS_DIR = path.join( HOME_DIR, '.cryptomessaging', 'personas' );

let program = require('commander')

program
    .arguments('<url> <filepath>')
    .option('-p, --persona [pid]', 'Use this persona to authorize post')
    .option('-n, --nickname [nickname]', 'Use this nickname to authorize post')
    .action(function(url) {
        // find persona to authorize post
        let persona;
        if( program.persona )
            persona = findPersonaByPid( program.persona );
        else if( program.nickname )
            persona = findPersonaByNickname( program.nickname );
        else
            return console.log( 'Please specify a persona or nickname to authorize this post');

        if( persona )
            console.log( 'Using', persona );
    })
    .parse(process.argv);



function post() {
    request( url, (err,res,body) => {
        if(err)
            return console.log('ERROR:', err);

        // verify the content certification
        let req = {
            originalUrl:"",
            body: body,
            headers: res.headers
        };
        console.log('req',req);
        edsig.verifyContentSignature(req,(err,auth) => {
            if(err)
                return console.log('FAILED to certify content');

            console.log('Certified from',auth,body);
        });
    });     
}