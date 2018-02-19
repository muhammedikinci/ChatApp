const express = require('express');
const path = require('path');
const http = require('http');
const request = require('request');
const socketIO = require('socket.io');
const app = express();
const ChatApp = require('./ChatCore.js');
const port = process.env.PORT || 8080;
app.use(express.static(path.join(__dirname,'dist')));
app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname, 'dist/client.html'));
});
//Headers
var generalHeaders = {
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin':'*',
    'Accept':'text/plain',
    'Content-Type':'text/plain'
};
const server = http.createServer(app); 
const io = socketIO(server);
io.on('connection',(socket) => {
    // Login Request
    socket.on('login', ({username:username,password:password}) => {
        console.log("connection found");
        
        let CurrentClient;
        ChatApp.getClientByNameToClient(username,(c) => {
            CurrentClient = c;
        });
        ChatApp.hasClient(socket,(res) => {
            if(!res){
                var post_options = {
                    url:'http://localhost/chat/login',
                    method:'POST',
                    headers:generalHeaders,
                    form: {'username':username,'password':password}
                };
                request(post_options,function(error,response,body) {
                    if(!error && response.statusCode == 200){
                        try{
                            console.log(body);
                            var data = JSON.parse(body);
                            if(data.status == "ok"){
                                console.log("giriş başarılı");
                                ChatApp.addClient(username,socket,(res)=>{
                                    console.log(res);
                                });
                                socket.emit("loginStatus",true);
                            }
                        }
                        catch(Err){ console.log(Err); }
                    }
                    else{
                        console.log(error);
                    }
                });
            }
            else{
                console.log("already user exists");
            }
        });
    });
    // Get All Users to Connected
    socket.on('getAllUsers', ({username:username}) => {
        ChatApp.hasClient(socket, (res) => {
            if(res){
                var post_options = {
                    url:'http://localhost/chat/chat',
                    method:'POST',
                    headers:generalHeaders,
                    form: {'PROCESS_SELECTOR':'getAllUsers','username':username}
                };
                request(post_options,function(error,response,body) {
                    if(!error && response.statusCode == 200){
                        try{
                            console.log("Api den gelen cevap : " + body);
                            var data = JSON.parse(body);
                            if(data.status == "ok"){
                                var Array_List = JSON.parse(data.value);
                                console.log("Parse Edilmiş Değer : " + Array_List);
                                ChatApp.getClientByName(username,(id) => {
                                    console.log(id);
                                    socket.emit("get",Array_List);
                                });
                            }
                        }
                        catch(Err){
                            console.log(Err);
                        }
                    }
                    else{
                        console.log(error);
                    }
                });
            }
        });

    });
    // Get Messages
    socket.on('openChatAndGetMessages', ({currentUser:CurrentUserName,targetUser:TargetUserName}) => {
        ChatApp.hasClient(socket, (res) => {
            if(res){
                var post_options = {
                    url:'http://localhost/chat/chat',
                    method:'POST',
                    headers:generalHeaders,
                    form: {'PROCESS_SELECTOR':'GetCurrentUserMessagesDatas',
                    'targetusername':TargetUserName,
                    'currentusername':CurrentUserName}
                };
                request(post_options,function(error,response,body) {
                    try{
                        if(!error && response.statusCode == 200){
                            console.log("App den gelen username : " + CurrentUserName);
                            console.log("App den gelen username : " + TargetUserName);
                            console.log("Api den gelen cevap : " + body);
                            var data = JSON.parse(body);
                            if(data.status == "ok"){
                                var Array_List = JSON.parse(data.value);
                                console.log("Parse Edilmiş Değer : " + Array_List);
                                ChatApp.getClientByName(CurrentUserName,(id) => {
                                    console.log(id);
                                    socket.emit("getOpenedChatMessages",Array_List);
                                });
                            }
                        } 
                        else{
                            console.log(error);
                        }
                    }
                    catch(err){
                        console.log("function name : openchatandgetmessages");
                        console.log(err);
                    }
                });
            }
        });

    });
    // Get Messages
    socket.on('sendMessage', ({currentUser:CurrentUserName,targetUser:TargetUserName,message:CurrentMessage}) => {
        ChatApp.hasClient(socket, (res) => {
            if(res){
                var post_options = {
                    url:'http://localhost/chat/chat',
                    method:'POST',
                    headers:generalHeaders,
                    form: {'PROCESS_SELECTOR':'sendMessage',
                    'rec_user_id':TargetUserName,
                    'sender_user_id':CurrentUserName,
                    'currentMessage':CurrentMessage}
                };
                request(post_options,function(error,response,body) {
                    try{
                        if(!error && response.statusCode == 200){
                            console.log(body);
                            var data = JSON.parse(body);
                            socket.emit("sendMessageResponser",data);
                            let TargetClientID = 0;
                            ChatApp.getClientByName(TargetUserName,(id) => {
                                TargetClientID = id;
                            });
                            socket.broadcast.to(TargetClientID).emit("haveNewMessage",{senderUser:CurrentUserName,message:CurrentMessage});
                            console.log(data.status);
                        } 
                        else{
                            console.log(error);
                        }
                    }
                    catch(err){
                        console.log("function name : openchatandgetmessages");
                        console.log(err);
                    }
                });
            }
        });

    });
    socket.on('disconnect',function(){
        console.log("disconnect");
    });
});

server.listen(port, () => {
    console.log("8080");
});