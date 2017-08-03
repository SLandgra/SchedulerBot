var google = require('googleapis');
var googleAuth = require('google-auth-library');
var OAuth2 = google.auth.OAuth2
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var models = require('../models')
var Task = models.Task;
var User = models.User;
var oauth2Client = new OAuth2(
  process.env.GCLIENT,
  process.env.GSECRET,
  process.env.REDIRECT
)
var meetingtime = 1000*60*30;
var meetingday = new Date('2017-08-04').getTime()
var daystart = meetingday + (1000*60*60*8);
var dayend = meetingday + (1000*60*60*17);
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);


test = async function(){
var slackID = 'U6H47L6LX';
var user = await User.findOne({slackID:slackID});
oauth2Client.setCredentials({
  access_token: user.google.access_token,
  refresh_token: user.google.refresh_token
});
var oneweek = new Date(daystart + (1000*60*60*24*7)).toISOString();
calendar.events.list({
  auth: oauth2Client,
  calendarId: 'primary',
  timeMin: new Date(daystart).toISOString(),
  timeMax: oneweek,
  singleEvents: true,
  timeZone: 'America/Los_Angeles',
  orderBy: 'startTime'
}, function(err, response){
  if(err) {
    console.log(err);
  }
  var events  = response.items;
  var stack = [];
  events.forEach(function(meeting){
    if(meeting.start.dateTime){
      console.log(meeting.start.dateTime)
      stack.push({
        start: new Date(meeting.start.dateTime).getTime(),
        end: new Date(meeting.end.dateTime).getTime()
      })
      }
    })
    console.log('********STACK**********')
    stack.forEach(function(interval){
      console.log('Start', new Date(interval.start).toLocaleDateString('en-US'));
      console.log('End', new Date(interval.end).toLocaleDateString('en-US'));
    })
    var intervals = [stack[0]];
    var currentinterval = 0;
    for(var i = 1; i<stack.length; i++){
      if((intervals[currentinterval].end>stack[i].start)&&(intervals[currentinterval].end<stack[i].end)){
        intervals[currentinterval].end = stack[i].end;
      }else if(intervals[currentinterval].end<stack[i].start){
        intervals.push(stack[i]);
        currentinterval++;
      }
    }
    console.log('************INTERVAL************')
    intervals.forEach(function(interval){
      console.log('Start', new Date(interval.start));
      console.log('End', new Date(interval.end))
    })
    var freetime = [];
    for(var i = 1; i<intervals.length; i++){
      if((intervals[i].start - intervals[i-1].end)>meetingtime){
        var n=0;
        while(intervals[i-1].end+n<intervals[i].start){
          if(freetime.length>9){
            break;
          }else if(intervals[i-1].end+n<dayend && intervals[i-1].end+n>daystart && new Date().getTime()<intervals[i-1].end+ n + 1000*60*5){
            freetime.push(new Date(intervals[i-1].end+n));
          }else if(intervals[i-1].end+n>dayend){
            dayend = dayend + 1000*60*60*24;
            daystart = daystart + 1000*60*60*24;
          }
          n=n+meetingtime;
      }
      }
    }
    console.log(freetime)
  })
}
test();
