"use strict";

/********************************************************************
 * Libraries
 ********************************************************************/

/** Hookup Express */
const express = require('express');
const app = express();

// Add paths for the docs to be served via HTML
app.use('/', express.static(`${__dirname}/public`));
app.get('/diagnostic', (req, res) => res.status(200).end('ok'));

/********************************************************************
 * Start the Express Server
 ********************************************************************/

/*eslint no-process-env: "off"*/
const _port = process.env.PORT || 3000;
const _appName = process.env.ORDERS_NAME;
app.listen(_port, () =>
  console.log(`${_appName}} listening on ${_port}`));
