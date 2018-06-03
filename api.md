## Classes

<dl>
<dt><a href="#HttpRequest">HttpRequest</a></dt>
<dd><p>Provides a subset of the Node.js Request Module, which is useful for
passing around basic HTTP request values.</p>
</dd>
<dt><a href="#EdsigVerification">EdsigVerification</a></dt>
<dd><p>Verification result from both verifyRequestSignature()
and verifyContentSignature() methods.</p>
</dd>
<dt><a href="#Signature">Signature</a></dt>
<dd><p>Contains the parsed values from an EdSig signature header</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#verifyRequestSignature">verifyRequestSignature(path)</a> ⇒ <code><a href="#EdsigVerification">EdsigVerification</a></code></dt>
<dd><p>Verify an HTTP request signature.</p>
</dd>
<dt><a href="#reqSummaryToBytes">reqSummaryToBytes(method, path, headers)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Convert HTTP request method, path, and certain headers to a Buffer. Format of
    buffer is &quot;METHOD path\nheader1value\nheader2value\n...headerNvalue&quot;</p>
</dd>
<dt><a href="#createAuthorization">createAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Create an authorization header value from the given Node Request object and an
elliptic curve keypair.</p>
</dd>
<dt><a href="#addAuthorization">addAuthorization(path, req, keypair, keypath)</a></dt>
<dd><p>Add an authorization header value to the provided req.headers map.</p>
</dd>
<dt><a href="#contentSummaryToBytes">contentSummaryToBytes(headers, body)</a> ⇒ <code>string</code></dt>
<dd><p>Convert the headers and body to a content summary string that can be signed or verified.  The
following headers are used for the summary: content-length, content-type, x-created,
x-content-hash, and x-content-path.</p>
</dd>
<dt><a href="#createCertification">createCertification(contentPath, body, headers, keypair, keypath)</a></dt>
<dd><p>Create a certification header value.</p>
</dd>
<dt><a href="#addCertification">addCertification(contentPath, req, keypair, keypath)</a></dt>
<dd><p>Modifies the req.headers by adding the x-certification header and other headers as necessary</p>
</dd>
<dt><a href="#addContentHeaders">addContentHeaders(headers, body)</a></dt>
<dd><p>Add the content-length and x-content-hash HTTP headers for the given body.</p>
</dd>
<dt><a href="#hashBody">hashBody(body)</a> ⇒ <code>string</code></dt>
<dd><p>Provides an HTTP ready representation of the CRC32C hash of the body.</p>
</dd>
<dt><a href="#copyHeaders">copyHeaders()</a> ⇒</dt>
<dd><p>Copy all headers.</p>
</dd>
<dt><a href="#normalizeHeaders">normalizeHeaders(headers)</a> ⇒</dt>
<dd><p>Amazon only supports x-amz-meta- headers, so add back the original values
AND filter out the non-signature headers.</p>
</dd>
<dt><a href="#base64url">base64url(buffer)</a> ⇒ <code>string</code></dt>
<dd><p>Convert a base64 buffer to a base64url string.
The character + becomes -, / becomes _, trailing = are removed
More info at <a href="https://tools.ietf.org/html/rfc4648#section-5">https://tools.ietf.org/html/rfc4648#section-5</a>
NOTE: Buffer() correctly decodes base64url, so we just need this encode function.</p>
</dd>
<dt><a href="#clean">clean(y)</a> ⇒ <code>string</code></dt>
<dd><p>Trim the whitespace off a string.  If the string is null simply return null.</p>
</dd>
<dt><a href="#trim">trim(y)</a> ⇒ <code>string</code></dt>
<dd><p>Trim the whitespace off a string.  If the string is null simply return null.</p>
</dd>
<dt><a href="#asKVset">asKVset()</a></dt>
<dd><p>Convert a string of the form key1=value1,key2=value2</p>
</dd>
<dt><a href="#createPersona">createPersona(nickname, secret)</a> ⇒ <code>object</code></dt>
<dd><p>Create a persona and secrets from a nickname and optional secret.</p>
</dd>
<dt><a href="#keypairFromSecret">keypairFromSecret(secret)</a> ⇒ <code>Keypair</code></dt>
<dd><p>Convert a base64url encoded Edwards elliptic curve secret into a Keypair.</p>
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

<a name="HttpRequest"></a>

## HttpRequest
Provides a subset of the Node.js Request Module, which is useful for
passing around basic HTTP request values.

**Kind**: global class  
<a name="new_HttpRequest_new"></a>

### new HttpRequest(method, headers, body)
Create an HttpRequest.


| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | POST, GET, etc. |
| headers | <code>object</code> | Simple map of HTTP header names to values |
| body | <code>Buffer</code> | Content of request.  Can be null or a string. |

<a name="EdsigVerification"></a>

## EdsigVerification
Verification result from both verifyRequestSignature()
and verifyContentSignature() methods.

**Kind**: global class  
<a name="new_EdsigVerification_new"></a>

### new EdsigVerification(pid)
Create an EdSig verification for the given pid.


| Param | Type | Description |
| --- | --- | --- |
| pid | <code>string</code> | A base64url encoded public key |

<a name="Signature"></a>

