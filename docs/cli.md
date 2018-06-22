# Command Line Interface Quickstart

The easiest way to learn about EdSig is to install the command line tools and run some commands.

Assuming you are using a Mac and have Node.js 8+ installed, install the command line interface:
<pre>
$ npm install edsig -g
</pre>


1. [Create a persona](cli-persona.md)
2. [Join a service and publish your persona](cli-services.md)
3. [Publish content for your new persona](cli-content.md)


## Want To See a Quick Example of Certification?

<pre>
$ edsig get https://personas.cryptomessaging.org/personas/aaa/persona.json -v --save-certification cert.json
</pre>

The "edsig get" command uses HTTPS to fetch a persona.json file and the cryptographically signed certificate that proves it could only have been created by a specific user.

Here's an example output from the last command:
<pre>
HTTP Request: { url: 'http://localhost:3030/personas/1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY/persona.json' }
Certified? {
    "type": "edsig",
    "pid": "1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY",
    "headers": {
        "x-certification": "EdSig kp=1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY,sig=So8NML5bq5rIQtE36cbi_Mw5YUrmh7P2fMo40jOXK6vHLRJtY6OtAWB-NancYa2hpYSBadnaNNu4GRJbiEeJCQ",
        "content-length": 87,
        "content-type": "application/json",
        "x-created": "2018-06-06T17:53:24.842Z",
        "x-content-hash": "CRC32C 513b0685",
        "x-content-path": "personas/1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY/persona.json"
    }
}
Content: {
    "pid": "1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY",
    "nickname": "Satoshi"
}
</pre>

In the above example output:

* **Content** is the raw file coming back from the server 
* **Certified?** are the details about the certification presented from the persona service
* **"headers"** are the raw HTTP headers presented by the persona service, and used by EdSig to verify the content
* **x-certification** is the EdSig HTTP header presented by the persona service and containing the cryptographic signature of the content