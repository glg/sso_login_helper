GLG SSO Login Helper
===============

The purpose of this extension is to detect when users login to our SSO portal and help them auto-login to other services not setup for SSO authentication.

## How it works

This extension:

* Listens for login events on the GLG SSO Portal  
* Caches the user's information  
* Injects an Authorization header onto domains (set in config.js)
