var baseWeapon = require('./baseWeapon');

var BasicShotWeapon = function (game, source, isPlayer) {
  baseWeapon.call(this, game, 'BasicShot', 'laser1', source, 600, 100, isPlayer);
  return this;
};

BasicShotWeapon.prototype = Object.create(baseWeapon.prototype);
BasicShotWeapon.prototype.constructor = BasicShotWeapon;

BasicShotWeapon.prototype.fire = function () {
  if (this.game.time.time < this.nextFire) { return; }

  var coords = this.source.centeredBulletCoords();
  var angle = this.isPlayerWeapon ? 0 : 180;

  this.getFirstExists(false).fire(coords.x, coords.y, angle, this.bulletSpeed, 0, 0);

  this.nextFire = this.game.time.time + this.fireRate;
};

module.exports = BasicShotWeapon;