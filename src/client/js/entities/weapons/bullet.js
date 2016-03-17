// The ideas for how weapons work was taken from the sample code at
// http://phaser.io/tutorials/coding-tips-007 "Creating a Shoot-em-up Tutorial"

// Bullets inherit from Phaser.Sprite
var Bullet = function (game, key, scaleX, scaleY) {
	Phaser.Sprite.call(this, game, 0, 0, key);

	this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

	this.anchor.set(0, 0);
	this.scale.setTo(scaleX, scaleY);

	this.checkWorldBounds = true;
	this.outOfBoundsKill = true;
	this.exists = false;

	this.tracking = false;
	this.scaleSpeed = 0;

};

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

Bullet.prototype.fire = function (x, y, angle, speed, gx, gy) {

	gx = gx || 0;
	gy = gy || 0;

	this.reset(x, y);

	// The angle (in degrees) passed to us is the angle we want the bullet to rotate by with
	// respect to the original sprite image. The original sprites have bullets pointing upward.
	// We want enemies to shoot at an angle of 180 to make them shoot down at the player.
	// The velocityFromAngle function assumes an angle of 0 points to the right
	// (toward the positive x direction). We subtract 90 degrees so that the bullets shoot up
	// or down the screen as expected. Calling fire with angle=0 results in a bullet
	// that does not have its sprite rotated and shoots toward the top of the screen.
	this.game.physics.arcade.velocityFromAngle(angle-90, speed, this.body.velocity);

	// We could potentially manipulate this value during updates to make spinning bullets
	this.angle = angle;

	// The gravity values can be used to make bullets that have a curved trajectory, or
	// bullets that accelerate after they are shot
	this.body.gravity.set(gx, gy);

};

module.exports = Bullet;