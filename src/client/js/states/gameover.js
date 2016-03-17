var Gameover = function () {}

Gameover.prototype = {
  create: function () {
    var text = this.add.text(this.game.width * 0.5, this.game.height * 0.5,
      'Game Over', {font: '42px Arial', fill: '#ffffff', align: 'center'
    });
    text.anchor.set(0.5);
    this.input.onDown.add(this.onDown, this);
  },

  update: function () {

  },

  onDown: function () {
    this.game.state.start('game');
  }
};

module.exports = Gameover;