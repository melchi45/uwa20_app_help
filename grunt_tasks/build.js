module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	var buildOption = grunt.file.readJSON('build_option.json');

	function modifyCameraOption(cameraOption){
			//Change Config in app/scripts/config/camera_option.js
			var filePath = buildOption.jsFilePath;
			//read file
			var fileContext = grunt.file.read(filePath);
			if(fileContext.length == 0){
					fileContext = "kindFramework.constant('CAMERA_TYPE','" + cameraOption + "');";
			}else{
					//remove space in file
					var removeSpaceReg = /(\s){0,}/gim;
					fileContext = fileContext.replace(removeSpaceReg, '');

					//replace camera option in file
					var reg = /(\,){1}([\w\W]){0,}(\);){1}/gim;
					fileContext = fileContext.replace(reg, ",'" + cameraOption + "');");
			}

			grunt.file.write(filePath, fileContext);
	}
	
	return function(cameraOption, target){ 
			grunt.option("force", true);

			var task = [
					'shell:less',
					'minimize'
			];

			if(!grunt.file.exists('./platforms')){
					task.unshift('copy:platformsForBuild');
			}

			if(!grunt.file.exists('./plugins')){
					task.unshift('copy:pluginsForBuild');
			}

			var cameraOptionsConfig = buildOption.cameraOption;

			var validateOption = function(){
					var isOk = false;

					if(cameraOption === 'none'){
							isOk = true;
					}else{
							for(var i = 0, len = cameraOptionsConfig.length; i < len; i++){
									if(cameraOption == cameraOptionsConfig[i]){
											isOk = true;
									}
							}
					}

					return isOk;
			};

			if( !validateOption(cameraOptionsConfig) ){
					grunt.log.write("Please enter a option of camera correctly.");
					return;
			}
		
			if(target == "ios"){
				task.push('clean:buildInIos');
			}

			if(cameraOption !== 'none'){
					modifyCameraOption(cameraOption);

					var pluginPath = 'plugins/';
					var CordovaPluginPath = buildOption.cordovaPluginPath + '/';
					var prefix = 'cordova-plugin-';

					//Remove Plugins
					if(grunt.file.exists(pluginPath + "cordova-plugin-nativePlugin")){
							task.push('shell:removeCordovaPlugin:cordova-plugin-nativePlugin');
					}

					//add Plugin
					var reg = /(\-){1}/gim;
					var pluginPathThatAdd = CordovaPluginPath + prefix.replace(reg,'_') + cameraOption + '_' + target;
					if(grunt.file.exists(pluginPathThatAdd)){
							task.push('shell:addCordovaPlugin:' + pluginPathThatAdd);
					}
			}

			if(target =='android'){
					task.push('shell:androidUpdateProj');
					task.push('shell:cordovaBuildAndroid');
			}else if(target == 'ios'){
					task.push('shell:cordovaBuildIOS');
			}else{
					grunt.log.write("Please enter target correctly");
					return;
			}

			grunt.task.run(task);
	};
};