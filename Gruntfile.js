module.exports = function (grunt) {
	/**
	 * help the injection of plugins, tasks in grunt_* directory
	 */
	var InjectionHelper = {
		data: {},
		add: function(name, value){
			InjectionHelper.data[name] = value;
		}
	};
	InjectionHelper.add("grunt", grunt);
	
	grunt.file.defaultEncoding = 'utf8';
	
	/**
	 * Grunt Directory
	 */
	var gruntConfig = './grunt_configs';
	var gruntPlugins = './grunt_plugins';
	var gruntTasks = './grunt_tasks';
	
	/**
	 * Load Grunt Config
	 */
	var projectStructure = require(gruntConfig + '/project_structure.js')(InjectionHelper.data);	
	
	InjectionHelper.add("projectStructure", projectStructure);
	
	/**
	 * Load Grunt Plugins
	 */
	var shell = require(gruntPlugins + '/shell.js')(InjectionHelper.data);
	var plato = require(gruntPlugins + '/plato.js')(InjectionHelper.data);
	var karma = require(gruntPlugins + '/karma.js')(InjectionHelper.data);
	var connect = require(gruntPlugins + '/connect.js')(InjectionHelper.data);
	var clean = require(gruntPlugins + '/clean.js')(InjectionHelper.data);
	var useminPlugin = require(gruntPlugins + '/usemin.js')(InjectionHelper.data);
	var useminPrepare = useminPlugin.useminPrepare;
	var usemin = useminPlugin.usemin;
	var copy = require(gruntPlugins + '/copy.js')(InjectionHelper.data);  
	var jsDoc = require(gruntPlugins + '/jsdoc.js')(InjectionHelper.data);
	var jsHint = require(gruntPlugins + '/jshint.js')(InjectionHelper.data);
	var htmlLint = require(gruntPlugins + '/htmllint.js')(InjectionHelper.data);  
	var cssLint = require(gruntPlugins + '/csslint.js')(InjectionHelper.data);
	var uglify = require(gruntPlugins + '/uglify.js')(InjectionHelper.data);
	var jsonMinify = require(gruntPlugins + '/json_minify.js')(InjectionHelper.data);
	var cssmin = require(gruntPlugins + '/cssmin.js')(InjectionHelper.data);
	var htmlmin = require(gruntPlugins + '/htmlmin.js')(InjectionHelper.data);
    
	/**
	 * Initialize the config of grunt
	 */
	grunt.initConfig({
		//Grunt Config
		projectStructure: projectStructure,

		//Grunt Plugins
		shell: shell,
		plato: plato,
		karma: karma,
		connect: connect,
		clean: clean,
		useminPrepare: useminPrepare,
		usemin: usemin,
		copy: copy,
		jsdoc: jsDoc,
		htmllint: htmlLint,
		jshint: jsHint,
		csslint: cssLint,
		uglify: uglify,
		'json-minify': jsonMinify,
		cssmin: cssmin,
		htmlmin: htmlmin
	});

	/** 
	 * Loading grunt modules that will use
	 */
	require('load-grunt-tasks')(grunt);
	
	/**
	 * Load the tasks in grunt_tasks
	 */
	(function(){
		var fs = require('fs');
		var gruntTasksFiles = fs.readdirSync(gruntTasks);
		for(var i = 0, len = gruntTasksFiles.length; i < len; i++){
			var fileName = gruntTasksFiles[i];
			
			if(fileName.indexOf(".js") === -1){
				continue;
			}
			
			var taskName = fileName.replace(/(\.js)$/, '');

			grunt.registerTask(
				taskName, 
				require(gruntTasks + '/' + fileName)(InjectionHelper.data)
			);
		}
	}());
};
