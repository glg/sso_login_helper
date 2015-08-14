# GLG SSO Login Helper
The purpose of this extension is to detect when users login to our SSO portal and help them auto-login to other services not setup for SSO authentication.

## How it works
This extension:
- Listens for login events on the GLG SSO Portal  
- Caches the user's information  
- Injects an Authorization header onto domains (set in config.js)

## How to Setup
The following steps are all that's required for this plugin to work:
- Install the plugin
- [Logout](https://glg.okta.com/login/signout) of the [GLG SSO Portal](https://my.glgroup.com)
- Login to the [Okta SSO Portal](https://glg.okta.com)

## Info For Developers
Some of the meta data is made available in a cookie set against our domains.  The meta data about the user can be retrieved here using some form of the following:

```
var allcookies = document.cookie;
var base64value = (allcookies.split("glguserinfo=")[1]).split(';')[0]
var json = atob(base64value);
try {
  user = JSON.parse(json);
} catch (e) {
  // User info is whack, tell @bhudgens
}
```
