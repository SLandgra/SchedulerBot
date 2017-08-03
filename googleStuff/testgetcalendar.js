var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var models = require('../models')
var Task = models.Task;
var User = models.User;
var oauth2Client = new OAuth2(
  process.env.GCLIENT,
  process.env.GSECRET,
  process.env.REDIRECT
)
var slackID = 'U6H47L6LX';
var user = await User.findOne({slackID:slackID});
oauth2Client.setCredentials({
  access_token: user.google.access_token,
  refresh_token: user.google.refresh_token
});
