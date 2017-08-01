var express = require('express');
var router = express.Router();
var models = require('../models');
var User = models.User;
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
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
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.profile']
  })
  res.render('home',{
    url:url
  });
});

router.get('/auth', function(req,res) {
  console.log('THE CODE IS ACTUALLY HERE',req.query.code);
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
      calendar.events.insert({
        auth: oauth2Client,
        calendarId: 'primary',
        resource: {
          'summary': 'Test case1',
          'location': 'Here!',
          'description':'Google Auth Testing',
          'start': {
            'dateTime': '2018-05-28T09:00:00-07:00',
            'timeZone': 'America/Los_Angeles',
          },
          'end': {
            'dateTime': '2018-05-28T17:00:00-07:00',
            'timeZone': 'America/Los_Angeles',
          },
          'reminders':{
            'useDefault':false,
            'overrides': [{
              'method':'email','minutes': 1},
              {'method':'popup','minutes':2}]
            }
          }

      }, function(err, event){
        if(err){
          console.log(err)
          console.log('Something went wrong')
        }else{
          console.log('success')
        }
      })
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
  console.log(tokes);
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
