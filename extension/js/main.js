// Where we store the Base64 encoded hash of the users credentials
var basic_auth_hash = "";

// Create an event listener and if the GLG cookie changes
// we update our user information when we detect changes to cookies
chrome.cookies.onChanged.addListener(function (info) {
  // If the event type means it's setting or updating a cookie
  if (info.cause == "explicit") {
    // ...And that cookie is from our root domain and the SSO glgSAM cookie
    // they must be on our SSO portal either logging in or refreshing
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "glgSAM") {
      console.log("GLG Login Detected");
      // Set the username in storage
      chrome.storage.local.set({"username":info.cookie.value},doTryToHashCredentials);
    }
  }
  // If the cookie event is a removal
  if (info.cause == "expired_overwrite") {
    // And the cookie is on our root and it is the singlepoint cookie then
    // this is happening because the user is logging out of the portal
    // so we delete our glgroup.com cookies from our other domains
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "singlepoint") {
      console.log("Logout Detected");
      // We clear the storage so there's no chance we shove creds into headers
      chrome.storage.local.clear();
      // We clear our hash also
      basic_auth_hash = "";
    }
  }
});

// We inject a sniffer (content_script) into our main SSO page which will send us
// an event if we detect someone logs into our SSO system.  The code
// below will handle these events
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (request.name) {
    // If the event we receive is our password event
    if (request.name == "sso_password_submit") {
      // Store the password locally as a cache
      chrome.storage.local.set({"password":request.sso_password},doTryToHashCredentials);
    }
  }
});

// Try to get credentials from storage and build a hash
var doTryToHashCredentials = function () {
  // See if we have a username/password combo cached
  chrome.storage.local.get(["username","password"], function(stored) {
    // If we have them cached
    if (stored && stored.username && stored.password) {
      // Convert them to a base64 encoded Basic Auth string and store
      // it globally
      basic_auth_hash = btoa(stored.username + ":" + stored.password);
    }
  });
};

// See if we have credentials cached when we first run to maybe
// avoid the user getting prompted
doTryToHashCredentials();

// Filter for which pages we should inject an Authorization header
var filter = {
  urls: config.remote_login_urls
};

// The following will redirect you to the SSO portal if we don't have
// your credentials
chrome.webRequest.onBeforeRequest.addListener(function (details) {
  // If we already have credentials - no need to redirect user to auth
  if (basic_auth_hash) {
    return;
  }
  console.info("No Login Information Detected");
  return { redirectUrl: config.sso_logout_url };
},filter,["blocking"]);

// If we are asked for auth - something is weird - so, if we haven't
// already redirected the user to auth.. try to open a new window
// and trigger them to auth
chrome.webRequest.onAuthRequired.addListener(function (details) {
  // open a new window to our auth portal
  window.open(config.sso_logout_url);
  return;
},filter,["blocking"]);


// Before the web request sends headers to the server listen for those
// events and determine if we can inject an auth header
chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
  // If we don't have credentials for this user we can't inject anything
  if (!basic_auth_hash) {
    return;
  }
  // Push a new header into the request that includes auth
  details.requestHeaders.push({
    "name": "Authorization",
    "value": "Basic " + basic_auth_hash
  });
  // Return all the request headers
  return {requestHeaders: details.requestHeaders};
  // Add our filter to the event listener and request blocking/requestHeaders
  // permissions
},filter,["blocking","requestHeaders"]);
