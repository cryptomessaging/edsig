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

//
// Basic request test
//
(function () {

    // Create request
    let {path,contentPath,req} = createRequest();
    edsig.addAuthorization( path, req, root_keypair );
    let actual = req.headers.authorization;
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=WlcpcCNE0h3Yk3EHmEzbYz_YfNsWcjxWluk2n-CPc95x0G5vbH7Ah7pzov1kuNTaUyoelxeALgM8eCJw4PRiDw';  
    if( global.DEBUG ) console.log( 'Authorization:', actual );
    assert.equal(actual,expected,'Authorization header is incorrect');

    edsig.addCertification( { contentPath: contentPath }, req, root_keypair );
    expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=ZsdFlJsZtvq0rK1Lgfh1R8elUapwBkDmvBVMqCDzre5MBNTvV2vEPtCeJ9Vz2lfkJ7kWdVlyE8WzueLmzzlDAw';
    actual = req.headers['x-certification'];
    if( global.DEBUG ) console.log( 'Certification:', actual );
    assert.equal(actual,expected,'Certification header did not match');

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
    console.log( 'Content certification', certification );
    expected = {
        type: 'edsig',
        keypath: 'ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw',
        headers: {
            'x-certification': 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=ZsdFlJsZtvq0rK1Lgfh1R8elUapwBkDmvBVMqCDzre5MBNTvV2vEPtCeJ9Vz2lfkJ7kWdVlyE8WzueLmzzlDAw',
            'content-length': 12,
            'content-type': 'application/json',
            'x-created': '1967-12-13T00:00:00.000Z',
            'x-content-hash': 'CRC32C 7b98e751',
            'x-content-path': 'personas/ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw/persona.json'
        }
    };
    assert.deepEqual(certification,expected,'Certification does not match');
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
        edsig.addCertification( { contentPath: contentPath }, req, root_keypair );
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
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw:GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4@startlinglabs.com,localhost:3030;sig=k8ReAVW-TK93vlEDfk6m_6TjzCGS5mMA-Ch7c-JU-euds7qTGgeQX43W8PZP2TPQ0wYcInKDy2oFREICKY1nDw';  
    if( global.DEBUG ) console.log( 'Authorization:', actual );
    assert.equal(actual,expected,'Subkey authorization header is incorrect');

    // Verify request
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
    assert.deepEqual(authorization, expected,'Subkey erification failed');
})();

//
// Test third party content
//
(function () {
    let {path,contentPath,req} = createRequest();
    let keypath = pid + ':' + subkey + '@startlinglabs.com,localhost:3030';
    edsig.addAuthorization( path, req, sub_keypair, keypath );
    let actual = req.headers.authorization;
    let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw:GxsBiN4njPNsgg1K_HotDnabcJaXuX8Re_Mee8lIiZ4@startlinglabs.com,localhost:3030;sig=k8ReAVW-TK93vlEDfk6m_6TjzCGS5mMA-Ch7c-JU-euds7qTGgeQX43W8PZP2TPQ0wYcInKDy2oFREICKY1nDw';  
    if( global.DEBUG ) console.log( 'Authorization:', actual );
    assert.equal(actual,expected,'Subkey authorization header is incorrect');

    let certification = ...


    edsig.addCertification( { contentPath: contentPath }, req, root_keypair );
    expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw;sig=ZsdFlJsZtvq0rK1Lgfh1R8elUapwBkDmvBVMqCDzre5MBNTvV2vEPtCeJ9Vz2lfkJ7kWdVlyE8WzueLmzzlDAw';
    actual = req.headers['x-certification'];
    if( global.DEBUG ) console.log( 'Certification:', actual );
    assert.equal(actual,expected,'Certification header did not match');

    // Verify request
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
    assert.deepEqual(authorization, expected,'Subkey erification failed');
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
            'x-created': new Date('1967-12-13').toISOString(),
            'content-type': 'application/json',
            host: 'localhost'
        },
        body: "Hello world!"
    };

    return { path:path, contentPath:contentPath, req:req };   
}