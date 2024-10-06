const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8082 });

wss.on('connection', (ws) => {
  console.log('New client connected!');

  broadcastClientCount();

  ws.on('message', (data) => {
    console.log(`Client sent: ${data}`);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`${data}`);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client has disconnected!');
    broadcastClientCount();
  });
});

function broadcastClientCount() {
  const clientCount = wss.clients.size;
  console.log(`Number of connected clients: ${clientCount}`);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`Number of connected clients: ${clientCount}`);
    }
  });
}
