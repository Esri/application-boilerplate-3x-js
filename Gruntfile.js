function mixin(destination) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      destination[key] = source[key];
    }
  }
  return destination;
}
var banner = '/* <%= packageJson.name %> - v<%= packageJson.version %> - <%= grunt.template.to' +
  '' +
  '' +
  'day("yyyy-mm-dd") %>\n*  <%= packageJson.homepage %>\n*  Copyr' +
  'ight (c) <%= grunt.template.today("yyyy") %> Environmental Systems Research Inst' +
  'itute, Inc.\n*  Apache 2.0 License */\n';
module.exports = function (grunt) {
  //Load all depenedencies
  require('matchdep')
    .filterDev('grunt-*')
    .forEach(grunt.loadNpmTasks);

  var tsConfigContent = grunt
    .file
    .read('tsconfig.json');
  var tsconfigFile = JSON.parse(tsConfigContent);
  var tsOptions = mixin({}, tsconfigFile.compilerOptions, {
    failOnTypeErrors: true,
    fast: 'never'
  });
  var packageJson = grunt
    .file
    .read('package.json');

  // Project configuration
  grunt.initConfig({
    name: packageJson.name,
    version: packageJson.version,
    packageJson: packageJson,
    tsconfigFile: tsconfigFile,
    all: [
      './src/js/*.ts', './src/js/**/*.ts', '/.src/js/**/**/*.ts', './typings.d.ts'
    ],
    sass: {
      dist: {
        files: {
          './src/css/boilerplate.css': './src/css/boilerplate.scss'
        }
      }
    },
    tslint: {
      options: {
        configuration: grunt
          .file
          .readJSON('tslint.json')
      },
      src: {
        src: ['src/js/**/*.ts']
      }
    },
    ts: {
      options: tsOptions,
      dist: {
        files: [{
          src: ['<%= all %>']
        }]
      }
    },
    watch: {
      grunt: {
        options: {
          reload: true
        },
        files: ['Gruntfile.js'] // reload when updates are made to grunt file
      },
      css: {
        files: 'src/**/*.scss',
        tasks: ['sass']
      },
      src: {
        files: ['<%= all %>'],
        tasks: ['tslint', 'ts']
      }
    }
  });
  // Alias a group of tasks.
  grunt.registerTask('dev', ['tslint', 'ts', 'sass']);
  grunt.registerTask('build', [
    'tslint',
    'ts',
    'sass'
  ]);
};
