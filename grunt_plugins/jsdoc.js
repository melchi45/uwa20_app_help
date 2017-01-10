module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
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
			}
	};	
};