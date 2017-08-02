var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var models = require('../models')
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
  var invite = await Invite.find({user_id: user._id})
  var meetings = await Meeting.find({invite.meeting_id})
  await meetings.forEach(function(meeting){
    if(meetings.pending === true){
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
      }
    })

  calendar.events.insert({
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
  }
module.exports = addToCalendarMeeting;
