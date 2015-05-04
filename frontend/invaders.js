
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

var socket = io.connect(window.location.href);

// Player class inherited from Sprite
var Player = function(game, x, y, key, frame){
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.id = null // bind it to unique socket id
}

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.setID = function(id){
    this.id = id;
}

// Upload it location info to server
Player.prototype.upload = function(input){
    // pass this.playState as param to upload function()
    socket.emit('upload', input)
    //console.log(input, " is uploaded")
}

// Update its own location from input to render in game
Player.prototype.updateInGame = function(input){
    if(input.alive === false){
        this.kill()
    }
    else{
        this.body.x = input.x;
        this.body.y = input.y;
    }
}

Player.prototype.kill = function(){
    //this.kill()
    Phaser.Sprite.prototype.kill.call(this)
    this.setID(null)
}

var PhaserGame = function(){
    this.player = null;
    this.playerState = {}
    this.allies = null;
    this.aliens = null;
    this.bullets = null;
    this.bulletTime = 0;
    this.cursors = null;
    this.fireButton = null;
    this.explosions = null;
    this.starfield = null;
    this.score = 0;
    this.scoreString = '';
    this.scoreText = null;
    this.lives = null;
    this.enemyBullet = null;
    this.firingTimer = 0;
    this.stateText = null;
    this.livingEnemies = [];
    this.gameState = {} 
}

PhaserGame.prototype.preload = function(){

    this.load.image('bullet', 'assets/games/invaders/bullet.png');
    this.load.image('enemyBullet', 'assets/games/invaders/enemy-bullet.png');
    this.load.spritesheet('invader', 'assets/games/invaders/invader32x32x4.png', 32, 32);
    this.load.image('ship', 'assets/games/invaders/player.png');
    this.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);
    this.load.image('starfield', 'assets/games/invaders/starfield.png');
    this.load.image('background', 'assets/games/starstruck/background2.png');
}

PhaserGame.prototype.create = function(){

    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.stage.disableVisibilityChange = true;

    //  The scrolling starfield background
    this.starfield = this.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  Our bullet group
    this.bullets = this.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(30, 'bullet');
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 1);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);

    // The enemy's bullets
    this.enemyBullets = this.add.group();
    this.enemyBullets.enableBody = true;
    this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBullets.createMultiple(30, 'enemyBullet');
    this.enemyBullets.setAll('anchor.x', 0.5);
    this.enemyBullets.setAll('anchor.y', 1);
    this.enemyBullets.setAll('outOfBoundsKill', true);
    this.enemyBullets.setAll('checkWorldBounds', true);

    //  The hero!
    var obj = new Player(this, 400, 500, 'ship');
    obj.setID(socket.id);
    this.player = this.add.existing(obj);
    this.player.anchor.setTo(0.5, 0.5);
    this.physics.enable(this.player, Phaser.Physics.ARCADE);

    // Inform server that a new player needs to be added into list
    var initial = {'id': socket.id, 'x': 400, 'y': 500, 'alive': true}
    this.gameState[socket.id] = initial;
    socket.emit('addPlayer', initial)

    // Allies online and set maximum players to 4
    this.allies = this.add.group();
    this.allies.enableBody = true;
    this.allies.classType = Player
    this.allies.physicsBodyType = Phaser.Physics.ARCADE;
    this.allies.createMultiple(3, 'ship')
    this.allies.setAll('anchor.x', 0);
    this.allies.setAll('anchor.y', 0);
    this.allies.setAll('body.x', 200);
    this.allies.setAll('body.y', 200);
    //this.allies.callAll('kill')
    /*for (var x = 0; x < 5; x++)
    {
        var ally = this.allies.create(x * 48, 500, 'ship');
        ally.anchor.setTo(0.5, 0.5);
    }*/

    //  The baddies!
    this.aliens = this.add.group();
    this.aliens.enableBody = true;
    this.aliens.physicsBodyType = Phaser.Physics.ARCADE;

    this.createAliens();

    //  The score
    this.scoreString = 'Score : ';
    this.scoreText = this.add.text(10, 10, this.scoreString + this.score, { font: '34px Arial', fill: '#fff' });

    //  Lives
    this.lives = this.add.group();
    this.add.text(this.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#fff' });

    //  Text
    this.stateText = this.add.text(this.world.centerX,this.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
    this.stateText.anchor.setTo(0.5, 0.5);
    this.stateText.visible = false;

    for (var i = 0; i < 3; i++) 
    {
        var ship = this.lives.create(this.world.width - 100 + (30 * i), 60, 'ship');
        ship.anchor.setTo(0.5, 0.5);
        ship.angle = 90;
        ship.alpha = 0.4;
    }

    //  An explosion pool
    this.explosions = this.add.group();
    this.explosions.createMultiple(30, 'kaboom');
    this.explosions.forEach(this.setupInvader, this);

    //  And some controls to play the game with
    this.cursors = this.input.keyboard.createCursorKeys();
    this.fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    var self = this;

    socket.on('updateGame', function(data){

        self.gameState = data // Contain state of all players
        var idList = []

        // Create or kill allies according to gameState received from server
        self.allies.forEachAlive(function(ally){

            // kill the ally if dead, remember id is set to null after calling kill()
            if(self.gameState[ally.id] && self.gameState[ally.id].alive === false){
                ally.kill()
            }
            idList.push(ally.id)
        })

        Object.keys(self.gameState).forEach(function(id){
            // Revive a ally and set ID if it is not on battle field
            if(self.player.id !== id && idList.indexOf(id) === -1){

                var ally = self.allies.getFirstDead()
                if(ally){
                    ally.setID(id)
                    ally.revive()
                }
            }
        })

    })
    
}

PhaserGame.prototype.createAliens = function() {

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 10; x++)
        {
            var alien = this.aliens.create(x * 48, y * 50, 'invader');
            alien.anchor.setTo(0.5, 0.5);
            alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);
            alien.play('fly');
            alien.body.moves = false;
        }
    }

    this.aliens.x = 100;
    this.aliens.y = 50;

    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    var tween = this.add.tween(this.aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  When the tween loops it calls descend
    tween.onLoop.add(this.descend, this);
}

