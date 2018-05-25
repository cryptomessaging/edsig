const DEBUG = true;

//
// Unified error reporting for the command line tool
//

function signalError(err) {
    if( DEBUG )
        console.error(err);
    else
        console.log( err.name, err.message );
    process.exit(1);
}
exports.signalError = signalError;