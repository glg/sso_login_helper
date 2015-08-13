var ssoLoginHosts = [];

// Store any paths that would represent the login page.  Don't inject hooks
// on any other page
ssoLoginHosts[0] = {
  host: "glg.okta.com",
  path: "/login/login.htm"
};
ssoLoginHosts[1] = {
  host: "glg.okta.com",
  path: "/"
};

// This looks nasty - I hate it
(function() {

  // Run through all our hosts and paths and see if we need to inject our
  // hooks on this page.  Assume we didn't find it until proven otherwise
  var _hostAndPathFound = false;
  var _c = ssoLoginHosts.length;
  while (_c--) {
    if (
      window &&
      window.location.host === ssoLoginHosts[_c].host &&
      window.location.pathname === ssoLoginHosts[_c].path
    ) {
      _hostAndPathFound = true;
      break;
    }
  }

  if (!_hostAndPathFound) {
    return;
  }

  console.info("SSO Login Page Detected");

  // It is possible for the DOM to not be loaded when we are called.  This can
  // happen if parts of the DOM are dynamically generated even if we set
  // our run_at in the manifest.  So we setup something to listen for the form
  // element on the main SSO page.
  var domLoadTimer = setInterval(doCheckForForm, 100);

  function doCheckForForm() {
    // If we find the form
    if (typeof document.forms != "undefined") {
      // Clear our check timer
      clearInterval(domLoadTimer);

      var ssoForm = document.forms[0];
      // Now listen for the submit event and if it's fired
      // store whatever password is sent to us.
      ssoForm.addEventListener("submit", function(t) {
        // Build an object to send to our background page
        var data = {
          "name": "ssoLoginSubmit",
          "ssoUsername": ssoForm.elements.username.value,
          "ssoPassword": ssoForm.elements.password.value
        };
        // Fire off an event to our background page with the password entered
        chrome.runtime.sendMessage("", data);
      }, false);
    }
  }
})();
