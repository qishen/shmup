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
  this.explosions;
  this.lives = 3;
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

Game.prototype.createExplosion = function (x, y) {
  // Create an explosion :)
  var explosion = this.explosions.getFirstExists(false);
  if(explosion){
    explosion.reset(x, y);
    explosion.play('kaboom', 30, false, true);
  }
}

Game.prototype.playerShootEnemyHandler = function(bullet, enemy){
  this.score += 20;
  var textString = 'Score: ' + this.score;
  this.scoreText.setText(textString);
  console.log("player shot enemy");
  this.createExplosion(enemy.body.x, enemy.body.y);
  // Kill bullet and enenmy
  bullet.kill();
  enemy.kill();
}

Game.prototype.enemyHitPlayerHandler = function (player, enemy) {
  if(enemy.key !== 'basic_enemy') enemy.kill(); // Means bullet hits player
  var originX = this.game.width/2 - 15;
  var originY = this.game.height - 100;
  if(player.body.x === originX && player.body.y === originY)
    return;
  var live = this.lives.getFirstAlive();
  if(live) live.kill(); // Reduce one life after hit by enemy
  this.createExplosion(player.body.x, player.body.y);
  player.reset(originX, originY);
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

  // Create explosion pool
  this.explosions = this.game.add.group();
  this.explosions.createMultiple(30, 'kaboom');
  this.explosions.forEach(function(explosion){
    explosion.anchor.x = 0.5;
    explosion.anchor.y = 0.5;
    explosion.animations.add('kaboom');
  }, this);

  // Add lives as star
  this.lives = this.game.add.group();
  for(var i=0; i<3; i++){
    var star = this.lives.create(this.game.world.width - 100 + (30 * i), this.game.world.height - 30, 'star');
  }

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

  // Gameover and clean up after player is dead.
  if(this.lives.getFirstAlive() === null){
    //this.game.state.start('gameover');
    //this.players[this.myId].sprite.kill();
    //delete this.players[this.myId];
  }

  if (this.isHost) {
      this.basicEnemyGroup.spawn();
  }

  this.basicEnemyGroup.group.forEachExists(function(enemy) {
    enemy.weapon.fire();
    // Existing enemies weapon hits player
    for (var id in this.players) {
      this.game.physics.arcade.overlap(this.players[id].sprite, enemy.weapon, this.enemyHitPlayerHandler.bind(this));
    }
  }, this);

  for (var id in this.players) {
    // Player's bullet hits enemy
    this.game.physics.arcade.overlap(this.players[id].weapon, this.basicEnemyGroup.group, this.playerShootEnemyHandler.bind(this));
    // Player is in collision with enemy's ship
    this.game.physics.arcade.overlap(this.players[id].sprite, this.basicEnemyGroup.group, this.enemyHitPlayerHandler.bind(this));
    // Check state and update
    if (id === this.myId) {
        this.players[this.myId].checkState();
    }
    this.players[id].update();
  }
};

module.exports = Game;