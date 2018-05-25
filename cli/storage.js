//
// Functions for interacting with local storage of personas and services
// in the ~/.cryptomessaging/ directory 
//

const fs = require('fs')
const path = require('path')
const util = require('./util')

const DEBUG = false;

const HOME_DIR = require('os').homedir();
const PERSONAS_DIR = path.join( HOME_DIR, '.cryptomessaging', 'personas' );
const SERVICES_FILEPATH = path.join( HOME_DIR, '.cryptomessaging', 'services.json' );

module.exports = {
    loadServices: loadServices,
    saveServices: saveServices,
    findPersonaByPid: findPersonaByPid,
    findPersonaByNickname: findPersonaByNickname,
    loadPersona: loadPersona,
    loadPersonaSecrets: loadPersonaSecrets,
    savePersona: savePersona,
    SERVICES_FILEPATH: SERVICES_FILEPATH
};

//===== Services =====
// Services are saved in a JSON file at ~/.cryptomessaging/services.json

function loadServices() {
    if( DEBUG ) console.log( 'loadServices()' );
    if( fs.existsSync( SERVICES_FILEPATH ) != true ) {
        // doesn't exist yet, so simply return an empty one
        return {};
    }

    let json = fs.readFileSync( SERVICES_FILEPATH );
    return JSON.parse( json );
}

function saveServices(services) {
    let json = JSON.stringify( services, null, 4 );
    fs.writeFileSync( SERVICES_FILEPATH, json );
}

//===== Personas =====

// find the closest matching persona by partial pid
function findPersonaByPid (partialpid) {
    let found = [];
    fs.readdirSync(PERSONAS_DIR).forEach( filename => {
        if( filename.startsWith( partialpid ) ) {
            found.push(filename);
        }
    });

    if( found.length == 0 ) {
        console.log( 'WARNING: Failed to find persona with pid starting with', partialpid );
        return;
    }
    
    if( found.length > 1 )
        console.log( 'WARNING: Multiple personas found, using', found[0] );

    return loadPersona(found[0]);
}

// find the closest matching persona by nickname
function findPersonaByNickname(nickname) {
    nickname = nickname.toLowerCase();

    let found = [];
    fs.readdirSync(PERSONAS_DIR).forEach( filename => {
        if( !filename || filename.startsWith('.') )
            return; // handle system files

        let persona = loadPersona(filename);
        if( persona && persona.nickname ) {
            if( persona.nickname.toLowerCase().indexOf(nickname) > -1 )
                found.push(persona);
        }
    });

    if( found.length == 0 ) {
        console.log( 'WARNING: Failed to find persona with nickname containing', nickname );
        return;
    }

    if( found.length > 1 ) {
        let duplicates = found.reduce( (result,e) => { result.push(e.nickname); return result },[]);
        console.log( 'WARNING: Multiple personas found, using', found[0].nickname, 'from', duplicates.join(', ') );
    }

    return found[0];
}

// pid - base64url of public key
function loadPersona(pid) {
    const filepath = path.join( PERSONAS_DIR, pid, 'persona.json' );
    let json = fs.readFileSync( filepath );
    return JSON.parse( json );
}

function loadPersonaSecrets(pid) {
    const filepath = path.join( PERSONAS_DIR, pid, 'secrets.json' );
    let json = fs.readFileSync( filepath );
    return JSON.parse( json );
}

function savePersona(persona,secrets,imagePath) {
    // make sure the image exists
    if( imagePath && fs.existsSync( imagePath ) != true )
        return util.signalError( new Error( "Image doesn't exist" ) );

    // make sure my persona directory is set up
    const configdir = ensureDir( path.join( HOME_DIR, '.cryptomessaging' ) );
    const personasdir = ensureDir( path.join( configdir, 'personas' ) );
    const mypersonadir = ensureDir( path.join( personasdir, persona.pid ) );

    // write pretty JSON
    const filename = saveJson(persona,mypersonadir,'persona.json');
    saveJson(secrets,mypersonadir,'secrets.json');

    // copy image?
    if( imagePath ) {
        const imagesdir = ensureDir( path.join( mypersonadir, 'images' ) );
        const dest = path.join( imagesdir, persona.images[0] );
        fs.copyFileSync( imagePath, dest );
    }

    console.log( 'Created persona', JSON.stringify(persona, null, 4), 'at', filename );
}

//
// Utility
//

function saveJson(obj,dir,filename) {
    const json = JSON.stringify(obj, null, 4);
    const fullpath = path.join( dir, filename )
    fs.writeFileSync( fullpath, json );
    return fullpath; 
}

// ensures the target directory exists
function ensureDir(path) {
    if( fs.existsSync( path ) != true )
        fs.mkdirSync( path );

    return path;
}