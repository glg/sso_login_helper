/*global user, ga, chrome*/
/*eslint no-unused-vars: "off"*/
// Standard Google Universal Analytics code
(function(i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  i[r] = i[r] || function() {
    (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date();
  a = s.createElement(o),
    m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m);
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga'); // Note: https protocol here

/** Grab the user info from the SSO Plugin cache */
const getUserInfo = () => new Promise((resolve, reject) => {
  const domain = ".glgresearch.com";
  const name = "glguserinfo";
  chrome.cookies.getAll({ domain, name }, cookies => {
    try {
      const _user = JSON.parse(atob(cookies[0].value));
      resolve(_user);
    } catch (e) {
      reject();
    }
  });
});

ga('create', 'UA-61162931-3', 'auto');
ga('set', 'checkProtocolTask', () => {
  // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
});
ga('require', 'displayfeatures');

const doSendGoogleAnalyticsEvent = (category, event, page) => getUserInfo()
  .then(user => user && user.username || "UnknownUser")
  .then(username => ga('send', 'event', category, event, username, { page }));
