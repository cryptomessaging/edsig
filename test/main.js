const edsig = require('../index')()
const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')
const assert = require('assert')
const storage = require('../cli/storage')
const util = require('../core/util')

global.DEBUG = true;
global.VERBOSE = true;

const root_keypair = edsig.keypairFromSecret( 'AqY7tB0Lbq1yKXCZfQa6QFkiPy5WCYjUrH7ahJBUalM' );
const pid = edsig.base64url( Buffer.from( root_keypair.getPublic() ) );

const sub_keypair = edsig.keypairFromSecret( '_cdHfTR0IhctvUm93jbRzTuU9kAihVTcm7Hu0ohP2ws' );
const subkey = edsig.base64url( Buffer.from( sub_keypair.getPublic() ) );

const third_party_keypair = edsig.keypairFromSecret( 'QMy-kk6iza68y0UiJosE96xRfJkcRS_E2Hr7r4LKygI' );
const third_party_pid = edsig.base64url( Buffer.from( sub_keypair.getPublic() ) );

//
// Keypath parsing
//

        // - 4fwe2er@foo.com = use master key
        // - 4rfg: = select persona starting with 4rfg but use subkey
        // - 34rerfwf:sfwefw@foo.com = use selected subkey
        // - @foo.com,bar.com = use master key of named persona, hinting at two persona servers
        // - :@foo.com = use subkey from named persona

(function() {
    [
        ['4fwe2er@foo.com',{
            "hosts": [
                "foo.com"
            ],
            "keys": [
                "4fwe2er"
            ]
        }],
        ['4rfg:',{
            "hosts": [],
            "keys": [
                "4rfg",
                null
            ]
        }],
        ['34rerfwf:sfwefw@foo.com',{
            "hosts": [
                "foo.com"
            ],
            "keys": [
                "34rerfwf",
                "sfwefw"
            ]
        }],
        [' 34rerfwf : sfwefw @ foo.com ',{
            "hosts": [
                "foo.com"
            ],
            "keys": [
                "34rerfwf",
                "sfwefw"
            ]
        }],
        ['@foo.com,bar.com',{
            "hosts": [
                "foo.com",
                "bar.com"
            ],
            "keys": [
                null
            ]
        }],
        ['@',{
            "hosts": [
                null
            ],
            "keys": [
                null
            ]
        }],
        [':',{
            "hosts": [],
            "keys": [
                null,
                null
            ]
        }],
        [':@',{
            "hosts": [
                null
            ],
            "keys": [
                null,
                null
            ]
        }],
        [':@foo.com',{
            "hosts": [
                "foo.com"
            ],
            "keys": [
                null,
                null
            ]
        }],
        [':435fd',{
            "hosts": [],
            "keys": [
                null,
                "435fd"
            ]
        }]
    ].forEach( pair => {
        let keypath = new edsig.Keypath( pair[0] );
        console.log( 'Testing Keypath', pair[0], '=>', keypath.toString() );
        assert.deepEqual(keypath,pair[1],'Keypath does not match expected result, value is: ' + util.stringify(keypath) );
    });
})();

//
// SHA3 hashing test
//

(function() {
    // simple text
    let hash = edsig.hashBody( 'Hello World!' );
    let expected = 'SHA3-256=0OR0hrv0wWrKwm-LZTWSlzwTYpCfkCYodwifnIpFNq8';
    assert.equal(hash,expected,'SHA3 hash did not match expected result, hash is: ' + hash );

    // big buffer
    let buffer = Buffer.allocUnsafe(1000000);   // 1MB
    buffer.fill('hello! ');
    hash = edsig.hashBody( buffer );
    expected = 'SHA3-256=_W7Zt0IaFFvHUt7lRPk7IsBO6yofhfNAdflvmHV-_KQ';
    assert.equal(hash,expected,'SHA3 hash did not match expected result, hash is: ' + hash );
})();

//
// Creating a persona, saving, and retrieval
//

