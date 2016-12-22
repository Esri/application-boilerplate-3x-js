module.exports = function(grunt) {
  //Load all depenedencies
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: ['dist/*']
    },
    copy: {
      html: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['*.html'],
          dest: 'dist/'
        }]
      },
      images: {
        files: [{
          expand: true,
          cwd: 'src/images/',
          src: ['**'],
          dest: 'dist/images/'
        }]
      },
      resources: {
        files: [{
          expand: true,
          cwd: 'src/js/',
          src: ['**'],
          dest: 'dist/js/'
        }]
      },
      config: {
        files: [{
          expand: true,
          cwd: 'src/config/',
          src: ['**'],
          dest: 'dist/config/'
        }]
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/css/',
          src: ['*.css'],
          dest: 'dist/css'
        }]
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      target: {
        files: [{
          expand: true,
          cwd: 'src/js',
          src: ['**/*.js'],
          dest: 'dist/js'
        }]
      }
    },
    jshint: {
      files: ['src/js/application/*.js', 'src/js/boilerplate/*.js'],
      options: {
        jshintrc: true,
        force: true // report errors without failing
      }
    }
  });
  // Alias a group of tasks.
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['clean', 'copy', 'cssmin', 'uglify', 'jshint']);
};
