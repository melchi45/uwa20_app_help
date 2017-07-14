module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			options: {
					reporter: 'checkstyle'
			},
			project: {
					options: {
							reporterOutput: projectStructure.reportDir + '/htmllint.xml'
					},
					src: [
							projectStructure.appDir + '/index.html',
							projectStructure.appViewPath + '/*.html'
					]
			},
			richComponents: {
					options: {
							reporterOutput: projectStructure.rcReportPath + '/htmllint.xml'
					},
					src: [
							projectStructure.rcDirPath + '/*/*.html'
					]
			},
			commonModules: {
					options: {
							reporterOutput: projectStructure.cmReportPath + '/htmllint.xml'
					},
					src: [
							projectStructure.cmDirPath + '/*/*.html'
					]
			},
			total: {
					options: {
							reporterOutput: projectStructure.reportDir + '/htmllint.xml'
					},
					src: [
							projectStructure.appDir + '/index.html',
							projectStructure.appViewPath + '/*.html',
							projectStructure.rcDirPath + '/*/*.html',
							projectStructure.cmDirPath + '/*/*.html'
					]
			}
	};
};