var models = require('../models')
var Task = models.Task;
var User = models.User;


var reminder = async function (slackID, callback){
  var tasks = await Task.find({user_id: slackID});
  tasks.forEach(function(task){
    if(task.pending === false){
      var range = (Date.parse(task.day) - new Date().getTime())
      if(range<=0){

      }else{
        var interval = setInterval(messagesender, 1000*30);
        // var interval = setInterval(messagesender, 1000*60*30);
        function messagesender(){
            if((range+36000000 <=0-1000*60*30)&&(range+36000000 >=0+1000*60*30)){
              callback(task.subject, 'today');
              clearInterval(interval);
            }else{
            // }else if((range<=1000*60*60*34 - 1000*60*30)&&(range>=1000*60*60*34 + 1000*60*30)){
              callback(task.subject, 'tomorrow');
          }
        }
      }
      Task.findOneAndRemove({user_id: task.user_id});
    }
  })
}

module.exports = reminder
