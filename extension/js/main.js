// Create an event listener and if the GLG cookie changes
// we update our user information

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
        var tmpCookie = cookies[i];
        // If we're suppose to delete cookies
        if (isPurge) {
          // Set the URL so the API doesn't bark
          tmpCookie.url = "https://" + config.glg_domains[c] + "/";
          // Remove the cookie from the other domains
          // console.log("Removing cookie: " + tmpCookie.name);
          chrome.cookies.remove({"url":tmpCookie.url,"name":tmpCookie.name});
        } else {
          // But if we're supposed to add the cookies
          // Change the domain of the cookie
          tmpCookie.domain = "." + config.glg_domains[c];
          // Shove in a URL so the API doesn't complain
          tmpCookie.url = "https://" + config.glg_domains[c] + "/";
          // Delete fields that also make the API complain
          delete tmpCookie.hostOnly;
          delete tmpCookie.session;
          // console.log("Adding cookie: " + tmpCookie.name);
          // Shove the rest of the cookie into the other domain
          chrome.cookies.set(tmpCookie);
        }
      }
    }
  });
};
