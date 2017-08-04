var axios = require('axios');

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var token = process.env.SLACK_BOT_TOKEN || '';
var apiToken = process.env.API_ACCESS_TOKEN;

var checktoken = require('./googleStuff/checktoken')
var mongoose = require('mongoose')
var models = require('./models');
var User = models.User;
var Task = models.Task;
var Meeting = models.Meeting;

var rtm = new RtmClient(token);

// WEB API
var WebClient = require('@slack/client').WebClient;
var web = new WebClient(token);

let channel;

rtm.on(RTM_EVENTS.MESSAGE, async function(message) {
  var user = await User.findOne({slackID: message.user})
    if(!user){
      var newuser = new User({
        slackID: message.user,
        google: {}
      })
      user = await newuser.save()
    }
  var authenticated = user.google;


  if (!authenticated && message.subtype !== 'bot_message') {
    var url = 'https://c1b08373.ngrok.io/connect?auth_id='+user._id;
    rtm.sendMessage(`<@${message.user}>! Please click on the link to authenticate! ${url}`, message.channel);
  } else {
    await checktoken(user);
    var pendingTask = await Task.find({user_id: message.user, pending: true});
    var pendingMeeting = await Meeting.find({ownerID: message.user, pending: true});

    if (pendingTask.length || pendingMeeting.length) {
      rtm.sendMessage(`<@${message.user}>! Please confirm your previous pending task by clicking the button!`, message.channel);
    } else {
      // geting users information

      var msgToAI = message.text;
      var userNameInfoObj = {};
      if(message.text.indexOf('<@')!== -1){
        var text = message.text;
        // var converted_id = text.split('@')[1].split('>')[0];
        var textArr = text.split('<');
        var newArr = []
        textArr.forEach(function(text){
          if(text.indexOf('@')===0){
            var converted_id = text.split('@')[1].split('>')[0];
            var SlackUser = rtm.dataStore.getUserById(converted_id);
            var realName = SlackUser.real_name.split(' ')[0];
            var converted_text = realName + text.split('>')[1];
            newArr.push(converted_text);
            userNameInfoObj[converted_id] = realName;
          } else {
            newArr.push(text);
          }
        });
        msgToAI = newArr.join('');
      }

      axios({
        method: 'post',
        url: 'https://api.api.ai/v1/query?v=20150910',
        headers: {
          'Authorization': 'Bearer ' + apiToken,
          'Content-Type': 'application/json; charset=utf-8',
        },
        data: {
          query: msgToAI,
          lang: "en",
          sessionId: message.user
        }
      }).then((resp) => {
        console.log('AI RESPONSE DATA RESULT ****************************************');
        console.log(resp.data.result);
        var aiResponse = resp.data.result.fulfillment.speech;
        if (resp.data.result.action === 'input.reminder.add' && resp.data.result.actionIncomplete === false){
          new Task({
            subject: resp.data.result.parameters.subject[0],
            day: resp.data.result.parameters.date[0],
            user_id: message.user,
            pending: true
          }).save(function(err) {
            if (err) {
              console.log('saving err!');
            } else {
              var interactive = generateInteractive(aiResponse, message.user);
              web.chat.postMessage(message.channel, 'Do you want to confirm your reminder?', interactive, function(err, res) {
                if (err) {
                  console.log('POSTING Error:', err);
                } else {
                  console.log('interactive sent');
                }
              });
            }
          })
        } else if (resp.data.result.action === 'input.meeting.add' && resp.data.result.actionIncomplete === false) {
          var invitees = resp.data.result.parameters['given-name'].map(realName => {
            for (key in userNameInfoObj) {
              if (userNameInfoObj[key].indexOf(realName) > -1) {
                return key;
              }
            }
          });
          var meeting_length = '00:30:00';

          var msg_subject = 'Meeting with ';
          for (key in userNameInfoObj){
            msg_subject = msg_subject + userNameInfoObj[key] + " / "
          }
          var creator = rtm.dataStore.getUserById(message.user).real_name.split(' ')[0];
          msg_subject = msg_subject + creator


          //check conflict
          // if(conflict){
          //   var meetingtime = generateMenu(aiResponse, message.user);
          //   web.chat.postMessage(message.channel, 'Please choose an available time slot', meetingtime, function(err, res) {
          //     if (err) {
          //       console.log('POSTING Error:', err);
          //     } else {
          //       console.log('interactive sent');
          //     }
          //   });
          // }

          new Meeting({
            day: resp.data.result.parameters.date,
            time: resp.data.result.parameters.time,
            invitees: invitees,
            subject: resp.data.result.parameters.subject || msg_subject,
            location: resp.data.result.parameters.location,
            meeting_length: meeting_length,
            pending: true,
            ownerID: message.user
          }).save(function(err) {
            if (err) {
              console.log('saving err!');
            } else {
              var interactive = generateInteractive(aiResponse, message.user);
              web.chat.postMessage(message.channel, 'Do you want to confirm your meeting?', interactive, function(err, res) {
                if (err) {
                  console.log('POSTING Error:', err);
                } else {
                  console.log('interactive sent');
                }
              });
            }
          })
        } else {
          rtm.sendMessage(`${aiResponse} <@${message.user}>!`, message.channel);
        }
      }).catch(error => {
        console.log('axios error');
      }); //End of axios request to api.ai
    }
  }
});

function generateInteractive(message, username) {
  return {
    "attachments": [
      {
        "text": `${message} <@${username}>!`,
        "fallback": "You are unable to respond to the request",
        "callback_id": "confirmation",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "actions": [
          {
              "name": "confirm",
              "text": "Confirm",
              "type": "button",
              "value": "confirm"
          },
          {
              "name": "cancel",
              "text": "Cancel",
              "type": "button",
              "value": "cancel"
          },
        ]
      }
    ]
  }
}


// hard coded options
function generateMenu(message, username) {
  return {
    "attachments": [
        {
            "text": `${message} <@${username}>!`,
            "fallback": "If you could read this message, you'd be choosing something fun to do right now.",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "callback_id": "free_time_selection",
            "actions": [
                {
                    "name": "available time",
                    "text": "Choose available time",
                    "type": "select",
                    "options": [
                        {
                            "text": "Hearts",
                            "value": "hearts"
                        },
                        {
                            "text": "Bridge",
                            "value": "bridge"
                        },
                        {
                            "text": "Checkers",
                            "value": "checkers"
                        },
                        {
                            "text": "Chess",
                            "value": "chess"
                        },
                        {
                            "text": "Poker",
                            "value": "poker"
                        },
                        {
                            "text": "Falken's Maze",
                            "value": "maze"
                        },
                        {
                            "text": "Global Thermonuclear War",
                            "value": "war"
                        }
                    ]
                }
            ]
        }
    ]

  }
}

// Wait for the client to connect
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function() {
  // Get the user's name
  var user = rtm.dataStore.getUserById(rtm.activeUserId);

  // Get the team's name
  var team = rtm.dataStore.getTeamById(rtm.activeTeamId);

  // Log the slack team name and the bot's name
  console.log('Connected to ' + team.name + ' as ' + user.name);
});

module.exports = rtm;
