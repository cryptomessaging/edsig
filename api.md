## Classes

<dl>
<dt><a href="#VerificationResult">VerificationResult</a></dt>
<dd><p>Verification result from both verifyRequestSignature()
and verifyContentSignature() methods.</p>
</dd>
<dt><a href="#HttpRequest">HttpRequest</a></dt>
<dd><p>Provides a subset of the Node.js Request Module, which is useful for
passing around basic HTTP request values.</p>
</dd>
<dt><a href="#Signature">Signature</a></dt>
<dd><p>Contains the parsed values from an EdSig signature header</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#verifyRequestSignature">verifyRequestSignature(path)</a> ⇒ <code><a href="#VerificationResult">VerificationResult</a></code></dt>
<dd><p>Verify an HTTP request signature that was signed using an EdSig authorization header.</p>
</dd>
<dt><a href="#createAuthorization">createAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Create an authorization header value from the given Node Request object and an
elliptic curve keypair.</p>
</dd>
<dt><a href="#addAuthorization">addAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Add an authorization header value to the provided req.headers map.</p>
</dd>
<dt><a href="#verifyContentSignature">verifyContentSignature(path, req)</a> ⇒ <code><a href="#VerificationResult">VerificationResult</a></code></dt>
<dd><p>Verify that the x-certification header contains a valid Edwards signature.</p>
</dd>
<dt><a href="#createCertification">createCertification(contentPath, headers, body, keypair, keypath)</a></dt>
<dd><p>Create a certification header value.</p>
</dd>
<dt><a href="#addCertification">addCertification(contentPath, req, keypair, keypath)</a></dt>
<dd><p>Modifies the req.headers by adding the x-certification header and other headers as necessary</p>
</dd>
<dt><a href="#createPersona">createPersona(nickname, secret)</a> ⇒ <code>object</code></dt>
<dd><p>Create a persona and secrets from a nickname and optional secret.</p>
</dd>
<dt><a href="#keypairFromSecret">keypairFromSecret(secret)</a> ⇒ <code>Keypair</code></dt>
<dd><p>Convert a base64url encoded Edwards elliptic curve secret into a Keypair.</p>
</dd>
<dt><a href="#base64url">base64url(buffer)</a> ⇒ <code>string</code></dt>
<dd><p>Convert a base64 buffer to a base64url string.
The character + becomes -, / becomes _, trailing = are removed
More info at <a href="https://tools.ietf.org/html/rfc4648#section-5">https://tools.ietf.org/html/rfc4648#section-5</a>
NOTE: Buffer() correctly decodes base64url, so we just need this encode function.</p>
</dd>
<dt><a href="#CodedError">CodedError(code, message, details)</a></dt>
<dd><p>Errors are coded with an integer array.  The leftmost/first number
is the most significant, with each subsequent number having less
significance.</p>
<p>The first number is designed to correspond to the major classes
of HTTP status codes:
2 =&gt; 2xx, OK status codes
4 =&gt; 4xx, Request failed due to incorrect client call
5 =&gt; 5xx, Request failed because of a server error</p>
</dd>
</dl>

<a name="VerificationResult"></a>

## VerificationResult
Verification result from both verifyRequestSignature()
and verifyContentSignature() methods.

**Kind**: global class  
<a name="new_VerificationResult_new"></a>

### new exports.VerificationResult(pid)
Create an EdSig verification result for the given pid.


| Param | Type | Description |
| --- | --- | --- |
| pid | <code>string</code> | A base64url encoded public key representing the persona id that  signed the request or content. |

<a name="HttpRequest"></a>

## HttpRequest
Provides a subset of the Node.js Request Module, which is useful for
passing around basic HTTP request values.

**Kind**: global class  
<a name="new_HttpRequest_new"></a>

### new exports.HttpRequest(method, headers, body)
Create an HttpRequest.


| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | POST, GET, etc. |
| headers | <code>object</code> | Simple map of HTTP header names to values.  Header names must be lower case. |
| body | <code>Buffer</code> | Content of request.  Can also be null or a string. |

