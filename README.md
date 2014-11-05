GLG SSO Login Helper
===============

The purpose of this extension is to detect when users login to our SSO portal and help them auto-login to other services not setup for SSO authentication.

## How it works

This extension:

* Listens for login events on the GLG SSO Portal  
* Caches the user's information  
* Injects an Authorization header onto domains (set in config.js)

## How to Setup

The following steps are all that's required for this plugin to work:

* Install the plugin
* Logout of the [GLG SSO Portal](https://my.glgroup.com/LogoutServlet)
* Login to the [GLG SSO Portal](https://my.glgroup.com)
