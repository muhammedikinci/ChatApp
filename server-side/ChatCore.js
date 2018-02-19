var exports = module.exports={};

    Clients = [];
    Client = function(){
        var username = "";
        let socket;
        var loginStatus = false;
        let socketid = 0;
    }
    
    //Add New Client
    exports.addClient = function(username,socket,FunctionResponse){
        //Print ID;
        console.log(socket.id);
        //Create New Client
        var CurrentClient = new Client();
        //Set values
        CurrentClient.username = username;
        CurrentClient.socket = socket;
        CurrentClient.loginStatus = true;
        CurrentClient.socketid = socket.id;
        //Has Client?
        this.hasClient(CurrentClient,function(res){
            if(res == false){
                // NO? ok.. add list
                Clients.push(CurrentClient);
                FunctionResponse(CurrentClient.socketid + " : " + CurrentClient.username);
            }
            else{
                //Failed! has client == true
                FunctionResponse("Failed");
            }
        });
    }
    
//Has Client?
exports.hasClient = function(client,FunctionResponse){
    if(Clients.indexOf(client) > -1){
        FunctionResponse(true);
    }
    else{
        FunctionResponse(false);
    }
}
//Remove client
exports.removeClient = function(socket){
    //Create new client
    var Current = new Client();
    //Set values
    Current.username = socket.handshake['query']['username'];
    Current.socket = socket;
    //indexed ?
    var i = Clients.indexOf(Current);
    //delete
    Clients.splice(i,1);
}
//Get Online Users
exports.getOnlineUsers = function(list){
    var names = [];
    Clients.forEach(function(element){
        names.push(element.username);
    });
    list(names);
}
//Get Client By Name
exports.getClientByName = function(username,ClientSocketID){
    var sck;
    Clients.forEach(function(element){
        console.log("Process : " + element.username);
        if(element.username == username){
            sck = element.socketid;
        console.log("Process : " + element.socketid);
            
        }
    });
    ClientSocketID(sck);
}
//Get Client By Name
exports.getClientByNameToClient = function(username,ClientS){
    var sck;
    Clients.forEach(function(element){
        console.log("Process : " + element.username);
        if(element.username == username){
            sck = element.socketid;
        console.log("Process : " + element.socketid);
            
        }
    });
    ClientS(sck);
}
//Get All Users
exports.getAllUsersBySelfId = function(self_id){

}
//
exports.getOlderMessagesByIds = function(self_id, target_id){

}
//Has client?
exports.hasClient = function(socket,FunctionResponse){
    Clients.forEach(function(element){
        if(element.socket == socket){
            FunctionResponse(true);
        }
    });
    FunctionResponse(false);
}
