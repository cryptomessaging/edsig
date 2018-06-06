#!/usr/bin/env node

const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')
const path = require('path')
const Options = require('./options')
const edsig = require('../index')
const util = require('./util')
const storage = require('./storage')

let program = require('commander')
let acted;
program
    .description('Create a persona on the local computer')
    .arguments('<nickname>')
    .option('-i, --image <filepath>', 'Include persona image')
    .action( nickname => {
        acted = true;
        handleAction(nickname).catch(err => {
            util.signalError(err);
        });
    })
    .parse(process.argv);

if( !acted )
    program.help();

async function handleAction(nickname) {
    let options = new Options(program);
    let imagePath = program.image;

    nickname = nickname.trim();
    if( nickname.length == 0 )
        throw new Error( 'Please provide a nickname' );

    const {persona,secrets} = edsig.createPersona(nickname);
    if( program.image )
        persona.images = [ path.basename(imagePath) ];
    storage.savePersona(persona, secrets, program.image);

    console.log( 'Secrets:', JSON.stringify(secrets,null,4) );  
}
