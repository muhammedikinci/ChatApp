(function () {
  'use strict';

  angular
    .module('socket.io', [])
    .provider('$socket', $socketProvider);

  /* @ngInject */
  function $socketProvider() {
    var ioUrl = '';
    var ioConfig = {};

    // Private Function to assign properties to ioConfig
    function setOption(name, value, type) {
      if (typeof value !== type)
        throw new TypeError('\'' + name + '\' must be of type \'' + type + '\'');
      else
        ioConfig[name] = value;
    }

    this.$get = function $socketFactory($rootScope) {
      var socket = io(ioUrl, ioConfig);

      return {
        on: function on(event, callback) {
          socket.on(event, function() {
            var resData = arguments;

            $rootScope.$apply(function() {
              callback.apply(socket, resData);
            });
          });
        },
        off: function off(event, callback) {
          if (typeof callback === 'function')
            socket.removeListener(event, callback);
          else
            socket.removeAllListeners(event);
        },
        emit: function emit(event, data, callback) {
          if (typeof callback === 'function') {
            socket.emit(event, data, function() {
              callback.apply(socket, arguments);
            });
          }
          else
            socket.emit(event, data);
        }
      };
    };

    this.setConnectionUrl = function setConnectionUrl(url) {
      if (typeof url === 'string')
        ioUrl = url;
      else
        throw new TypeError('url must be of type string');
    };

    this.setPath = function setPath(value) {
      setOption('path', value, 'string');
    };

    this.setConnectTimeout = function setConnectTimeout(value) {
      setOption('connect timeout', value, 'number');
    };

    this.setTryMultipleTransports = function setTryMultipleTransports(value) {
      setOption('try multiple transports', value, 'boolean');
    };

    this.setReconnect = function setReconnect(value) {
      setOption('reconnect', value, 'boolean');
    };

    this.setReconnectionDelay = function setReconnectionDelay(value) {
      setOptions('reconnection delay', value, 'number');
    };

    this.setReconnectionLimit = function setReconnectionLimit(value) {
      setOptions('max reconnection attempts', value, 'number');
    };

    this.setSyncDisconnectOnUnload = function setSyncDisconnectOnUnload(value) {
      setOptions('sync disconnect on unload', value, 'boolean');
    };

    this.setAutoConnect = function setAutoConnect(value) {
      setOptions('auto connect', value, 'boolean');
    };

    this.setFlashPolicyPort = function setFlashPolicyPort(value) {
      setOptions('flash policy port', value, 'number');
    };

    this.setForceNewConnection = function setForceNewConnection(value) {
      setOptions('force new connection', value, 'boolean');
    };
  }

})();



var app = angular.module('chat-app', [ 'socket.io' ]);
app.config(function ($socketProvider) {
    $socketProvider.setConnectionUrl('http://localhost:8080');
});
app.directive('myEnter', function () {
  return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
          if(event.which === 13) {
              scope.$apply(function (){
                  scope.$eval(attrs.myEnter);
              });

              event.preventDefault();
          }
      });
  };
});
app.controller('index', function Ctrl($scope, $socket,$interval) {
  $scope.LoginStatus = false;
  $interval(scroller,100);
  function scroller(){
    $("#CurrentChatBox-Middle").scrollTop(10200);
  }
  /*$interval(getUsers,10000);
  function getUsers(){
    if($scope.LoginStatus){
      $socket.emit('getAllUsers', {username:$scope.username});
    }
  }*/
  /*$interval(Namer,3000);
  function Namer(){
    $scope.SenderError = "Gönder";
  }*/
  $scope.SenderError = "Gönder";
  $scope.CurrentChatUserName = "";
  $scope.MessageBoxInput = "";
  $scope.OpenedChatMessageDatas = [];

  //Login Process
  $scope.username_html = "";
  $scope.username = "";
  $scope.password = "";
  $scope.login = function(){
    $socket.emit('login', {username:$scope.username, password:$scope.password});
  }
  $socket.on('loginStatus',function(status){
    $scope.LoginStatus = status;
  });

  //Last messages list
  $scope.List = [];
  // Get last messages list
  $socket.on('get', function (data) {
    $scope.List = data;
  });

  $scope.getAllUsers = function(){
    $socket.emit('getAllUsers', {username:$scope.username});
  }

  $scope.openChat = function(CurrentChatUserName){
    $scope.CurrentChatUserName = CurrentChatUserName;
    $socket.emit('openChatAndGetMessages', {currentUser:$scope.username,targetUser:$scope.CurrentChatUserName});
    
  }
  $scope.startChat = function(){
    $scope.CurrentChatUserName = $scope.username_html;
  }
  $socket.on('getOpenedChatMessages',function(CurrentChatMessageDatas){
    $scope.OpenedChatMessageDatas = CurrentChatMessageDatas;
    $("#CurrentChatBox-Middle").scrollTop(10200);
    var index = arrayObjectIndexOf($scope.List,{UserName:$scope.CurrentChatUserName});
    if(index !== -1){
      $scope.List[index].ActiveMessage = 0;
    }
    else {
      $scope.List.push({UserName:$scope.CurrentChatUserName,ActiveMessage:1});
    }
  });

  $scope.sendMessage = function(){
    console.log($scope.CurrentChatUserName);
    if(MessagesController($scope.MessageBoxInput)){
      $socket.emit('sendMessage',{currentUser:$scope.username,targetUser:$scope.CurrentChatUserName,message:$scope.MessageBoxInput});
    }
  }
  $socket.on('sendMessageResponser',(data) => {
    console.log(data);
    if(data.status == "ok"){
      $scope.OpenedChatMessageDatas.push({currentUserName:$scope.username,message:$scope.MessageBoxInput});
      $scope.MessageBoxInput = "";
    }
    if(data.NewUser){
      $scope.List.push({UserName:data.NewUser});
    }
  });
  $socket.on('haveNewMessage',({senderUser:S_User,message:G_Message}) => {
    if(S_User == $scope.CurrentChatUserName){
      $scope.OpenedChatMessageDatas.push({currentUserName:S_User,message:G_Message});
    }
    else{
      console.log(S_User+"'den yeni mesajınız vaaaar");
      var index = arrayObjectIndexOf($scope.List,{UserName:S_User});
      if(index !== -1){
        $scope.List[index].ActiveMessage = 1;
      }
    }
  });
  function MessagesController(message){
    var Arr = message;
    if(message == ""){
      $scope.SenderError = "Message is empty";
      return false;
    }
    if(Arr.length > 200){
      $scope.SenderError = "Message is higher than 200 chars";
      return false;
    }
    return true;
  }
  function arrayObjectIndexOf(arr, obj){
    for(var i = 0; i < arr.length; i++){
        if(angular.equals(arr[i], obj)){
            return i;
        }
    };
    return -1;
}
});