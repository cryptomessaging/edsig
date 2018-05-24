#!/usr/bin/env node

const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')
const path = require('path')

const edsig = require('../index')
const util = require('../util')

let program = require('commander')
program
    .arguments('[name]')
    .option('-p, --push [service]', 'Push persona to service')
    .option('-i, --image [filepath]', 'Include persona image')
    .action(function(name) {
        name = name.trim();
        if( name.length == 0 ) {
            console.log( 'ERROR: Please provide a name');
            process.exit(1);
        }

        const { persona, secrets } = createPersona(name,program.image);
        util.savePersona(persona, secrets, program.image);          
    })
    .parse(process.argv);

function createPersona(name,imagePath) {
    const secret = randomBytes(32);
    const keypair = ec.keyFromSecret(secret);
    const pid = edsig.base64url( Buffer.from( keypair.getPublic() ) );
    let persona = {
        pid: pid,
        nickname: name
    };

    let secrets = {
        root: {
            type: "ed25519",
            secret: edsig.base64url( Buffer.from( secret ) )
        }
    };

    // if there's an image, add just the filename to images list
    if( imagePath )
        persona.images = [ path.basename(imagePath) ];

    return { persona:persona, secrets:secrets };
}