<a name="Signature"></a>

## Signature
Contains the parsed values from an EdSig signature header

**Kind**: global class  
<a name="new_Signature_new"></a>

### new exports.Signature(pubkey, sighex, keypath)
Create an EdSig Signature from the parsed values.


| Param | Type | Description |
| --- | --- | --- |
| pubkey | <code>Keypair</code> | Public Elliptic keypair |
| sighex |  | The signature in hexadecimal |
| keypath | <code>string</code> | A simple pid, or complex <pid>:<subkey>@host1,host2,..hostN |

<a name="verifyRequestSignature"></a>

## verifyRequestSignature(path) ⇒ [<code>VerificationResult</code>](#VerificationResult)
Verify an HTTP request signature that was signed using an EdSig authorization header.

**Kind**: global function  
**Returns**: [<code>VerificationResult</code>](#VerificationResult) - - when authorization succeeds, or null when no authorization header presented  
**Throws**:

- Error when authorization header is present, but signature check fails

**Req**: [<code>HttpRequest</code>](#HttpRequest) req - Node like Request structure containing method, headers, and body proeprties  

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
| req | [<code>HttpRequest</code>](#HttpRequest) | Node.js like Request including method, headers, and body properties. |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]]].  When keypath is not provided, the keypair pid is used. |

<a name="addAuthorization"></a>

## addAuthorization(path, req, keypair, keypath)
Add an authorization header value to the provided req.headers map.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | "/pathname[?querystring]" |
| req | [<code>HttpRequest</code>](#HttpRequest) | Node.js like Request including method, headers, and body properties. |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used. |

<a name="verifyContentSignature"></a>

## verifyContentSignature(path, req) ⇒ [<code>VerificationResult</code>](#VerificationResult)
Verify that the x-certification header contains a valid Edwards signature.

**Kind**: global function  
**Returns**: [<code>VerificationResult</code>](#VerificationResult) - on success, null when no 'x-certification' header presented.  
**Throws**:

- [<code>CodedError</code>](#CodedError) When the certification header does not match the request content.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | pathname of request. WILL be used for verification if the x-content-path was specified |
| req | [<code>HttpRequest</code>](#HttpRequest) | Node.js Request like object containing the headers |

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
| req | [<code>HttpRequest</code>](#HttpRequest) |  |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used. |

<a name="createPersona"></a>

## createPersona(nickname, secret) ⇒ <code>object</code>
Create a persona and secrets from a nickname and optional secret.

**Kind**: global function  
**Returns**: <code>object</code> - result - containing the persona and secrets  

| Param | Type | Description |
| --- | --- | --- |
| nickname | <code>string</code> |  |
| secret | <code>Buffer</code> | OPTIONAL, when not provided a new secret is created |

<a name="keypairFromSecret"></a>

## keypairFromSecret(secret) ⇒ <code>Keypair</code>
Convert a base64url encoded Edwards elliptic curve secret into a Keypair.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| secret | <code>string</code> | base64url encoded secret |

<a name="base64url"></a>

## base64url(buffer) ⇒ <code>string</code>
Convert a base64 buffer to a base64url string.
The character + becomes -, / becomes _, trailing = are removed
More info at https://tools.ietf.org/html/rfc4648#section-5
NOTE: Buffer() correctly decodes base64url, so we just need this encode function.

**Kind**: global function  
**Returns**: <code>string</code> - base64url representation of buffer  

| Param | Type |
| --- | --- |
| buffer | <code>Buffer</code> | 

<a name="CodedError"></a>

## CodedError(code, message, details)
Errors are coded with an integer array.  The leftmost/first number
is the most significant, with each subsequent number having less
significance.

The first number is designed to correspond to the major classes
of HTTP status codes:
2 => 2xx, OK status codes
4 => 4xx, Request failed due to incorrect client call
5 => 5xx, Request failed because of a server error

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>array</code> | array of numbers |
| message | <code>string</code> | End user readable message describing error |
| details | <code>array</code> | Technical support readable details about error, useful for  passing to tech support so they can resolve the users issue. |

