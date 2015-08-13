/**
 * @function User
 * @abstract A dropin module for grabbing and caching GLG user information
 *           for chrome extensions.  Depends on three other .js files:
 *           		- http.js
 *           		- sso_hook.js
 *           		- config.js
 *
 * 					 config.js can be optional so long as a global 'config.epildap'
 * 					 configuration option is present before we are invoked which
 * 					 contains the full url to epildap
 * @return   {object}        This auto invokes itself.  user.$info is available
 *                           globally to an extension
 */
var User = (function() {

  /**
   * @function User
   * @abstract Constructor for this object
   */
  var User = function() {
    this.username = "";
    this.password = "";
    this.metadata = {};
    this.init();
  };
  /**
   * @function doLogout
   * @abstract Respect a logout event and purge all
   */
  User.prototype.doLogout = function doLogout() {
    chrome.storage.local.clear();
    this.username = "";
    this.password = "";
    this.metadata = {};
  };

  /**
   * @function init
   * @abstract Try to initialize the user from chrome storage and snag all
   *           their meta data from ldap
   */
  User.prototype.init = function init() {
    // Try to snag our creds from storage
    this.doUpdateUserFromStorage(function() {
      // ...but if they aren't there punt
      if (!this.username || !this.password) {
        return;
      }
      // Update our metadata about the user
      var _url = [config.epildap, "/searchldap?sAMAccountName=", this.username].join('');
      // Send a request to epildap and get the user's data
      http(_url, null, function(err, data) {
        if (err) {
          console.error("Error grabbing LDAP Info:", err);
          return;
        }
        // Don't throw exceptions if we get an invalid response
        try {
          // Parse the respone and store it
          this.metadata = JSON.parse(data);
          // Make sure we only got one result (results are an array)
          if (this.metadata.length > 1) {
            console.error("Userdata came back with too many results", this.metadata);
            this.metadata = "";
            return;
          }
          // Store the first result since all results come back as an array
          this.metadata = this.metadata[0];
        } catch (Exception) {
          console.error("Yikes, couldn't snag ldap info for the user:", Exception);
          return;
        }
        // Keep execution bound to the object
      }.bind(this));
      // Keep execution bound to the object
    }.bind(this));
    // Extract the Username from the "glgSAM" Cookie provided by our SSO
  };

  /**
   * @function doUpdateUserFromStorage
   * @abstract Try to grab the user's information from chrome storage
   * @param    {Function}    callback      Optional callback when we finish
   *                                       grabbing from storage
   */
  User.prototype.doUpdateUserFromStorage = function(callback) {
    // No Op if no callback submitted
    if (!callback || typeof(callback) !== "function") {
      callback = function() {};
    }
    // Try to get cached creds out of chrome storage
    chrome.storage.local.get(["username", "password", "metadata"], function(stored) {
      // If the item returned isn't empty
      this.username = stored.username ? stored.username : "";
      this.password = stored.password ? stored.password : "";
      this.extension = stored.extension ? stored.extension : "";
      // this.ldapObject = stored.ldapobject ? stored.ldapobject : {};
      // Keep all this functions bound this this object
      callback();
    }.bind(this));
  };

  // Return the constructor
  return User;
})();

// Create an event listener and if the GLG cookie changes
// we update our user information
chrome.cookies.onChanged.addListener(function(info) {
  if (info.cause === "expired_overwrite") {
    if (info.cookie.domain === "glg.okta.com" && info.cookie.name === "sid") {
      console.log("Logout Detected");
      user.doLogout();
    }
  }
});

// We inject a sniffer (content_script) into our main SSO page which will send us
// an event if we detect someone logs into our SSO system.  The code
// below will handle these events
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  // 'le guards
  if (!request || !request.name) {
    console.warn("Event without request info:", request);
    return;
  }
  // If the event we receive is our password event
  if (request.name == "ssoLoginSubmit") {

    if (!request.ssoUsername || !request.ssoPassword) {
      console.warn("Got login event but no infoz");
      return;
    }

    // If the username submitted has an '@' sign we got a userPrincipalName.
    // In this case we need to search ldap for the sAMAccountName.  This may
    // trigger a white box but it's the price we pay.
    if (~request.ssoUsername.indexOf('@')) {
      var _url = [config.epildapUsernameLookup, "/emailToUsername?email=", request.ssoUsername].join('');
      http(_url, null, function(err, responseText) {
        // Don't throw exceptions if we get an invalid response
        try {
          // Parse the respone and store it
          var _obj = JSON.parse(responseText);
          if (!_obj || !_obj[0] || !_obj[0].sAMAccountName || err) {
            return;
          }
          // Store the sAMAccountName as the username of the object.  We'll need
          // the short name for basic auth.
          chrome.storage.local.set({
            "username": _obj[0].sAMAccountName,
            "password": request.ssoPassword
          }, user.init.bind(user));
        } catch (Exception) {
          console.error("Storing LDAP Response for principal name puked:", Exception);
          return;
        }
      });
    } else {
      // Store the password locally as a cache
      chrome.storage.local.set({
        "username": request.ssoUsername,
        "password": request.ssoPassword
      }, user.init.bind(user));
    }
  }
});

// And finally, globally init the user so this file is self contained and provides
// user infoz to an extension
var user = new User();
