/**
 * Entry point to start shooting game
 *
 * @author Qishen  https://github.com/VictorCoder123
 */

// Import all stages in game
var Boot = require('./states/boot');
var Menu = require('./states/menu');
var Preloader = require('./states/preloader');
var Game = require('./states/game');

var GAME_WIDTH = 480;
var GAME_HEIGHT = 640;

window.addEventListener('load', function () {
  'use strict';

  var game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'shooting-game');

  game.state.add('boot', Boot);
  game.state.add('preloader', Preloader);
  game.state.add('menu', Menu);
  game.state.add('game', Game);

  game.state.start('boot');

}, false);
