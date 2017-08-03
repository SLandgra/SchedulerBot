var google = require('googleapis');
var googleAuth = require('google-auth-library');
var models = require('../models');
var OAuth2 = google.auth.OAuth2;
var User = models.User;
var oauth2Client = new OAuth2(
  process.env.GCLIENT,
  process.env.GSECRET,
  process.env.REDIRECT
)

var checker = function(user){
  if((user.google.expiry_date-(new Date().getTime()))<=0){
    oauth2Client.setCredentials({
      access_token: user.google.access_token,
      refresh_token: user.google.refresh_token
    })
    oauth2Client.refreshAccessToken(function(err, tokens){
      user.google.access_token = oauth2Client.access_token;
      user.save();
    })
  }
}

module.exports = checker;
