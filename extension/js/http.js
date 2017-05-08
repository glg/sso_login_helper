/*eslint no-unused-vars: "off"*/
const http = (url, data, callback) => {
  // Create our request
  var _request = new XMLHttpRequest();
  // Open the request with the url
  _request.open(data ? "POST" : "GET", url, true);

  if (data) {
    _request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  }
  _request.onreadystatechange = function onReadyStateChangeHandler() {
    // Skip any requests that that aren't success and ready
    if (_request.readyState !== 4 || _request.status >= 400) {
      return;
    }
    // Callback on Error with no results
    if (_request.readyState === 4 && _request.status >= 400) {
      return callback("Something went wrong:");
    }
    callback(null, _request.responseText);
  };
  // Now initiate the request
  _request.send(data);
};
