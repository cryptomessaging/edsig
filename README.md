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

Create a new persona with a nickname "Satoshi"
$ edsig persona add "Satoshi"

Join the "Alpha" Persona Service at cryptomessaging.org and upload your Satoshi persona
$ edsig join https://personas.cryptomessaging.org --nickname Satoshi






$ edsig post ~/mypictures/hawaii.jpg images/hawaii.jpg --nickname John --service stanford

Update your Satoshi persona on the Alpha persona service
$ edsig persona update --nickname Satoshi --service alpha

Delete a file from a persona service
$ edsig persona delete --service stanford /personas/42fw234kb234kj2n34bm234 --secret fsJd8sTYd6sdfnsdfFSSDF

Make a directory named "resume" on a persona server under my persona with a nickname containing Satoshi
$ edsig persona mkdir "resume" --service alpha --nickname Satoshi

Simply generate a keypair and print on the screen.  The value is not saved.
$ edsig genkey


## Using The EdSig Library

TBD
