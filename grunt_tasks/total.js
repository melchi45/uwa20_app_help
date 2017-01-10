module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return function(){
			grunt.option('force', true);
			grunt.task.run([
					'minimize',
					'clean:project',
					'plato:total',
					'karma:total',
					'htmllint:total',
					'csslint:total',
					'jshint:total'
			]);
	};
};