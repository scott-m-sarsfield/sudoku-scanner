var gulp = require('gulp');

var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var mocha = require('gulp-mocha');
var browserSync = require('browser-sync').create();
var notify = require('gulp-notify');
var notifierReporter = require('mocha-notifier-reporter');
var mustache = require('gulp-mustache');
var ext_replace = require('gulp-ext-replace');
var prettify = require('gulp-html-prettify');

var argv = require('yargs').argv;

gulp.task('default',['mocha','javascript','static-files','renderStatic','init-browser-sync'],function(){
    gulp.watch(['www/**'],['static-files']);
    gulp.watch(['templates/**','src/**'],['renderStatic','javascript']);
    gulp.watch(['src/**','test/**'],['mocha']);

    gulp.watch(['dist/**']).on('change',browserSync.reload);
});

gulp.task('javascript',function(){
    var b = browserify({
        entries:"./src/app.js",
        debug:true
    });

    return b.transform(babelify).bundle()
        .pipe(source('app.js')) // app.js is a pretend file name, BTW
        .pipe(buffer())
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('mocha',function(){
    return gulp.src(['./test/*.js'],{read:false})
        .pipe(mocha({reporter:notifierReporter.decorate('spec')}));
        //.pipe(mocha({reporter:'mocha-notifier-reporter'}));
        //.on('error',gutil.log);
});

gulp.task("static-files",function(){
    return gulp.src(['./www/**'])
        .pipe(gulp.dest("./dist/"));
});

gulp.task('init-browser-sync',function(){
    browserSync.init({
        server:{
            baseDir:"./dist/"
        }
    });
});

gulp.task('notify',function(){
    return gulp.src(['./src/**'])
        .pipe(notify("Hello Gulp!"));
});

gulp.task('renderStatic',function(){

    // this is probably dumb.
    Object.keys(require.cache).forEach(function(key) {
         if(!key.match(/node_modules/)){    // only want to delete the require cache for my files.
             console.log(key);
             delete require.cache[key];
         }
     });

    try{
        var staticReactContent = require('./static_react').default;
    return gulp.src('./templates/*.mustache')
        .pipe(mustache(staticReactContent))
        .pipe(ext_replace(".html"))
        .pipe(prettify({indent_char: ' ', indent_size: 2}))
        .pipe(gulp.dest('./dist'));
    }catch(e){
        console.log(e.stack);
    }
});

gulp.task('copy',function(){
    //console.log(argv);
    //var destination = argv.dest || argv.d;
    if(!argv.dest){
        console.log("Usage:\ngulp copy --dest <destination>");
    }else{
        return gulp.src(['./**','!./node_modules/**','.babelrc'])
            .pipe(gulp.dest(argv.dest));
    }
});
