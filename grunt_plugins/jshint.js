module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			options: {
					jshintrc: '.jshintrc',
					reporter: 'checkstyle'
			},
			project: {
					options: {
							reporterOutput: projectStructure.reportDir + '/jshint.xml'
					},
					src: projectStructure.projectJsCodePath
			},
			richComponents: {
					options: {
							reporterOutput: projectStructure.rcReportPath + '/jshint.xml'
					},
					src: projectStructure.richComponentsJsCodePath,
			},
			commonModules: {
					options: {
							reporterOutput: projectStructure.cmReportPath + '/jshint.xml'
					},
					src: projectStructure.commonModulesJsCodePath
			},
			total: {
					options: {
							reporterOutput: projectStructure.reportDir + '/jshint.xml'
					},
					src: projectStructure.totalJsCodePath
			}
	};
};