#!/usr/bin/env node

var program = require('commander');

// Standard options:
//  -n --nickname
//  -s --service
//  -p --pid
//  -c --certification <filename> save certificate

program
    .version('0.1.0')
    .command('persona', 'Create, list, and update local personas')
    .command('join', 'Join a persona, group, or push service')
    .command('get', 'Fetch a file from a persona service')
    .command('put', 'Publish a file to a persona service')
    .command('demo', 'Change to a tmp directory and copy in demo files')
    .command('sign', 'Create a certificate for a file' )
    .command('verify', 'Verify a certified file')
    .parse(process.argv);
    