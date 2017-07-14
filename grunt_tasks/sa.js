module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;

	return function(target){

		if(!grunt.file.exists(projectStructure.customSaConfig)){
			grunt.log.errorlns("You don't have a " + projectStructure.customSaConfig + ' file.');
			return;
		}

		var customSaPath = grunt.file.readJSON(projectStructure.customSaConfig);
		var isOk = true;

		for(var i = 0, len = customSaPath.length; i < len; i++){
			var self = customSaPath[i];
			var saperatedSelf = self.split('/');
			var lastSlashReg = /\/$/;
			var haveExtension = /[\.]{1}(js)$/;

			if(lastSlashReg.test(self)){
				self = self.replace(lastSlashReg, '');
			}

			if(!grunt.file.exists(self)){
				grunt.log.errorlns(self + " is not exists.");
				isOk = false;
			}

			if(!haveExtension.test(saperatedSelf)){
				self = self + '/**';
			}

			customSaPath[i] = self;
		}

		if(!isOk){
			return;
		}

		projectStructure.customSaPath = customSaPath;

    var plato = require('plato');
		var done = this.async();
		var outputDir = projectStructure.reportDir + '/' + projectStructure.customSaDir;
    var eslintData = JSON.parse(grunt.file.read('.eslintrc').replace(/\/\/.*/g, ''));
		var options = {
			title: 'JavaScript Source Analysis',
			eslint: eslintData
		};

		plato.inspect(customSaPath, outputDir, options, done);
	};
};