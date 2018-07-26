const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 8000;

const app = express();
const chatHistory = [];
const users = {};

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
    
    socket.on('join', function(data){
        users[socket.id] = data;
        io.emit('join_announcement', data);
    });

    socket.on('disconnect', function(reason){
        const user = users[socket.id];
        io.emit('left_announcement', user);
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