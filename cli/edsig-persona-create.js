#!/usr/bin/env node

const path = require('path')
const Options = require('./options')
const edsig = require('../index')()
const util = require('./util')
const storage = require('./storage')

let program = Options.setup( require('commander') )
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

    const {persona,keyring,secrets} = edsig.Persona.create(nickname);
    if( program.image )
        persona.images = [ path.basename(imagePath) ];
    storage.savePersona(persona, keyring, secrets, program.image);
}
