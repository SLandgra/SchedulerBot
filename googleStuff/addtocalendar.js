var models = require('../models');
var User = models.User;
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');

var addToCalendar = function(auth,eventInfo,callback){
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: {
      'summary': 'Test case1',
      'location': 'Here!',
      'description':'Google Auth Testing',
      'start':{
        'date':'2017-08-02'
      },
      'end': {
        'date':'2017-08-02'
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
  }
module.exports = addToCalendar;
