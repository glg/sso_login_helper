/*eslint no-unused-vars: "off"*/

const config = {
  remote_login_urls: [
    "*://query.glgroup.com/*",
    "*://vega.glgroup.com/*",
    "*://vega2.glgroup.com/*",
    "*://mosaic.glgroup.com/*",
    "*://ccomplete.glgroup.com/*",
    "*://extccomplete.glgroup.com/*",
    "*://baristagram.glgroup.com/*",
    "*://*.glgresearch.com/*"
  ],

  // The logout URL of the SSO portal
  sso_logout_url: "https://glg.okta.com/login/signout",
  epildap: "https://services.glgresearch.com/epildap",

  jwtCookieName: "jwt",
  jwtAuthUrl: "/auth",
  jwtGetTokenUrl: "http://services.glgresearch.com/jwt-generator/generate",

  // To support Okta we need a place publically to lookup user data for people
  // who login with their 'email' address.  The folks who setup okta
  // did NOT set it up to use the userPrincipalName.  The users are truly
  // logging in with their email address.
  epildapUsernameLookup: "https://services.glgresearch.com/epildap-public",

  // We will set a cookie for all these Domains
  // with some brief user information
  glgDomains: [
    ".glgroup.com",
    "services.glgresearch.com",
    "index.glgresearch.com",
    "jobs.glgresearch.com"
  ],
  // URLS we completely ignore
  ssoExclusionUrls: [
    "services.glgresearch.com/logout",
    "services.glgresearch.com/taxonomy",
    "west.glgresearch.com/pi",
    "east.glgresearch.com/pi",
    "europe.glgresearch.com/pi",
    "asia.glgresearch.com/pi",
    "services.glgresearch.com/pi"
  ]
};