(function() {
    const masterSecret = Buffer.from( 'AqY7tB0Lbq1yKXCZfQa6QFkiPy5WCYjUrH7ahJBUalM', 'base64' );
    const subkeySecret = Buffer.from( 'QMy-kk6iza68y0UiJosE96xRfJkcRS_E2Hr7r4LKygI', 'base64' );

    const {persona,keyring,secrets} = edsig.Persona.create('Test user',masterSecret,subkeySecret);
    secrets.master.created = new Date('12-13-1967').toISOString();
    const subkeyId = Object.keys( secrets.subkeys )[0];
    const subkey = secrets.subkeys[subkeyId];
    subkey.created = new Date('5-10-1977').toISOString();
    keyring[0].created = subkey.created;

    // verify persona
    const expectedPersona = {
        "pid": "ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw",
        "nickname": "Test user"
    };
    assert.deepEqual(persona,expectedPersona,'Persona does not match expected result, value is: ' + util.stringify(persona) );

    // verify secrets
    const expectedSecrets = {
        "master": {
            "type": "ed25519",
            "created": "1967-12-13T08:00:00.000Z",
            "id": "ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw",
            "secret": "AqY7tB0Lbq1yKXCZfQa6QFkiPy5WCYjUrH7ahJBUalM"
        },
        "subkeys": {
            "pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA": {
                "type": "ed25519",
                "created": "1977-05-10T07:00:00.000Z",
                "id": "pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA",
                "secret": "QMy-kk6iza68y0UiJosE96xRfJkcRS_E2Hr7r4LKygI"
            }
        }
    };
    assert.deepEqual(secrets,expectedSecrets,'Secrets do no match expected result, value is: ' + util.stringify(secrets) );

    // verify keyring
    const expectedKeyring = [
        {
            "type": "ed25519",
            "created": "1977-05-10T07:00:00.000Z",
            "id": "pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA"
        }
    ];
    assert.deepEqual(keyring,expectedKeyring,'Keyring does not match expected result, value is: ' + util.stringify(keyring) );

    // save to storage, and load back in, and verify again
    storage.savePersona(persona,keyring,secrets);
    const persona2 = storage.loadPersona(persona.pid);
    assert.deepEqual(persona2,expectedPersona,'Stored persona does not match expected result, value is: ' + util.stringify(persona2) );

    const secrets2 = storage.loadSecrets(persona.pid);
    assert.deepEqual(secrets2,expectedSecrets,'Stored secrets does not match expected result, value is: ' + util.stringify(secrets2) );

    const subkey2 = storage.loadSubkey(persona.pid,subkeyId);
    assert.deepEqual(subkey2,keyring[0],'Stored keybase does not match expected result, value is: ' + util.stringify(subkey2) + ' expected: ' + util.stringify(keyring[0]) );
})();


//
// Basic request test
//
(function () {

    // Create request
    let {path,contentPath,req} = createRequest();
    edsig.addAuthorization( path, req, root_keypair );
    let actual = req.headers.authorization;
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=g_DX-oCbxx3Ysb-wo7VvkC085yGlVWWmjRzsSDdc9sXVwcXvhRhbv_vgnW8vPi2I3f01c3Qz7u8MGoK4qPAbCA';  
    assert.equal(actual,expected,'Authorization header is incorrect, value is', actual );

    edsig.addCertificationHeaders( contentPath, req.headers, req.body, root_keypair );
    expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=bTMxLSkrrHl4Gw-GywvTWP4aOSXsgictnDysbfh7YmCoWPhEiksDGGfxVrlImNE0l0JnnTAvVZyYfcdlTDDJDA';
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
            'content-length': 12,
            'digest': 'SHA3-256=1uqPmh8i4SmOWpUGvQZvI8xWAB9dNlgjRKYoZJ31Oug',
            'x-certification': 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=bTMxLSkrrHl4Gw-GywvTWP4aOSXsgictnDysbfh7YmCoWPhEiksDGGfxVrlImNE0l0JnnTAvVZyYfcdlTDDJDA',
            'x-content-created': '1967-12-13T00:00:00.000Z',
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
        ['date',new Date('2010-1-3').toISOString()],
        ['host','danger.com'],
        ['digest','CRC32C 4fec3345']
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
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw:GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4@startlinglabs.com,localhost:3030;sig=qyztdholruPwrnuZqaVPE1If12cvWyNnJ0uq-dwVhH5YbqIsthc6Iu2C4bQl6krdwpaQTyrYM2XNmdBLYjGACw';  
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
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw:GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4@startlinglabs.com,localhost:3030;sig=qyztdholruPwrnuZqaVPE1If12cvWyNnJ0uq-dwVhH5YbqIsthc6Iu2C4bQl6krdwpaQTyrYM2XNmdBLYjGACw';  
    assert.equal(actual,expected,'Subkey authorization header is incorrect, value is: ' + actual );

    edsig.addCertificationHeaders( contentPath, req.headers, req.body, third_party_keypair );
    expected = 'EdSig kp=pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA;sig=6aIADYdM9iti4piSwFJrd8RMIi0Fmw8jD8k0Bdp1LdG_wHPLVACahqlTZj3ILYImouI7G_d477lDsUklKsI4BQ';
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
            'content-length': 12,
            'digest': 'SHA3-256=1uqPmh8i4SmOWpUGvQZvI8xWAB9dNlgjRKYoZJ31Oug',
            'x-certification': 'EdSig kp=pUL9YNHQ39odztm9aEqjBbCwRAn0aSD3jQZAOJi8jZA;sig=6aIADYdM9iti4piSwFJrd8RMIi0Fmw8jD8k0Bdp1LdG_wHPLVACahqlTZj3ILYImouI7G_d477lDsUklKsI4BQ',
            'x-content-created': '1967-12-13T00:00:00.000Z',
            'x-content-path': 'personas/ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw/persona.json'
        }
    };
    assert.deepEqual( certificate, expected, 'Third party cerification failed, value is: ' + JSON.stringify(certificate,null,4) );
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