PhaserGame.prototype.setupInvader = function(invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');

}

PhaserGame.prototype.descend = function() {

    this.aliens.y += 10;

}

PhaserGame.prototype.update = function() {

    //  Scroll the background
    this.starfield.tilePosition.y += 2;

    if (this.player.alive)
    {
        //  Reset the player, then check for movement keys
        //  this.playerState = {'id': socket.id, 'x':0, 'y':0, 'alive': true}

        if (this.cursors.left.isDown)
        {
            this.gameState[this.player.id].x = this.gameState[this.player.id].x - 5
        }
        else if (this.cursors.right.isDown)
        {
            this.gameState[this.player.id].x = this.gameState[this.player.id].x + 5
        }
        else if (this.cursors.up.isDown)
        {
            this.gameState[this.player.id].y = this.gameState[this.player.id].y - 5
        }
        else if (this.cursors.down.isDown)
        {
            this.gameState[this.player.id].y = this.gameState[this.player.id].y + 5
        }

        // upload its location to server
        this.player.upload(this.gameState[this.player.id]) 

        //  Firing?
        if (this.fireButton.isDown)
        {
            this.fireBullet();
        }

        if (this.time.now > this.firingTimer)
        {
            this.enemyFires();
        }

        // Update the state of other existing players
        this.updateGame();

        //  Run collision
        this.physics.arcade.overlap(this.bullets, this.aliens, this.collisionHandler, null, this);
        this.physics.arcade.overlap(this.enemyBullets, this.player, this.enemyHitsPlayer, null, this);
    }

}

PhaserGame.prototype.updateGame = function(){
    var self = this

    this.player.updateInGame(this.gameState[this.player.id]);

    this.allies.forEachAlive(function(ally){

        ally.updateInGame(self.gameState[ally.id])

    });
}

PhaserGame.prototype.render = function() {

    // for (var i = 0; i < aliens.length; i++)
    // {
    //     game.debug.body(aliens.children[i]);
    // }

}

PhaserGame.prototype.collisionHandler = function(bullet, alien) {

    //  When a bullet hits an alien we kill them both
    bullet.kill();
    alien.kill();

    //  Increase the score
    this.score += 20;
    this.scoreText.text = this.scoreString + this.score;

    //  And create an explosion :)
    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 30, false, true);

    if (this.aliens.countLiving() == 0)
    {
        this.score += 1000;
        this.scoreText.text = this.scoreString + this.score;

        this.enemyBullets.callAll('kill',this);
        this.stateText.text = " You Won, \n Click to restart";
        this.stateText.visible = true;

        //the "click to restart" handler
        this.input.onTap.addOnce(this.restart,this);
    }

}

PhaserGame.prototype.enemyHitsPlayer = function(player,bullet) {
    
    bullet.kill();

    live = this.lives.getFirstAlive();

    if (live)
    {
        live.kill();
    }

    //  And create an explosion :)
    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(this.player.body.x, this.player.body.y);
    explosion.play('kaboom', 30, false, true);

    // When the player dies
    if (this.lives.countLiving() < 1)
    {
        this.player.kill();
        this.enemyBullets.callAll('kill');

        this.stateText.text=" GAME OVER \n Click to restart";
        this.stateText.visible = true;

        //the "click to restart" handler
        this.input.onTap.addOnce(this.restart,this);
    }

}

PhaserGame.prototype.enemyFires = function() {

    //  Grab the first bullet we can from the pool
    enemyBullet = this.enemyBullets.getFirstExists(false);
    this.livingEnemies.length=0;
    var self = this // refer to game when 'this' cannot be accessed in function

    this.aliens.forEachAlive(function(alien){
        // put every living enemy in an array
        self.livingEnemies.push(alien);
    });


    if (enemyBullet && this.livingEnemies.length > 0)
    {
        
        var random=game.rnd.integerInRange(0, this.livingEnemies.length-1);

        // randomly select one of them
        var shooter=this.livingEnemies[random];
        // And fire the bullet from this enemy
        enemyBullet.reset(shooter.body.x, shooter.body.y);

        this.physics.arcade.moveToObject(enemyBullet,this.player,120);
        this.firingTimer = this.time.now + 12000;
    }

}

PhaserGame.prototype.fireBullet = function() {

    //  To avoid them being allowed to fire too fast we set a time limit
    if (this.time.now > this.bulletTime)
    {
        //  Grab the first bullet we can from the pool
        bullet = this.bullets.getFirstExists(false);

        if (bullet)
        {
            //  And fire it
            bullet.reset(this.player.x, this.player.y + 8);
            bullet.body.velocity.y = -400;
            bulletTime = this.time.now + 200;
        }
    }

}

PhaserGame.prototype.resetBullet = function(bullet) {

    //  Called if the bullet goes out of the screen
    bullet.kill();

}

PhaserGame.prototype.restart = function() {

    //  A new level starts
    
    //resets the life count
    this.lives.callAll('revive');
    //  And brings the aliens back from the dead :)
    this.aliens.removeAll();
    this.createAliens();

    //revives the player
    this.player.revive();
    //hides the text
    this.stateText.visible = false;

}


game.state.add('Game', PhaserGame, true);



