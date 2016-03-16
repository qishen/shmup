var gulp = require('gulp')
  , gutil = require('gulp-util')
  , del = require('del')
  , concat = require('gulp-concat')
  , rename = require('gulp-rename')
  , minifycss = require('gulp-minify-css')
  , minifyhtml = require('gulp-minify-html')
  , processhtml = require('gulp-processhtml')
  , jshint = require('gulp-jshint')
  , uglify = require('gulp-uglify')
  , connect = require('gulp-connect')
  , nodemon = require('gulp-nodemon')        // Restart the app
  , livereload = require('gulp-livereload')  // Reload browser after restart
  , notify = require('gulp-notify')
  , browserify = require('gulp-browserify')
  , watchify = require('watchify')
  , buffer = require('vinyl-buffer')
  , source = require('vinyl-source-stream')
  , paths;

// Path of static files like css, html, js
paths = {
    libs:   ['src/client/bower_components/phaser-official/build/phaser.min.js']
  , html:   ['src/client/views/**/*.jade', 'src/client/views/**/*.html']
  , css:    'src/client/css/*.css'
  , js:     ['src/client/js/**/*.js', 'src/server/*.js']
  , img:    'src/client/img'
  , dist:   'src/client/dist/'
  , entry:  'src/client/js/main.js'
};

// Clean auto-generated dist folder
gulp.task('clean', function (cb) {
  del([paths.dist]);
  cb(null); // Give a hint when task finished
});

// Minify and rename CSS files, then output them to dist/css folder
gulp.task('minifycss', ['clean'], function () {
 gulp.src(paths.css)
    .pipe(minifycss({
      keepSpecialComments: false,
      removeEmpty: true
    }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(paths.dist + 'css'))
    .on('error', gutil.log);
});

// Lint js files and log errors
gulp.task('lint', function() {
  gulp.src(paths.js)
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .on('error', gutil.log);
});

// Browserify all js modules into one file
gulp.task('browserify', function () {
  gulp.src(paths.entry)
    .pipe(browserify({
      debug : true
    }))
    //.pipe(uglify())
    .pipe(gulp.dest(paths.dist + 'js'));
});

// Build before start server, rebuild and restart server in nodemon
// when files are modified.
gulp.task('runserver', ['build'], function(cb){
  // ! livereload is still not working, press CMD + R instead
  livereload.listen();
  nodemon({
      script: 'src/server/app.js'
    , ext: 'css js jade'
    , tasks: ['build']
    , ignore: ['src/client/dist/**/*.js', 'src/client/dist/**/*.css']
  }).on('restart', function(){
    gulp.src('src/server/app.js')
      .pipe(livereload())
      //.pipe(notify('Reloading page, please wait...'));
  });
});

// Event listener on change of static files
gulp.task('watch', function () {
  gulp.watch(paths.js, ['lint']);
  gulp.watch(paths.css, ['minifycss']);
});

gulp.task('default', ['runserver', 'watch']);
gulp.task('build', ['browserify', 'minifycss']);