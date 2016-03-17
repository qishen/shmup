/**
 * Entry point to start shooting game
 *
 * @author Qishen  https://github.com/VictorCoder123
 */

// Import all stages in game
var Boot = require('./states/boot');
var Gameover = require('./states/gameover');
var Preloader = require('./states/preloader');
var Game = require('./states/game');

var GAME_WIDTH = 960;
var GAME_HEIGHT = 640;

window.addEventListener('load', function () {
  'use strict';

  var game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'shooting-game');

  game.state.add('boot', Boot);
  game.state.add('preloader', Preloader);
  game.state.add('gameover', Gameover);
  game.state.add('game', Game);

  game.state.start('boot');

}, false);
