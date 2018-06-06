/**
 * Unified error reporting for the command line tool.  The the global
 * DEBUG is true the stack trace will also be displayed.
 * @param {Error} err
 */
exports.signalError = function(err) {
    if( global.DEBUG )
        console.error(err);
    else
        console.log( err.name, err.message );
    process.exit(1);
}

//
// Matching
// Find personas and services by partial names or ids
//

class StringMatcher {
    constructor(pattern) {
        this.pattern = pattern.toLowerCase();
    }

    // item - raw item
    // value - matchable value from item
    // returns { score:Number, item:Object } OR null on no match
    // Higher scores are better
    score( item, value ) {
        if( !value || value.length == 0 )
            return null;
        value = value.toLowerCase();
        let p = value.indexOf( this.pattern );
        if( p == -1 )
            return null;

        let score = (value.length - p) / value.length;
        return { score:score, item:item };
    }
}

// given an object/set, use a 'resolver' to convert
// each set item into a string, then return the item
// with a string that most closely matches the search(pattern)
class nBest {
    constructor() {
        this.STRING_MATCHER = StringMatcher
    }

    // set - object with key/value pairs
    // resolver - converts object into matchable value
    // matcher - turns query+matchable value into score
    search( set, resolver, matcher ) {
        if( !set || !resolver || !matcher )   // sanity
            return [];  // TODO throw exception instead?

        let found = [];
        Object.keys(set).forEach(key => {
            let item = set[key];
            let value = resolver( item );
            let score = matcher.score( item, value );
            if( score ) {
                found.push( score );
                found.sort((a, b)=>{return a.score - b.score});
            }

        });

        return found;
    }
}
exports.nBest = new nBest();