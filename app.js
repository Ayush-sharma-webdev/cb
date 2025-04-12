const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const indexRouter = require('./routes/index.router');
const path = require('path');
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join( __dirname , 'public')));

app.use('/' , indexRouter);

const http = require('http');
const server = http.createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);

let waitingusers = [];
let rooms = {};

io.on('connection' , function(socket){
   socket.on('joinroom' , function(){
    try{
        if(waitingusers.length > 0){
            let partner = waitingusers.shift();
            const roomname = `${socket.id}-${partner.id}`;

            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit('joined',roomname);
        }else{
            waitingusers.push(socket);
        };
    }catch(error){
        throw new Error(error);
    };

    socket.on('signalingMessage' , function(data){
        socket.broadcast.to(data.room).emit('signalingMessage', data.message);
    });

    socket.on('message' , function(data){
        socket.broadcast.to(data.room).emit('message',data.message);
    });

    socket.on('startVideoCall' , function({room}){
        socket.broadcast.to(room).emit('incomingCall');
    });

    socket.on('acceptCall' , function({room}){
        socket.broadcast.to(room).emit('callAccepted');
    });

    socket.on('rejectCall', function({room}){
        socket.broadcast.to(room).emit('callRejected');
    });
   });
   socket.on('disconnect' , function(){
    let index = waitingusers.findIndex((waitingUsers)=> waitingUsers.id === socket.id);
    waitingusers.splice(index,1);
    });

})

server.listen( PORT , ()=>{
    console.log(`Server is running on PORT NO : ${PORT}`);
}); 