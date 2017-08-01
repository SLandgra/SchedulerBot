var express = require('express');
var router = express.Router();
var models = require('../models');
var User = models.User;
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var addToCalendar = require('../googleStuff/addToCalendar');
var url = require('../googleStuff/authUrl')
var oauth2Client = new OAuth2(
  process.env.GCLIENT,
  process.env.GSECRET,
  process.env.REDIRECT
)
google.options({
  auth: oauth2Client
})
//////////////////////////////// PUBLIC ROUTES ////////////////////////////////
// Users who are not logged in can see these routes

router.get('/', function(req, res, next) {
  res.render('home',{
    url:url
  });
});

router.get('/auth', function(req,res) {
  var code = req.query.code;
  var tokes;
  oauth2Client.getToken(code, function (err, tokens){
    if(!err){
      oauth2Client.setCredentials(tokens);
      tokes = tokens;
        oauth2Client.setCredentials({
          access_token: tokes.access_token,
          refresh_token: tokes.refresh_token
        })
        addToCalendar(oauth2Client,'nothing','nothing')
      new User({
        google: tokes
      }).save(function(err){
        if (err) {
          console.log('Google Auth Failed to Save')
        }else{
          console.log('Google Auth Saved')
        }
      })
    }else{
      console.log(err)
    }
  })
  // if(tokes - (new Date()).getTime()<=0){
  //   oauth2Client.setCredentials({
  //     access_token: tokes.access_token,
  //     refresh_token: tokes.refresh_token
  //   })
  //   oauth2Client.refreshAccessToken(function(err, tokens){})
  // }

  res.redirect('/')
})


module.exports = router;
