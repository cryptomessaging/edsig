## Classes

<dl>
<dt><a href="#AuthorizationResult">AuthorizationResult</a></dt>
<dd><p>Authorization result from verifyRequestAuthorization()</p>
</dd>
<dt><a href="#ContentCertificate">ContentCertificate</a></dt>
<dd><p>Certification result from both verifyCertification() that is suitable for converting
to JSON.</p>
</dd>
<dt><a href="#HttpRequest">HttpRequest</a></dt>
<dd><p>Provides a subset of the Node.js Request Module, which is useful for
passing around basic HTTP request values.</p>
</dd>
<dt><a href="#Keybase">Keybase</a></dt>
<dd><p>Base information about a public key including the type of cryptography used,
the secret, and the derived public key.  Also includes housekeeping info such as the
date created.</p>
</dd>
<dt><a href="#Persona">Persona</a></dt>
<dd><p>Persona to represent the persons nickname and a globally unique id.</p>
</dd>
<dt><a href="#Keypath">Keypath</a></dt>
<dd><p>Encapsulates a Cryptomessaging keypath of the form <masterkey>[:subkey][@host1[,host2[...,hostN]]]</p>
</dd>
<dt><a href="#Signature">Signature</a></dt>
<dd><p>Contains the parsed values from an EdSig signature header</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#verifyAuthorization">verifyAuthorization(path)</a> ⇒ <code><a href="#AuthorizationResult">AuthorizationResult</a></code></dt>
<dd><p>Verify an HTTP request that was signed using an EdSig authorization header.</p>
</dd>
<dt><a href="#createAuthorization">createAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Create an authorization header value from the given Node Request object and an
elliptic curve keypair.</p>
</dd>
<dt><a href="#addAuthorization">addAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Add an authorization header value to the provided req.headers map.</p>
</dd>
<dt><a href="#verifyCertification">verifyCertification(path, req)</a> ⇒ <code><a href="#ContentCertificate">ContentCertificate</a></code></dt>
<dd><p>Verify that the x-certification header contains a valid Edwards signature for the given content
 and headers.</p>
</dd>
<dt><a href="#createContentCertificate">createContentCertificate(file, contentType, keypair, keypath, contentPath)</a> ⇒ <code><a href="#ContentCertificate">ContentCertificate</a></code></dt>
<dd><p>Create a certification for a file.</p>
</dd>
<dt><a href="#addCertificationHeaders">addCertificationHeaders(contentPath, headers, body, keypair, keypath)</a></dt>
<dd><p>Create a certification header value.</p>
</dd>
<dt><a href="#mergeCertificationHeaders">mergeCertificationHeaders(certification, req)</a></dt>
<dd><p>Use an existing content certification to certify the request content.</p>
</dd>
</dl>

<a name="AuthorizationResult"></a>

## AuthorizationResult
Authorization result from verifyRequestAuthorization()

**Kind**: global class  
<a name="new_AuthorizationResult_new"></a>

### new AuthorizationResult(keypath)
Create an EdSig authorization result for the given pid.


