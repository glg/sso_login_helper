// If we force a redirect because of an auth condition we remember the old URL here
var originalUrl = "";

// To emit our version
var appDetails = chrome.app.getDetails();
doSendGoogleAnalyticsEvent('Loading', 'Version: ' + appDetails.version);
setInterval(function doGoogleAnalyticsPing() {
  doSendGoogleAnalyticsEvent('Ping', 'Version: ' + appDetails.version);
}, 900000);


// Cache of calls already authed
var authedCache = {};
var urlCache = {};

// Filter for which pages we should inject an Authorization header
var filter = {
  urls: config.remote_login_urls
};

// If we are asked for auth - something is weird - so, if we haven't
// authed yet we inject our creds and try
chrome.webRequest.onAuthRequired.addListener(function(details, callback) {
  console.log("Auth Requested");
  if (user.username && user.password && !authedCache[details.requestId]) {
    doSendGoogleAnalyticsEvent('Login', 'Attempt', details.url);
    // Cache this attempt to make sure we don't loop with bad credentials
    authedCache[details.requestId] = true;
    // Try to login with our credentials
    callback({
      authCredentials: {
        "username": user.username,
        "password": user.password
      }
    });
    return;
  }
  // If this url is excluded from sso or ldap auth we send the normal behavior
  // This is controlled in the config file
  var c = config.ssoExclusionUrls.length;
  while (c--) {
    if (~details.url.indexOf(config.ssoExclusionUrls[c])) {
      doSendGoogleAnalyticsEvent('Login', 'Exclusion', details.url);
      callback();
      return;
    }
  }
  // If this isn't a background request and we couldn't get auth
  // we need to open a new window for the user to authenticate via SSO
  if (details.type === "main_frame" && (!urlCache[details.url] || (user.username && user.password))) {
    doSendGoogleAnalyticsEvent('Login', 'Prompt', details.url);
    urlCache[details.url] = true;
    window.open(config.sso_logout_url);
  }
  // Now probably need to prompt the user for auth and fallback to the original
  // browser behavior
  callback();
  return;
}, filter, ["asyncBlocking"]);
