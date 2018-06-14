const authorization = require('./core/authorization')
const certification = require('./core/certification')
const util = require('./core/util')
const models = require('./core/models')

module.exports = {
    // Authorizing HTTP requests
    createAuthorization: authorization.createAuthorization,
    addAuthorization: authorization.addAuthorization,
    verifyAuthorization: authorization.verifyAuthorization,

    // Certifying content
    createContentCertificate: certification.createContentCertificate,
    addCertificationHeaders: certification.addCertificationHeaders,
    mergeCertificationHeaders: certification.mergeCertificationHeaders,
    verifyCertification: certification.verifyCertification,

    // Utility
    Keypath: models.Keypath,
    createPersona: util.createPersona,
    keypairFromSecret: util.keypairFromSecret,
    base64url: util.base64url,
    CodedError: util.CodedError,
    hashBody: util.hashBody
};
