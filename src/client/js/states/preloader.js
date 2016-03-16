var Preloader () {
  this.asset = null;
  this.ready = false;
}

Preloader.prototype = {
  preload: function () {
    this.asset = this.add.sprite(this.game.width * 0.5 - 110, this.game.height * 0.5 - 10, 'preloader');
    this.load.setPreloadSprite(this.asset);

    // this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    // this.loadResources();

    this.ready = true;
  },

  loadResources: function () {
    // load your assets here
    this.load.image('bg', 'static/SpaceShooterRedux/Backgrounds/blue.png');
    this.load.image('player1', 'static/SpaceShooterRedux/PNG/playerShip1_blue.png');
    this.load.image('laser1', 'static/SpaceShooterRedux/PNG/Lasers/laserBlue01.png');
    this.load.image('basic_enemy', 'static/SpaceShooterRedux/PNG/Enemies/enemyBlack1.png');
  },

  create: function () {

  },

  update: function () {
    // if (!!this.ready) {
    this.game.state.start('menu');
    // }
  },

  onLoadComplete: function () {
    // this.ready = true;
  }
};

module.exports = Preloader;