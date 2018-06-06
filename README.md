# EdSig

Edwards-curve based cryptographic HTTP authorization and certification SDK for Node.js and command line tools.

The SDK can be used to build clients or servers that allow users to authenticate HTTP requests using public key based identities created on a smartphone or laptop.  Additionally the library supports certifying content using the same public keys, so that content can be distributed using web servers and edge caching networks.

A command line interface is included, to help programmers quickly learn how EdSig works, and for interacting with EdSig based services.  A sample persona service is available at https://personas.cryptomessaging.org


## Installation

The EdSig module can be used for both creating Node based [Cryptomessaging](https://cryptomessaging.org) services, and as a command line tool for generating cryptomessaging files and communicating with cryptomessaging services.

Assuming you are using a Mac and have Node.js 8+ installed, to use the command line interface:
<pre>
$ npm install edsig -g
</pre>

To include edsig in a your Node project:
<pre>
$ cd &lt;your project directory&gt;
$ npm install edsig --save
</pre>


## Command Line Interface Examples

Create a new persona with a nickname "Satoshi" on your local computer.  The resulting files are stored on your computer under the ~/.cryptomessaging directory.  A persona is one version of yourself, such as your role as a parent, or the way you are around your old college friends.  You can create as many personas as you want, and they are all kept completely separate.
<pre>
$ edsig persona create Satoshi
</pre>

Join the "Alpha" persona service at cryptomessaging.org and upload your new Satoshi persona.  The following command remembers the "Alpha Persona Service" on your local computer and allows you to refer to it by name, such as "-s alpha".
<pre>
$ edsig join https://personas.cryptomessaging.org --nickname Satoshi
</pre>

Fetch the persona.json file you just uploaded in the last example.  Copy the URL printed after the last example and substitute it into the example below:
<pre>
$ edsig get -s alp personas/-E0MwwjCx1JOLBo6q0yUn4w9KyDEV5xUdBUiPy-k8hI/persona.json --save-sig persona.json.edsig
</pre>


### Managing Persona Files on a Persona Service

For the following commands to work, make sure you have joined the Alpha service using the "edsig join" command and added your Satoshi persona to the Alpha service.

Upload the hawaii.jpg image to your persona on the Alpha service.  Note that --nickname only requires a case-insensitive partial match, so lowercase "sat" matches "Satoshi".  The --service also matches partial service names.
<pre>
$ edsig persona put ~/mypictures/hawaii.jpg images/hawaii.jpg --nickname sat --service alpha
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
