/**
 * shell module of grunt
 */
module.exports = function(injection){
	var grunt = injection.grunt;
	var projectStructure = injection.projectStructure;
	return {
		androidUpdateProj: {
				command: 'android update project -p platforms/android'
		},
		cordovaBuildAndroid: {
				command: 'cordova build android',
				options: {
						execOptions: {
								maxBuffer: Infinity
						}
				}
		},
		cordovaBuildIOS: {
				command: 'cordova build ios',
				options: {
						execOptions: {
								maxBuffer: Infinity
						}
				}
		},
		removeCordovaPlugin: {
				command: function(pluginId){
						return 'cordova plugin remove ' + pluginId;
				},
				options: {
						failOnError: false,
						stderr: false
				}
		},
		removeLessInIndex: {
				command: function(){
					var filePath = projectStructure.wwwDir + '/index.html';
					var data = grunt.file.read(filePath);

					data = data.replace('<link href="styles/less/app.less" rel="stylesheet/less">', '');
					data = data.replace('<script src="external-lib/less/dist/less.js"></script>', '');

					grunt.file.write(filePath, data);
					//Temporary Added

					return 'git --version';
				}
		},
		modifyOnlineHelpIndex: {
			command: function(){
				var filePath = projectStructure.wwwDir + '/views/help/index.html';

				if(grunt.file.exists(filePath) === false){
					console.error(filePath + "is not exists!!");
					return 'git --version';
				}

				var data = grunt.file.read(filePath);
				var removeFilePath = [
					"<!-- endbuild -->",
					'<link href="../../external-lib/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">',
					'<link href="../../external-lib/font-awesome/css/font-awesome.min.css" rel="stylesheet">',
					'<link href="../../external-lib/jquery-ui/jquery-ui.css" rel="stylesheet">',
					'<link href="../../external-lib/nvd3/build/nv.d3.min.css" rel="stylesheet">',
					'<link href="../../external-lib/fullcalendar/fullcalendar.min.css" rel="stylesheet">',
					'<link href="../../base/kind/common_modules/kind_client_cm_strm-display/display.css" rel="stylesheet">',
					'<link href="../../base/external-modules/vis/vis.css" rel="stylesheet">',
					'<link href="../../styles/fonts/notosans.css" rel="stylesheet">',
					'<link href="../../styles/fonts/Techwin-Universal-Icon/icons.css" rel="stylesheet">',
					'<link href="../../styles/plugins/nouslider/jquery.nouislider.css" rel="stylesheet">',
					'<link href="../../styles/plugins/rzslider/rzslider.min.css" rel="stylesheet">',
					'<link href="../../styles/plugins/datapicker/angular-datapicker.css" rel="stylesheet">',
					'<link href="../../styles/setup/setup.css" rel="stylesheet">',
					'<link href="../../styles/setup/cameraSetup.css" rel="stylesheet">',
					'<link href="../../styles/setup/eventSchedule.css" rel="stylesheet">',
					'<link href="../../styles/setup/ptz.css" rel="stylesheet">',
					'<link href="../../styles/animate.css" rel="stylesheet">',
					'<link href="../../styles/style.css" id="loadBefore" rel="stylesheet">',
					'<link href="../../styles/common.css" rel="stylesheet">',
					'<link href="../../styles/app.css" rel="stylesheet">',
					'<link href="../../styles/page-common.css" rel="stylesheet">',
					'<link href="../../styles/less/app.less" rel="stylesheet/less">',
					'<script src="../../external-lib/jquery/jquery.js"></script>',
					'<script src="../../external-lib/jquery-ui/jquery-ui.min.js"></script>',
					'<script src="../../external-lib/jquery-ui/jquery.ui.touch-punch.min.js"></script>',
					'<script src="../../external-lib/metisMenu/jquery.metisMenu.js"></script>',
					'<script src="../../external-lib/angular/angular.js"></script>',
					'<script src="../../external-lib/angular-ios9-uiwebview-patch/angular-ios9-uiwebview-patch.js"></script>',
					'<script src="../../external-lib/angular-mocks/angular-mocks.js"></script>',
					'<script src="../../external-lib/angular-sanitize/angular-sanitize.min.js"></script>',
					'<script src="../../external-lib/angular-translate/angular-translate.min.js"></script>',
					'<script src="../../external-lib/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js"></script>',
					'<script src="../../external-lib/ui-router/angular-ui-router.min.js"></script>',
					'<script src="../../external-lib/bootstrap/dist/js/bootstrap.min.js"></script>',
					'<script src="../../external-lib/fullcalendar/moment.min.js"></script>',
					'<script src="../../external-lib/fullcalendar/fullcalendar.min.js"></script>',
					'<!-- ui-bootstrap-tpls-0.14.3 is modified due to Datepicker Issue, so that is renamed. -->',
					'<script src="../../external-lib/angular-bootstrap/ui-bootstrap-tpls-0.14.3-custom.js"></script>',
					'<script src="../../external-lib/angular-animate/angular-animate.js"></script>',
					'<script src="../../external-lib/angular-touch/angular-touch.min.js"></script>',
					'<script src="../../external-lib/bower-angular-cookies-master/angular-cookies.js"></script>',
					'<script src="../../external-lib/datapicker/angular-datepicker.js"></script>',
					'<script src="../../external-lib/oclazyload/dist/ocLazyLoad.min.js"></script>',
					'<script src="../../external-lib/hammer.js/hammer.js"></script>',
					'<script src="../../external-lib/rzslider/rzslider.min.js"></script>',
					'<script src="../../external-lib/ng-pattern-restrict/ng-pattern-restrict.min.js"></script>',
					'<script src="../../external-lib/d3/d3.min.js"></script>',
					'<script src="../../external-lib/nvd3/build/nv.d3.min.js"></script>',
					'<script src="../../external-lib/angular-nvd3/dist/angular-nvd3.min.js"></script>',
					'<script src="../../external-lib/less/dist/less.js"></script>',
					'<script src="../../scripts/controllers/help/onlineHelpCtrl.js"></script>'
				];

				var createFile = [
					{
						from: '<!-- build:css ../../styles/libraries.css -->',
						to: '<link href="../../styles/libraries.css" rel="stylesheet">'
					},
					{
						from: '<!-- build:css ../../styles/customs.css -->',
						to: '<link href="../../styles/customs.css" rel="stylesheet">'
					},
					{
						from: '<!-- build:js ../../scripts/base_component.js -->',
						to: '<script src="../../scripts/base_component.js"></script>'
					},
					{
						from: '<!-- build:js ../../scripts/online_help.js -->',
						to: '<script src="../../scripts/online_help.js"></script>'
					}
				];

				for(var i = 0, ii = removeFilePath.length; i < ii; i++){
					data = data.replace(new RegExp(removeFilePath[i], 'gm'), '');	
				}

				for(var i = 0, ii = createFile.length; i < ii; i++){
					var self = createFile[i];
					data = data.replace(self.from, self.to);		
				}

				grunt.file.write(filePath, data);
				return 'git --version';
			}
		},
		removeCordova: {
				command: function(){
					var filePath = projectStructure.wwwDir + '/index.html';
					var data = grunt.file.read(filePath);

					data = data.replace('<script src="cordova.js"></script>', '');

					grunt.file.write(filePath, data);

					return 'git --version';
				}
		},
		remove9011File: {
			command: function(){
				var filePath = projectStructure.appDir + '/index.html';
				var data = grunt.file.read(filePath);
				//Temporary Added
				data = data.replace('<script src="scripts/controllers/setup/peoplecounting/statistics.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/peoplecounting/setup.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/heatmap/statistics.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/heatmap/setup.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/peoplecounting/modals/alert_modal_ctrl.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/peoplecounting/modals/confirm_modal_ctrl.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/peoplecounting/modals/report_modal_ctrl.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/peoplecounting/modals/add_slave_modal_ctrl.js"></script>', '');
				data = data.replace('<script src="scripts/controllers/setup/heatmap/modals/hm_report_modal_ctrl.js"></script>', '');
				data = data.replace('<script src="scripts/models/setup/peoplecounting.js"></script>', '');
				data = data.replace('<script src="scripts/models/setup/heatmap.js"></script>', '');
				data = data.replace('<script src="scripts/services/setup/peoplecounting/svg_line.js"></script>', '');
				data = data.replace('<script src="scripts/services/setup/peoplecounting/canvas_rectangle.js"></script>', '');
				data = data.replace('<script src="scripts/services/setup/peoplecounting/dsv_parser.js"></script>', '');
									
				grunt.file.write(filePath, data);

				return 'git --version';
			}
		},
		remove9011Menu: {
			command: function(){
				//Temporary Added
				var filePath = projectStructure.wwwDir + '/' + projectStructure.jsDir + '/customs.js';
				var data = grunt.file.read(filePath);
				data = data.replace('var usePCHM = true;', 'var usePCHM = false;');
				data = data.replace('var usePCHM=true;', 'var usePCHM=false;');
				
				grunt.file.write(filePath, data);
				return 'git --version';
			}
		},
		addCordovaPlugin: {
				command: function(pluginPath){
						return 'cordova plugin add ' + pluginPath;
				},
				options: {
						failOnError: false,
						stderr: false
				}
		},
		updateUWAVersion: {
			command: function(){
				try {
					var versionFilePath = './version.txt';
					var versionData = grunt.file.read(versionFilePath);
					var uwaConfigPath = './app/base/scripts/config/application_config.js';
					var uwaConfigData = grunt.file.read(uwaConfigPath);

					versionData = versionData.split(/\r?\n/);

					uwaConfigData = uwaConfigData
										.replace(/(BRANCH:)([\s]{0,})([\'\"]{1}[0-9a-zA-Z\/\-\_]{0,40}[\'\"]{1})/, "BRANCH: '" + versionData[0] + "'")
										.replace(/(CODE:)([\s]{0,})([\'\"]{1}[0-9]{0,5}[\'\"]{1})/, "CODE: '" + versionData[1] + "'")
										.replace(/(VERSION:)([\s]{0,})([\'\"]{1}[0-9a-zA-Z.]{0,15}[\'\"]{1})/, "VERSION: '" + versionData[2] + "'")
					
					grunt.file.write(uwaConfigPath, uwaConfigData);
				}catch(e){
					console.log(e);
				}

				return 'node --version';
			}
		},
		less: {
				command: function(){
          return 'node node_modules/less/bin/lessc ' + projectStructure.appCssPath + '/less/app.less ' + projectStructure.appCssPath + '/app.css';
        }
		},
		languages: {
				command: 'node languages/UWA2_vba/Check_languages.js'
		}
	};
};