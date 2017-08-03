var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var models = require('../models')
var Task = models.Task;
var User = models.User
var oauth2Client = new OAuth2(
  process.env.GCLIENT,
  process.env.GSECRET,
  process.env.REDIRECT
)

var addToCalendarTask = async function(slackID, callback){
  var resource = {}
  var user = await User.findOne({slackID:slackID});
  oauth2Client.setCredentials({
    access_token: user.google.access_token,
    refresh_token: user.google.refresh_token
  });
  var tasks = await Task.find({user_id:slackID});
  await tasks.forEach(async function(task){
    if(task.pending === true){
        resource = {
          'summary': task.subject,
          'start':{
            'date': task.day
          },
          'end':{
            'date': task.day
          },
        }

        task.pending = false;
        await task.save();
        var range = (Date.parse(task.day) - new Date().getTime());
        if(range<=0){

        }else{
          var interval = setInterval(messagesender, 1000*60*30);
          // var interval = setInterval(messagesender, 1000*60*30);
          function messagesender(){
              if((range+36000000 <=0-1000*60*30)&&(range+36000000 >=0+1000*60*30)){
                callback(task.subject, 'today');
                clearInterval(interval);
                task.remove();
              }else if((range<=1000*60*60*34 - 1000*60*30)&&(range>=1000*60*60*34 + 1000*60*30)){
                callback(task.subject, 'tomorrow');
            }else if(range<0){
              clearInterval(interval);
            }
          }
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
module.exports = addToCalendarTask;
