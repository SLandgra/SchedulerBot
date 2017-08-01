var axios = require('axios');

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var token = process.env.SLACK_BOT_TOKEN || '';
var apiToken = process.env.API_ACCESS_TOKEN;

var mongoose = require('mongoose')
var models = require('./models');
var User = models.User;

var rtm = new RtmClient(token);

var url = require('./googleStuff/authUrl');
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

  var authenticated = true;
  if (!authenticated) {
        // make user model
  } else {
    axios({
      method: 'post',
      url: 'https://api.api.ai/v1/query?v=20150910',
      headers: {
        'Authorization': 'Bearer ' + apiToken,
        'Content-Type': 'application/json; charset=utf-8',
      },
      data: {
        query: message.text,
        lang: "en",
        sessionId: message.user
      }
    }).then((resp) => {
      console.log('AI RESPONSE DATA RESULT ****************************************');
      console.log(resp.data.result);
      var aiResponse = resp.data.result.fulfillment.speech;
      if (resp.data.result.action === 'input.reminder.add' && resp.data.result.actionIncomplete === false){
        var interactive = {
          "attachments": [
            {
              "text": `${aiResponse} <@${message.user}>!`,
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

        web.chat.postMessage(message.channel, 'Do you want to confirm your reminder?', interactive, function(err, res) {
          if (err) {
            console.log('POSTING Error:', err);
          } else {
            console.log('interactive sent');
          }
        });

      } else {
        rtm.sendMessage(`${aiResponse} <@${message.user}>!`, message.channel);
      }
    }).catch(error => {
      console.log('axios error');
    });
  }
});

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