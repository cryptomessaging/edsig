# Cryptomessaging Glossary

## Base 64 Url

Base 64 URL encoding is a web safe encoding where the forward slash symbol '/' has been replaced by an underscore '_', the plus '+' is replaced by a dash '-', and the trailing equal signs '=' have been removed.  It is part of RFC 4648 and more information can be found at the [IETF](https://tools.ietf.org/html/rfc4648#section-5).  Cryptomessaging uses base64url encoding instead of hex to preserve memory while still keeping the keys as text.

## Chat Service
## Cryptomessaging
## Cryptomessaging.org
## EdSig
## Edwards Curve
## Elliptic Curve Cryptography
## Group Service
## Keybase
## Keypath
## Master Key

Each persona has one master key.  The public key for this master key is also the persona id.  The public key is encoded as base64url.

## Mobido
## Persona
## Persona Id
## Push Service
## Subkey

Each persona has one master key and many subkeys.  Each key is has a secret which is only known to the persona owner, and a public key.  Both public and private keys are encoded as base64url.

Subkeys are stored under the keyring directory of each persona on persona servers, in files named as subkey(&lt;publicid&gt;).json
