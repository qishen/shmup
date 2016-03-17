/**
 * Ship base class used to be inherited by player ship and
 * enenmy ship, etc.
 *
 * @author Qishen  https://github.com/VictorCoder123
 */

var SPRITE_SCALE_FACTOR = 0.4;

var BaseShip = function(game, key, weapon, x, y, scaleX, scaleY) {
  this.sprite = game.add.sprite(x, y, key);
  this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

  scaleX = scaleX || SPRITE_SCALE_FACTOR;
  scaleY = scaleY || SPRITE_SCALE_FACTOR;
  this.sprite.scale.setTo(scaleX, scaleY);
  game.physics.arcade.enable(this.sprite);
  // Assume all ships should be killed if they go out of bounds
  this.sprite.checkWorldBounds = true;
  this.sprite.outOfBoundsKill = true;

  this.weapon = weapon;
  // A hack to allow us to call fire() on the sprite object as well
  this.sprite.weapon = weapon;

  // Make sure we don't add a sprite outside of the world bounds
  var horiz = this.sprite.width + 2;
  if (this.sprite.x < horiz) {
    this.sprite.x = horiz;
  } else if (this.sprite.x > game.width - horiz) {
    this.sprite.x = game.width - horiz;
  }
};

BaseShip.prototype.constructor = BaseShip;

// This should be overridden so the bullet will be centered correctly from different ships
BaseShip.prototype.centeredBulletCoords = function() {
  var x = this.sprite.x;
  var y = this.sprite.y;
  return {x: x, y: y};
};

module.exports = BaseShip;