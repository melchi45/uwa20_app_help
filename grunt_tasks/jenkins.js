module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return function(target){
			grunt.option("force", true);
			var taskType = null;

			switch(target){
					case 'rc':
							taskType = 'richComponents';
					break;
					case 'cm':
							taskType = 'commonModules';
					break;
					case undefined:
							taskType = 'project';
					break;
			}

			if(taskType === null){
					grunt.log.write("Please enter code correctly");
					return;
			}

			grunt.task.run([
					'clean:' + taskType,
					'htmllint:' + taskType,
					'csslint:' + taskType,
					'jshint:' + taskType
			]);
	};
};