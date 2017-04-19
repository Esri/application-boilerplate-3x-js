module.exports = function (grunt) {

  function loadPostCssPlugin(name) {
    var plugin;

    try {
      plugin = require(name);
      return plugin;
    }
    catch (error) {
      plugin = Function.prototype;  // no-op
      console.log(error.message + ' used by task postcss');
    }

    return plugin;
  }

  // Project configuration.
  grunt.initConfig({
    releaseDir: 'dist',
    watch: {
      styles: {
        options: {
          spawn: false
        },
        files: ['dist/styles/**/*.scss'],
        tasks: ['styles']
      },
      ts: {
        options: {
          spawn: false
        },
        files: ["src/**/*.ts"],
        tasks: ['ts']
      }
    },
    ts: {
      default: {
        src: ["src/**/*.ts"],
        tsconfig: './tsconfig.json'
      },
      options: {
        fast: 'never'
      }
    },
    sass: {
      options: {
        outputStyle: 'compressed'
      },
      dist: {
        files: [{
          expand: true,
          src: ['dist/styles/**/*.scss'],
          ext: '.css'
        }]
      }
    },
    postcss: {
      options: {
        processors: [
          loadPostCssPlugin('autoprefixer')(),
          loadPostCssPlugin('postcss-normalize-charset')()
        ]
      },
      dist: {
        src: ['dist/styles/**/*.css']
      }
    }
  });

  // Load grunt plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks("grunt-ts");

  // Register tasks
  grunt.registerTask('styles', 'compile & autoprefix CSS', ['sass']);
  grunt.registerTask('default', ['watch']);
};
