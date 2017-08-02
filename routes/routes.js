var express = require('express');
var router = express.Router();
var models = require('../models');
var User = models.User;
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var rtm = require('../bot');
var addToCalendarTask = require('../googleStuff/addToCalendartask');
var reminder = require('../googleStuff/reminders');
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
  res.render('home');
});
router.get('/connect', function(req,res){
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.profile'],
    state: req.query.auth_id
  });
  res.redirect(url);
});

router.get('/auth', function(req,res) {
  console.log("req.query***********", req.query);
  var user_id = req.query.state;
  var code = req.query.code;
  var tokes;
  oauth2Client.getToken(code, function (err, tokens){
    if(!err){
      oauth2Client.setCredentials(tokens);
      tokes = tokens;
      oauth2Client.setCredentials({
        access_token: tokes.access_token,
        refresh_token: tokes.refresh_token
      });
  //     var testobj= { source: 'agent',
  // resolvedQuery: 'remind me to buy tacos at The Market on 2017-08-01',
  // action: 'input.reminder.add',
  // actionIncomplete: false,
  // parameters:
  //  { date: [ '2017-08-01' ],
  //    subject: [ 'buy tacos at The Market' ] },
  // contexts: [],
  // metadata:
  //  { intentId: '6c0d78b9-5ec0-48eb-9ab5-baf31b2aa0ad',
  //    webhookUsed: 'false',
  //    webhookForSlotFillingUsed: 'false',
  //    intentName: 'reminder.add' },
  // fulfillment:
  //  { speech: 'You need me to schedule a reminder on 2017-08-01 to buy tacos at The Market.',
  //    messages: [ [Object] ] },
  // score: 1 }
  //     addToCalendar(oauth2Client, testobj,'nothing')
  User.findByIdAndUpdate(user_id,{google: tokes}, function(err){
    if(err){
      console.log(err)
    }else{
      console.log('updated user')
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
  console.log('REQUEST PAYLOAD FROM SLACK INTERACTIVE*****************');
  console.log(JSON.parse(req.body.payload));
  console.log('USER NAME & ID FROM SLACK INTERACTIVE******************');
  console.log(JSON.parse(req.body.payload).user);
  var slackId = JSON.parse(req.body.payload).user.id;

  var doConfirm = JSON.parse(req.body.payload).actions[0].name === 'confirm';
  if (doConfirm) {
    addToCalendarTask(slackId);
    function reminderMessage(task, when){
      rtm.sendMessage('Rember to '+ task +' '+ when + '!', JSON.parse(req.body.payload).channel.id);
    }
    reminder(slackId, reminderMessage);

    rtm.sendMessage('OK! Got it, I will!', JSON.parse(req.body.payload).channel.id);
  } else {
    // delete the pending data from database.
    console.log(doConfirm);
    rtm.sendMessage('Oh no...', JSON.parse(req.body.payload).channel.id);
  }
  res.end();
});


module.exports = router;
