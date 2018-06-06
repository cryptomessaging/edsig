const edsig = require('../index')


const { randomBytes } = require('crypto')
const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')
const assert = require('assert');

const DEBUG = true;

const SECRET = 'AqY7tB0Lbq1yKXCZfQa6QFkiPy5WCYjUrH7ahJBUalM';
const keypair = edsig.keypairFromSecret( SECRET );
const pid = edsig.base64url( Buffer.from( keypair.getPublic() ) );

//
// Create request
//
let {path,contentPath,req} = createRequest();
edsig.addAuthorization( path, req, keypair );
let actual = req.headers.authorization;
let expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw,sig=niU9OEVDT-Z0p9JTdnx0jHP4Dl0WshBb9oXSmcj9Wg3gt0OdPsNnE3h2zLk7FVgkqSUgBZCCmL0QS_jOixT6DA';  
if( DEBUG ) console.log( 'Authorization', actual );
assert.equal(actual,expected,'Authorization header is incorrect');

edsig.addCertification( contentPath, req, keypair );
expected = 'EdSig kp=ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw,sig=ZsdFlJsZtvq0rK1Lgfh1R8elUapwBkDmvBVMqCDzre5MBNTvV2vEPtCeJ9Vz2lfkJ7kWdVlyE8WzueLmzzlDAw';
actual = req.headers['x-certification'];
if( DEBUG ) console.log( 'Certification', actual );
assert.equal(actual,expected,'Certification header did not match');

//
// Verify request
//
let authorization = edsig.verifyRequestSignature( path, req );
console.log( 'Request authorization', authorization );
assert.deepEqual(authorization
            ,{ type: 'edsig', pid: 'ziSFUObFVISG_0qaSh58dy0e-5p1FsCtQ-Me48_1vAw' }
            ,'Verification failed');

let certification = edsig.verifyContentSignature(path, req );
console.log( 'Content certification', certification );
assert.equal(pid,certification.pid,'Certification pid is incorrect');

//
// Test man-in-the-middle attacks
//

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
    if( DEBUG )
        console.log( 'Forging header',name,'to',value);
    let {path,contentPath,req} = createRequest();
    edsig.addAuthorization( path, req, keypair );
    edsig.addCertification( contentPath, req, keypair );
    req.headers[name] = value;
    try {
        edsig.verifyRequestSignature( path, req );
        throw new Error('Forged header \'' + name + '\' was not detected');
    } catch(err) {
        // this is the expected path :)
    }   
}

//
// Utility
//

function createRequest() {
    let contentPath = 'personas/' + pid + '/persona.json';
    let path='/v1/' + contentPath;
    let req = {
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