/**
 * Main script to run Shooting Game application
 *
 * @author Qishen  https://github.com/VictorCoder123
 */

// Node.js Framework (Express) settings
var express = require("express");
var path = require('path');
var app = express();
var port = process.env.PORT || 3700;

// Serve static files in localhost:3000/static/assets/hi.png
app.set('views', path.join(__dirname, '/../client/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/static', express.static(path.join(__dirname, '/../client')));

// Main route to render game page
app.get("/", function(req, res){
    res.render('index');
});

// Player states
var players = {};
var hostId;

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function(socket){
    console.log("Player connected with id " + socket.id);
    var isHost = false;
    if (hostId === undefined)
    {
        hostId = socket.id;
        console.log(hostId + " selected as host");
        isHost = true;
    }
    socket.emit('init', {id: socket.id, playerIds: Object.keys(players), isHost: isHost});
    players[socket.id] = {};
    io.emit("player_joined", {id: socket.id});

    socket.on("input_changed", function(data) {
        io.emit("player_update", data);
    });

    socket.on("spawn_enemy", function(data) {
        io.emit("spawn_enemy", data);

    });
    socket.on('disconnect', function() {
        console.log("Player " + socket.id + " disconnected from game");
        io.emit("player_left", {id: socket.id});
        var wasHost = hostId === socket.id;
        delete players[socket.id];
        if (wasHost)
        {
            // Assign a new host
            var ids = Object.keys(players);
            hostId = ids[Math.floor(Math.random() * ids.length)];
            console.log("Host left the game. Promoted " + hostId + " to host");
            io.emit("promoted_to_host", {id: hostId});
        }
    });
});

console.log("Game server is listening on port ", port);
