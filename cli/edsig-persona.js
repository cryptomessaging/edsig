#!/usr/bin/env node

var program = require('commander');

program
    .version('0.1.0')
    .command('create', 'Create a new persona')
    .parse(process.argv);