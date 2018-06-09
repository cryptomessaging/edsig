const EdDSA = require('elliptic').eddsa
const ec = new EdDSA('ed25519')
const util = require('./util')

/**
 * Provides a subset of the Node.js Request Module, which is useful for
 * passing around basic HTTP request values.
 */
exports.HttpRequest = class {
    /**
     * Create an HttpRequest.
     * @param {string} method - POST, GET, etc.
     * @param {object} headers - Simple map of HTTP header names to values.  Header names must be lower case.
     * @param {Buffer} body - Content of request.  Can also be null or a string.
     */
    constructor(method,headers,body) {
        this.method = method;
        this.headers = headers;
        this.body = body;
    }
}

/**
 * Encapsulates a Cryptomessaging keypath of the form <rootkey>[:subkey][@host1[,host2[...,hostN]]]
 */
exports.Keypath = class Keypath {

    constructor(keypath) {
        const tokens = keypath.split('@');
        this.hosts = tokens.length > 1 ? tokens[1].split(',') : [];
        this.keys = tokens[0].split(':');
    }

    /** Provides the persona id. */
    pid() {
        return this.keys[0];
    }

    /** Provides the key used for cryptography. */
    key() {
        return this.keys[ this.keys.length - 1 ]; 
    }

    toString() {
        return this.keys.join(':')
            + (this.hosts.length > 0 ? '@' : '')
            + this.hosts.join(',');
    }

    static toPid( keypath ) {
        return keypath.split(/[:@]+/)[0];
    }
}

/** Contains the parsed values from an EdSig signature header */
exports.Signature = class Signature {

    /**
     * Create an EdSig Signature from the parsed values.
     * @param {Keypair} pubkey - Public Elliptic keypair
     * @param {} sighex - The signature in hexadecimal
     * @param {Keypath} keypath - A simple pid, complex <pid>:<subkey>@host1,host2,..hostN or Keypath object.
     */
    constructor(pubkey,sighex,keypath) {
        this.pubkey = pubkey;
        this.sighex = sighex;

        if( typeof keypath === 'string' )
            this.keypath = new Keypath(keypath);
        else
            this.keypath = keypath;
    }

    /**
     * Parse an EdSig authorization or x-certification header in the form "EdSig kp=<keypath>,sig=<base64url signature>"
     * @param {object} headers - HTTP header map
     * @param {string} name - name of HTTP header to parse, 'authorization' or 'x-certification'
     * @return {Signature} or null
     * @throws Error When an unsupported auth scheme is found, or required parameters are missing.
     */
    static parse(headers,name) {
        const signature = headers[name];
        if( !signature ) {
            if( DEBUG) console.log( 'No', name, 'header' );
            return;
        }

        if( global.DEBUG )
            console.log( 'Parsing signature:', signature );

        const authFields = signature.split(/\s+/);
        if( authFields[0] != 'EdSig' ) {
            throw new util.CodedError([4],'Unsupported auth scheme ' + authFields[0] + ' in ' + name );
        } else if( authFields.length < 2 ) {
            throw new util.CodedError([4],'Missing required second EdSig parameter for ' + name );
        }

        // extract public key from authorization header
        const kvset = util.asKVset( authFields[1] );
        const keypath = new exports.Keypath( kvset.kp );
        const pubhex = Buffer.from( keypath.key(), 'base64').toString('hex');  // ec wants hex, so convert from base64url to hex 
        const pubkey = ec.keyFromPublic(pubhex, 'hex');

        // extract 512 bit request signature from authorization header
        const sighex = Buffer.from( kvset.sig, 'base64' ).toString('hex'); 

        return new Signature(pubkey, sighex, keypath );
    }
}
