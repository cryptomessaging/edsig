# EdSig

Edwards-curve based cryptographic HTTP authorization and certification SDK for Node.js and command line tools.

The SDK can be used to build cryptomessaging clients or services that authenticate HTTP requests using public key based identities created on a smartphone or laptop.  Additionally the library supports certifying content using the same public keys, so that content can be distributed using ordinary web servers and edge caching networks.

A command line interface is included to help programmers quickly learn how EdSig works, and for interacting with EdSig based services.  A reference persona service is available at [https://personas.cryptomessaging.org](https://personas.cryptomessaging.org)


## Quickstart

The easiest way to learn about EdSig is to install the command line tools and run some commands.

Assuming you are using a Mac and have Node.js 8+ installed, install the command line interface:
<pre>
$ npm install edsig -g
</pre>

Instead of each user having only one account, Cryptomessaging supports personas and each person can have many of them.  To create your first persona nicknamed 'Satoshi':
<pre>
$ edsig persona create Satoshi
</pre>

Your new persona is displayed on the screen as two JSON objects: the persona which includes public information and a globally unique identifier (the persona id), and the secrets which are the elliptic curve secrets for cryptography.  Both these files are saved in the .cryptomessaging directory under your user directory.

Just like email, cryptomessaging is a network of Internet services interacting with common protocols.  A core service type is a persona service which shares personas publicly.  Cryptomessaging.org provides a reference persona service at https://personas.cryptomessaging.org which can be joined with the following edsig command:
<pre>
$ edsig join https://personas.cryptomessaging.org -n satoshi
</pre>

In the command above we added the '-n' option which also published the Satoshi persona when joining the service.  Here's an example of the output:
<pre>
Joined service: Alpha Persona Service at https://personas.cryptomessaging.org
Persona published to: https://personas.cryptomessaging.org/personas/1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY/persona.json
</pre>
COPY DOWN the URL after "Persona published to:" and use in the next command as "edsig get &lt;URL&gt;":
<pre>
$ edsig get http://localhost:3030/personas/1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY/persona.json -v
</pre>

This last command, "edsig get", demonstrates the final result.  Anyone on the Internet can request your persona.json file and the file they receive includes a cryptographically signed certificate proving it could only have been created by you.

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

## SDK Installation

The EdSig module can be used for both creating Node based [Cryptomessaging](https://cryptomessaging.org) services, and as a command line tool for generating cryptomessaging files and communicating with cryptomessaging services.

To include edsig in a your Node project:
<pre>
$ cd &lt;your project directory&gt;
$ npm install edsig --save
</pre>


## Command Line Interface Examples

For the following commands to work, make sure you have:
1. Joined the Alpha persona service using the "edsig join" command from the Quickstart above
2. Added your Satoshi persona to the Alpha persona service

Download the real Satoshi Nakamoto's photo from the Alpha persona service:
<pre>
$ edsig get images/nakamoto.jpg
</pre>

Upload the hawaii.jpg image to your persona on the Alpha service.  Note that --nickname only requires a case-insensitive partial match, so lowercase "sat" matches "Satoshi".  The --service also matches partial service names.
<pre>
$ edsig put ~/mypictures/hawaii.jpg images/hawaii.jpg --nickname sat --service alpha
</pre>

Delete a file from a persona service.  The filename is relative to your personas directory.  The shorthand version of --nickname is -n
<pre>
$ edsig persona delete images/hawaii.jpg -n sat --service alp
</pre>

Update your Satoshi persona on the Alpha persona service.  This updates the personas.json file.
<pre>
$ edsig persona update --nickname Satoshi --service alpha
</pre>

Make (or ensure they exist) a directory and child directory named "share/resume" on a persona server, under my persona identified with a nickname containing "Satoshi"
<pre>
$ edsig persona mkdir "share/resume" --service alpha --nickname Satoshi
</pre>

Publish my Stanford resume that has an Edwards Signature from Stanford, to my resume directory:
<pre>
$ edsig persona put stanford.pdf share/resume/stanford.pdf --content-sig stanford.pdf.sig -n sat -s alp
</pre>

Remove a directory named "share" on a persona server, under my persona identified with a nickname containing "Satoshi".  All directories under the share directory are also removed.
<pre>
$ edsig persona delete share --service alpha --nickname Satoshi
</pre>


### Other Useful Commands

Simply generate a keypair and print on the screen.  The value is not saved.
<pre>
$ edsig genkey
</pre>

## Installing EdSig on platforms other than Mac

Coming coon!

## Using The EdSig SDK

Coming soon!