| Param | Type | Description |
| --- | --- | --- |
| keypath | [<code>Keypath</code>](#Keypath) | A Keypath with at least the root key that  signed the request.  Can be a simple pid, or a complex rootkey:subkey@host1,host2. |

<a name="ContentCertificate"></a>

## ContentCertificate
Certification result from both verifyCertification() that is suitable for converting
to JSON.

**Kind**: global class  
<a name="new_ContentCertificate_new"></a>

### new ContentCertificate(keypath, headers)
Create an EdSig verification result for the given pid.


| Param | Type | Description |
| --- | --- | --- |
| keypath | <code>string</code> | Keypath used to create certification.  Can also be a Keypath object.  signed the request or content.  Can be a simple pid, or a complex pid:pid@ |
| headers | <code>map</code> | HTTP headers used to verify content certification. |

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

<a name="Keybase"></a>

## Keybase
Base information about a public key including the type of cryptography used,
the secret, and the derived public key.  Also includes housekeeping info such as the
date created.

**Kind**: global class  

* [Keybase](#Keybase)
    * [new Keybase(secret)](#new_Keybase_new)
    * [.withoutSecret()](#Keybase+withoutSecret)

<a name="new_Keybase_new"></a>

### new Keybase(secret)
Create a Keybase object.


| Param | Type | Description |
| --- | --- | --- |
| secret | <code>Buffer</code> | OPTIONAL set of 32 bytes to use as secret. |

<a name="Keybase+withoutSecret"></a>

### keybase.withoutSecret()
Returns a copy of the Keybase object with the secret property removed
so it can be publicy shared.

**Kind**: instance method of [<code>Keybase</code>](#Keybase)  
<a name="Persona"></a>

## Persona
Persona to represent the persons nickname and a globally unique id.

**Kind**: global class  
<a name="new_Persona_new"></a>

### new exports.Persona(pid, nickname)
Create a persona from a persona id and nickname.


| Param | Type | Description |
| --- | --- | --- |
| pid | <code>string</code> | base64url encoded persona id |
| nickname | <code>string</code> |  |

<a name="Keypath"></a>

## Keypath
Encapsulates a Cryptomessaging keypath of the form <masterkey>[:subkey][@host1[,host2[...,hostN]]]

**Kind**: global class  
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
| keypath | [<code>Keypath</code>](#Keypath) | A simple pid, complex <pid>:<subkey>@host1,host2,..hostN or Keypath object. |

<a name="verifyAuthorization"></a>

## verifyAuthorization(path) ⇒ [<code>AuthorizationResult</code>](#AuthorizationResult)
Verify an HTTP request that was signed using an EdSig authorization header.

**Kind**: global function  
**Returns**: [<code>AuthorizationResult</code>](#AuthorizationResult) - - when authorization succeeds, or null when no authorization header presented  
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

<a name="verifyCertification"></a>

## verifyCertification(path, req) ⇒ [<code>ContentCertificate</code>](#ContentCertificate)
Verify that the x-certification header contains a valid Edwards signature for the given content
 and headers.

**Kind**: global function  
**Returns**: [<code>ContentCertificate</code>](#ContentCertificate) - on success, null when no 'x-certification' header presented.  
**Throws**:

- <code>CodedError</code> When the certification header does not match the request content.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | pathname of request. WILL be used for verification if the x-content-path was specified |
| req | [<code>HttpRequest</code>](#HttpRequest) | Node.js Request like object containing the headers |

<a name="createContentCertificate"></a>

## createContentCertificate(file, contentType, keypair, keypath, contentPath) ⇒ [<code>ContentCertificate</code>](#ContentCertificate)
Create a certification for a file.

**Kind**: global function  
**Returns**: [<code>ContentCertificate</code>](#ContentCertificate) - Headers containing x-certification value and other required headers.  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>Buffer</code> | a Buffer containing the file |
| contentType | <code>string</code> |  |
| keypair | <code>Keypair</code> | Keypair from secret |
| keypath | <code>string</code> | OPTIONAL keypath |
| contentPath | <code>string</code> | OPTIONAL anchor path used by the certificate |

<a name="addCertificationHeaders"></a>

## addCertificationHeaders(contentPath, headers, body, keypair, keypath)
Create a certification header value.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| contentPath | <code>string</code> | OPTIONAL path to anchor content within url |
| headers | <code>object</code> | HTTP headers |
| body | <code>Buffer</code> |  |
| keypair | <code>Keypair</code> | an elliptic curve keypair |
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used. |

<a name="mergeCertificationHeaders"></a>

## mergeCertificationHeaders(certification, req)
Use an existing content certification to certify the request content.

**Kind**: global function  

| Param | Type |
| --- | --- |
| certification | <code>ContentCertification</code> | 
| req | [<code>HttpRequest</code>](#HttpRequest) | 

