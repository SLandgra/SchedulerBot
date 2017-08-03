var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var models = require('../models');
var checktoken = require('./checktoken');
var Meeting = models.Task;
var User = models.User;
var Invite = models.Invite;
var oauth2Client = new OAuth2(
  process.env.GCLIENT,
  process.env.GSECRET,
  process.env.REDIRECT
)

var addToCalendarMeeting = async function(slackID){
  var resource = {}
  var user = await User.findOne({slackID:slackID});
  oauth2Client.setCredentials({
    access_token: user.google.access_token,
    refresh_token: user.google.refresh_token
  });
  var meetings = await Meeting.find({creator:slackID});
  var nonpendingmeeting;
  await meetings.forEach(function(meeting){
    if(meeting.pending === true){
        resource = {
          'summary': meeting.day,
          'location':meeting.location|| '',
          'start':{
            'dateTime': meeting.time,
            'America/Los_Angeles'
          },
          'end':{
            'dateTime': meeting.time+meeting.meeting_length,
            'America/Los_Angeles'
          },
        }
        meeting.pending === false;
        meeting.save();
        nonpendingmeeting = meeting;
      }
    })
  await calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    resource: resource
  }, function(err, event){
    if(err){
      console.log(err)
      console.log('Something went wrong')
    }else{
      console.log(event,'SAVED EVENT DATA')
    }
  })
  nonpendingmeeting.invitees.forEach(async function(invitee){
    var attender = await User.findOne({slackID: invitee});
    await oauth2Client.setCredentials({
      access_token: attender.google.access_token,
      refresh_token: attender.google.refresh_token
    });
    await checktoken(attender);
    await calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      resource: resource
    }, function(err, event){
      if(err){
        console.log(err)
        console.log('Something went wrong')
      }else{
        console.log(event,'SAVED EVENT DATA')
      }
    })

  })
  }
module.exports = addToCalendarMeeting;
