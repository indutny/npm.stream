var connect = require('connect'),
    io = require('socket.io'),
    Changes = require('./stat/changes');

exports.createStat = function(config) {
  var server = http.createServer();

  var changes = new Changes(config);
  
  server.listen(config.server.port, config.server.host);
  var socket = io.listen(server);
  
  socket.on('connection', function(client) {    
    client.send(JSON.stringify(changes.bootstrap()));
  });
  
  changes.on('event', function(event) {
    socket.broadcast(JSON.stringify([event]));
  });
  
};
