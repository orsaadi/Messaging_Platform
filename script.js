const ws = new WebSocket('ws://localhost:8082');

// Messaging Chat
const sendBtn = document.getElementById('send-btn');
const messageBox = document.getElementById('message-input');
const messagingDiv = document.getElementById('messages-div');
const usernameBox = document.getElementById('usernameBox');

// Voice Chat
const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');

// Voice Chat Vars
let localStream;
let peerConnection;
const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

sendBtn.onclick = () => {
  if (usernameBox.value != '' && !usernameBox.value.includes(' ')) {
    const messageData = {
      username: usernameBox.value,
      message: messageBox.value,
    };
    ws.send(JSON.stringify(messageData));
  } else {
    alert('Please Enter A Vaild Username!');
  }
};

ws.addEventListener('open', () => {
  ws.send('New user has joined the chat!');
});

ws.addEventListener('message', (e) => {
  console.log(`Message from server: ${e.data}`);

  const messageData = JSON.parse(e.data);

  const message = document.createElement('div');
  message.textContent = `${messageData.username}: ${messageData.message}`;
  messagingDiv.appendChild(message);
});

ws.addEventListener('close', () => {
  console.log('Connection closed!');
});

startCallButton.addEventListener('click', async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localAudio.srcObject = localStream;

  peerConnection = new RTCPeerConnection(iceServers);

  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({ type: 'candidate', candidate: event.candidate })
      );
    }
  };

  peerConnection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    remoteAudio.srcObject = remoteStream;
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.send(JSON.stringify({ type: 'offer', sdp: offer }));
});

socket.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  if (data.type === 'offer') {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.sdp)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: 'answer', sdp: answer }));
  } else if (data.type === 'answer') {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.sdp)
    );
  } else if (data.type === 'candidate') {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

endCallButton.onclick = () => {
  peerConnection.close();
  localAudio.srcObject = null;
  remoteAudio.srcObject = null;
};
