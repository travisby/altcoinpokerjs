module.exports.game = function(socketio) {
    socketio.on(
        'join',
        function (room) {
            console.log(room);
            socketio.join(room);
        }
    );
}
