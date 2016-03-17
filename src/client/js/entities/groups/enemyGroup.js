var BasicEnemyShip = require('../ships/basicEnemyShip');

var EnemyGroup = function(game, key, spawnRate, firstSpawn, socket) {
  this.key = key;
  this.rate = spawnRate;
  if (firstSpawn) {
    this.nextSpawn = game.time.time + firstSpawn;
  } else {
    this.nextSpawn = 0;
  }
  this.group = game.add.group();
  this.socket = socket;
  this.game = game;
};

EnemyGroup.prototype.constructor = EnemyGroup;

EnemyGroup.prototype.spawn = function () {
  if (this.game.time.time < this.nextSpawn) { return; }
  this.socket.emit("spawn_enemy", {x: this.randX()});
  this.nextSpawn = this.game.time.time + this.rate;
};

EnemyGroup.prototype.spawnAt = function (x) {
  var enemy = this.group.getFirstExists(false);
  if (enemy) {
    enemy.reset(x, 1);
    enemy.ship.resetVelocity();
  } else {
    var ship = new BasicEnemyShip(this.game, x, 1);
    ship.sprite.ship = ship;
    this.group.add(ship.sprite);
  }
};

EnemyGroup.prototype.randX = function () {
  return Math.floor(Math.random() * this.game.width);
}

module.exports = EnemyGroup;