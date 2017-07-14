module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			options: {
					csslintrc: '.csslintrc',
					import: false
			},
			project: {
					options: {
							formatters: [
								{ 
										id: 'csslint-xml',
										dest: projectStructure.reportDir + '/csslint.xml'
								}
							]
					},
					src: [projectStructure.appCssPath + '/**/*.css']
			},
			richComponents: {
					options: {
							formatters: [
								{ 
										id: 'csslint-xml',
										dest: projectStructure.rcReportPath + '/csslint.xml'
								}
							]
					},
					src: [projectStructure.rcDirPath + '/**/*.css']
			},
			commonModules: {
					options: {
							formatters: [
								{ 
										id: 'csslint-xml',
										dest: projectStructure.cmReportPath + '/csslint.xml'
								}
							]
					},
					src: [projectStructure.cmDirPath + '/**/*.css']
			},
			total: {
					options: {
							formatters: [
								{ 
										id: 'csslint-xml',
										dest: projectStructure.reportDir + '/csslint.xml'
								}
							]
					},
					src: [
							projectStructure.appCssPath + '/**/*.css',
							projectStructure.rcDirPath + '/**/*.css',
							projectStructure.cmDirPath + '/**/*.css'
					]
			}
	};
};