#!/usr/bin/env node

var program = require('commander');

program
    .version('0.1.0')
    .command('create [name]', 'Create a new persona')
    //.command('post <src> <dest>', 'Post a file to a service')
    //.command('mkdir <path>', 'Create a directory in a service')
    .parse(process.argv);