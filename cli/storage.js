//
// Functions for interacting with local storage of personas and services
// in the ~/.cryptomessaging/ directory 
//

const fs = require('fs')
const path = require('path')
const util = require('./util')
const nBest = util.nBest;

const HOME_DIR = require('os').homedir();
const PERSONAS_DIR = path.join( HOME_DIR, '.cryptomessaging', 'personas' );
const SERVICES_FILEPATH = path.join( HOME_DIR, '.cryptomessaging', 'services.json' );

module.exports = {
    loadServices: loadServices,
    saveServices: saveServices,
    findServiceByName: findServiceByName,
    findPersonaByPid: findPersonaByPid,
    findPersonaByNickname: findPersonaByNickname,
    bestPersonasByNickname: bestPersonasByNickname,
    loadPersona: loadPersona,
    loadSecrets: loadSecrets,
    loadSubkey: loadSubkey,
    savePersona: savePersona,
    SERVICES_FILEPATH: SERVICES_FILEPATH
};

//===== Services =====
// Services are saved in a JSON file at ~/.cryptomessaging/services.json

function serviceNameResolver(service) {
    return service.service ? service.service.name : null; 
}

function findServiceByName(name) {
    let services = loadServices();
    let matcher = new nBest.STRING_MATCHER(name);
    let found = nBest.search( services.active, serviceNameResolver, matcher );
    if( found.length == 0 )
        throw new Error('Failed to find service with name ' + name );

    if( global.DEBUG )
        console.log( 'Using service:', util.stringify( found[0] ) );
    else if( global.VERBOSE )
        console.log( 'Using service:', found[0].item.service.name );

    return found[0].item;
}

function loadServices() {
    //if( global.DEBUG ) console.log( 'loadServices()' );
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
function findPersonaByPid(partialpid) {
    if( fs.existsSync( PERSONAS_DIR ) != true )
        return [];
    
    let found = [];
    fs.readdirSync(PERSONAS_DIR).forEach( filename => {
        if( filename.startsWith( partialpid ) ) {
            found.push(filename);
        }
    });

    if( found.length == 0 )
        throw new Error( 'Failed to find persona with pid starting with ' + partialpid );
    
    if( found.length > 1 )
        throw new Error( 'Multiple personas found: ' + found.join(', ') );

    logPersona( found[0] );
    return loadPersona(found[0]);
}

function logPersona(persona) {
    if( global.DEBUG )
        console.log( 'Using persona:', util.stringify( persona ) );
    else if( global.VERBOSE )
        console.log( 'Using persona:', persona.nickname );    
}

/**
 * Find the personas that match a partial nickname.
 * @param {string} nickname
 * @return {Array} zero or more persona matches, ordered by the best match. 
 */
function bestPersonasByNickname(nickname) {
    nickname = nickname.toLowerCase();

    if( fs.existsSync( PERSONAS_DIR ) != true )
        return [];

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

    return found;  
}

// find the closest matching persona by nickname
function findPersonaByNickname(nickname) {
    let found = bestPersonasByNickname(nickname);

    if( found.length == 0 )
        throw new Error( 'WARNING: Failed to find persona with nickname containing ' + nickname );

    if( found.length > 1 ) {
        let duplicates = found.reduce( (result,e) => { result.push(e.nickname); return result },[]);
        throw new Error( 'WARNING: Multiple personas found: ' + duplicates.join(', ') );
    }

    logPersona( found[0] );
    return found[0];
}

// pid - base64url of public key
function loadPersona(pid) {
    const filepath = path.join( PERSONAS_DIR, pid, 'persona.json' );
    let json = fs.readFileSync( filepath );
    return JSON.parse( json );
}

function loadSecrets(pid) {
    const filepath = path.join( PERSONAS_DIR, pid, 'secrets.json' );
    let json = fs.readFileSync( filepath );
    return JSON.parse( json );
}

function loadSubkey(pid,subkeyId) {
    const filepath = path.join( PERSONAS_DIR, pid, 'keyring', subkeyId + '.json' );
    let json = fs.readFileSync( filepath );
    return JSON.parse( json );
}

function savePersona(persona,keyring,secrets,imagePath) {
    // make sure the image exists
    if( imagePath && fs.existsSync( imagePath ) != true )
        return util.signalError( new Error( "Image doesn't exist at " + imagePath ) );

    // make sure my persona directory is set up
    const configdir = ensureDir( path.join( HOME_DIR, '.cryptomessaging' ) );
    const personasdir = ensureDir( path.join( configdir, 'personas' ) );
    const mypersonadir = ensureDir( path.join( personasdir, persona.pid ) );
    const keyringdir = ensureDir( path.join( mypersonadir, 'keyring' ) );

    // write pretty JSON
    saveJson( persona, mypersonadir, 'persona.json', 'persona' );
    saveJson( secrets, mypersonadir, 'secrets.json', 'secrets' );
    if( keyring ) {
        keyring.forEach( keybase => {
            saveJson( keybase, keyringdir, keybase.id + '.json', 'keyring ' + keybase.id );
        });
    }

    // copy image?
    if( imagePath ) {
        const imagesdir = ensureDir( path.join( mypersonadir, 'images' ) );
        const dest = path.join( imagesdir, persona.images[0] );
        fs.copyFileSync( imagePath, dest );
        console.log( 'Copied', imagePath, 'to', dest );
    }
}

//
// Utility
//

function saveJson(obj,dir,filename,label) {
    const json = JSON.stringify(obj, null, 4);
    const fullpath = path.join( dir, filename )
    fs.writeFileSync( fullpath, json );

    if( label )
        console.log( 'Saved', label + ':', JSON.stringify(obj, null, 4), 'at', fullpath );
    return fullpath; 
}

// ensures the target directory exists
function ensureDir(path) {
    if( fs.existsSync( path ) != true )
        fs.mkdirSync( path );

    return path;
}