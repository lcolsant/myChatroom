const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 8000;

const app = express();
const chatHistory = [];
const users = {};
const availUsers = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname + '/static')));
app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'ejs');

const server = app.listen(port,function(){
    console.log(`listening on port ${port}`);
});

const io = require('socket.io')(server);

io.sockets.on('connection', function(socket){
    socket.emit('greeting', {msg:'new socket connection made.'});
    socket.emit('updateChatHistory', chatHistory);
    socket.on('connected', function(data){
        console.log(data.msg);
    });
    
    //handles all actions when a new chatroom user joins
    socket.on('join', function(data){
        users[socket.id] = data;
        socket.emit('updateUsers', availUsers)
        newUser = {
            name: data,
        }

        availUsers.push(newUser);
        console.log(newUser);
        io.emit('join_announcement', data);
        io.emit('updateUser', newUser.name);
    });

    //handles all actions when a chatroom user leaves
    socket.on('disconnect', function(reason){
        const user = users[socket.id];
        io.emit('left_announcement', user);

        //finds the index of the user that left in the array of all users
        let index = availUsers.map(function(user){return user.name;}).indexOf(users[socket.id]);
        //removes the leaver from the array
        availUsers.splice(index,1);
        //sends updated array to refresh user list for all remaining chatroom users
        io.emit('refreshUsers',availUsers);
    });

    socket.on('incoming_msg',function(data){
        console.log('new message: ', data.msg.message);
        console.log('username: ', data.msg.name);
        
        const message = {
            message: data.msg.message,
            name: data.msg.name,
        }
       
        io.emit('new_msg',{msg:message});
       
        chatHistory.push(message);
        
    });
});

app.get("/", function (request, response){
    response.render('index');
});