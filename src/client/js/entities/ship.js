
// Used to represent both the player and enemy ships.
var Ship = function(game, key, weapon, x, y, scaleX, scaleY) {
    this.sprite = game.add.sprite(x, y, key);
    this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

    scaleX = scaleX || SPRITE_SCALE_FACTOR;
    scaleY = scaleY || SPRITE_SCALE_FACTOR;
    this.sprite.scale.setTo(SPRITE_SCALE_FACTOR, SPRITE_SCALE_FACTOR);
    game.physics.arcade.enable(this.sprite);
    // Assume all ships should be killed if they go out of bounds
    this.sprite.checkWorldBounds = true;
    this.sprite.outOfBoundsKill = true;
/*
    this.exists = false;
    this.tracking = false;
*/
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

Ship.prototype.constructor = Ship;
// This should be overridden so the bullet will be centered correctly from different ships
Ship.prototype.centeredBulletCoords = function() {
    var x = this.sprite.x;
    var y = this.sprite.y;
    return {x: x, y: y};
};

Ship.PlayerShip = function(game, key, x, y, clientId) {
    Ship.call(this, game, key, new Weapon.BasicShot(game, this, true), x, y);
    this.sprite.body.collideWorldBounds = true;
    this.clientId = clientId;
    this.input = { left: false, right: false, up: false, down: false, spacebar: false };
};

Ship.PlayerShip.prototype = Object.create(Ship.prototype);
Ship.PlayerShip.constructor = Ship.PlayerShip;

Ship.PlayerShip.prototype.centeredBulletCoords = function() {
    var x = this.sprite.x + this.sprite.width / 2 - 1;
    var y = this.sprite.y - this.sprite.height + 2;
    return {x: x, y: y};
};

Ship.PlayerShip.prototype.updateState = function (state) {
    this.input.left = state.left;
    this.input.right = state.right;
    this.input.up = state.up;
    this.input.down = state.down;
    this.input.spacebar = state.spacebar;
    this.sprite.x = state.x;
    this.sprite.y = state.y;
};

Ship.PlayerShip.prototype.checkState = function() {
    // See if the state has changed, send update server if so
    var spacebar = game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
    if (cursors.left.isDown != this.input.left ||
        cursors.right.isDown != this.input.right ||
        cursors.up.isDown != this.input.up ||
        cursors.down.isDown != this.input.down ||
        spacebar != this.input.spacebar)
    {
        // Send new state
        var state =
            { left: cursors.left.isDown,
              right: cursors.right.isDown,
              up: cursors.up.isDown,
              down: cursors.down.isDown,
              spacebar: spacebar,
              x: this.sprite.x,
              y: this.sprite.y,
              id: myId };
        socket.emit("input_changed", state);
        this.updateState(state);
    }
};

Ship.PlayerShip.prototype.update = function() {
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

Ship.BasicEnemyShip = function(game, x, y) {
    Ship.call(this, game, 'basic_enemy', new Weapon.BasicShot(game, this, false), x, y);
    // Set the fire rate to be more fair for a player to be able to dodge
    this.weapon.fireRate = 1000;
    this.resetVelocity();
};

Ship.BasicEnemyShip.prototype = Object.create(Ship.prototype);
Ship.BasicEnemyShip.constructor = Ship.BasicEnemyShip;

Ship.BasicEnemyShip.prototype.centeredBulletCoords = function() {
    var x = this.sprite.x + this.sprite.width / 2 + 1;
    var y = this.sprite.y + this.sprite.height + 2;
    return {x: x, y: y};
};

Ship.BasicEnemyShip.prototype.resetVelocity = function() {
    this.sprite.body.velocity.y = 50;
};

module.exports = Ship;