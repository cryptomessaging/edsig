const authorization = require('./core/authorization');
const certification = require('./core/certification');
const util = require('./core/util');

module.exports = {
    // Authorizing HTTP requests
    createAuthorization: authorization.createAuthorization,
    addAuthorization: authorization.addAuthorization,
    verifyRequestSignature: authorization.verifyRequestSignature,

    // Certifying content
    createCertification: certification.createCertification,
    addCertification: certification.addCertification,
    verifyContentSignature: certification.verifyContentSignature,

    createPersona: util.createPersona,
    keypairFromSecret: util.keypairFromSecret,
    base64url: util.base64url,
    CodedError: util.CodedError
};
