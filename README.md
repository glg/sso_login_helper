# GLG SSO Login Helper
The purpose of this extension is to detect when users login to our SSO portal and help them auto-login to other services not setup for SSO authentication.

## How it works
This extension:
- Listens for login events on the GLG SSO Portal  
- Caches the user's information  
- Injects an Authorization header onto domains (set in config.js)

## How to Setup
The following steps are all that's required for this plugin to work:
- [Install the plugin](https://chrome.google.com/webstore/detail/glg-login-helper/jjplhohhmnecolkkhofjgbaginidmmal?authuser=1)

> You don't do anything active.  Login to Microsoft at any time and the extension will detect that and enable itself
  The extension will send you to the appropriate page the first time it detects it doesn't know your password and _COULD_ have helped.

  You can click here to force log yourself out, once you log back in, the plugin should detect the login:
                    
   https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=https%3a%2f%2flogin.microsoftonline.com


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
