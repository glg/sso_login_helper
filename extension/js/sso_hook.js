/*global chrome*/

/**
 * Store any host and path matches that would represent the OKTA
 * login page.  We should never get run on any page outside
 * of these because of the extension manifest but this guard
 * is on the content side just-in-case.
 */
const ssoLoginHosts = [{
    host: "glg.okta.com",
    path: "/login/login.htm"
  },
  {
    host: "glg.okta.com",
    path: "/"
  }
];

(function() {
  /**
   * Run through all our hosts and paths and see if we need to inject our
   * hooks on this page.  We assume we shouldn't run until we prove
   * we should
   */
  let _hostAndPathFound = false;
  let _c = ssoLoginHosts.length;
  while (_c--) {
    if (
      window
      && window.location.host === ssoLoginHosts[_c].host
      && window.location.pathname === ssoLoginHosts[_c].path
    ) {
      _hostAndPathFound = true;
      break;
    }
  }

  if (!_hostAndPathFound) {
    return;
  }

  /*eslint no-console: "off"*/
  console.info("SSO Login Page Detected");

  // It is possible for the DOM to not be loaded when we are called.  This can
  // happen if parts of the DOM are dynamically generated even if we set
  // our run_at in the manifest.  So we setup something to listen for the form
  // element on the main SSO page.
  var domLoadTimer = setInterval(doCheckForForm, 100);

  function doCheckForForm() {
    // If we find the form
    if (typeof document.forms !== "undefined"
      && document.forms[0]
      && document.forms[0].elements.username) {
      // Clear our check timer
      clearInterval(domLoadTimer);

      var ssoForm = document.forms[0];
      // Now listen for the submit event and if it's fired
      // store whatever password is sent to us.
      ssoForm.addEventListener("submit", () => chrome.runtime.sendMessage("", {
        "name": "ssoLoginSubmit",
        "ssoUsername": ssoForm.elements.username.value,
        "ssoPassword": ssoForm.elements.password.value
      }), false);
    }
  }
}());
