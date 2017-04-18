var directories = [
	'app/base/scripts',
	'app/base/kind/rich_components',
	'app/base/kind/common_modules',
	'app/kind/common_modules',
	'app/scripts',
	'app/styles',
	'app/views'
];

var fileCount = 0;
var lineCount = 0;

var fs = require('fs');

function countFiles(directory){
	var files = fs.readdirSync(directory);
	for(var i = 0, ii = files.length; i < ii; i++){
		var fileName = files[i];

		if(fileName.indexOf(".") > -1){
			console.log("file name: ", directory + "/" + fileName);
			lineCount += fs.readFileSync(directory + "/" + fileName).toString().split('\n').length;
			fileCount++;
		}else{
			countFiles(directory + "/" + fileName);
		}
	}
}

for(var i = 0, ii = directories.length; i < ii; i++){
	countFiles(directories[i]);
}

console.log("Total Files :", fileCount);
console.log("Total Line :", lineCount);