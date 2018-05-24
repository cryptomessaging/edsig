//
// Errors are coded with an integer array.  The leftmost/first number
// is the most significant, with each subsequent number having less
// significance.
//
// The first number is designed to correspond to the major classes
// of HTTP status codes:
// 2 => 2xx, OK status codes
// 4 => 4xx, Request failed due to incorrect client call
// 5 => 5xx, Request failed because of a server error
//

// Use this method when we DON'T have an Error object
exports.signalNotOk = function(req,res,code,message,details) {
    var err = { code:code, message:message, details:details };
    log(req,code,err);
    res.status(code[0]*100).json({failure:err});
}

// Use this method when we have an Error object
exports.signalError = function(req,res,err) {
    if( err instanceof ServerError && err.code ) {
        log(req,err.code,err);
        res.status( err.code[0]*100).json({failure:err});
    } else {
        log(req,500,err);
        var failure = { code:500, message:err.toString() };
        res.status( 500 ).json( {failure:failure} );
    }
}

function ServerError(code,message,details) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;

    this.code = code;           // if set, gets used as HTTP status code
    this.message = message;     // user friendly(ish) message
    this.details = details;     // techie/support details, if any
}
require('util').inherits(ServerError, Error);
exports.ServerError = ServerError;

function log(req,code,err) {
    const details = {
        code:code,
        url:req.originalUrl,
        headers:req.headers,
        auth:req.auth,
        body:req.body    
    }
    console.log( new Date(), 'ERROR:', details, JSON.stringify(err) );
}