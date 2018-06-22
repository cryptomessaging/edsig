# Command Line Interface - Service Examples

Just like email, cryptomessaging is a network of Internet services interacting with common protocols.  A core service type is a persona service which shares personas publicly.  Cryptomessaging.org provides a reference persona service at https://personas.cryptomessaging.org which can be joined with the following edsig command:
<pre>
$ edsig join https://personas.cryptomessaging.org -n satoshi
</pre>

In the command above we added the '-n' option which also published the Satoshi persona when joining the service.  Here's an example of the output:
<pre>
Joined service: Alpha Persona Service at https://personas.cryptomessaging.org
Persona published to: https://personas.cryptomessaging.org/personas/1PnUQJ2zISR_ufhoABksm1b8y_BhLa9ssgWv4rFXNZY/persona.json
</pre>