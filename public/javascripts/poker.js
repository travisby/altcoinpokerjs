var socket = io.connect('/pokersocket');
socket.on('connect', function (data) {
    console.log("asking to join room " + roomID);
    socket.emit('join', {roomID: roomID});
});
