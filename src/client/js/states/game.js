var EnemyGroup = require('../entities/groups/enemyGroup');
var PlayerShip = require('../entities/ships/playerShip');

var Game = function () {
  this.players = {};
  this.isHost = false;
  this.basicEnemyGroup;
  this.socket;
  this.ready = false;
  this.scoreText;
  this.score = 0;
  this.cursors;
  this.myId;
}

Game.prototype.connectSockets = function (callback) {
  var self = this;
  var socket = io.connect(window.location.href);
  this.socket = socket;
  this.game.socket = socket;

  this.socket.on('player_joined', function(data) {
    if (data.id === self.myId) return;
    console.log("Player joined with id " + data.id);
    self.addPlayerShip(data.id);
  });
  this.socket.on('player_left', function(data) {
    self.players[data.id].sprite.kill();
    delete self.players[data.id];
  });
  this.socket.on('player_update', function(data) {
    if (data.id === self.myId) return;
    self.players[data.id].updateState(data);
  });
  this.socket.on('promoted_to_host', function(data) {
    if (data.id === self.myId) {
      console.log("Promoted to host!");
      self.isHost = true;
    }
  });
  this.socket.on('spawn_enemy', function(data) {
    self.basicEnemyGroup.spawnAt(data.x);
  });

  // Don't proceed before game initialization is done,
  // socket will receive data about other players in current game.
  this.socket.on('init', function(data) {
    self.myId = data.id;
    console.log("My socket id: " + self.myId);
    self.isHost = data.isHost;

    if (self.isHost) console.log("I am the host");

    var playerIds = data.playerIds;
    playerIds.push(self.myId);

    // Get all existing player IDs and create PlayerShips on canvas
    callback(playerIds);
  });
};

Game.prototype.addPlayerShip = function (id) {
  var newShip = new PlayerShip(this.game, "player1", this.game.width/2 - 15, this.game.height - 100, id, this.socket);
  this.players[id] = newShip;
  console.log("player ship created");
}

Game.prototype.playerShootEnemyHandler = function(bullet, enemy){
  this.score += 20;
  var textString = 'Score: ' + this.score;
  this.scoreText.setText(textString);
  console.log("player shot enemy");
  bullet.kill();
  enemy.kill();
}

Game.prototype.create = function () {
  var self = this;

  // Our controls.
  this.cursors = this.game.input.keyboard.createCursorKeys();
  this.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

  // We're going to be using physics, so enable the Arcade Physics system
  this.game.physics.startSystem(Phaser.Physics.ARCADE);
  this.game.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'bg');
  this.game.background.autoScroll(0, 40);

  // Initialize our score text
  var textString = 'Score: ' + this.score;
  this.scoreText = this.game.add.text(10, 10, textString, { font: '34px Arial', fill: '#fff' });

  this.connectSockets(function(playerIds){
    // Set up our enemies
    self.basicEnemyGroup = new EnemyGroup(self.game, 'basic_enemy', 1500, 1000, self.socket);

    self.syncPlayers(playerIds);
    // Set status to true when data is received from socket connection,
    // and game is created on game canvas.
    self.ready = true;
  });
}

Game.prototype.syncPlayers = function (playerIds) {
  // Import all existing player ships
  for (var i=0; i<playerIds.length; i++){
    this.addPlayerShip(playerIds[i]);
  }
};

Game.prototype.update = function () {
  // Don't start to update before game is generated on canvas
  if (!this.ready) return;

  if (this.isHost) {
      this.basicEnemyGroup.spawn();
  }

  this.basicEnemyGroup.group.forEachExists(function(enemy) { enemy.weapon.fire(); }, this);

  for (var id in this.players) {
    if (id === this.myId) {
        this.players[this.myId].checkState();
    }
    this.players[id].update();
    this.game.physics.arcade.overlap(this.players[id].weapon, this.basicEnemyGroup.group, this.playerShootEnemyHandler.bind(this));
  }
};

module.exports = Game;