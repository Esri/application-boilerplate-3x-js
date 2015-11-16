var gulp = require("gulp");
var jshint = require("gulp-jshint");
var beautify = require("gulp-beautify");
var sass = require("gulp-sass");
var compass = require("gulp-compass");
var cssbeautify = require("gulp-cssbeautify");
var uncss = require("gulp-uncss"); 
var minifycss = require("gulp-minify-css");
var stylus = require("gulp-stylus");
var nib = require("nib");


//Define a task. Takes two arguments the name of the task and a function
//which will be run when you call the task
//In this example we specify that we want to run jshint on each .js file 
//in the javascript folder and report the results using the jshint reporter. 
gulp.task("lint", function(){
	gulp.src("./js/*.js")
	.pipe(jshint())
	.pipe(jshint.reporter("default"));
});

//Run the beautify task and specify options in this example 
//I added a base to overwrite existing files. You could 
//specify that results are written to another location by specifying
//a different destination instead. 
gulp.task("beautify", function(){
	gulp.src("./js/*.js",{base:"./"})
	.pipe(beautify({indentSize:4}))
	.pipe(gulp.dest("./"));
});

//Process sass
gulp.task('sass', function () {
    gulp.src("./css/*.scss")
        .pipe(sass())
        .pipe(sass({errLogToConsole: true}))
        .pipe(gulp.dest("./css"));
});


//use nib

gulp.task('nib', function(){
    gulp.src('./css/*.styl')
        .pipe(stylus({ use: nib(), compress: false }))
        .pipe(gulp.dest('./css'));
});

//Task to remove unused css. I write these updates out to a new folder
//called public so I don't lose any css I  may need. 
gulp.task("uncss", function(){
	gulp.src("./css/*.css")
   .pipe(uncss({
      html: ["index.html"]
    }))
   .pipe(gulp.dest("./public"));
});

//Beautify css 
gulp.task("css",function(){
	gulp.src("./css/*.css", {base:"./"})
	.pipe(cssbeautify())
	.pipe(gulp.dest("./public"))
});


//Minify css
gulp.task("minify-css", function(){
	gulp.src("./css/*.css",{base:"./"})
	.pipe(minifycss())
	.pipe(gulp.dest("./"))
});



//define a default task that will run if you type gulp at the command line

gulp.task('default', ["lint","beautify","css"]);

