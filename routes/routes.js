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
      var testobj= { source: 'agent',
  resolvedQuery: 'remind me to buy tacos at The Market on 2017-08-01',
  action: 'input.reminder.add',
  actionIncomplete: false,
  parameters:
   { date: [ '2017-08-01' ],
     subject: [ 'buy tacos at The Market' ] },
  contexts: [],
  metadata:
   { intentId: '6c0d78b9-5ec0-48eb-9ab5-baf31b2aa0ad',
     webhookUsed: 'false',
     webhookForSlotFillingUsed: 'false',
     intentName: 'reminder.add' },
  fulfillment:
   { speech: 'You need me to schedule a reminder on 2017-08-01 to buy tacos at The Market.',
     messages: [ [Object] ] },
  score: 1 }
      addToCalendar(oauth2Client, testobj,'nothing')
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
router.post('/interactive', function(req, res){
  console.log('REQ.BODY*****************');
  console.log('ORIGINAL MESSAGE*****************');
  console.log(JSON.parse(req.body.payload).original_message);
  var doConfirm = JSON.parse(req.body.payload).actions[0].name === 'confirm';
  if (doConfirm) {
    console.log(doConfirm);

  } else {
    console.log(doConfirm);
  }
});


module.exports = router;
