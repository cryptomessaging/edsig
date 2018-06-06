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

        if( program.persona )
            this.persona = storage.findPersonaByPid( program.persona );
        else if( program.nickname )
            this.persona = storage.findPersonaByNickname( program.nickname );
    }
}