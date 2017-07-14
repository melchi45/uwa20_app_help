module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return function(target){
		var pluginList = [
			"cordova-plugin-file",
			"cordova-plugin-whitelist",
			"cordova-plugin-console",
			"ionic-plugin-keyboard"
		];

		var tasks = [];

		if(target == "ios"){
			tasks.push('clean:buildInIos');
		}
		
		grunt.option('force', true);

		if(!grunt.file.exists('./platforms')){
			tasks.push('copy:platformsForBuild');
			grunt.log.writeln("Oh! You don't have a platforms. I will fix this. :)");
		}

		if(!grunt.file.exists('./plugins')){
			tasks.push('copy:pluginsForBuild');
			grunt.log.write("Oh! You don't have a plugins. I will fix this. :)");
		}
		
		var removeCordovaPlugin = "shell:removeCordovaPlugin:";
		var addCordovaPlugin = "shell:addCordovaPlugin:";
		
		for(var i = 0, len = pluginList.length; i < len; i++){
			var pluginName = pluginList[i];
			tasks.push(removeCordovaPlugin + pluginName);
			tasks.push(addCordovaPlugin + projectStructure.originalPlugins + '/' + pluginName);
		}
		
		grunt.task.run(tasks);
	};
};