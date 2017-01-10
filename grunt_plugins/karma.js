module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			options: {
					configFile: 'karma.conf.js',
					singleRun: true
			},
			project: {
					options: {
							files: [
									//libraries
									projectStructure.wwwJsPath + '/base_components.js',

									projectStructure.rcDirPath + '/initialization/module.config.js',
									projectStructure.rcDirPath + '/initialization/module.js',

									//framework
									projectStructure.wwwJsPath + '/kind_components.js',

									projectStructure.appJsPath + '/!(init)/*.js',
									projectStructure.appJsPath + '/!(init)/**/*.js',

									//custom spec
									projectStructure.tcDir + '/*.js',
									projectStructure.tcDir + '/**/*.js'
							],
							preprocessors: {
									'<%= projectStructure.appJsPath %>/!(init)/*.js' : 'coverage'
							},
							htmlReporter: {
									outputDir: projectStructure.reportDir + '/' + projectStructure.utDir
							},
							coverageReporter: {
									type: 'html',
									dir: projectStructure.reportDir + '/' + projectStructure.cvrgDir
							}
					}
			},
			richComponents: {
					options: {
							files: [
									projectStructure.bcDirPath + '/angular/angular.min.js',
									projectStructure.bcDirPath + '/angular-mocks/angular-mocks.js',

									projectStructure.rcDirPath + '/initialization/module.config.js',
									projectStructure.rcDirPath + '/initialization/module.js',

									projectStructure.rcDirPath + '/**/*config.js',
									projectStructure.rcDirPath + '/**/*.js',
									projectStructure.rcDirPath + '/**/*spec.js'
							],
							preprocessors: {
									'<%= projectStructure.rcDirPath %>/**/*.js' : 'coverage'
							},
							htmlReporter: {
									outputDir: projectStructure.rcReportPath + '/' + projectStructure.utDir
							},
							coverageReporter: {
									type: 'html',
									dir: projectStructure.rcReportPath + '/' + projectStructure.cvrgDir
							}
					}
			},
			commonModules: {
					options: {
							files: [
									projectStructure.bcDirPath + '/angular/angular.min.js',
									projectStructure.bcDirPath + '/angular-mocks/angular-mocks.js',

									projectStructure.rcDirPath + '/initialization/module.config.js',
									projectStructure.rcDirPath + '/initialization/module.js',

									projectStructure.cmDirPath + '/**/*config.js',
									projectStructure.cmDirPath + '/**/*.js',
									projectStructure.cmDirPath + '/**/*spec.js'
							],
							preprocessors: {
									'<%= projectStructure.cmDirPath %>/**/*.js' : 'coverage'
							},
							htmlReporter: {
									outputDir: projectStructure.cmReportPath + '/' + projectStructure.utDir
							},
							coverageReporter: {
									type: 'html',
									dir: projectStructure.cmReportPath + '/' + projectStructure.cvrgDir
							}
					}
			},
			total: {
					options: {
							files: [
									//libraries
									projectStructure.wwwJsPath + '/base_components.js',

									projectStructure.rcDirPath + '/initialization/module.config.js',
									projectStructure.rcDirPath + '/initialization/module.js',

									//framework
									projectStructure.wwwJsPath + '/kind_components.js',

									projectStructure.appJsPath + '/!(init)/*.js',

									//custom spec
									projectStructure.tcDir + '/*.js',
									projectStructure.tcDir + '/**/*.js',

									projectStructure.rcDirPath + '/**/*config.js',
									projectStructure.rcDirPath + '/**/*.js',
									projectStructure.rcDirPath + '/**/*spec.js',

									projectStructure.cmDirPath + '/**/*config.js',
									projectStructure.cmDirPath + '/**/*.js',
									projectStructure.cmDirPath + '/**/*spec.js'
							],
							preprocessors: {
									'<%= projectStructure.appJsPath %>/kind.js' : 'coverage',
									'<%= projectStructure.appJsPath %>/!(init)/*.js' : 'coverage',
									'<%= projectStructure.rcDirPath %>/**/*.js' : 'coverage',
									'<%= projectStructure.cmDirPath %>/**/*.js' : 'coverage'
							},
							htmlReporter: {
									outputDir: projectStructure.reportDir + '/' + projectStructure.utDir
							},
							coverageReporter: {
									type: 'html',
									dir: projectStructure.reportDir + '/' + projectStructure.cvrgDir
							}
					}
			}
	};
};