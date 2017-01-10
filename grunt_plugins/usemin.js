module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
		useminPrepare: {
			html: projectStructure.appDir + '/index.html'
		},
		usemin: {
			html: projectStructure.wwwDir + '/index.html'
		}
	};
};