var config = {};

// TODO: Probably nuking this functionality in a future release
// config.glg_domains = [
//   "glgresearch.com",
//   "glg.it"
// ];

// URLS (wildcards supported) of URLS we want to inject basic auth headers in
config.remote_login_urls = [
  "*://query.glgroup.com/*",
  "*://*.glgresearch.com/*"
];

// The logout URL of the SSO portal
config.sso_logout_url = "https://my.glgroup.com/LogoutServlet";
