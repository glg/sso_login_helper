// Create an event listener and if the GLG cookie changes
// we update our user information

var base64_hash = "";

// When we detect changes to cookies
chrome.cookies.onChanged.addListener(function (info) {
  // If the event type means it's setting or updating a cookie
  if (info.cause == "explicit") {
    // And that cookie is from our root domain and the SSO glgSAM cookie
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
    // And the cookie is on our root and the singlepoint cookie then
    // this is happening because the user is logging out of the portal
    // so we delete our glgroup.com cookies from our other domains
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "singlepoint") {
      console.log("Logout Detected");
      // Go to the deleting
      doCookieSync(true);
      base64_hash = "";
    }
  }
});

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



var doTryToHashCredentials = function () {
  chrome.storage.local.get(["username","password"], function(stored) {
    if (stored && stored.username && stored.password) {
      console.log("Caching credentials");
      base64_hash = btoa(stored.username + ":" + stored.password);
    }
  });
};


// Event listener for requests - add credentials
var filter = {
  urls: ["*://*.glgresearch.com/*"]
};

chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
  if (!base64_hash) {
    return;
  }
  details.requestHeaders.push({
    "name": "Authorization",
    "value": "Basic " + base64_hash
  });
  return {requestHeaders: details.requestHeaders};
},filter,["blocking","requestHeaders"]);
