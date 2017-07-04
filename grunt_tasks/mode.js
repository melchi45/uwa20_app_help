module.exports = function(injection){
	var projectStructure = injection.projectStructure;
	var grunt = injection.grunt;
	return function(target){
		switch(target){
			case "4k":
				var	mainHtmlPath = [
					projectStructure.wwwDir,
					'/',
					projectStructure.viewDir,
					'/',
					projectStructure.livePlayback,
					'/main.html'
				].join('');
				
				var mainHtmlData = grunt.file.read(mainHtmlPath);
				mainHtmlData = mainHtmlData.replace('#/setup/basic_videoProfile', '/home/setup/basic_videoprofile.cgi');
				grunt.file.write(mainHtmlPath, mainHtmlData);
			break;
			case "camera":
				var customJsPath = [
					projectStructure.wwwDir,
					'/',
					projectStructure.jsDir,
					'/customs.js',
				].join('');
			
				var customJsData = grunt.file.read(customJsPath);
				customJsData = customJsData.replace(/(serverType:)([\s]{0,})([\'\"]{1}grunt[\'\"]{1})/, "serverType: 'camera'");
				grunt.file.write(customJsPath, customJsData);
			break;
			case "s1":
				var customJsPath = [
					projectStructure.wwwDir,
					'/',
					projectStructure.jsDir,
					'/customs.js',
				].join('');
			
				var customJsData = grunt.file.read(customJsPath);
				customJsData = customJsData.replace(/(serverType:)([\s]{0,})([\'\"]{1}grunt[\'\"]{1})/, "serverType: 's1'");
				grunt.file.write(customJsPath, customJsData);
			break;
		}
	}
};