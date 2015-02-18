// UN/PW Cache for the user
var username = "";
var password = "";

// If we force a redirect because of an auth condition we remember the old URL here
var originalUrl = "";

// Cache of calls already authed
var authedCache = {};

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
      chrome.storage.local.set({"username":info.cookie.value},doPullCredentialsFromStorage);
    }
  }

  // If the cookie event is a removal
  if (info.cause == "expired_overwrite") {
    // And the cookie is on our root and it is the singlepoint cookie then
    // this is happening because the user is logging out of the portal
    // so we delete our glgroup.com cookies from our other domains
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "singlepoint") {
      console.log("Logout Detected");
      //     // We clear the storage so there's no chance we shove creds into headers
      chrome.storage.local.clear();
      // We clear our hash also
      username = "";
      password = "";
    }
  }
});

// We inject a sniffer (content_script) into our main SSO page which will send us
// an event if we detect someone logs into our SSO system.  The code
// below will handle these events
chrome.runtime.onMessage.addListener(function doHandleSSOPasswordCallback(request, sender, callback) {
  if (request.name) {
    // If the event we receive is our password event
    if (request.name == "sso_password_submit") {
      // Store the password locally as a cache
      chrome.storage.local.set({"password":request.sso_password},doPullCredentialsFromStorage);
    }
  }
});

// Try to get credentials from storage and build a hash
var doPullCredentialsFromStorage = function doPullCredentialsFromStorage() {
  // See if we have a username/password combo cached
  chrome.storage.local.get(["username","password"], function(stored) {
    // If we have them cached
    if (stored && stored.username && stored.password) {
      // Convert them to a base64 encoded Basic Auth string and store
      // it globally
      username = stored.username;
      password = stored.password;
    }
  });
};

// See if we have credentials cached when we first run to maybe
// avoid the user getting prompted
doPullCredentialsFromStorage();

// Filter for which pages we should inject an Authorization header
var filter = {
  urls: config.remote_login_urls
};

// If we are asked for auth - something is weird - so, if we haven't
// and trigger them to auth
chrome.webRequest.onAuthRequired.addListener(function (details,callback) {
  console.log("Auth Requested");
  // debugger;
  // FIXME: If we are no longer going to inject a header we no longer
  //        need to store the basic_auth_hash OR do all this decoding
  //        ..
  //        Really this whole thing needs to be refactore
  if (username && password && !authedCache[details.requestId]) {
    // Cache this attempt to make sure we don't loop with bad credentials
    authedCache[details.requestId] = true;
    // Try to login with our credentials
    callback({authCredentials: {"username": username,"password": password}});
    return;
  }
  // If this isn't a background request and we couldn't get auth
  // we need to open a new window for the user to authenticate via SSO
  if (details.type === "main_frame" && username && password) {
    window.open(config.sso_logout_url);
  }
  // Now probably need to prompt the user for auth and fallback to the original
  // browser behavior
  callback();
  return;
},filter,["asyncBlocking"]);
