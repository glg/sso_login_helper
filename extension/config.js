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
config.sso_logout_url = "https://my.glgroup.com/LogoutServlet";

// URLS we completely ignore
config.ssoExclusionUrls = [
  "services.glgresearch.com/taxonomy",
  "west.glgresearch.com/pi",
  "east.glgresearch.com/pi",
  "europe.glgresearch.com/pi",
  "asia.glgresearch.com/pi",
  "services.glgresearch.com/pi"
];
