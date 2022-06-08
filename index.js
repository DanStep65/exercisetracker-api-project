const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const URI = process.env['MONGO_URI'];
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: "false"}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const{Schema} = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  }
});
const exerciseSchema = new Schema({
  user_id:{
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date
  }
});


let User = mongoose.model('user', userSchema);
let Exercise = mongoose.model('exercise', exerciseSchema);



app.post('/api/users/:_id/exercises/', async (req, res) =>{
  const body = req.body;
  if(!Boolean(body[':_id'])){
    body[':_id'] = req.params['_id'];
  }
  let date;
  if(!Boolean(body['date'])){
    date = new Date().toDateString();
  }
  else{
    date = new Date(body['date']).toDateString();
  }
  const first_data = {
    user_id: body[':_id'],
    username: "",
    date: date,
    duration: body['duration'],
    description: body['description']
  };
  User.find({_id: body[':_id']}).select('_id, username')
    .lean()
    .exec(
      (err, data) =>{
        if(err){
          return res.send(err);
        } else{
       first_data['user_id'] = (data[0]._id + "");
      first_data['username'] = (data[0].username);
        const new_exercise = new Exercise(first_data);
        new_exercise.save(function(err, data){
          if(err){
            if(err.name === 'ValidationError'){
              return res.send(err['message']);
            }
            return res.send(err);
          }
          res.json({
            _id: data['user_id'],
            username: data['username'],
            date: data['date'].toDateString(),
            duration: data['duration'],
            description: data['description']});
        })}        
        }
      );
  
//  console.log(user_data);
//{"_id":"612515baf5860e05a365311d","username":"new","date":"Tue Jun 07 2022","duration":10,"description":"walk"}
});

app.route('/api/users/')
  .post((req, res) => {
    //OPTIONAL: when name exists in db, return the username and the db.
  const user = new User({
    username: req.body.username});
  user.save(function(err, data){
    if(err){
      return console.log(err);
    }
    return res.json({_id: data._id, username: data.username});
  });
})
  .get((req, res) =>{
    User.find().select('-__v').exec((err, data) =>{
      if(err){
        return console.log(err);
      }
      return res.json(data);
    });
  });
function logging(obj){
  return {description: obj.description, duration: obj.duration, date: obj.date.toDateString()};
}
app.get('/api/users/:_id/logs/', (req, res) =>{
  Exercise.find({user_id: req.params._id}).exec((err, data) =>{
    if(err){
      return res.send(err.message);
    }
    return res.json(
      { username: data[0]['username'],
        count: data.length,
        _id: data[0]['user_id'],
        log: data.map(logging)
      });
  });
  //
  /*
{
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}*/
});

app.get('/api/delete/', (req, res) => {
  User.deleteMany({username: /fcc/}, (err, result) =>{
    if(err) return console.log(err);
    return res.send("Success!");
  })
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
