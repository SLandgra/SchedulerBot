var mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
  subject: String,
  day: String,
  event_id: String,
  user_id: String,
  pending: Boolean
});

var meetingSchema = mongoose.Schema({
  day: String,
  time: String,
  invitees: Array,
  subject: String,
  location: String,
  meeting_length: String,
});

var userSchema = mongoose.Schema({
  google: Object,
  slackID: String
});

var inviteSchema = mongoose.Schema({
  subject: String,
  day: String,
  event_id: String,
  user_id: String
});


Task = mongoose.model('Task', taskSchema);
Meeting = mongoose.model('Meeting', meetingSchema);
User = mongoose.model('User', userSchema);
Invite = mongoose.model('Invite', inviteSchema);



module.exports = {
    Task:Task,
    Meeting:Meeting,
    User:User,
    Invite:Invite
};
