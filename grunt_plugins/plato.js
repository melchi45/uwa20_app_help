module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
		options:{
			jshint : grunt.file.readJSON('.jshintrc')
		},
		custom: {
			files: {
				'<%= projectStructure.reportDir %>/<%= projectStructure.customSaDir %>': '<%= projectStructure.customSaPath %>'
			}
		},
		project: {
			files: {
				'<%= projectStructure.reportDir %>/<%= projectStructure.saDir %>': projectStructure.projectJsCodePath
			}
		},
		richComponents: {
			files: {
				'<%= projectStructure.rcReportPath %>/<%= projectStructure.saDir %>': projectStructure.richComponentsJsCodePath
			}
		},
		commonModules: {
			files: {
				'<%= projectStructure.cmReportPath %>/<%= projectStructure.saDir %>': projectStructure.commonModulesJsCodePath
			}
		},
		total: {
			files: {
				'<%= projectStructure.reportDir %>/<%= projectStructure.saDir %>': projectStructure.totalJsCodePath
			}
		}
	};
};