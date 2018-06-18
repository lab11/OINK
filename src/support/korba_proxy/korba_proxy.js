#!/usr/bin/env node

var bodyParser = require("body-parser");
const crypto = require('crypto');
var express = require('express');
var fs = require('fs');
var https = require('https');
const request = require('request');
const sortObj = require('sort-object');
const sudoBlock = require('sudo-block');
const util = require('util');

//////////////////////////////////////////////////////////////////////////////
// Simple protection -- Never run a proxy as root.

sudoBlock();

//////////////////////////////////////////////////////////////////////////////
// Local configuration
var config = require('./config');

// Strip trailing '/' off path if needed
if (config.certificate_path.slice(-1) == '/') {
  config.certificate_path = config.certificate_path.slice(0,-1);
}

//////////////////////////////////////////////////////////////////////////////
// Set up express app
var app = express();

// This is from the Node.js HTTPS documentation.
var credentials = {
  key: fs.readFileSync(`${config.certificate_path}/privkey.pem`),
  cert: fs.readFileSync(`${config.certificate_path}/fullchain.pem`),
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var httpsServer = https.createServer(credentials, app);
httpsServer.listen(config.port);

app.post('/',function(req,res){
  var body = req.body;
  console.log(body);
  bodySorted = sortObj(body)
  emptyArray = []
  for (var key in bodySorted) {
    if (bodySorted.hasOwnProperty(key)) {
      //console.log(key + "=" + newLocalSorted[key]);
      emptyArray.push(key + "=" + bodySorted[key])
    }
  }
  newArray = emptyArray.join('&');
  console.log(newArray);

  // Getting the HMAC SHA-256 digest
  const secret_key = config.korba.secret_key;
  const client_key = config.korba.client_key;

  const hash = crypto.createHmac('sha256', secret_key)
    .update(newArray) //This is the msg
    .digest('hex');
  request({
    uri: 'https://korbaxchange.herokuapp.com/api/v1.0/topup/',
    method: 'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`HMAC ${client_key}:${hash}`
    },
    json: true,
    body: bodySorted,
    resolveWithFullResponse: true,
  },function(error, response, bodyKorba){
    console.log('error: ', error);
    console.log('statusCode: ', response.statusCode);
    console.log('response: ', response);
    console.log(bodyKorba);
    res.send(bodyKorba)
  });
});
