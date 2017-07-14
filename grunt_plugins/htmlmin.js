module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			options: {
					removeComments: true,
					collapseWhitespace: true
			},
			www: {
					files: [{
							expand: true,
							cwd: projectStructure.wwwDir + '/' + projectStructure.viewDir,
							src: '**/*.html',
							dest: projectStructure.wwwDir + '/' + projectStructure.viewDir
					}]
			}
	};
};