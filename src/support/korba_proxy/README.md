Korba Proxy
===========

The Korba API requires a whitelisted IP for requests. Google cloud functions
don't provide a mechanism to limit IPs that send external requests, hence this
pass-through proxy.

The proxy does a little sanity-checking and correction. Ideally, the higher
layers would have handled these already, but no harm in applying some
idempotent rules here.


config.js
---------

The proxy requires some configuration of secrets. See the provided
`config.example.js` for the needed keys. Copy this template to `config.js` and
fill in appropriately. **NEVER** commit a `config.js` file.
