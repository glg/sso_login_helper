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


ga('create', 'UA-61162931-3', 'auto');
ga('set', 'checkProtocolTask', function() {}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('require', 'displayfeatures');

var doSendGoogleAnalyticsEvent = function doSendGoogleAnalyticsEvent(category, event, page) {
  if (!page) {
    page = "";
  }
  var analyticsUsername = user.username;
  if (user.username === "") {
    analyticsUsername = "anonymous";
  }
  ga('send', 'event', category, event, user.username, {
    'nonInteraction': 1,
    'page': page
  });
};

var doSendGoogleAnalyticsPageView = function doSendGoogleAnalyticsPageView(event) {
  ga('send', 'pageview', {
    "page": event,
    "title": user.username
  });
};