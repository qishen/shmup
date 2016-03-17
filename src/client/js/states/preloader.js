var Preloader = function() {
  this.asset = null;
  this.ready = false;
}

Preloader.prototype = {
  preload: function () {
    this.asset = this.add.sprite(this.game.width * 0.5 - 110, this.game.height * 0.5 - 10, 'preloader');
    this.load.setPreloadSprite(this.asset);

    this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    this.loadResources();

    this.ready = true;
  },

  loadResources: function () {
    // load your assets here
    this.load.image('bg', 'static/assets/SpaceShooterRedux/Backgrounds/blue.png');
    this.load.image('player1', 'static/assets/SpaceShooterRedux/PNG/playerShip1_blue.png');
    this.load.image('laser1', 'static/assets/SpaceShooterRedux/PNG/Lasers/laserBlue01.png');
    this.load.image('basic_enemy', 'static/assets/SpaceShooterRedux/PNG/Enemies/enemyBlack1.png');
    this.load.image('star', 'static/assets/star.png');
    this.load.spritesheet('kaboom', 'static/assets/SpaceShooterRedux/games/invaders/explode.png', 128, 128);
  },

  create: function () {

  },

  update: function () {
    // if (!!this.ready) {
    this.game.state.start('game');
    // }
  },

  onLoadComplete: function () {
    // this.ready = true;
  }
};

module.exports = Preloader;