## Signature
Contains the parsed values from an EdSig signature header

**Kind**: global class  

* [Signature](#Signature)
    * [new Signature(pubkey, sighex, keypath)](#new_Signature_new)
    * [.parse(headers, name)](#Signature.parse) ⇒ [<code>Signature</code>](#Signature)

<a name="new_Signature_new"></a>

### new Signature(pubkey, sighex, keypath)
Create an EdSig Signature from the parsed values.


| Param | Type | Description |
| --- | --- | --- |
| pubkey | <code>Keypair</code> | Public Elliptic keypair |
| sighex |  | The signature in hexadecimal |
| keypath | <code>string</code> | A simple pid, or complex <pid>:<subkey>@host1,host2,..hostN |

<a name="Signature.parse"></a>

### Signature.parse(headers, name) ⇒ [<code>Signature</code>](#Signature)
Parse an EdSig authorization or x-certification header in the form "EdSig kp=<keypath>,sig=<base64url signature>"

**Kind**: static method of [<code>Signature</code>](#Signature)  
**Returns**: [<code>Signature</code>](#Signature) - or null  
**Throws**:

- Error When an unsupported auth scheme is found, or required parameters are missing.


| Param | Type | Description |
| --- | --- | --- |
| headers | <code>object</code> | HTTP header map |
| name | <code>string</code> | name of HTTP header to parse, 'authorization' or 'x-certification' |

<a name="verifyRequestSignature"></a>

## verifyRequestSignature(path) ⇒ [<code>EdsigVerification</code>](#EdsigVerification)
Verify an HTTP request signature.

**Kind**: global function  
**Returns**: [<code>EdsigVerification</code>](#EdsigVerification) - - when authorization succeeds, or null when no authorization header presented  
**Throws**:

- Error when authorization header is present, but signature check fails

**Req**: [<code>HttpRequest</code>](#HttpRequest) req - Node like Request structure containing method, headers, and body proeprties  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | pathname of request including query string |

<a name="reqSummaryToBytes"></a>

## reqSummaryToBytes(method, path, headers) ⇒ <code>Buffer</code>
Convert HTTP request method, path, and certain headers to a Buffer. Format of
    buffer is "METHOD path\nheader1value\nheader2value\n...headerNvalue"

**Kind**: global function  
**Returns**: <code>Buffer</code> - Summary string of rewquest.  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | HTTP method, i.e. GET, POST, PUT |
| path | <code>string</code> | pathname, including query string if any. |
| headers | <code>object</code> | Simple map of header names to values. |

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
| keypath | <code>string</code> | OPTIONAL keypath as <pid>[:subkey][@host1[,host2[,hostN]].  When keypath is not provided, the keypair pid is used. |

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

<a name="contentSummaryToBytes"></a>

## contentSummaryToBytes(headers, body) ⇒ <code>string</code>
Convert the headers and body to a content summary string that can be signed or verified.  The
following headers are used for the summary: content-length, content-type, x-created,
x-content-hash, and x-content-path.

**Kind**: global function  

| Param | Type |
| --- | --- |
| headers | <code>object</code> | 
| body | <code>Buffer</code> | 

<a name="createCertification"></a>

## createCertification(contentPath, body, headers, keypair, keypath)
Create a certification header value.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| contentPath | <code>string</code> | OPTIONAL path to anchor content within url |
| body | <code>Buffer</code> |  |
| headers | <code>object</code> | HTTP headers |
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

<a name="addContentHeaders"></a>

## addContentHeaders(headers, body)
Add the content-length and x-content-hash HTTP headers for the given body.

**Kind**: global function  

| Param | Type |
| --- | --- |
| headers | <code>object</code> | 
| body | <code>Buffer</code> | 

<a name="hashBody"></a>

## hashBody(body) ⇒ <code>string</code>
Provides an HTTP ready representation of the CRC32C hash of the body.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| body | <code>Buffer</code> | Body can be a buffer or string |

<a name="copyHeaders"></a>

## copyHeaders() ⇒
Copy all headers.

**Kind**: global function  
**Returns**: A simple copy of the map.  
**Poaram**: <code>object</code> headers - map of key/value pairs.  
<a name="normalizeHeaders"></a>

## normalizeHeaders(headers) ⇒
Amazon only supports x-amz-meta- headers, so add back the original values
AND filter out the non-signature headers.

**Kind**: global function  
**Returns**: The provided map.  

| Param | Type | Description |
| --- | --- | --- |
| headers | <code>object</code> | map of heaver name to values, including Amazon specific x-amz-meta ones. |

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

<a name="clean"></a>

## clean(y) ⇒ <code>string</code>
Trim the whitespace off a string.  If the string is null simply return null.

**Kind**: global function  

| Param | Type |
| --- | --- |
| y | <code>string</code> | 

<a name="trim"></a>

## trim(y) ⇒ <code>string</code>
Trim the whitespace off a string.  If the string is null simply return null.

**Kind**: global function  

| Param | Type |
| --- | --- |
| y | <code>string</code> | 

<a name="asKVset"></a>

## asKVset()
Convert a string of the form key1=value1,key2=value2

**Kind**: global function  
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

