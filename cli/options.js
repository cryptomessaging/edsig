const storage = require('./storage')

/**
 * Handle common program options.
 *
 */
module.exports = class Options {
    constructor(program) {
        global.DEBUG = program.debug;
        global.VERBOSE = program.verbose || program.debug;

        let serviceName = program.service;
        this.service = serviceName && storage.findServiceByName( serviceName );

        if( program.pid )
            this.persona = storage.findPersonaByPid( program.pid );
        else if( program.nickname )
            this.persona = storage.findPersonaByNickname( program.nickname );
    }

    /**
     * Configure the standard options.
     */
    static setup(program) {
        program
            .option('-s, --service <service>', 'Service to use')
            .option('-n, --nickname <nickname>', 'Use the persona with this nickname')
            .option('-p, --pid <pid>', 'Use the persona that has this PID' )
            .option('-v, --verbose', 'Verbose mode for debugging')
            .option('-d, --debug', 'Ultra verbose mode for debugging')

        return program;
    }
}