var http = require('http'),
    util = require('util');

var Changes = module.exports = function(config) {
  process.EventEmitter.call(this);
  this._config = config;
  this.events = [];
  
  this.endless(function(event) {
    this.data.push(event);
  });
};
util.inherits(Changes, process.EventEmitter);

Changes.prototype.bootstrap = function() {
  return this.events;
};

Changes.prototype.endless = function(callback) {
  var that = this,
      config = this._config.changes,
      client = http.createClient(config.port, config.host),
      request = client.request('GET', config.url + '&since=' + (config.since || 0), {
        host: config.host,
        accept: '*/*'
      });
  
  client.on('error', function() {});
  client.on('close', function() {    
    try {
      client.destroy();
    } catch(e) {
    }
    process.nextTick(function() {
      that.endless(callback);
    });
  });
  
  request.on('response', function(response) {
    var buffer = '';
    response.on('data', function(data) {
      buffer += data;
      
      if (!buffer.indexOf('\n')) return;
      var messages = buffer.split(/\n/g);
      
      // Save last
      buffer = messages.pop();
      
      messages.forEach(function(message) {
        try {
          message = JSON.parse(message);
        } catch(e) {
          return;
        }
        
        if (message.seq) {
          config.since = message.seq;
        }
        
        var event = message.doc;
        
        var delta = that.events.push(event) - config.limit;
        if (delta > 0) {
          that.events = that.events.slice(delta);
        }
        that.emit('event', event);
      });
    });
  });
  
  request.end();
  
};
