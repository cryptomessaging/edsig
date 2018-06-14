const edsig = require('../index')
const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')
const assert = require('assert');

global.DEBUG = true;
global.VERBOSE = true;

const root_keypair = edsig.keypairFromSecret( 'AqY7tB0Lbq1yKXCZfQa6QFkiPy5WCYjUrH7ahJBUalM' );
const pid = edsig.base64url( Buffer.from( root_keypair.getPublic() ) );

const sub_keypair = edsig.keypairFromSecret( '_cdHfTR0IhctvUm93jbRzTuU9kAihVTcm7Hu0ohP2ws' );
const subkey = edsig.base64url( Buffer.from( sub_keypair.getPublic() ) );

const third_party_keypair = edsig.keypairFromSecret( 'QMy-kk6iza68y0UiJosE96xRfJkcRS_E2Hr7r4LKygI' );
const third_party_pid = edsig.base64url( Buffer.from( sub_keypair.getPublic() ) );

//
// SHA3 hashing test
//

(function() {
    // simple text
    let hash = edsig.hashBody( 'Hello World!' );
    let expected = 'SHA3-256 0OR0hrv0wWrKwm-LZTWSlzwTYpCfkCYodwifnIpFNq8';
    assert.equal(hash,expected,'SHA3 hash did not match expected result, hash is: ' + hash );

    // big buffer
    let buffer = Buffer.allocUnsafe(1000000);   // 1MB
    buffer.fill('hello! ');
    hash = edsig.hashBody( buffer );
    expected = 'SHA3-256 _W7Zt0IaFFvHUt7lRPk7IsBO6yofhfNAdflvmHV-_KQ';
    assert.equal(hash,expected,'SHA3 hash did not match expected result, hash is: ' + hash );
})();

//
// Basic request test
//
(function () {

    // Create request
    let {path,contentPath,req} = createRequest();
    edsig.addAuthorization( path, req, root_keypair );
    let actual = req.headers.authorization;
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=QyR4DQ2a0Idyhg4jgd3lXYC_KeVdQX8TgXoGrj8-QQkuDeNi-kJvX8DwxA-YHkf4czmEN0wC5wuEHpm8KAGvDw';  
    assert.equal(actual,expected,'Authorization header is incorrect, value is', actual );

    edsig.addCertificationHeaders( contentPath, req.headers, req.body, root_keypair );
    expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=kBwP4kWdJ_Tdh75tfq5Abu9haY8NKNS30Mw97eUJzj1PNuPBwl3DtYiMTl8LB6fr_D2O_rgosiKMKGNasDdlAw';
    actual = req.headers['x-certification'];
    assert.equal(actual,expected,'Certification header did not match expected result, header is: ' + actual );

    // Verify request
    let authorization = edsig.verifyAuthorization( path, req );
    console.log( 'Request authorization', authorization );
    expected = {
        type: 'edsig',
        keypath: {
            hosts: [],
            keys: [ 'ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw' ]
        } 
    };
    assert.deepEqual(authorization, expected,'Verification failed');

    let certification = edsig.verifyCertification(path, req );
    expected = {
        type: 'edsig',
        keypath: 'ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw',
        headers: {
            'x-certification': 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=kBwP4kWdJ_Tdh75tfq5Abu9haY8NKNS30Mw97eUJzj1PNuPBwl3DtYiMTl8LB6fr_D2O_rgosiKMKGNasDdlAw',
            'content-length': 12,
            'content-type': 'application/json',
            'x-content-created': '1967-12-13T00:00:00.000Z',
            'x-content-hash': 'SHA3-256 1uqPmh8i4SmOWpUGvQZvI8xWAB9dNlgjRKYoZJ31Oug',
            'x-content-path': 'personas/ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw/persona.json'
        }
    };
    assert.deepEqual(certification,expected,'Certification does not match expected result, value is: ' + certification );
})();

//
// Test man-in-the-middle attacks
//
(function(){

    [
        ['content-length','100'],
        ['content-type','text/html'],
        ['date',new Date('2010-1-3').toISOString()],
        ['host','danger.com'],
        ['x-content-hash','CRC32C 4fec3345']
    ].forEach( item => {
        alterHeader(item[0],item[1]);
    });

    function alterHeader(name,value) {
        if( global.DEBUG )
            console.log( 'Forging header',name,'to',value);
        let {path,contentPath,req} = createRequest();
        edsig.addAuthorization( path, req, root_keypair );
        edsig.addCertificationHeaders( contentPath, req.headers, req.body, root_keypair );
        req.headers[name] = value;
        try {
            edsig.verifyAuthorization( path, req );
            throw new Error('Forged header \'' + name + '\' was not detected');
        } catch(err) {
            // this is the expected path :)
        }   
    }
})();

