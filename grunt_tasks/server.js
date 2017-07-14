module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return function(target, mode){
			var task = null;
			if (target === 'www') {
					task = [
							'minimize',
							'connect:www'
					];
			}else if(target === "camera"){
					task = [
							'minimize:camera',
							'connect:index'
					];
				
				if(mode == "4k"){
					task[0] = task[0] + ":4k";
				}else if(mode == "9011"){
					task = [
						'connect:camera9011'
					];
				}

			}else if(target === "https"){
				task = [
					'connect:httpsApp'
				];
			}else if(target === undefined){
					task = [
							'connect:app'
					];
			}else{
					grunt.log.write("Please enter code correctly");
					return;
			}
		
			grunt.task.run(task);
	};
};