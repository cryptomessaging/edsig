## Functions

<dl>
<dt><a href="#verifyRequestSignature">verifyRequestSignature(path)</a> ⇒ <code>VerificationResult</code></dt>
<dd><p>Verify an HTTP request signature that was signed using an EdSig authorization header.</p>
</dd>
<dt><a href="#createAuthorization">createAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Create an authorization header value from the given Node Request object and an
elliptic curve keypair.</p>
</dd>
<dt><a href="#addAuthorization">addAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Add an authorization header value to the provided req.headers map.</p>
</dd>
<dt><a href="#verifyContentSignature">verifyContentSignature(path, req)</a> ⇒ <code>VerificationResult</code></dt>
<dd><p>Verify that the x-certification header contains a valid Edwards signature.</p>
</dd>
<dt><a href="#createCertification">createCertification(contentPath, headers, body, keypair, keypath)</a></dt>
<dd><p>Create a certification header value.</p>
</dd>
<dt><a href="#addCertification">addCertification(contentPath, req, keypair, keypath)</a></dt>
<dd><p>Modifies the req.headers by adding the x-certification header and other headers as necessary</p>
</dd>
</dl>

<a name="verifyRequestSignature"></a>

## verifyRequestSignature(path) ⇒ <code>VerificationResult</code>
Verify an HTTP request signature that was signed using an EdSig authorization header.

**Kind**: global function  
**Returns**: <code>VerificationResult</code> - - when authorization succeeds, or null when no authorization header presented  
**Throws**:

- Error when authorization header is present, but signature check fails

**Req**: <code>HttpRequest</code> req - Node like Request structure containing method, headers, and body proeprties  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | pathname of request including query string.  I.e. http://mydomain.com/pathname?querystring |

<a name="createAuthorization"></a>

## createAuthorization(path, req, keypair, keypath)
Create an authorization header value from the given Node Request object and an
elliptic curve keypair.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | "/pathname[?querystring]" |
| req | <code>HttpRequest</code> | Node.js like Request including method, headers, and body properties. |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]]].  When keypath is not provided, the keypair pid is used. |

<a name="addAuthorization"></a>

## addAuthorization(path, req, keypair, keypath)
Add an authorization header value to the provided req.headers map.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | "/pathname[?querystring]" |
| req | <code>HttpRequest</code> | Node.js like Request including method, headers, and body properties. |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used. |

<a name="verifyContentSignature"></a>

## verifyContentSignature(path, req) ⇒ <code>VerificationResult</code>
Verify that the x-certification header contains a valid Edwards signature.

**Kind**: global function  
**Returns**: <code>VerificationResult</code> - on success, null when no 'x-certification' header presented.  
**Throws**:

- <code>CodedError</code> When the certification header does not match the request content.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | pathname of request. WILL be used for verification if the x-content-path was specified |
| req | <code>HttpRequest</code> | Node.js Request like object containing the headers |

<a name="createCertification"></a>

## createCertification(contentPath, headers, body, keypair, keypath)
Create a certification header value.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| contentPath | <code>string</code> | OPTIONAL path to anchor content within url |
| headers | <code>object</code> | HTTP headers |
| body | <code>Buffer</code> |  |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used. |

<a name="addCertification"></a>

## addCertification(contentPath, req, keypair, keypath)
Modifies the req.headers by adding the x-certification header and other headers as necessary

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| contentPath | <code>string</code> | OPTIONAL path to anchor content within url |
| req | <code>HttpRequest</code> |  |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used. |

