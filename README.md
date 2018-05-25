# EdSig

Edwards-curve based HTTP authorization and certification SDK for Node.js and command line tools.

## Installation

Assuming you have Node.js installed, to use the command line interface:
$ npm install edsig -g

To include edsig in a your Node project:
<pre>
$ cd &lt;your project directory&gt;
$ npm install edsig --save
</pre>


## Command Line Interface Examples

Create a new persona with a nickname "Satoshi" on the local computer
<pre>
$ edsig persona create "Satoshi"
</pre>

Join the "Alpha" Persona Service at cryptomessaging.org and upload your Satoshi persona
<pre>
$ edsig join https://personas.cryptomessaging.org --nickname Satoshi
</pre>


### Managing Persona Files on a Persona Service

For the following commands to work, make sure you have joined the service using the "edsig join" command and added your Satoshi persona to the service.

Upload the hawaii.jpg image to your persona on the Alpha service.  Note that --nickname only requires a case-insensitive partial match, so lowercase "sat" matches "Satoshi".  The --service also matches partial service names.
<pre>
$ edsig persona put ~/mypictures/hawaii.jpg images/hawaii.jpg --nickname sat --service alpha
</pre>

Delete a file from a persona service.  The filename is relative to your personas directory.  The shorthand version of --nickname is -n
<pre>
$ edsig persona delete --service alp images/hawaii.jpg -n sat
</pre>

Update your Satoshi persona on the Alpha persona service.  This updates the personas.json file.
<pre>
$ edsig persona update --nickname Satoshi --service alpha
</pre>

Make (or ensure they exist) a directory and child directory named "share/resume" on a persona server, under my persona identified with a nickname containing "Satoshi"
<pre>
$ edsig persona mkdir "share/resume" --service alpha --nickname Satoshi
</pre>

Remove a directory named "share" on a persona server, under my persona identified with a nickname containing "Satoshi".  All directories under the share directory are also removed.
<pre>
$ edsig persona rmdir share --service alpha --nickname Satoshi
</pre>


### Other Useful Commands

Simply generate a keypair and print on the screen.  The value is not saved.
<pre>
$ edsig genkey
</pre>



## Using The EdSig SDK

TBD
