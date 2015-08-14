var config = {};

// URLS (wildcards supported) of URLS we want to inject basic auth headers in
config.remote_login_urls = [
  "*://query.glgroup.com/*",
  "*://mosaic.glgroup.com/*",
  "*://ccomplete.glgroup.com/*",
  "*://extccomplete.glgroup.com/*",
  "*://baristagram.glgroup.com/*",
  "*://*.glgresearch.com/*"
];

// The logout URL of the SSO portal
config.sso_logout_url = "https://glg.okta.com/login/signout";

// We grab user meta data from this endpoint
config.epildap = "https://services.glgresearch.com/epildap";

// To support Okta we need a place publically to lookup user data for people
// who login with their 'email' address.  The folks who setup okta
// did NOT set it up to use the userPrincipalName.  The users are truly
// logging in with their email address.
config.epildapUsernameLookup = "https://services.glgresearch.com/epildap-public";

// We will set a cookie for all these Domains
// with some brief user information
config.glgDomains = [
  ".glgroup.com",
  ".glgresearch.com"
];

// URLS we completely ignore
config.ssoExclusionUrls = [
  "services.glgresearch.com/taxonomy",
  "west.glgresearch.com/pi",
  "east.glgresearch.com/pi",
  "europe.glgresearch.com/pi",
  "asia.glgresearch.com/pi",
  "services.glgresearch.com/pi"
];
