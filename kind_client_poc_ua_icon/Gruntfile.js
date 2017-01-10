module.exports = function(grunt) {
  var webFont = {
    icon: {
      src: 'icons/*.svg',
      dest: './fonts/Techwin-Universal-Icon',
      options: {
        syntax: 'bem',
        types: 'eot,woff2,woff,ttf,svg',
        fontFilename: 'Techwin-Universal-Icon',
        //template: 'fonts/Techwin-Universal-Icon.css',
        //rename: 'Techwin-Universal-Icon',
        templateOptions: {
          baseClass: 'tui',
          classPrefix: 'tui-',
          mixinPrefix: 'tui-'
        }
      }
    }
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    webfont: webFont
  });

  grunt.loadNpmTasks('grunt-webfont');
  grunt.registerTask('default', ['webfont']);
};
