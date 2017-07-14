module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
			www: {
					files: projectStructure.wwwDir + 'base/locales/*.json'
			}
	};
};