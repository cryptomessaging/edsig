const util = require('./core/util')
const models = require('./core/models')

/**
 *
 */
module.exports = options => {

    const authorization = require('./core/authorization')(options)
    const certification = require('./core/certification')(options)

    return {
        // Authorizing HTTP requests
        createAuthorization: authorization.createAuthorization,
        addAuthorization: authorization.addAuthorization,
        verifyAuthorization: authorization.verifyAuthorization,

        // Certifying content
        createContentCertificate: certification.createContentCertificate,
        addCertificationHeaders: certification.addCertificationHeaders,
        mergeCertificationHeaders: certification.mergeCertificationHeaders,
        verifyCertification: certification.verifyCertification,

        // Models
        Keypath: models.Keypath,
        Persona: models.Persona,

        // Utility
        keypairFromSecret: util.keypairFromSecret,
        base64url: util.base64url,
        CodedError: util.CodedError,
        hashBody: util.hashBody
    }
};
