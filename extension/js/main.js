// Create an event listener and if the GLG cookie changes
// we update our user information
chrome.cookies.onChanged.addListener(function (info) {
  if (info.cause == "explicit") {
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "glgSAM") {
      console.log("GLG Login Detected");
      doCookieSync();
    }
  }
  if (info.cause == "expired_overwrite") {
    if (info.cookie.domain == ".glgroup.com" && info.cookie.name == "singlepoint") {
      console.log("Logout Detected");
      doCookieSync(true);
    }
  }
});

var doCookieSync = function(isPurge) {
  chrome.cookies.getAll({"domain":"glgroup.com"},function (cookies) {
    // for (var c=config.glg_domains.length; c > 0; c--) {
    for (var i=cookies.length; i > 0; i--) {
      if (cookies[i-1].domain != ".glgroup.com") {
        // Not a root cookie
        continue;
      }
      for (var c=config.glg_domains.length; c > 0; c--) {
        var tmpCookie = cookies[c-1];
        // Grab
        if (isPurge) {
          tmpCookie.url = "https://" + config.glg_domains[c-1] + "/";
          chrome.cookies.remove({"url":tmpCookie.url,"name":tmpCookie.name});
        } else {
          tmpCookie.domain = "." + config.glg_domains[c-1];
          tmpCookie.url = "https://" + config.glg_domains[c-1] + "/";
          delete tmpCookie.hostOnly;
          delete tmpCookie.session;
          chrome.cookies.set(tmpCookie);
        }
      }
    }
  });
};
