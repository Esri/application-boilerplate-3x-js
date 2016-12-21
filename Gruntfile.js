module.exports = function(grunt) {
  //Load all depenedencies
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: ['build/*']
    },
    copy: {
      html: {
        files: [{
          expand: true,
          src: ['*.html'],
          dest: 'build/'
        }]
      },
      images: {
        files: [{
          expand: true,
          src: ['images/**'],
          dest: 'build/'
        }]
      },
      resources: {
        files: [{
          expand: true,
          src: ['js/**'],
          dest: 'build/'
        }]
      },
      config: {
        files: [{
          expand: true,
          src: ['config/**'],
          dest: 'build/'
        }]
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'css/',
          src: ['*.css'],
          dest: 'build/css'
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
          cwd: 'js/application',
          src: ['**/*.js'],
          dest: 'build/js/application'
        }, {
          expand: true,
          cwd: 'js/boilerplate',
          src: ['**/*.js'],
          dest: 'build/js/boilerplate'
        }]
      }
    },
    jshint: {
      files: ['js/application/*.js', 'js/boilerplate/*.js'],
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
