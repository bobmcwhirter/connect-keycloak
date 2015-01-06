
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    doxx: {
      all: {
        src: '.',
        target: 'doc',
        options: {
          ignore: 'Gruntfile.js,node-registerer.js,uuid.js,middleware,stores,node_modules,.git',
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', '*.js', 'middleware/*.js', 'stores/*.js', 'test/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-doxx');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'doxx']);

};

