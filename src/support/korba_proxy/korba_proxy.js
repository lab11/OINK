#!/usr/bin/env node

var bodyParser = require("body-parser");
const crypto = require('crypto');
var express = require('express');
var fs = require('fs');
var http = require('http');
const request = require('request');
const sortObj = require('sort-object');
const sudoBlock = require('sudo-block');
const util = require('util');

//////////////////////////////////////////////////////////////////////////////
// Simple protection -- Never run a proxy as root.

sudoBlock();

//////////////////////////////////////////////////////////////////////////////
// Local configuration
var command = require('commander');
command.option('-k, --korba [korba]', 'Korba configuration file.').parse(process.argv);

if(typeof command.korba !== 'undefined') {
    config = require(command.korba);
} else {
    config = require('./config');
}

//////////////////////////////////////////////////////////////////////////////
// Set up express app
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//


console.log('Starting http server on port 3111...');
var httpServer = http.createServer(app);
httpServer.listen(3111);

app.get('/', function(req,res) {
  res.send('OK');
});

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
    uri: 'https://xchange.korbaweb.com/api/v1.0/topup/',
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
