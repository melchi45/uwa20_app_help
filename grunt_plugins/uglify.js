module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			options: {
					mangle: false,
					compress: false
			},
			www: {
					files: [{
							expand: true,
							cwd: projectStructure.wwwJsPath,
							src: '*.js',
							dest: projectStructure.wwwJsPath
					}]
			}
	};
};