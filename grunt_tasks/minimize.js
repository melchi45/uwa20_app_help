module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return function(target, mode){
			grunt.option("force", true);
      
			var task = '';
			if(target == undefined){
					//Mobile, 9081
					task = [
							'shell:less', //less 파일은 css로 바꿈
							'shell:updateUWAVersion',
							'clean:temp', //.tmp폴더 삭제
							'clean:www', //www폴더 비우기
							'useminPrepare:html', //usemin prepare 모듈 사용
							'concat', //app/index.html에 정의된 주석을 기준으로 파일 Concat
							'copy:temp', //Concat 된 파일 www로 복사
							'copy:bootstrapFonts', // app/kind에 있는 bootstrap 라이브러리의 font를 www로 옮김
							'copy:fontAwesomeFonts', // app/kind에 있는 font awesome 라이브러리의 font를 www로 옮김
							'copy:jQueryUiImage', // app/kind에 있는 jQuery UI 라이브러리의 image를 www로 옮김
							'copy:app', //images, fonts, views 폴더 등 app에서 www로 이동
							'copy:techwinIconInApp', // app/styles에 techwin 아이콘을 www로 옮김
							'copy:notoSansInApp',  // app/styles에 noto sans 폰트를 www로 옮김
							'usemin:html', //www/index.html에 정의된 주석을 기준으로 <script>, <link> 태그 생성
					];
			}else if(target == "camera"){
					//9081
					task = [
							'shell:less',
							'shell:updateUWAVersion',
							'clean:temp',
							'clean:www',
							'useminPrepare:html',
							'concat',
							'copy:temp',
							'copy:bootstrapFonts',
							'copy:fontAwesomeFonts',
							'copy:jQueryUiImage',
							'copy:app',
							'mode:camera',
							'uglify:www',
							'shell:modifyOnlineHelpIndex',
							'json-minify:www',
							'cssmin:www',
							'htmlmin:www',
							'copy:techwinIconInApp',
							'copy:notoSansInApp',
							'usemin:html',
					];
				
					if(mode === "4k"){
						task.splice(11, 0, "mode:4k");
					}
			}else if(target == "cam"){
				task = [
					'shell:less',
					'clean:temp',
					'clean:www',

					'copy:indexHtmlToWww',
					'shell:removeLessInIndex',
					'shell:removeCordova',
					'shell:remove9011File',

					'useminPrepare:html',
					'concat', 
					'copy:temp',

					'copy:indexHtmlToApp',
					'shell:remove9011Menu',

					'copy:bootstrapFonts',
					'copy:fontAwesomeFonts',
					'copy:jQueryUiImage',
					'copy:app'
				];

				if(mode == "9011"){
					task.splice(6, 1); //remove9011File
					task.splice(10, 1); //remove9011Menu
					task.push("copy:views9011");
				}

				task.push('copy:techwinIconInApp');
				task.push('copy:notoSansInApp');
				task.push('usemin:html');
			}else{
				console.log("Please enter code correctly.");
				return;
			}

			task.push('shell:removeLessInIndex');
			grunt.task.run(task);
	};
};