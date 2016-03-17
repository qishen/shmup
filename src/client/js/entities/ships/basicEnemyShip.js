var Ship = require('./baseShip');
var BasicShotWeapon = require('../weapons/basicShotWeapon');

var BasicEnemyShip = function(game, x, y) {
  Ship.call(this, game, 'basic_enemy', new BasicShotWeapon(game, this, false), x, y);
  // Set the fire rate to be more fair for a player to be able to dodge
  this.weapon.fireRate = 1000;
  this.resetVelocity();
};

BasicEnemyShip.prototype = Object.create(Ship.prototype);
BasicEnemyShip.prototype.constructor = BasicEnemyShip;

BasicEnemyShip.prototype.centeredBulletCoords = function() {
  var x = this.sprite.x + this.sprite.width / 2 + 1;
  var y = this.sprite.y + this.sprite.height + 2;
  return {x: x, y: y};
};

BasicEnemyShip.prototype.resetVelocity = function() {
  this.sprite.body.velocity.y = 50;
};

module.exports = BasicEnemyShip;