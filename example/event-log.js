// Prints every widget event into <pre id="events">, newest first. Example pages only.
(function () {
  var log = document.getElementById('events');
  ['ready', 'open', 'close', 'register', 'send', 'reply', 'quickreply', 'error', 'reset'].forEach(function (name) {
    FlowBubble.on(name, function (payload) {
      var line = new Date().toLocaleTimeString() + '  ' + name + (payload ? '  ' + JSON.stringify(payload) : '');
      log.textContent = line + '\n' + log.textContent;
    });
  });
})();
