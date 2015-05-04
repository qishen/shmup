(function main() {
// Constants
var GAME_WIDTH = 450;
var GAME_HEIGHT = 600;
var PLAYER_SIDE_VELOCITY = 250;
var PLAYER_TOPDOWN_VELOCITY = 250;
// How much we're scaling the sprites by from the original source
var SPRITE_SCALE_FACTOR = 0.4;

var game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var assetsPath = 'nick-assets';
var spritePath = assetsPath + '/SpaceShooterRedux/PNG/';
var partsPath = spritePath + 'Parts/';
var laserPath = spritePath + 'Lasers/';
var enemyPath = spritePath + 'Enemies/';

var myId;
var players = {};
var playerIds = [];
var basicEnemyGroup;
var cursors;
var score = 0;
var scoreText;
var socket;
var ready = false;
var isHost;

function preload() {

    game.load.image('bg', assetsPath + '/SpaceShooterRedux/Backgrounds/blue.png');
    game.load.image('player1', spritePath + 'playerShip1_blue.png');
    game.load.image('laser1', laserPath + 'laserBlue01.png');
    game.load.image('basic_enemy', enemyPath + 'enemyBlack1.png');

    game.stage.disableVisibilityChange = true;

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

    //game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
}


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

// Weapons inherit from Phaser.Group. We do this because Phaser.Group keeps a pool of objects
// and reuses them. For bullets this is important so we can reuse the bullet object after it
// goes off screen or hits an enemy, saving a lot of memory allocation calls
var Weapon = function(game, weaponName, spriteId, source, bulletSpeed, fireRate, isPlayer) {
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
Weapon.prototype = Object.create(Phaser.Group.prototype);
Weapon.prototype.constructor = Weapon;

Weapon.BasicShot = function (game, source, isPlayer) {
    Weapon.call(this, game, 'BasicShot', 'laser1', source, 600, 100, isPlayer);
    return this;
};

Weapon.BasicShot.prototype = Object.create(Weapon.prototype);
Weapon.BasicShot.prototype.constructor = Weapon.BasicShot;

Weapon.BasicShot.prototype.fire = function () {
    if (this.game.time.time < this.nextFire) { return; }

    var coords = this.source.centeredBulletCoords();

    var angle = this.isPlayerWeapon ? 0 : 180;
    this.getFirstExists(false).fire(coords.x, coords.y, angle, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;
};


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

function addPlayerShip(id) {
    var newShip = new Ship.PlayerShip(game, "player1", game.width/2 - 15, game.height - 100);
    newShip.clientId = id;
    players[id] = newShip;
    console.log("player ship created");
}

function create() {
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
    
}

function playerShootEnemyHandler(bullet, enemy)
{   
    game.score += 20;
    game.scoreText.text = game.scoreString + game.score;
    console.log("player shot enemy");
    bullet.kill();
    enemy.kill();
}

function update() {
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
}
})();

