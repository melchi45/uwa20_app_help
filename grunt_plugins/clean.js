module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			temp: [
					'.tmp'
			],
			project: [
					projectStructure.reportDir + '/*'
			],
			richComponents: [
					projectStructure.rcReportPath + '/*'
			],
			commonModules: [
					projectStructure.cmReportPath + '/*'
			],
			www: [
					projectStructure.wwwDir + '/*'
			],
			projectInDocs: [
					projectStructure.docsDir + '/*'
			],
			richComponentsInDocs: [
					projectStructure.rcDocsPath + '/*'
			],
			commonModulesInDocs: [
					projectStructure.cmDocsPath + '/*'
			],
			buildInIos: [
					'platforms/ios/build'
			]
	};
}