var Bullet = require('./bullet');

var SPRITE_SCALE_FACTOR = 0.4;

// Weapons inherit from Phaser.Group. We do this because Phaser.Group keeps a pool of objects
// and reuses them. For bullets this is important so we can reuse the bullet object after it
// goes off screen or hits an enemy, saving a lot of memory allocation calls
var baseWeapon = function(game, weaponName, spriteId, source, bulletSpeed, fireRate, isPlayer) {
  Phaser.Group.call(this, game, game.world, weaponName, false, true, Phaser.Physics.ARCADE);

  this.source = source;
  this.nextFire = 0;
  this.bulletSpeed = bulletSpeed;
  this.fireRate = fireRate;
  this.isPlayerWeapon = isPlayer;

  for (var i = 0; i < 64; i++)
  {
      this.add(new Bullet(game, spriteId, SPRITE_SCALE_FACTOR, SPRITE_SCALE_FACTOR, isPlayer), true);
  }

  return this;
};

// This code is what actually makes Weapon inherit from Phaser.Group. If you write
// a new weapon object and you get errors where something in the phaser.js file is
// undefined, you probably forgot this step.
baseWeapon.prototype = Object.create(Phaser.Group.prototype);
baseWeapon.prototype.constructor = baseWeapon;

module.exports = baseWeapon;