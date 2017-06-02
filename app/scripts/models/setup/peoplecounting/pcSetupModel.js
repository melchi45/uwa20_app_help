/* global setTimeout */
"use strict";

kindFramework.factory('PcSetupModel', function($q, $interval, pcSetupService, $translate){
	var PeopleCountingModel = function(){
		if(!(this instanceof PeopleCountingModel)){
			return new PeopleCountingModel();
		}

		var channelIndex = 0;
		var asyncInterrupt = false;
		var interruptMessage = "interrupt with cancel";
		this.getInterruptMessage = function(){
			return interruptMessage;
		};

		var lang = {
			statisticsTitle: 'lang_statistics', 
			peoplecounting: 'lang_peoplecounting', 
			setupTitle: 'lang_setup',
			cancle: 'lang_cancel',
			apply: 'lang_apply',
			realTime: {
				title: 'lang_realtime', 
				undefined: {
					title: '', //in lang init
					setup: 'lang_setup'
				},
				peopleCountDisalbed: '',  //in lang init
				counting: {
					title: 'lang_counting', 
					no: 'lang_num',
					ruleName: 'lang_rulename', 
					in: 'lang_in', 
					out: 'lang_out'
				},
				graph: {
					title: 'lang_graph', 
					today: 'lang_today',
					week: 'lang_weekly' 
				}
			},
			conditions: {
				title: 'lang_search',
				rule: {
					title: '',  //in lang init
					firstRule: '',  //in lang init
					secondRule: '',  //in lang init
					in: 'lang_in', 
					out: 'lang_out', 
					search: 'lang_search',
					report: 'lang_download' 
				}
			},
			results: {
				title: 'lang_results',
				graph: {
					title: 'lang_graph',
					in: 'lang_in',
					out: 'lang_out'
				},
				table: {
					title: 'lang_table',
					camera: 'lang_Camera',
					sum: 'lang_sum'
				},
				noResults: 'lang_msg_no_result'
			},
			ruleSetup: {
				title: 'lang_setup',
				common: {
					use: 'lang_enable'
				},
				countingRule: {
					title: 'lang_countingrule',
					no: 'lang_num',
					ruleName: 'lang_rulename',
					noName: 'lang_msg_noname',
					duplicatedName: 'lang_msg_name_duplicate'
				}
			},
			calibration: {
				title: 'lang_calibration',
				usage: '' //in lang init
			},
			modal: {
				alert: 'lang_alert',
				ruleGuide: 'lang_ruleguide',
				selectCamera: 'lang_msg_rule_select'
			}
		};

		(function langInit(){
			var undefinedTitle = [
				$translate.instant('lang_msg_norule'),
				' ',
				$translate.instant('lang_msg_addrule').replace('%1', $translate.instant('lang_setup'))
			];

			var peoplecount = $translate.instant('lang_peoplecounting');
			var heatmap = $translate.instant('lang_heatmap');

			var peopleCountDisalbed = $translate.instant('lang_msg_please_enable').replace('%1', peoplecount);
			var rule = $translate.instant('lang_rule');

			var calibrationGuide = [
				$translate.instant('lang_msg_calibration_guide_1'),
				'&nbsp;',
				$translate.instant('lang_msg_calibration_guide_2').replace('%1', peoplecount + ', ' + heatmap)
			];

			lang.realTime.undefined.title = undefinedTitle.join('');
			lang.realTime.peopleCountDisalbed = peopleCountDisalbed;

			lang.conditions.rule.title = rule.replace('%1', '').replace(' ', '');
			lang.conditions.rule.firstRule = rule.replace('%1', '01');
			lang.conditions.rule.secondRule = rule.replace('%1', '02');

			lang.calibration.usage = calibrationGuide.join('');
		})();

		this.getStLang = function(){
			return lang;
		};

		var eventSourcesCgi = {
			peoplecount: {
				view: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'peoplecount',
						action: 'view',
						data: {},
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				check: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'peoplecount',
						action: 'check',
						data: {},
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				set: function(data, successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'peoplecount',
						action: 'set',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			},
			videoanalysis: {
				view: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'videoanalysis',
						action: 'view',
						data: {},
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			}
		};

		var systemCgi = {
			deviceInfo: {
				view: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'system',
						msubmenu: 'deviceinfo',
						action: 'view',
						data: {},
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			}
		};

		var eventRulesCgi = {
			masterslave: {
				view: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventrules',
						msubmenu: 'masterslave',
						action: 'view',
						data: {
							Type: 'PeopleCount'
						},
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			}
		};

		var recordingCgi = {
			peoplecountsearch: {
				control: function(data, successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'recording',
						msubmenu: 'peoplecountsearch',
						action: 'control',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				view: function(data, successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'recording',
						msubmenu: 'peoplecountsearch',
						action: 'view',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			}
		};

	  	var cameraLocalTime = {
			data: '',
			set: function(localTime){
				cameraLocalTime.data = localTime;
			},
			getDateObj: function(){
				return new Date(cameraLocalTime.data);
			}
		};

		this.initModel = function(){
			var deferred = $q.defer();
			pcSetupService.getCameraLocalTime(
				function(localTime){
					cameraLocalTime.set(localTime);
					deferred.resolve();
				},
				function(errorData){
					deferred.reject(errorData);
				}
			);

			return deferred.promise;
		};

		var lineName = {
			data: [],
			set: function(index, name){
				lineName.data[index - 1] = name;
			},
			get: function(){
				return lineName.data;
			}
		};
		
		var masterName = {
			data: '',
			set: function(name){
				masterName.data = name;
			},
			get: function(){
				return masterName.data;
			}
		};

		function addZero(data){
			if(data < 10){
				data = "0" + data;
			}	

			return data;
		}

		function getSunapiDateFormat(timeStamp){
			var d = new Date(timeStamp);
			var year = d.getFullYear();
			var month = addZero(d.getMonth() + 1);
			var date = addZero(d.getDate());
			var hours = addZero(d.getHours());
			var minutes = addZero(d.getMinutes());
			var seconds = addZero(d.getSeconds());

			var dateFormat = [
				year,
				'-',
				month,
				'-',
				date,
				'T',
				hours,
				':',
				minutes,
				':',
				seconds,
				'Z',
			];

			return dateFormat.join('');
		}

		var searchToken = null;

		var getSearchData = function(searchOptions){
			var deferred = $q.defer();

			var searchControl = recordingCgi.peoplecountsearch.control;
			var searchView = recordingCgi.peoplecountsearch.view;
			

			function failCallback(errorData){
				if(asyncInterrupt === true){
					errorData = interruptMessage;
				}

				console.log("getSearchData Error", errorData);
				deferred.reject(errorData);
			}

			function controlSuccessCallback(response){
				searchToken = response.data.SearchToken;
				requestSearchView();
			}

			function requestSearchView(){
				searchView(
					{
						Type: 'Status',
						SearchToken: searchToken
					},
					viewStatusSuccessCallback,
					failCallback
				);
			}

			function viewStatusSuccessCallback(response){
				if(response.data.Status === "Completed"){
					searchView(
						{
							Type: 'Results',
							SearchToken: searchToken
						},
						viewResultSuccessCallback,
						failCallback
					);
				}else{
					requestSearchView();
				}
			}

			function viewResultSuccessCallback(response){
				var responseData = response.data;
				var resultInterval = responseData.ResultInterval;
				var lineResults = responseData.PeopleCountSearchResults[channelIndex].LineResults;
				var responseData = [];

				for(var i = 0, len = lineResults.length; i < len; i++){
					var lineSelf = lineResults[i];

					for(var j = 0,jLen = lineSelf.DirectionResults.length; j < jLen; j++){
						var directionSelf = lineSelf.DirectionResults[j];
						if(typeof directionSelf.Result !== "undefined"){
							var data = {
								name: '',
								direction: '',
								results: []
							};
							var results = directionSelf.Result.split(',');

							data.name = lineSelf.Line;
							data.direction = directionSelf.Direction.toLowerCase() === "in" ? 
								$translate.instant(lang.realTime.counting.in) : 
								$translate.instant(lang.realTime.counting.out);
							data.results = fillterResults(results, resultInterval);

							responseData.push(data);
						}
					}
				}

				responseData.resultInterval = resultInterval;

				searchToken = null;
				deferred.resolve(responseData);
			}

			function fillterResults(results, resultInterval){
				var fillterData = [];

				var changeDateObj = function(str){
					str = str.replace('T',' ').replace('Z', '');
					str = str.split(' ');
					str[0] = str[0].split('-');
					str[1] = str[1].split(':');

					str = new Date(
						str[0][0],
						str[0][1] - 1,
						str[0][2],
						str[1][0],
						str[1][1],
						str[1][2]
					);

					return str;
				};

				/**
				 * Graph format is <Full Year><Month><Date><Hours><Minutes><Seconds>
				 * 2014-07-11 11:23:32 => 20140711112332
				 */
				var changeFormatForGraph = function(dateObj){
					var year = dateObj.getFullYear();
					var month = addZero(dateObj.getMonth() + 1);
					var date = addZero(dateObj.getDate());
					var hours = addZero(dateObj.getHours());
					var minutes = addZero(dateObj.getMinutes());
					var seconds = addZero(dateObj.getSeconds());

					var str = [
						year,
						month,
						date,
						hours,
						minutes,
						seconds
					];

					return parseInt(str.join(''));
				};

				var fromDate = changeDateObj(searchOptions.FromDate);
				var toDate = changeDateObj(searchOptions.ToDate);

				switch(resultInterval){
					case "Hourly":
						for(var i = 0, len = results.length; i < len; i++){
							var data = {};
							fromDate.setHours(i);
							data.timeStamp = changeFormatForGraph(fromDate);
							data.value = parseInt(results[i]);
							fillterData.push(data);
						}
					break;
					case "Daily":
					case "Weekly":
						for(var i = 0, len = results.length; i < len; i++){
							var data = {};

							if(i === 0){
								data.timeStamp = changeFormatForGraph(fromDate);
							}else{
								fromDate.setDate(fromDate.getDate() + 1);
								data.timeStamp = changeFormatForGraph(fromDate);
							}

							data.value = parseInt(results[i]);
							fillterData.push(data);

							if(
								fromDate.getFullYear() === toDate.getFullYear() &&
								fromDate.getMonth() === toDate.getMonth() &&
								fromDate.getDate() === toDate.getDate()
								){
								break;
							}
						}
					break;
					case "Monthly":
						for(var i = 0, len = results.length; i < len; i++){
							var data = {};
							
							if(
								fromDate.getFullYear() === toDate.getFullYear() &&
								fromDate.getMonth() === toDate.getMonth()
								){
								break;
							}

							if(i === 0){
								data.timeStamp = changeFormatForGraph(fromDate);
							}else{
								fromDate.setMonth(fromDate.getMonth() + 1);
								data.timeStamp = changeFormatForGraph(fromDate);
							}

							data.value = parseInt(results[i]);
							fillterData.push(data);
						}
					break;
				}

				return fillterData;
			}

			searchOptions.Channel = channelIndex;
			searchOptions.Mode = 'Start';

			searchControl(
				searchOptions,
				controlSuccessCallback,
				failCallback
			);

			return deferred.promise;
		};

		var timeRag = /([0-9:]{8})/g;
		
		var removeTime = function(str){
			return str.replace(timeRag, '00:00:00');
		};

		var setLastTime = function(str){
			return str.replace(timeRag, '23:59:59');
		};

		var getBasicSearchOption = function(){
			var lineNames = lineName.get();
			var masterCameraName = masterName.get();
			var searchLineOptions = {};

			for(var i = 0; i < lineNames.length; i++){
				searchLineOptions['Camera.' + masterCameraName + '.Line.' + lineNames[i] + '.Direction']	= 'In,Out';
			}

			return searchLineOptions;
		};

		this.getTodayGraphData = function(){
			var nowDate = getSunapiDateFormat(cameraLocalTime.getDateObj().getTime());
			var searchOptions =  getBasicSearchOption();

			searchOptions.FromDate = removeTime(nowDate);
			searchOptions.ToDate = setLastTime(nowDate);

			return getSearchData(searchOptions);
		};

		this.getWeekGraphData = function(){
			var newDate = cameraLocalTime.getDateObj();
			var nowDate = getSunapiDateFormat(newDate.getTime());
			var fromDate = null;
			var searchOptions = getBasicSearchOption();

			//get date at the six day ago
			newDate.setDate(newDate.getDate() - 6);

			/*
			카메라는 최소 2000/01/01까지 지원을 하기 때문에
			현재 날짜(newDate)가 2000년 이전을 설정될 경우
			강제로 2000/01/01로 설정한다.
			*/
			if(newDate.getFullYear() < 2000){
				newDate.setYear(2000);
				newDate.setMonth(0);
				newDate.setDate(1);
			}

			fromDate = getSunapiDateFormat(newDate.getTime());

			searchOptions.FromDate = removeTime(fromDate);
			searchOptions.ToDate = setLastTime(nowDate);

			return getSearchData(searchOptions);
		};

		this.getSearchResults = function(options){
			var searchOptions = {
				FromDate: removeTime(getSunapiDateFormat(options.fromDate)),
				ToDate: getSunapiDateFormat(options.toDate)
			};

			var masterCameraName = masterName.get();
			for(var lineName in options.lines){
				var self = options.lines[lineName];
				var direction = [];

				if(self.in === true){
					direction.push('In');
				}
				if(self.out === true){
					direction.push('Out');
				}

				searchOptions['Camera.' + masterCameraName + '.Line.' + lineName + '.Direction'] = direction.join(',');
			}

			return getSearchData(searchOptions);
		};

		this.cancelSearch = function(){
			if(searchToken === null) return;

			asyncInterrupt = true;
			recordingCgi.peoplecountsearch.control({
				Mode: 'Cancel',
				SearchToken: searchToken
			}, function(response){
				console.log("Search is canceled.");
			}, function(errorData){
				console.error(errorData);
			});
		};

		/*
		var ruleInfo = [
			{
				name: '',
				enable: '',
				arrow: '',
				x1: '',
				y1: '',
				x2: '',
				y2: '',
				inCount: '',
				outCount: ''
			}
		];
		*/
		this.setRuleInfo = function(data){
			var deferred = $q.defer();
			eventSourcesCgi.peoplecount.set(
				data,
				function(){
					deferred.resolve('Success');
				},
				function(errorData){
					deferred.reject(errorData);
				}
			);

			return deferred.promise;
		};

		this.getRuleInfo = function(){
			var deferred = $q.defer();

			var failCallback = function(errorData){
				deferred.reject(errorData);
			};

			eventSourcesCgi.peoplecount.view(
				function(response){
					var viewData = response.data.PeopleCount[channelIndex];

					/*
					"/stw-cgi/eventsources.cgi?msubmenu=peoplecount&action=view" have not InCount and OutCount.
					So it have to add inCount and OutCount in viewData.
					*/
					if("Lines" in viewData){
						if(viewData.Lines.length > 0){
							eventSourcesCgi.peoplecount.check(
								function(response){
									var checkData = response.data.PeopleCount[channelIndex];
									masterName.set(viewData.MasterName);

									for(var i = 0, len = viewData.Lines.length; i < len; i++){
										var lineInViewData = viewData.Lines[i];

										for(var j = 0, jLen = checkData.Lines.length; j < len; j++){
											var lineInCheckData = checkData.Lines[i];

											if(lineInViewData.Line === lineInCheckData.LineIndex){
												lineInViewData.Name = lineInViewData.Name;
												lineInViewData.LineIndex = lineInCheckData.LineIndex;
												lineInViewData.InCount = lineInCheckData.InCount;
												lineInViewData.OutCount = lineInCheckData.OutCount;

												lineName.set(lineInViewData.LineIndex, lineInViewData.Name);
											}
										}
									}

									deferred.resolve(viewData);
								},
								failCallback
							);
						}
					}
				}, 
				failCallback
			);

			return deferred.promise;
		};

		this.getCurrentCountingData = function(){
			var deferred = $q.defer();

			eventSourcesCgi.peoplecount.check(
				function(response){
					var checkData = response.data.PeopleCount[channelIndex];
					var realTimeData = [];
					for(var i = 0, ii = checkData.Lines.length; i < ii; i++){
						var lineInCheckData = checkData.Lines[i];
						var item = {
							inCount: lineInCheckData.InCount,
							outCount: lineInCheckData.OutCount
						};	
						realTimeData.push(item);
					}

					deferred.resolve(realTimeData);
				},
				function(errorData){
					deferred.reject(errorData);
				}
			);

			return deferred.promise;
		};

		this.getGraphData = function(){
			var deferred = $q.defer();

			setTimeout(function(){
				deferred.resolve({});
			}, 500);

			return deferred.promise;
		};

		this.getDeviceName = function(){
			var deferred = $q.defer();
			var masterSlaveData = {};

			var failCallback = function(errorData){
				deferred.reject(errorData);
			};

			systemCgi.deviceInfo.view(function(response){
				var deviceName = response.data.DeviceName;
				deferred.resolve(deviceName);
			}, failCallback);

			return deferred.promise;
		};

	  	/**
	  	 * @param axis <Array> Axis object
	  	 * @param axis[index] <Object> item of Axis object
	  	 * @param typeOption <Object> 0 : Default to Maximum, 1 : Maximum to Default
	  	 * @example
	  	 *   console.log(axis[0]); //{x: 10, y: 10}
	  	 */
	  	this.changeResolution = function(axis, typeOption){
	  		var changedAxis = [];
	  		var defaultResolution = pcSetupService.getDefaultResolution();
	  		var eventSourceMaxResolution = pcSetupService.getMaxResolution();
	  		var multi = {
	  			width: 0,
	  			height: 0
	  		};
	  		var divition = {
	  			width: 0,
	  			height: 0
	  		};

	  		if(typeOption === 0){
	  			multi.width = eventSourceMaxResolution.width;
	  			multi.height = eventSourceMaxResolution.height;
	  			divition.width = defaultResolution.width;
	  			divition.height = defaultResolution.height;
	  		}else{
	  			multi.width = defaultResolution.width;
	  			multi.height = defaultResolution.height;
	  			divition.width = eventSourceMaxResolution.width;
	  			divition.height = eventSourceMaxResolution.height;
	  		}

	  		for(var i = 0, len = axis.length; i < len; i++){
	  			var item = axis[i];
	  			var changedItem = {
	  				x: multi.width * item.x / divition.width,
	  				y: multi.height * item.y / divition.height,
	  			};

	  			changedAxis.push(changedItem);
	  		}

	  		return changedAxis;
	  	};
	};

	return PeopleCountingModel;
});