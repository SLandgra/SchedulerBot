var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var models = require('../models')
var Task = models.Task;
var User = models.User
var oauth2Client = new OAuth2(
  process.env.GCLIENT,
  process.env.GSECRET,
  process.env.REDIRECT
)

var addToCalendarTask = async function(slackID){
  var resource = {}
  var user = await User.findOne({slackID:slackID});
  oauth2Client.setCredentials({
    access_token: user.google.access_token,
    refresh_token: user.google.refresh_token
  });
  var tasks = await Task.find({user_id:user._id});
  await tasks.forEach(function(task){
    if(task.pending === true){
        resource = {
          'summary': task.day,
          'start':{
            'date': task.day
          },
          'end':{
            'date': task.day
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
