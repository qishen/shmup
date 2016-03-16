function randX() {
    return Math.floor(Math.random() * game.width);
}

var EnemyGroup = function(key, spawnRate, firstSpawn) {
    this.key = key;
    this.rate = spawnRate;
    if (firstSpawn) {
        this.nextSpawn = game.time.time + firstSpawn;
    } else {
        this.nextSpawn = 0;
    }
    this.group = game.add.group();
};

EnemyGroup.prototype.constructor = EnemyGroup;
EnemyGroup.prototype.spawn = function() {
    if (game.time.time < this.nextSpawn) { return; }
    socket.emit("spawn_enemy", {x: randX()});
    this.nextSpawn = game.time.time + this.rate;
};

EnemyGroup.prototype.spawnAt = function(x) {
    var enemy = this.group.getFirstExists(false);
    if (enemy) {
        enemy.reset(x, 1);
        enemy.ship.resetVelocity();
    } else {
        var ship = new Ship.BasicEnemyShip(game, x, 1);
        ship.sprite.ship = ship;
        this.group.add(ship.sprite);
    }
};

var Game = function () {}

Game.prototype.connectSockets = function () {
  // Network setup
  socket = io.connect(window.location.href);
  socket.on('player_joined', function(data) {
      if (data.id === myId) return;
      console.log("Player joined with id " + data.id);
      addPlayerShip(data.id);
  });
  socket.on('player_left', function(data) {
      players[data.id].sprite.kill();
      delete players[data.id];
  });
  socket.on('player_update', function(data) {
      if (data.id === myId) return;
      players[data.id].updateState(data);
  });
  socket.on('promoted_to_host', function(data) {
      if (data.id === myId) {
          console.log("Promoted to host!");
          isHost = true;
      }
  });
  socket.on('spawn_enemy', function(data) {
      basicEnemyGroup.spawnAt(data.x);
  });
  socket.on('init', function(data) {
      myId = data.id;
      console.log("My socket id: " + myId);
      isHost = data.isHost;
      if (isHost) {
          console.log("I am the host");
      }
      playerIds = data.playerIds;
      playerIds.push(myId);
      ready = true;
      create();
  });
};

Game.prototype.addPlayerShip = function (id) {
  var newShip = new Ship.PlayerShip(game, "player1", game.width/2 - 15, game.height - 100);
  newShip.clientId = id;
  players[id] = newShip;
  console.log("player ship created");
}

Game.prototype.playerShootEnemyHandler(bullet, enemy){
  game.score += 20;
  game.scoreText.text = game.scoreString + game.score;
  console.log("player shot enemy");
  bullet.kill();
  enemy.kill();
}

Game.prototype.create = function () {
  //this.input.onDown.add(this.onInputDown, this);
  if (!ready) return;

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.background = game.add.tileSprite(0, 0, game.width, game.height, 'bg');
    game.background.autoScroll(0, 40);

    for (var i=0; i<playerIds.length; i++)
    {
        addPlayerShip(playerIds[i]);
    }

    // Set up our enemies
    basicEnemyGroup = new EnemyGroup('basic_enemy', 1500, 1000);

    // Our score text
    game.scoreString = "Score: "
    game.score = 0
    game.scoreText = game.add.text(10, 10, game.scoreString + game.score, { font: '34px Arial', fill: '#fff' });

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
};

Game.prototype.update = function () {
  if (!ready) return;

    if (isHost) {
        basicEnemyGroup.spawn();
    }

    basicEnemyGroup.group.forEachExists(function(enemy) { enemy.weapon.fire(); }, this);

    for (var id in players) {
        if (id === myId) {
            players[myId].checkState();
        }
        players[id].update();
        game.physics.arcade.overlap(players[id].weapon, basicEnemyGroup.group, playerShootEnemyHandler);
    }
};

module.exports = Game;















