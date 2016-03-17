var PLAYER_SIDE_VELOCITY = 250;
var PLAYER_TOPDOWN_VELOCITY = 250;

var BaseShip = require('./baseShip');
var BasicShotWeapon = require('../weapons/basicShotWeapon');

var PlayerShip = function(game, key, x, y, clientId, socket) {
  BaseShip.call(this, game, key, new BasicShotWeapon(game, this, true), x, y);
  this.sprite.body.collideWorldBounds = true;
  this.clientId = clientId;
  this.input = { left: false, right: false, up: false, down: false, spacebar: false };
  this.socket = socket;
  this.game = game;
  this.cursors = game.input.keyboard.createCursorKeys();
};

PlayerShip.prototype = Object.create(BaseShip.prototype);
PlayerShip.prototype.constructor = PlayerShip;

PlayerShip.prototype.centeredBulletCoords = function() {
  var x = this.sprite.x + this.sprite.width / 2 - 1;
  var y = this.sprite.y - this.sprite.height + 2;
  return {x: x, y: y};
};

PlayerShip.prototype.updateState = function (state) {
  this.input.left = state.left;
  this.input.right = state.right;
  this.input.up = state.up;
  this.input.down = state.down;
  this.input.spacebar = state.spacebar;
  this.sprite.x = state.x;
  this.sprite.y = state.y;
};

PlayerShip.prototype.checkState = function () {
  // See if the state has changed, send update server if so
  var spacebar = this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
  if (this.cursors.left.isDown != this.input.left ||
    this.cursors.right.isDown != this.input.right ||
    this.cursors.up.isDown != this.input.up ||
    this.cursors.down.isDown != this.input.down ||
    spacebar != this.input.spacebar)
  {
    // Send new state
    var state = {
      left: this.cursors.left.isDown,
      right: this.cursors.right.isDown,
      up: this.cursors.up.isDown,
      down: this.cursors.down.isDown,
      spacebar: spacebar,
      x: this.sprite.x,
      y: this.sprite.y,
      id: this.clientId
    };

    // Send changed state to server in order to notify other players
    this.socket.emit("input_changed", state);
    this.updateState(state);
  }
};

PlayerShip.prototype.update = function () {
  this.sprite.body.velocity.x = 0;
  this.sprite.body.velocity.y = 0;

  if (this.input.left)
  {
    //  Move to the left
    this.sprite.body.velocity.x = -PLAYER_SIDE_VELOCITY;
  }
  else if (this.input.right)
  {
    //  Move to the right
    this.sprite.body.velocity.x = PLAYER_SIDE_VELOCITY;
  }

  if (this.input.up)
  {
    this.sprite.body.velocity.y = -PLAYER_TOPDOWN_VELOCITY;
  }
  else if (this.input.down)
  {
    this.sprite.body.velocity.y = PLAYER_TOPDOWN_VELOCITY;
  }

  if (this.input.spacebar)
  {
    this.weapon.fire();
  }
};

module.exports = PlayerShip;