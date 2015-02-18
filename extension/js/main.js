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
      // When this extension redirects a user to auth we store the original
      // url the user came from.  If they successfully auth and we still
      // have a record of the original email we open them back up to that
      // url
      // XXX: The following code can confuse users because sometimes the first
      //      request that triggers authentication is a json endpoint or some
      //      backend call for an SPA.  In those cases, redirecting the user
      //      to the requesting URL would be confusing.  All the user sees is
      //      a json blob.  Will either need to add a huge list of exclusions
      //      or a list of 'inclusion' urls that we would redirect back to.
      //      In the mean time disabling completely
      if (originalUrl) {
      //   // Open the original URL the user was redirected from
      //   window.open(originalUrl);
      //   // Clear our cache so we don't redirect them in the future
        originalUrl = "";
      }
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
      username = stored.username;
      password = stored.password;
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

// XXX: This refactor might mean that we no longer need any of this
//      code
// The following will redirect you to the SSO portal if we don't have
// your credentials
// chrome.webRequest.onBeforeRequest.addListener(function (details) {
//   // If we already have credentials - no need to redirect user to auth
//   console.log("onBeforeRequest");
//   return;
//   if (basic_auth_hash) {
//     return;
//   }
//   console.info("No Login Information Detected");
//   // Store the original URL before we redirect the user
//   originalUrl = details.url;
//   // Redirect the user to login
//   return { redirectUrl: config.sso_logout_url };
// },filter,["blocking"]);


// Before the web request sends headers to the server listen for those
// events and determine if we can inject an auth header
// chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
//   // If we don't have credentials for this user we can't inject anything
//   console.log("onBeforeSendHeaders");
//   console.dir(details);
//   if (!basic_auth_hash) {
//     return;
//   }
//   // Push a new header into the request that includes auth
//   // details.requestHeaders.push({
//   //   "name": "Authorization",
//   //   "value": "Basic " + basic_auth_hash
//   // });
//   // Return all the request headers
//   return {requestHeaders: details.requestHeaders};
//   // Add our filter to the event listener and request blocking/requestHeaders
//   // permissions
// },filter,["blocking","requestHeaders"]);
