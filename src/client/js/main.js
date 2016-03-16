/**
 * Entry point to start shooting game
 *
 * @author Qishen  https://github.com/VictorCoder123
 */

var Boot = require('./states/boot');
var Menu = require('./states/menu');
var Preloader = require('./states/preloader');
var Game = require('./states/game');

window.addEventListener('load', function () {
  'use strict';

  var game = new Phaser.Game(640, 480, Phaser.AUTO, 'shooting-game');

  game.state.add('boot', Boot);
  game.state.add('preloader', Preloader);
  game.state.add('menu', Menu);
  game.state.add('game', Game);

  game.state.start('boot');

}, false);
