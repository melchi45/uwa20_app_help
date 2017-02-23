/* global setTimeout */
"use strict";

kindFramework.factory('QmModel', function($q, $translate, $interval, pcSetupService){
	var QueueModel = function(){
		if(!(this instanceof QueueModel)){
			return new QueueModel();
		}

		var channelIndex = 0;
		var asyncInterrupt = false;
		var interruptMessage = "interrupt with cancel";
		this.getInterruptMessage = function(){
			return interruptMessage;
		};

		var lang = {
			queueManagement: 'Queue management',
			searchTitle: 'lang_search', 
			setupTitle: 'lang_setup',
			enable: 'Enable Queue management',
			realTime: {
				queueLevel: 'Queue Level', 
				button: 'lang_setup',
			},
			graph: {
				today: 'lang_today',
				weekly: 'lang_weekly',
				average: 'Average people in Queue',
				cumulative: 'Cumulative Time in Queue',
				sec: 'lang_sec',
				highQueue: '%1 High Queue',
				midQueue: '%1 Mid Queue'
			},
			search: {
				title: 'lang_search',
				button: 'lang_search',
				date: 'lang_date',
				rule: {
					title: 'Rule',
					peopleInQ: 'People in queue',
					mediumQ: 'Medium queue',
					highQ: 'High queue',
					average: 'Average people',
					cumulative: 'Cumulative time'
				}
			},
			results: {
				title: 'lang_results',
				queue: 'Queue',
				timeInQ: 'Time in Queue',
				high: 'lang_high',
				mid: 'Mid',
				noResults: 'lang_msg_no_result',
				button: 'lang_download'
			},
			setupTabTitle: {
				configuration: 'Configuration',
				calibration: 'lang_calibration'
			},
			queueList: {
				title: 'Queue List',
				no: 'lang_num',
				name: 'lang_name'
			},
			queueUndefined: {
				disable: '',
				noRule: ''
			},
			queueLevel: {
				title: 'Queue Level',
				people: 'People',
				max: 'Max',
				high: 'lang_high',
				mid: 'Mid'
			},
			queueEvent: {
				title: 'Queue event duration(s)',
				high: 'lang_high',
				mid: 'Mid',
				sec: 'lang_sec',
				message: 'Alarm is occurred When both queue status and duration are satisfied the Predefined condition.'
			},
			calibration: {
				message: ''
			}
		};

		(function langInit(){
			lang.queueUndefined.disable = $translate.instant('lang_msg_please_enable').replace('%1', lang.queueManagement);
			lang.queueUndefined.noRule = $translate.instant('lang_msg_norule') + ' ' + $translate.instant('lang_msg_addrule').replace('%1', $translate.instant('lang_setup'));
			lang.calibration.message = $translate.instant('lang_msg_calibration_guide_1') + ' ' + $translate.instant('lang_msg_calibration_guide_2').replace('%1', lang.queueManagement);
		})();

		this.getStLang = function(){
			return lang;
		};

		var mockupData = {
			eventSourcesCgi: {
				queue: {
					view: 
					{
					    "QueueManagementSetup": [
					        {
					            "Channel": 0,
					            "Enable": true,
					            "ReportEnable": false,
					            "ReportFilename": "",
					            "ReportFileType": "XLS",
					            "CalibrationMode": "CameraHeight",
					            "CameraHeight": 300,
					            "ObjectSizeCoordinates": [
					                {
					                    "x": 895,
					                    "y": 475
					                },
					                {
					                    "x": 1024,
					                    "y": 604
					                }
					            ],
					            "Queues": [
					                {
					                    "Queue": 1,
					                    "MaxPeople": 10,
					                    "HighPeople": 7,
					                    "Name": "Queue1",
					                    "Enable": true,
					                    "Coordinates": [
					                        {
					                            "x": 138,
					                            "y": 129
					                        },
					                        {
					                            "x": 120,
					                            "y": 569
					                        },
					                        {
					                            "x": 633,
					                            "y": 590
					                        },
					                        {
					                            "x": 648,
					                            "y": 123
					                        }
					                    ],
										"QueueTypes":[
											{
												"Type": "High",
												"Count": 6,
												"AlarmEnable": true,
												"Threshold": 180
											},
											{
												"Type": "Medium",
												"Count": 3,
												"AlarmEnable": true,
												"Threshold": 180
											}
										]
					                },
					                {
					                    "Queue": 2,
					                    "MaxPeople": 5,
					                    "HighPeople": 4,
					                    "Name": "Queue2",
					                    "Enable": true,
					                    "Coordinates": [
					                        {
					                            "x": 1238,
					                            "y": 204
					                        },
					                        {
					                            "x": 1112,
					                            "y": 519
					                        },
					                        {
					                            "x": 1526,
					                            "y": 551
					                        },
					                        {
					                            "x": 1556,
					                            "y": 255
					                        }
					                    ],
										 QueueTypes:[
											{
												"Type": "High",
												"Count": 6,
												"AlarmEnable": true,
												"Threshold": 180
											},
											{
												"Type": "Medium",
												"Count": 3,
												"AlarmEnable": true,
												"Threshold": 180
											}
										]
					                },
					                {
					                    "Queue": 3,
					                    "MaxPeople": 7,
					                    "HighPeople": 3,
					                    "Name": "Queue3",
					                    "Enable": true,
					                    "Coordinates": [
					                        {
					                            "x": 363,
					                            "y": 713
					                        },
					                        {
					                            "x": 378,
					                            "y": 986
					                        },
					                        {
					                            "x": 1535,
					                            "y": 971
					                        },
					                        {
					                            "x": 1466,
					                            "y": 671
					                        }
					                    ],
										 QueueTypes:[
											{
												"Type": "High",
												"Count": 6,
												"AlarmEnable": true,
												"Threshold": 180
											},
											{
												"Type": "Medium",
												"Count": 3,
												"AlarmEnable": true,
												"Threshold": 180
											}
										]
					                }
					            ]
					        }
					    ]
					},
					check: 
					{
					    "QueueLevels": [
					        {
					            "Channel": 0,                        
					            "Queues": [
					                {
					                    "Queue": 1,
					                    "Level": 8,                  
					                },
					                {
					                    "Queue": 2,
					                    "Level": 15,
					                },
							{
					                    "Queue": 3,
					                    "Level": 25,
					                },
					            ]
					        }
					    ]
					},
					checkOnly12:
					{
					    "QueueLevels": [
					        {
					            "Channel": 0,                        
					            "Queues": [
					                {
					                    "Queue": 1,
					                    "Level": 8,                  
					                },
					                {
					                    "Queue": 2,
					                    "Level": 15,
					                }
					            ]
					        }
					    ]
					}


				},
				sourceoptions: {
					view: 
					{
					    "EventSources": [        
					        {
					            "EventSource": "QueueManagement",
					            "EventAction": [
					                "FTP",
					                "SMTP",
									"AlarmOutput"
					            ]
					        }
					    ]
					}

				}
			},
			eventRulesCgi: {
				scheduler: {
					view:
					{
					    "QueueManagement": [
					        {
					            "Channel": 0,
					            "ScheduleType": "Daily",
					            "Hour": 0,
					            "Minute": 0,
					            "WeekDay": "SUN",
						    	"EventAction": [
					                "AlarmOutput.1",
					                "SMTP",
					                "FTP"
					            ],
					            "AlarmOutputs": [
					                {
					                    "AlarmOutput": 1,
					                    "Duration": "5s"
					                }
					            ]
					        }
					    ]
					}	
				}
			},
			eventStatusCgi: {
				check: 
				{
				    "ChannelEvent": [
				        {
				            "Channel": 0,
				            "QueueEvents": {
				                "Queues": [
					                {
					                    "Queue": 1,
									    "QueueTypes":[
											{
												"High": true
											},
											{
												"Medium": false
											}
										]
					                },
					                {
					                    "Queue": 2,                    
									    "QueueTypes":[
											{
												"High": false
											},
											{
												"Medium": false
											}
										]
					                }
				            	]
				            }
				        }
				    ]
				},
				monitor: 
				{
				    "ChannelEvent": [
				        {
				            "Channel": 0,            
				            "QueueEvents": {
				                "Queues": [
					                {
					                    "Queue": 1,                    
									    "QueueTypes":[
											{
												"High": true
											}
										]                
						            }
					            ]
				            }
				        }
				    ]
				}

			},
			recordingCgi: {
				viewStatus: 
				{
					"Status": "Completed"
				},
				viewResults:
				{
					"ResultInterval": "Hourly",
					"QueueResults": [
				        {
				            "Queue": 1,
						    "QueueTypes":[
						    	{
									"High": true,
									"CumulativeTimeResult": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
					            },
					            {
									"Medium": false,
									"CumulativeTimeResult": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
					            }
					        ]
					    },
					 	{
				            "Queue": 2,
						    "QueueTypes":[
							    {
									"High": true,
									"CumulativeTimeResult": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
							    },
							    {
									"Medium": false,
									"CumulativeTimeResult": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
					            }
					        ]
				         },
						{
					            "Queue": 3,
							    "QueueTypes":[
								    {
										"High": true,
										"CumulativeTimeResult": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
								    },
								    {
										"Medium": false,
										"CumulativeTimeResult": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
								    }
							    ]
					    }
				    ]
				},
				controlStart:
				{
					"SearchToken": "123456"
				},
				controlCancel:
				{
					"Response": "Success"
				}
			}
		};

		var eventSourcesCgi = {
			queue: {
				view: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'queuemanagementsetup',
						action: 'view',
						data: {},
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				set: function(data, successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'queuemanagementsetup',
						action: 'set',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				add: function(data, successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'queuemanagementsetup',
						action: 'add',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				update: function(data, successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'queuemanagementsetup',
						action: 'update',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				remove: function(successCallback, failCallback, data){
					if(!data){ data = {}; }
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'queuemanagementsetup',
						action: 'remove',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				check: function(successCallback, failCallback, data){
					if(!data){ data = {}; }
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'queuemanagementsetup',
						action: 'check',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			},
			sourceoptions: {
				view: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventsources',
						msubmenu: 'sourceoptions',
						action: 'view',
						data: {},
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			}
		};

		var eventRulesCgi = {
			scheduler: {
				view: function(successCallback, failCallback){
					pcSetupService.requestSunapi({
						cgi: 'eventrules',
						msubmenu: 'scheduler',
						action: 'view',
						data: {
							Type: 'QueueManagement'
						},
						successCallback: successCallback,
						failCallback: failCallback
					});
				},
				set: function(data, successCallback, failCallback){
					data.Type = 'QueueManagement';
					pcSetupService.requestSunapi({
						cgi: 'eventrules',
						msubmenu: 'scheduler',
						action: 'set',
						data: data,
						successCallback: successCallback,
						failCallback: failCallback
					});
				}
			}
		};

		var eventStatusCgi = {
			check: function(successCallback, failCallback){
				pcSetupService.requestSunapi({
					cgi: 'eventstatus',
					msubmenu: 'eventstatus',
					action: 'check',
					data: {
						'Channel.0.EventType': 'QueueEvent'
					},
					successCallback: successCallback,
					failCallback: failCallback
				});
			},
			monitor: function(successCallback, failCallback){
				pcSetupService.requestSunapi({
					cgi: 'eventstatus',
					msubmenu: 'eventstatus',
					action: 'monitor',
					data: {
						'Channel.0.EventType': 'QueueEvent'
					},
					successCallback: successCallback,
					failCallback: failCallback
				});
			},
			monitordiff: function(successCallback, failCallback){
				pcSetupService.requestSunapi({
					cgi: 'eventstatus',
					msubmenu: 'eventstatus',
					action: 'monitordiff',
					data: {
						'Channel.0.EventType': 'QueueEvent'
					},
					successCallback: successCallback,
					failCallback: failCallback
				});
			}
		};

		var recordingCgi = {
			control: function(data, successCallback, failCallback){
				pcSetupService.requestSunapi({
					cgi: 'recording',
					msubmenu: 'queuesearch',
					action: 'control',
					data: data,
					successCallback: successCallback,
					failCallback: failCallback
				});
			},
			view: function(data, successCallback, failCallback){
				pcSetupService.requestSunapi({
					cgi: 'recording',
					msubmenu: 'queuesearch',
					action: 'view',
					data: data,
					successCallback: successCallback,
					failCallback: failCallback
				});
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

		var timeRag = /([0-9:]{8})/g;
		var removeTime = function(str){
			return str.replace(timeRag, '00:00:00');
		};

		var setLastTime = function(str){
			return str.replace(timeRag, '23:59:59');
		};

		this.getData = function(){
			var deferred = $q.defer();

			function successCallback(data){
				deferred.reject(data);
			}

			function failCallback(data){
				data = mockupData.eventSourcesCgi.queue.view; //mockup
				data = data.QueueManagementSetup[0];
				
				deferred.resolve(data);
			}

			eventSourcesCgi.queue.view(successCallback, failCallback);

			return deferred.promise;
		};

		this.setData = function(data){
			var deferred = $q.defer();

			function successCallback(data){
				deferred.reject(data);
			}

			function failCallback(data){
				deferred.resolve(data);
			}

			eventSourcesCgi.queue.set(data, successCallback, failCallback);

			return deferred.promise;
		};

		// var searchToken = null;

		// var getSearchData = function(searchOptions){
		// 	var deferred = $q.defer();

		// 	var searchControl = recordingCgi.peoplecountsearch.control;
		// 	var searchView = recordingCgi.peoplecountsearch.view;
			

		// 	function failCallback(errorData){
		// 		if(asyncInterrupt === true){
		// 			errorData = interruptMessage;
		// 		}

		// 		console.log("getSearchData Error", errorData);
		// 		deferred.reject(errorData);
		// 	}

		// 	function controlSuccessCallback(response){
		// 		searchToken = response.data.SearchToken;
		// 		requestSearchView();
		// 	}

		// 	function requestSearchView(){
		// 		searchView(
		// 			{
		// 				Type: 'Status',
		// 				SearchToken: searchToken
		// 			},
		// 			viewStatusSuccessCallback,
		// 			failCallback
		// 		);
		// 	}

		// 	function viewStatusSuccessCallback(response){
		// 		if(response.data.Status === "Completed"){
		// 			searchView(
		// 				{
		// 					Type: 'Results',
		// 					SearchToken: searchToken
		// 				},
		// 				viewResultSuccessCallback,
		// 				failCallback
		// 			);
		// 		}else{
		// 			requestSearchView();
		// 		}
		// 	}

		// 	function viewResultSuccessCallback(response){
		// 		var responseData = response.data;
		// 		var resultInterval = responseData.ResultInterval;
		// 		var lineResults = responseData.PeopleCountSearchResults[channelIndex].LineResults;
		// 		var responseData = [];

		// 		for(var i = 0, len = lineResults.length; i < len; i++){
		// 			var lineSelf = lineResults[i];

		// 			for(var j = 0,jLen = lineSelf.DirectionResults.length; j < jLen; j++){
		// 				var directionSelf = lineSelf.DirectionResults[j];
		// 				if(typeof directionSelf.Result !== "undefined"){
		// 					var data = {
		// 						name: '',
		// 						direction: '',
		// 						results: []
		// 					};
		// 					var results = directionSelf.Result.split(',');

		// 					data.name = lineSelf.Line;
		// 					data.direction = directionSelf.Direction.toLowerCase() === "in" ? 
		// 						$translate.instant(lang.realTime.counting.in) : 
		// 						$translate.instant(lang.realTime.counting.out);
		// 					data.results = fillterResults(results, resultInterval);

		// 					responseData.push(data);
		// 				}
		// 			}
		// 		}

		// 		responseData.resultInterval = resultInterval;

		// 		searchToken = null;
		// 		deferred.resolve(responseData);
		// 	}

		// 	function fillterResults(results, resultInterval){
		// 		var fillterData = [];

		// 		var changeDateObj = function(str){
		// 			str = str.replace('T',' ').replace('Z', '');
		// 			str = str.split(' ');
		// 			str[0] = str[0].split('-');
		// 			str[1] = str[1].split(':');

		// 			str = new Date(
		// 				str[0][0],
		// 				str[0][1] - 1,
		// 				str[0][2],
		// 				str[1][0],
		// 				str[1][1],
		// 				str[1][2]
		// 			);

		// 			return str;
		// 		};

		// 		/**
		// 		 * Graph format is <Full Year><Month><Date><Hours><Minutes><Seconds>
		// 		 * 2014-07-11 11:23:32 => 20140711112332
		// 		 */
		// 		var changeFormatForGraph = function(dateObj){
		// 			var year = dateObj.getFullYear();
		// 			var month = addZero(dateObj.getMonth() + 1);
		// 			var date = addZero(dateObj.getDate());
		// 			var hours = addZero(dateObj.getHours());
		// 			var minutes = addZero(dateObj.getMinutes());
		// 			var seconds = addZero(dateObj.getSeconds());

		// 			var str = [
		// 				year,
		// 				month,
		// 				date,
		// 				hours,
		// 				minutes,
		// 				seconds
		// 			];

		// 			return parseInt(str.join(''));
		// 		};

		// 		var fromDate = changeDateObj(searchOptions.FromDate);
		// 		var toDate = changeDateObj(searchOptions.ToDate);

		// 		switch(resultInterval){
		// 			case "Hourly":
		// 				for(var i = 0, len = results.length; i < len; i++){
		// 					var data = {};
		// 					fromDate.setHours(i);
		// 					data.timeStamp = changeFormatForGraph(fromDate);
		// 					data.value = parseInt(results[i]);
		// 					fillterData.push(data);
		// 				}
		// 			break;
		// 			case "Daily":
		// 			case "Weekly":
		// 				for(var i = 0, len = results.length; i < len; i++){
		// 					var data = {};

		// 					if(i === 0){
		// 						data.timeStamp = changeFormatForGraph(fromDate);
		// 					}else{
		// 						fromDate.setDate(fromDate.getDate() + 1);
		// 						data.timeStamp = changeFormatForGraph(fromDate);
		// 					}

		// 					data.value = parseInt(results[i]);
		// 					fillterData.push(data);

		// 					if(
		// 						fromDate.getFullYear() === toDate.getFullYear() &&
		// 						fromDate.getMonth() === toDate.getMonth() &&
		// 						fromDate.getDate() === toDate.getDate()
		// 						){
		// 						break;
		// 					}
		// 				}
		// 			break;
		// 			case "Monthly":
		// 				for(var i = 0, len = results.length; i < len; i++){
		// 					var data = {};
							
		// 					if(
		// 						fromDate.getFullYear() === toDate.getFullYear() &&
		// 						fromDate.getMonth() === toDate.getMonth()
		// 						){
		// 						break;
		// 					}

		// 					if(i === 0){
		// 						data.timeStamp = changeFormatForGraph(fromDate);
		// 					}else{
		// 						fromDate.setMonth(fromDate.getMonth() + 1);
		// 						data.timeStamp = changeFormatForGraph(fromDate);
		// 					}

		// 					data.value = parseInt(results[i]);
		// 					fillterData.push(data);
		// 				}
		// 			break;
		// 		}

		// 		return fillterData;
		// 	}

		// 	searchOptions.Channel = channelIndex;
		// 	searchOptions.Mode = 'Start';

		// 	searchControl(
		// 		searchOptions,
		// 		controlSuccessCallback,
		// 		failCallback
		// 	);

		// 	return deferred.promise;
		// };

		// var getBasicSearchOption = function(){
		// 	var lineNames = lineName.get();
		// 	var searchLineOptions = {};

		// 	for(var i = 0; i < lineNames.length; i++){
		// 		searchLineOptions['Camera.' + //masterCameraName + '.Line.' + lineNames[i] + '.Direction']	= 'In,Out';
		// 	}

		// 	return searchLineOptions;
		// };

		// this.getTodayGraphData = function(){
		// 	var nowDate = getSunapiDateFormat(cameraLocalTime.getDateObj().getTime());
		// 	var searchOptions =  getBasicSearchOption();

		// 	searchOptions.FromDate = removeTime(nowDate);
		// 	searchOptions.ToDate = setLastTime(nowDate);

		// 	return getSearchData(searchOptions);
		// };

		// this.getWeekGraphData = function(){
		// 	var newDate = cameraLocalTime.getDateObj();
		// 	var nowDate = getSunapiDateFormat(newDate.getTime());
		// 	var fromDate = null;
		// 	var searchOptions = getBasicSearchOption();

		// 	//get date at the six day ago
		// 	newDate.setDate(newDate.getDate() - 6);

		// 	/*
		// 	카메라는 최소 2000/01/01까지 지원을 하기 때문에
		// 	현재 날짜(newDate)가 2000년 이전을 설정될 경우
		// 	강제로 2000/01/01로 설정한다.
		// 	*/
		// 	if(newDate.getFullYear() < 2000){
		// 		newDate.setYear(2000);
		// 		newDate.setMonth(0);
		// 		newDate.setDate(1);
		// 	}

		// 	fromDate = getSunapiDateFormat(newDate.getTime());

		// 	searchOptions.FromDate = removeTime(fromDate);
		// 	searchOptions.ToDate = setLastTime(nowDate);

		// 	return getSearchData(searchOptions);
		// };

		// this.getSearchResults = function(options){
		// 	var searchOptions = {
		// 		FromDate: removeTime(getSunapiDateFormat(options.fromDate)),
		// 		ToDate: getSunapiDateFormat(options.toDate)
		// 	};

		// 	for(var lineName in options.lines){
		// 		var self = options.lines[lineName];
		// 		var direction = [];

		// 		if(self.in === true){
		// 			direction.push('In');
		// 		}
		// 		if(self.out === true){
		// 			direction.push('Out');
		// 		}

		// 		searchOptions['Camera.' + //masterCameraName + '.Line.' + lineName + '.Direction'] = direction.join(',');
		// 	}

		// 	return getSearchData(searchOptions);
		// };

		// this.cancelSearch = function(){
		// 	if(searchToken === null) return;

		// 	asyncInterrupt = true;
		// 	recordingCgi.peoplecountsearch.control({
		// 		Mode: 'Cancel',
		// 		SearchToken: searchToken
		// 	}, function(response){
		// 		console.log("Search is canceled.");
		// 	}, function(errorData){
		// 		console.error(errorData);
		// 	});
		// };

	};

	return QueueModel;
});