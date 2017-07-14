module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;


	if(!grunt.file.exists(projectStructure.customDocsConfig)){
		grunt.log.errorlns("You don't have a " + projectStructure.customDocsConfig + ' file.');
		return;
	}

	var customDocsSrc = grunt.file.readJSON(projectStructure.customDocsConfig);
	// var isOk = true;
	var newCustomDocsSrc = [];

	for(var i = 0, len = customDocsSrc.length; i < len; i++){
		var self = customDocsSrc[i];
		var saperatedSelf = self.split('/');
		var lastSlashReg = /\/$/;
		var haveExtension = /[\.]{1}(js)$/;

		if(lastSlashReg.test(self)){
			self = self.replace(lastSlashReg, '');
		}

		if(!grunt.file.exists(self)){
			// grunt.log.errorlns(self + " is not exists.");
			// isOk = false;
		}

		if(!haveExtension.test(saperatedSelf)){
			newCustomDocsSrc.push(self + '/**/*.js');
			newCustomDocsSrc.push(self + '/*.js');
		}else{
			newCustomDocsSrc.push(self);
		}
	}

	projectStructure.customDocsSrc = newCustomDocsSrc;

	return {
			project: {
					src: projectStructure.projectJsCodePath,
					options: {
							destination: projectStructure.docsDir
					}
			},
			richComponents: {
					src: projectStructure.richComponentsJsCodePath,
					options: {
							destination: projectStructure.rcDocsPath
					}
			},
			commonModules: {
					src: projectStructure.commonModulesJsCodePath,
					options: {
							destination: projectStructure.cmDocsPath
					}
			},
			custom: {
				src: projectStructure.customDocsSrc,
				options: {
					destination: projectStructure.customDocsPath
				}
			}
	};	
};