//
// Test subkey authorization
//
(function () {
    let {path,contentPath,req} = createRequest();
    let keypath = pid + ':' + subkey + '@startlinglabs.com,localhost:3030';
    edsig.addAuthorization( path, req, sub_keypair, keypath );
    let actual = req.headers.authorization;
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw:GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4@startlinglabs.com,localhost:3030;sig=chki4jw1lURoVKsT7PhXE9N_0M3C0_v-Za5yY7tgBbrBz7duxMxTzeDk8k7v8tejYkHmtwjvOfhDJA4W9FfJCw';  
    assert.equal(actual,expected,'Subkey authorization header is incorrect, with value of: ' + actual );

    // Verify request
    let authorization = edsig.verifyAuthorization( path, req );
    expected = {
        type: 'edsig',
        keypath: {
            hosts: [ 'startlinglabs.com', 'localhost:3030' ],
            keys: [
                'ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw',
                'GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4'
            ]
        } 
    };
    assert.deepEqual(authorization, expected,'Subkey authorization failed, actual value:' + authorization );
})();

//
// Test third party content
//
(function () {
    let {path,contentPath,req} = createRequest();
    let keypath = pid + ':' + subkey + '@startlinglabs.com,localhost:3030';
    edsig.addAuthorization( path, req, sub_keypair, keypath );
    let actual = req.headers.authorization;
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw:GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4@startlinglabs.com,localhost:3030;sig=chki4jw1lURoVKsT7PhXE9N_0M3C0_v-Za5yY7tgBbrBz7duxMxTzeDk8k7v8tejYkHmtwjvOfhDJA4W9FfJCw';  
    assert.equal(actual,expected,'Subkey authorization header is incorrect, value is: ' + actual );

    edsig.addCertificationHeaders( contentPath, req.headers, req.body, third_party_keypair );
    expected = 'EdSig kp=pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA;sig=VqTJNwffldPx7y5DbV-w5KTruqK91vjf7O4-EHprdYzjo_N_-ak_xOtWMMGTB3qPuPCOpvzDRtE0hGSRZcOgCQ';
    actual = req.headers['x-certification'];
    assert.equal(actual,expected,'Certification header did not match, value is: ' + actual );

    // Verify request authorization
    let authorization = edsig.verifyAuthorization( path, req );
    console.log( 'Request authorization', authorization );
    expected = {
        type: 'edsig',
        keypath: {
            hosts: [ 'startlinglabs.com', 'localhost:3030' ],
            keys: [
                'ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw',
                'GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4'
            ]
        } 
    };
    assert.deepEqual(authorization, expected,'Subkey authorization failed, value is:' + authorization );

    // Verify content certification
    let certificate = edsig.verifyCertification( path, req );
    expected = {
        type: 'edsig',
        keypath: 'pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA',
        headers: {
            'x-certification': 'EdSig kp=pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA;sig=VqTJNwffldPx7y5DbV-w5KTruqK91vjf7O4-EHprdYzjo_N_-ak_xOtWMMGTB3qPuPCOpvzDRtE0hGSRZcOgCQ',
            'content-length': 12,
            'content-type': 'application/json',
            'x-content-created': '1967-12-13T00:00:00.000Z',
            'x-content-hash': 'SHA3-256 1uqPmh8i4SmOWpUGvQZvI8xWAB9dNlgjRKYoZJ31Oug',
            'x-content-path': 'personas/ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw/persona.json'
        }
    };
    assert.deepEqual( certificate, expected, 'Third party cerification failed, value is: ' + certificate );
})();

//
// Utility
//

function createRequest() {
    let contentPath = 'personas/' + pid + '/persona.json';
    let path='/v1/' + contentPath;
    let req = {
        method: 'POST',
        headers: {
            date: new Date('2001-05-10').toISOString(),
            'x-content-created': new Date('1967-12-13').toISOString(),
            'content-type': 'application/json',
            host: 'localhost'
        },
        body: "Hello world!"
    };

    return { path:path, contentPath:contentPath, req:req };   
}