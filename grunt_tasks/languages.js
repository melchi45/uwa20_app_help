module.exports = function(injection){
	var grunt = injection.grunt;
	return function(){
		grunt.task.run('shell:languages');
	};
};