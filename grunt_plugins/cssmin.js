module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			www: {
					files: [{
							expand: true,
							cwd: projectStructure.wwwCssPath,
							src: '*.css',
							dest: projectStructure.wwwCssPath
					}]
			}
	};
};