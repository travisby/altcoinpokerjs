altcoinpokerpy
==============

A poker game which utilizes cryptocurrency for real bets

Tech stack
----------
NodeJS is unparalleled for parallel communication.  NodeJS allows seamless server <-> client communication, which a realtime poker game will require.
Sequelize is the Database Connectivity tool for use with NodeJS which allows us to track game stats, along with users, and their wallets.
poker-evaluator prevented us from writing our own five, six, and seven card comparison tool.  This step was definitely not trivial.  We saved hours by using this library.
SocketIO is the meat of our server <--> client communication.  Underneath, it uses around five different methods each falling back to another more _sure_ method to make sure communication never dies.  The most useful is websockets, a new HTML5 technology which is great communicating back and forth with clients.  We are able to broadcast, whisper, and transfer data between sectioned off clients in a room, or all clients as a whole.

