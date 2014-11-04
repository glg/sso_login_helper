// Move these to an appropriate configuration place
var _sso_login_host = "customsso.glgroup.com";
var _sso_login_path = "/public/login.php";

// This looks nasty - I hate it
(function () {
  // If we are not on our main SSO portal we should punt
  if ( !window || window.location.host != _sso_login_host || window.location.pathname != _sso_login_path ) {
    return;
  }
  console.info("SSO Login Page Detected");

  // It is possible for the DOM to not be loaded when we are called.  This can
  // happen if parts of the DOM are dynamically generated even if we set
  // our run_at in the manifest.  So we setup something to listen for the form
  // element on the main SSO page.
  var domLoadTimer = setInterval(doCheckForForm, 100);

  function doCheckForForm () {
    // If we find the form
    if (typeof document.forms != "undefined") {
      // Clear our check timer
      clearInterval(domLoadTimer);

      var sso_form = document.forms[0];
      // Now listen for the submit event and if it's fired
      // store whatever password is sent to us.  We don't trust
      // the username/password combo until the cookie is set
      // so all we are after is the password
      sso_form.addEventListener("submit",function (t) {
        // Build an object to send to our background page
        // TODO:  Instead of grabbing the element by name it would
        //        be more ideal to grab the 'password' field on the page.
        //        It is less likely to break if the portal page changes.
        //        However, right now the page and url are statically configured
        //        inside this script ... so, we'll be back in here if they change
        //        the portal too much.
        var data = {
          "name":"sso_password_submit",
          "sso_password":sso_form.elements["singlepoint-password"].value
        };
        // Fire off an event to our background page with the password entered
        chrome.runtime.sendMessage("",data);
      },false);
    }
  }
})();
