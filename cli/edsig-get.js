#!/usr/bin/env node

const request = require('request');
var program = require('commander');
const edsig = require('../index');

program
    .arguments('<url>')
    .action(function(url) {
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
    })
    .parse(process.argv);
