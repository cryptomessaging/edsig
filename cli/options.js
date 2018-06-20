const storage = require('./storage')
const edsig = require('../index')

/**
 * Handle common program options.
 */
module.exports = class Options {
    constructor(program) {
        global.DEBUG = program.debug;
        global.VERBOSE = program.verbose || program.debug;

        let serviceName = program.service;
        this.service = serviceName && storage.findServiceByName( serviceName );

        // this.keypath acts as a template, and can be
        // overridden by other parameters
        // Ex:
        // - 4fwe2er@foo.com = use master key
        // - 4rfg: = select persona starting with 4rfg but use subkey
        // - 34rerfwf:sfwefw@foo.com = use selected subkey
        // - @foo.com,bar.com = use master key of named persona, hinting at two persona servers
        // - :@foo.com = use a valid subkey from named persona
        this.keypath = new edsig.Keypath( program.keypath );

        // if we have a nickname, or the master key of the keypath, load the persona
        if( program.nickname )
            this.persona = storage.findPersonaByNickname( program.nickname );
        else if( this.keypath.pid() )
            this.persona = storage.findPersonaByPid( this.keypath.pid() );

        if( this.persona ) {
            // We know the persona, so make sure the master/pid is set in the keypath
            this.keypath.keys[0] = this.persona.pid;
        }

        if( program.master && this.keypath.keys.length > 1 ) {
            // don't use a subkey, only the master/first element of keys array
            this.keypath.keys = this.keypath.keys.slice(0,1);
        }

        const pid = this.keypath.pid();
        if( pid ) {
            const secrets = storage.loadSecrets(pid);

            if( this.keypath.keys.length == 1 )
                // use master key/pid
                this.keypair = edsig.keypairFromSecret( secrets.master.secret );
            else {
                // use subkey
                const id = this.keypath.keys[1];
                let keybase;
                if( id && id.length )
                    keybase = findMatchingSubkey( id, secrets.subkeys );
                else
                    keybase = findBestValidSubkey( secrets.subkeys );

                this.keypath.keys[1] = keybase.id;
                this.keypair = edsig.keypairFromSecret( keybase.secret );
            }
        }
    }

    /**
     * Configure the standard options.
     */
    static setup(program) {
        program
            .option('-s, --service <service>', 'Service to use')
            .option('-n, --nickname <nickname>', 'Use the persona with this nickname')
            .option('-v, --verbose', 'Verbose mode for debugging')
            .option('-d, --debug', 'Ultra verbose mode for debugging')
            .option('-c, --certify <filename>', 'Provide a certificate for the content')
            .option('-k, --keypath <keypath>', 'Use the specified full or partial keypath')
            .option('-m, --master', 'Use the master key of the persona, and not a subkey')

        return program;
    }
}

function findMatchingSubkey( id, subkeys ) {
    if( !subkeys )
        throw new Error( 'No subkeys' );

    let now = new Date();
    let found = [];
    Object.keys( subkeys ).forEach( key => {
        if( key.startsWith(id) != true )
            return;     // not a match

        const keybase = subkeys[id];

        // still valid?
        const valid = keybase.valid;
        if( valid && valid.from ) {
            const from = new Date( valid.from );
            if( from > now )
                return; // not valid yet
        }
        if( valid && valid.to ) {
            const to = new Date( valid.to );
            if( to < now )
                return; // has expired
        }

        // passed all the tests!
        found.push( keybase );
    });

    return found.length > 0 ? found[0] : null;
}

function findBestValidSubkey( subkeys ) {
    if( !subkeys )
        throw new Error( 'No subkeys' );

    let now = new Date();
    let found = [];
    Object.keys( subkeys ).forEach( key => {
        const keybase = subkeys[key];

        // still valid?
        const valid = keybase.valid;
        if( valid && valid.from ) {
            const from = new Date( valid.from );
            if( from > now )
                return; // not valid yet
        }
        if( valid && valid.to ) {
            const to = new Date( valid.to );
            if( to < now )
                return; // has expired
        }

        // passed all the tests!
        found.push( keybase );
    });

    // TODO sort by keybase that will be valid the longest?  Or newest?

    return found.length > 0 ? found[0] : null;
}