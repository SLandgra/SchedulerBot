var models = require('../models');
var User = models.User;
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');

var addToCalendar = function(auth,eventInfo,callback){
  var resource = {}
  if(eventInfo.action === 'input.reminder.add'){
    resource = {
      'summary': eventInfo.parameters.subject[0],
      'start':{
        'date':eventInfo.parameters.date[0]
      },
      'end':{
        'date':eventInfo.parameters.date[0]
      },
    }
  }else{
    resource ={
      'summary': 'Test case1',
      'start':{
        'date':'2017-08-02'
      },
      'end': {
        'date':'2017-08-02'
      }
    }
  }
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: resource

  }, function(err, event){
    if(err){
      console.log(err)
      console.log('Something went wrong')
    }else{
      console.log('success')
    }
  })
  }
module.exports = addToCalendar;
