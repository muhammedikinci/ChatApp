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
app.controller('index', function Ctrl($scope, $socket) {
  $scope.CurrentChatUserName = "";
  $scope.MessageBoxInput = "";
  $scope.OpenedChatMessageDatas = [];

  //Login Process
  $scope.username = "ahmet";
  $scope.password = "1357911m";
  $socket.emit('login', {username:$scope.username, password:$scope.password});

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
  $socket.on('getOpenedChatMessages',function(CurrentChatMessageDatas){
    $scope.OpenedChatMessageDatas = CurrentChatMessageDatas;

  });

  $scope.sendMessage = function(){
    $socket.emit('sendMessage',{currentUser:$scope.username,targetUser:$scope.CurrentChatUserName,message:$scope.MessageBoxInput});
  }
  $socket.on('sendMessageResponser',(status) => {
    if(status == "ok"){
      $scope.OpenedChatMessageDatas.push({currentUserName:$scope.username,message:$scope.MessageBoxInput});
      $scope.MessageBoxInput = "";
    }
  });
});

/*"use strict";

var app = angular.module('chat-app',[]);
/*app.service('SocketService', ['socketFactory', function SocketService(socketFactory) {
    return socketFactory({
        ioSocket: io.connect('http://localhost:8080')
    });
}]);
app.controller('index',function($scope,SocketService){
  $scope.username="";
  SocketService.emit('getAllUsers', {username:"muhammed"});
  SocketService.on('allUsersList',function(){
  $scope.username="asd";
    
  });

});
*/
/*
app.factory('socket', function ($rootScope) {
  var socket = io.connect("http://localhost:8080");
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});


app.controller('index',function($scope,socket) {

  $scope.username = "muhammed";
  $scope.password = "1357911";
  $scope.List = [{"dsfd":"asd"}];
  
  $scope.login = function(){
    socket.emit('login', {username:$scope.username, password:$scope.password});
  }
  $scope.getAllUsers = function(){
    socket.emit('getAllUsers', {username:$scope.username});
  }
  socket.on('get',(gList) => {
      $scope.List.push(glist);
      $scope.username="asd";
    });
});


/*app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: '/index.html'
  });
}]);

app.factory('socket', ['$rootScope', function($rootScope) {
  var socket = io.connect('http://localhost:8080/');

  return {
    on: function(eventName, callback){
      socket.on(eventName, callback);
    },
    emit: function(eventName, data) {
      socket.emit(eventName, data);
    }
  };
}]);*/
/*app.factory('Socket', ['$rootScope', function ($rootScope) {
  var socket = io.connect('http://localhost:8080/');
  return {
    on: function (eventName, callback) {

      function wrapper() {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      }

      socket.on(eventName, wrapper);

      return function () {
        socket.removeListener(eventName, wrapper);
      };
    },

    emit: function (eventName, data, callback) {

      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if(callback) {
            callback.apply(socket, args);
          }
        });
      });
    },

    off: function (eventName) {

      function wrapper() {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      }

      socket.off(eventName);

      return function () {
        socket.removeListener(eventName, wrapper);
      };
    },

    removeAllListeners: function (eventName) {
      socket.removeAllListeners(eventName);

      return function () {
        socket.removeAllListeners(eventName);
      };
    },

    addListener: function (eventName, callback) {
      function wrapper() {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      }

      socket.on(eventName, wrapper);

      return function () {
        socket.on(eventName, wrapper);
      };
    },

  };
}]);*/

/*app.factory('socket',function(){
  var socket = io.connect("http://localhost:8080/");
  return socket;
});
app.controller('index', ['$scope','socket', function($scope,socket){
  $scope.username = "muhammed";
  $scope.password = "1357911";
  $scope.List = [{"dsfd":"asd"}];
  
  $scope.login = function(){
    socket.emit('login', {username:$scope.username, password:$scope.password});
  }
  $scope.getAllUsers = function(){
    socket.emit('getAllUsers', {username:$scope.username});
  }
  socket.on('allUsersList',function(){
    $scope.username = "asdasd";
  });
}]);*/