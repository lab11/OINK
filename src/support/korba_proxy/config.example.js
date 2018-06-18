var config = {};

// This is the path to the HTTPS certificates for this proxy to use.
// We're processing payment infomration with this, so you absolutely must
// configure HTTPS. The folder should include a 'privkey.pem' and
// 'fullchain.pem' that the proxy is able to read.
//
// As these files are likely owned by root (and should stay that way for
// letsencrypt to manage them), you should change their group to a group that
// the proxy is a member of and `chmod g+r` the files to allow the proxy to
// read them.
//
// DO NOT RUN A PROXY AS ROOT!
// Ideally, create a jailed user to run the proxy under.
//
// This will look something like '/etc/letsencrypt/live/YOUR_DOMAIN'
config.certificate_path =

// What port should the proxy listen on?
//
// Probably do not need to change this.
config.port = 3111;

// Korba keys
//
// Get from here:
// https://korbaxchange.herokuapp.com/dashboard/api_credentials/
config.korba = {
  secret_key: ,
  client_key: ,
};

module.exports = config;
