"use strict";

// If we force a redirect because of an auth condition we remember the old URL here
var originalUrl = "";

// To emit our version
var appDetails = chrome.app.getDetails();
doSendGoogleAnalyticsEvent('Loading', 'Version: ' + appDetails.version);
setInterval(function doGoogleAnalyticsPing() {
  doSendGoogleAnalyticsEvent('Ping', 'Version: ' + appDetails.version);
}, 240000);


// Cache of calls already authed
var authedCache = {};
var urlCache = {};

// Filter for which pages we should inject an Authorization header
var filter = {
  urls: config.remote_login_urls
};

chrome.webRequest.onHeadersReceived.addListener(details => {
  if (details.type === "main_frame") {
    let isJWTAuthRequired = false;
    details.responseHeaders.forEach(header => {
      isJWTAuthRequired = isJWTAuthRequired || (header.name === "X-Starphleet-Service" && header.value === config.jwtAuthUrl)
    });
    console.log("isJWTAuthRequired", isJWTAuthRequired);
    if (isJWTAuthRequired) {
      const emailAddress = user.metadata.mail || void 0;
      const url = details.url;
      http(config.jwtGetTokenUrl, JSON.stringify({ emailAddress, url }), (err, res) => {
        try {
          if (err) {
            throw new Error("http error getting cookie");
          }
          
          const jwtTokenResponse = JSON.parse(res);

          const cookie = {
            name: config.jwtCookieName,
            path: "/",
            expirationDate: ((new Date()).getTime() / 1000) + 30,
            value: jwtTokenResponse.token
          };

          let c = config.glgDomains.length;
          while (c--) {
            cookie.url = ["https://", config.glgDomains[c]].join('');
            cookie.domain = config.glgDomains[c];
            chrome.cookies.set(cookie);
          }
          chrome.tabs.reload(details.tabId);

        } catch (e) {
          return console.error("Unable to get JWT Token", e, e.stack);
        }
      })
    }
  }
  console.log(details);
}, filter, ["responseHeaders"]);

// If we are asked for auth - something is weird - so, if we haven't
// authed yet we inject our creds and try
chrome.webRequest.onAuthRequired.addListener(function(details, callback) {
  console.log("Auth Requested: ", details.url);
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
