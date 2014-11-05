//
var basic_auth_hash = "";

// Create an event listener and if the GLG cookie changes
// we update our user information when we detect changes to cookies
chrome.cookies.onChanged.addListener(function (info) {
  // If the event type means it's setting or updating a cookie
  if (info.cause == "explicit") {
    // ...And that cookie is from our root domain and the SSO glgSAM cookie
    // they must be on our SSO portal either logging in or refreshing
    // so lets copy the GLG cookies to our other domains
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "glgSAM") {
      console.log("GLG Login Detected");
      // Sync our cookies
      doCookieSync();
    }
  }
  // If the cookie event is a removal
  if (info.cause == "expired_overwrite") {
    // And the cookie is on our root and it is the singlepoint cookie then
    // this is happening because the user is logging out of the portal
    // so we delete our glgroup.com cookies from our other domains
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "singlepoint") {
      console.log("Logout Detected");
      // Go do the deleting
      doCookieSync(true);
      chrome.storage.local.clear();
      basic_auth_hash = "";
    }
  }
});

var doStoreUsernameFromCookie = function () {
  chrome.cookies.getAll({"domain":"glgroup.com"},function (cookies) {
    // Foreach glgroup.com cookie
    for (var i=cookies.length-1; i >= 0; i--) {
      if (cookies[i].domain != ".glgroup.com") {
        // Not a root cookie
        continue;
      }
      if (cookies[i].name == "glgSAM") {
        chrome.storage.local.set({"username":cookies[i].value},doTryToHashCredentials);
      }
    }
  });
};

// Copy cookies from glgroup.com to other domains
var doCookieSync = function(isPurge) {
  chrome.cookies.getAll({"domain":"glgroup.com"},function (cookies) {
    // Foreach glgroup.com cookie
    for (var i=cookies.length-1; i >= 0; i--) {
      // We are only looking for root level cookies (not subdomains)
      if (cookies[i].domain != ".glgroup.com") {
        // Not a root cookie
        continue;
      }
      // Foreach domain configured
      for (var c=config.glg_domains.length-1; c >= 0; c--) {
        var tmpCookie = {};
        // If we're suppose to delete cookies
        if (isPurge) {
          // Set the URL so the API doesn't bark
          tmpCookie.url = "https://" + config.glg_domains[c] + "/";
          // Remove the cookie from the other domains
          // console.log("Removing cookie: " + tmpCookie.name);
          chrome.cookies.remove({"url":tmpCookie.url,"name":cookies[i].name});
        } else {
          // But if we're supposed to add the cookies
          // Set the cookie to the domain we're supposed to copy to
          tmpCookie.domain = "." + config.glg_domains[c];
          // Shove in a URL so the API doesn't complain
          tmpCookie.url = "https://" + config.glg_domains[c] + "/";
          // Set the cookie name
          tmpCookie.name = cookies[i].name;
          // Set the cookie value
          tmpCookie.value = cookies[i].value;
          // Set expire time to one day for other sizes
          var d = new Date();
          d.setTime(d.getTime() + (1*24*60*60));
          if (!tmpCookie.expirationDate) {
            tmpCookie.expirationDate = d.getTime();
          }
          // Shove the cookie into the other domain
          chrome.cookies.set(tmpCookie);
          // Copy the glgSAM cookie to starphleet_user
          // and use the SAM cookie to set the user's username
          if (tmpCookie.name == "glgSAM") {
            console.log("Setting Username");
            var starphleet_cookie = tmpCookie;
            starphleet_cookie.name = "starphleet_user";
            chrome.cookies.set(starphleet_cookie);
            chrome.storage.local.set({"username":tmpCookie.value},doTryToHashCredentials);
          }
        }
      }
    }
  });
};


// We inject a sniffer (content_script) into our main SSO page which will send us
// an event if we detect someone logs into our SSO system.  The code
// below will handle these events
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (request.name) {
    // If the event we receive is our password event
    if (request.name == "sso_password_submit") {
      // Store the password locally as a cache
      chrome.storage.local.set({"password":request.sso_password});
    }
  }
  doTryToHashCredentials();
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
// TODO:  Only redirect if we don't have your credentials AND we get
//        a 401 suggesting you need them
// FIXME:  Redirect user to the 'logged out' page of the portal
//        because we actually need the login event in order
//        to get the users info
// chrome.webRequest.onBeforeRequest.addListener(function (details) {
//   if (basic_auth_hash) {
//     // console.log("Base64 hash found");
//     return;
//   }
//   // console.log('No SSO cookie, redirecting ', details.url);
//   return { redirectUrl: 'https://my.glgroup.com' };
// },filter,["blocking"]);


// Before the web request sends headers to the server listen for those
// events and determine if we can inject an auth header
chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
  // If we don't have credentials for them we can't inject anything
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
