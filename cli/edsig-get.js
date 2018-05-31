#!/usr/bin/env node

const request = require('request')
const fs = require('fs')

const edsig = require('../index')
const util = require('./util')
const net = require('./net')
const storage = require('./storage')

var program = require('commander')

program
    .arguments('<url> [filename]')
    .option('-s, --service <service>', 'Service to get file from, for relative urls')
    .action(function(url,filename) {
        doAction(url,filename,program.service)
        .then( result => {
            console.log( JSON.stringify( result.certified, null, 4 ) );
        }).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

async function doAction(url,filename,serviceName) {
    let service = serviceName ? storage.findServiceByName( serviceName ) : null;
    let result = await net.getFile(url,service);
    if( filename ) {
        fs.writeFileSync( filename, result.body );
    }
    return result; 
}
