# Command Line Interface - Persona Examples

Cryptomessaging supports personas, different views of yourself which can be kept completely separate.  This allows you to have a work life, and a family life.


## Creating a Persona

To create your first persona nicknamed 'Satoshi':
<pre>
$ edsig persona create Satoshi
</pre>

Your new persona is displayed on the screen as two JSON objects: the persona which includes public information and a globally unique identifier (the persona id), and the secrets which are the elliptic curve secrets for cryptography.  Both these files are also saved in the .cryptomessaging directory under your user directory.


## Update Your Persona on a Service

Update your Satoshi persona on the Alpha persona service.  This updates the personas.json file.
<pre>
$ edsig persona update --nickname Satoshi --service alpha
</pre>


## Other Useful Commands

Simply generate a keypair and print on the screen.  The value is not saved.
<pre>
$ edsig genkey
</pre>
