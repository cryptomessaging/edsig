#!/usr/bin/env node

const edsig = require('../index')
const storage = require('./storage')
const fs = require('fs')
const path = require('path')
const net = require('./net')
const util = require('./util')

try {
    setup();
} catch(err) {
    util.signalError(err);
}

function setup() {
    // Create ~/tmp directory
    const homedir = require('os').homedir();
    const tmpdir = path.join( homedir, 'tmp' );
    if( fs.existsSync( tmpdir ) != true )
        fs.mkdir( tmpdir );

    console.log( 'Setting up EdSig demo...' );

    // Does Satoshi exist?
    let nBest = storage.bestPersonasByNickname('satoshi');
    let persona;
    if( nBest.length == 0 ) {
        // if there's no Satoshi persona, then create...
        let created = edsig.Persona.create('Satoshi');
        persona = created.persona;
        storage.savePersona( persona, created.keyring, created.secrets );
        console.log( '- Created new persona', persona.nickname, 'with pid', persona.pid );
    } else {
        persona = nBest[0];
        console.log( '- Using existing persona', persona.nickname, 'with pid', persona.pid );
    }

    // copy sample files into ~/tmp 
    const demodir = path.join(__dirname, 'demo');
    let demofiles = fs.readdirSync( demodir )
    demofiles.forEach( filename => {
        if( filename.startsWith('.') != true ) {
            fs.copyFileSync( path.join( demodir, filename), path.join( tmpdir, filename ) );
            console.log( '- Copied', filename, 'to', tmpdir );
        }
    });

    const CRLF = '\r\n';
    console.log( CRLF + CRLF + 'Please change to the ~/tmp directory and try these commands...'
        + CRLF + CRLF + 'Join the Alpha Persona Service so we can use the -s alpha option later:' 
        + CRLF + '  $ edsig join https://personas.cryptomessaging.org -n satoshi'
        + CRLF + CRLF + 'Add a self-certified diploma to your resume and fetch it back:'
        + CRLF + '  $ edsig put college-diploma.jpg resume/college-diploma.jpg -s alpha -n satoshi'
        + CRLF + '  $ edsig get -s alpha personas/' + persona.pid + '/resume/college-diploma.jpg diploma1.jpg -v'
        + CRLF + CRLF + 'Add a diploma certified by Nakamoto himself(!) to your resume and fetch it back:'
        + CRLF + '  $ edsig put university-diploma.jpg resume/university-diploma.jpg -s alpha -n satoshi --certification cert(university-diploma.jpg).json'
        + CRLF + '  $ edsig get https://personas.cryptomessaging.org/personas/' + persona.pid + '/resume/university-diploma.jpg diploma2.jpg'
        + CRLF + CRLF + 'Certify your college diploma locally, and verify the certification:'
        + CRLF + '  $ edsig sign college-diploma.jpg -n sat > cert.json'
        + CRLF + '  $ edsig verify college-diploma.jpg cert.json -v' );
}

