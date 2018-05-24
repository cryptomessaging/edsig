#!/usr/bin/env node

var program = require('commander');

program
    .version('0.1.0')
    .command('persona', 'Create, list, and update personas')
    .command('join', 'Join a persona, group, or push service')
    .command('get <url>', 'Fetch a file from a persona service')
    //.command('post <src> <dest>', 'Post a file to a service')
    //.command('mkdir <path>', 'Create a directory in a service')
    .parse(process.argv);