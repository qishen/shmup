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

module.exports = Weapon;