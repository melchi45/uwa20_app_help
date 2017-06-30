/* global sessionStorage */
"use strict";

kindFramework.controller('QMStatisticsCtrl', function (
	$q,
	$scope, 
	$uibModal, 
	$timeout,
	$state,
	$translate,
	$window,
	Attributes,
	ConnectionSettingService, 
	pcSetupService,
	pcModalService,
	SunapiClient, 
	QmModel
	){
	//Playerdata for Video
	$scope.playerdata = null;
	$scope.pageLoaded = false;
	$scope.checkSearching = false;

    $scope.sketchinfo = {};
    $scope.coordinates = [];

	var modalInstance = null;
	var asyncInterrupt = false;

	var mAttr = Attributes.get();
	var qmModel = new QmModel();
	$scope.lang = qmModel.getStLang();

	var searchFromDate = null;
	var searchToDate = null;

	$scope.queueData = {};
	$scope.queueData.dataLoad = false;

	var chartColor = {
		default: '#ddd',
		selected: '#399'
	};
	var graphTypes = ["average", "cumulative"];
	var graphDateTypes = ["today", "weekly", "search"];

	var channel = 0;

	var cameraLocalTime = {
		data: '',
		set: function(localTime){
			var deferred = $q.defer();

			pcSetupService.getCameraLocalTime(
				function(localTime){
					cameraLocalTime.data = localTime;
					deferred.resolve(true);
				}, function(failData){
					deferred.reject(false);
				}
			);

			return deferred.promise;
		},
		getDateObj: function(){
			return new Date(cameraLocalTime.data);
		}
	};

	function getAttributes() {
        var defer = $q.defer();

        defer.resolve("success");
        return defer.promise;
    }

	function setMaxResolution(){
        return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
	}

	$scope.areaColor = [
		{color: "#238bc1"},
		{color: "#ff6633"},
		{color: "#32ac3a"}
	];
	$scope.previewSection = {
		coordinates: [],
		goToSetup: function(){
			$state.go("setup.statistics_queue_setup");
		},
		init: function(){
			//sketchinfo
			$scope.sketchinfo = {
				shape: 1,
				color: 0,
				maxNumber: 3,
				useEvent: false,
				workType: 'qmArea',
				modalId: "./views/setup/common/confirmMessage.html"
			};

			//coordinates
			var datas = $scope.queueData.Queues;
			for(var i = 0; i < datas.length; i++){
				var points = [];
				var data = datas[i].Coordinates;
				for(var j = 0; j < data.length; j++){
					points.push( [data[j].x, data[j].y] );
				}

	            $scope.coordinates.push(
		            {
	        			isSet: true,
	        			enable: datas[i].Enable,
	            		points: points,
	            		textInCircle: (i + 1) + '',
						areaColor: $scope.areaColor[i].color
	            	}
            	);
			}
		}
	};

	function changeFormatForGraph(timeForamtForGraph, dateFormat){
		timeForamtForGraph += ""; //Change Type
		var year = timeForamtForGraph.substr(0,4);
		var month = timeForamtForGraph.substr(4,2);
		var date = timeForamtForGraph.substr(6,2);
		var hours = timeForamtForGraph.substr(8,2);
		var minutes = timeForamtForGraph.substr(10,2);
		var seconds = timeForamtForGraph.substr(12,2);

		var returnVal = null;

		switch(dateFormat){
			case "Hourly":
				returnVal = hours + ":00";
			break;
			case "Daily":
			case "Weekly":
				returnVal = month + "/" + date;
			break;
			case "Monthly":
				returnVal = year + "-" + month;
			break;
		}

		return returnVal;
	}

	function changeYAxisFormat(data){
		function isFloat(x) {
			return typeof(x, 'Number') && !!(x % 1);
		}

		/* tickFormat이 비정상일 때 null 처리 */
		if(isFloat(data) || data < 0) return null;

    	var num = data < 10 ? 1 : data < 100 ? 2 : 3;
        return d3.format('.' + num + 's')(data);
	}

	$scope.graphSection = {
		chartConfig: {
			deepWatchData: false
		},
		average: {
			today: {
				options: {},
				data: [],
				xAxisData: []
			},
			weekly: {
				options: {},
				data: [],
				xAxisData: []
			},
			search: {
				options: {},
				data: [],
				xAxisData: []
			}
		},
		cumulative: {
			today: {
				options: {},
				data: [],
				xAxisData: []
			},
			weekly: {
				options: {},
				data: [],
				xAxisData: []
			},
			search: {
				options: {},
				data: [],
				xAxisData: []
			}
		},
		setData: function(data, dateType, type){
			$scope.graphSection[type][dateType].data = data;
			$timeout(function(){
				if(type === graphTypes[0]){
					if($scope.graphSection[type][dateType].options.chart.legend !== undefined){
						$scope.graphSection[type][dateType].options.chart.legend.dispatch.legendClick({
							seriesIndex: 0
						});
					}
				}
			});
		},
		update: function(){
			for(var t = 0; t < graphTypes.length; t++){
				var type = graphTypes[t];
				for(var d = 0; d < graphDateTypes.length; d++){
					var dateType = graphDateTypes[d];
					var api = $scope.graphSection[type][dateType].options.chart.api;
					if(api !== null){
						$scope.graphSection[type][dateType].options.chart.api.update();
					}
				}
			}
		},
		setXAxisData: function(data, dateType, type){
			$scope.graphSection[type][dateType].xAxisData = data;
		},
		selectChartItem: function(parentClass, chartData, item){
	        item.disabled = true;

	        var seriesIndex = item.seriesIndex;
	        if(seriesIndex === undefined){
	        	seriesIndex = item.values[0].series;
	        }

	        d3.selectAll(parentClass + ' .nv-series-' + seriesIndex).each(function(){
	            this.parentNode.appendChild(this);
	        });

	        for(var i = 0, len = chartData.length; i < len; i++){
	            var color = i === seriesIndex ? chartColor.selected : chartColor.default;
	            chartData[i].color = color;
	        }
	    },
		resizeHandle: function(){
		    $scope.graphSection.update();
		},
		bindResize: function(){
			angular.element($window).bind(
				'resize',
				$scope.graphSection.resizeHandle
			);
		},
		unbindResize: function(){
			angular.element($window).unbind(
				'resize',
				$scope.graphSection.resizeHandle
			);	
		},
		init: function(){
			var deferred = $q.defer();
			var gs = $scope.graphSection;
			var promises = [];

			var failCallback = function(errorData){
				console.error(errorData);
				deferred.reject("Fail");
			};
			var todayAverage = function(){
				return gs.getGraph(graphDateTypes[0], graphTypes[0]);
			};
			var todayCumulative = function(){
				return gs.getGraph(graphDateTypes[0], graphTypes[1]);
			};
			var weeklyAverage = function(){
				return gs.getGraph(graphDateTypes[1], graphTypes[0]);
			};
			var weeklyCumulative = function(){
				return gs.getGraph(graphDateTypes[1], graphTypes[1]);
			};

			promises.push(gs.setChartOptions);
			promises.push(todayAverage);
			promises.push(todayCumulative);
			promises.push(weeklyAverage);
			promises.push(weeklyCumulative);

			if(promises.length > 0){
				$q.seqAll(promises).then(
					function(){
						gs.bindResize();
						deferred.resolve("Success");
					}, 
					failCallback
				);
			}

			return deferred.promise;
		},
		setChartOptions: function(){
			var deferred = $q.defer();
			var gs = $scope.graphSection;

			var commonOptions = {
				chart: {
					height: 300,
					margin : {
						bottom: 20,
						left: 40
					},
					x: function(d){
						return d[0];
					},
					clipEdge: true,
					api: null,
					useInteractiveGuideline: true,
					xAxis: {
						showMaxMin: true,
						tickFormat: null
					},
					yAxis: {
						showMaxMin: true,
						tickFormat: changeYAxisFormat
					},
					showLegend: true,
					yDomain: [0, 1]
				}
			};

			var eachChartOptions = {
				average: {
					type: 'lineChart',
					useVoronoi: false,
					transitionDuration: 500,
					dispatch: {
						renderEnd: function(){
							console.log("renderEnd");
						}
					},
					legend: {}
				},
				cumulative: {
					type: 'multiBarChart',
					duration: 500,
					stacked: false,
					showControls: false
				}
			};

			graphTypes.forEach(function(type, t){
				graphDateTypes.forEach(function(dateType, d){
					gs[type][dateType].options = angular.copy(commonOptions);
					//tickFormat
					gs[type][dateType].options.chart.xAxis.tickFormat = function(index) {
						var data = gs[type][dateType].xAxisData[index];
						var resultInterval = gs[type][dateType].data[0].resultInterval;
						return changeFormatForGraph(data, resultInterval);
					};
					gs[type][dateType].options.chart.y = function(d){
						if(gs[type][dateType].options.chart.yDomain[1] < d[1]){
							gs[type][dateType].options.chart.yDomain[1] = d[1];
						}
						return d[1];
					};
					for(var k in eachChartOptions[type]){
						gs[type][dateType].options.chart[k] = eachChartOptions[type][k];
						if(type === graphTypes[0] && k === "legend"){
							gs[type][dateType].options.chart[k] = {
								dispatch: {
									legendClick: function(item){
										gs.selectChartItem(
											'.pc-realtime-graph-today', 
											gs.average[dateType].data,
											item
										);
									}
								}
							};
						}
					}
				});
			});

			deferred.resolve("Success");
			return deferred.promise;
		},
		getGraph: function(dateType, type){
			var deferred = $q.defer();

			function successCallback(data){
				data = data.data;

				var xAxisData = [];
				var allChartData = [];
				var tableData = {
					rules: [],
					timeTable: []
				};

				$scope.graphSection[type][dateType].options.chart.yDomain = [0, 1];
				$scope.resultSection.setXAxisFormat(data[0].resultInterval);

				for(var i = 0, len = data.length; i < len; i++){
					var self = data[i];

					var key = $scope.queueData.Queues[self.name - 1].Name;
					if(type === graphTypes[1]){
						key = key + ' - ' + $translate.instant($scope.lang.graph[self.direction.toLowerCase()]);
					}

					var chartData = {
						key: key,
						values: [],
						seriesIndex: i,
						resultInterval: self.resultInterval
					};

					if(type === graphTypes[0]){
						chartData.color =  i === 0 ? chartColor.selected : chartColor.default;
						chartData.area = true;
					}

					var tableKey = $scope.queueData.Queues[data[i].name - 1].Name + ' - ' + $translate.instant($scope.lang.graph[data[i].direction.toLowerCase()]);
					tableData.rules[i] = [];
					tableData.rules[i].push( tableKey );
					var sum = 0;
					for(var j = 0, jLen = self.results.length; j < jLen; j++){
						var resultSelf = self.results[j];
						if(parseInt(resultSelf.value, 10) > 0){
							$scope.resultSection.noResults = false;
						}
						chartData.values.push([j, resultSelf.value]);
						xAxisData[j] = resultSelf.timeStamp;

						tableData.rules[i].push(resultSelf.value);
						sum += resultSelf.value;

						if(i === 0){
							var time = changeFormatForGraph(resultSelf.timeStamp, self.resultInterval);
							tableData.timeTable.push(time);
						}
					}

					allChartData.push(chartData);
					tableData.rules[i].push(sum);
				}

				$scope.graphSection.setData(allChartData, dateType, type);
				$scope.graphSection.setXAxisData(xAxisData, dateType, type);

				if(dateType === graphDateTypes[2]){
					if(type === graphTypes[1]){
						var oldTableData = $scope.resultSection.getTableData().rules;
						oldTableData.reverse();
						oldTableData.forEach(function(rule, i){
							tableData.rules.unshift(rule);
						});
					}
					$scope.resultSection.setTable(tableData);
				}

				deferred.resolve("Success");
			}

			function failCallback(failData){
				deferred.reject("Fail");
				console.error(failData);
			}

			if(dateType === graphDateTypes[0]){
				qmModel
					.getTodayGraphData(type)
					.then(successCallback, failCallback);
			}else if(dateType === graphDateTypes[1]){
				qmModel
					.getWeeklyGraphData(type)
					.then(successCallback, failCallback);
			}else{
				var dateForm = $scope.pcConditionsDateForm;
				var toCalenderTimeStamp = dateForm.toCalender.getTime();
				var fromCalenderTimeStamp = dateForm.fromCalender.getTime();

				var searchOptions = {
					fromDate: fromCalenderTimeStamp,
					toDate: toCalenderTimeStamp
				};

				var checkList = {};
				var typeArr = type === graphTypes[0]? ["average"] : ["medium", "high"];

				typeArr.forEach(function(typeSelf, i){
					var arr = [];
					$("input[type='checkbox'][id^='qm-search-" + typeSelf + "-']:checked").each(function(j, self){
						var index = parseInt( $(self).attr("data-index"), 10);
						arr.push(index);
					});

					if(arr.length > 0){
						checkList[typeSelf] = arr;
					}
				});

				if(Object.keys(checkList).length === 0){
					deferred.resolve("NoData");
				}else{
					$scope.resultSection.viewGraph[type] = true;
					qmModel
						.getSearchGraphData(type, searchOptions, checkList)
						.then(successCallback, failCallback);
				}
			}

			return deferred.promise;
		}
	};

	$scope.searchSection = {
		start: function(){
			var deferred = $q.defer();
			var dateForm = $scope.pcConditionsDateForm;
			if(dateForm.validate() === false){
				deferred.resolve("Success");
			}else{
				$scope.resultSection.noResults = true;

				var gs = $scope.graphSection;
				var promises = [];

				$scope.resultSection.view = false;
				$scope.resultSection.viewGraph[graphTypes[0]] = false;
				$scope.resultSection.viewGraph[graphTypes[1]] = false;
				$scope.resultSection.resetTableData();

				var failCallback = function(errorData){
					console.error(errorData);
					deferred.reject("Fail");
				};
				var searchAverage = function(){
					return gs.getGraph(graphDateTypes[2], graphTypes[0]);
				};
				var searchCumulative = function(){
					return gs.getGraph(graphDateTypes[2], graphTypes[1]);
				};

				promises.push(searchAverage);
				promises.push(searchCumulative);

				if(promises.length > 0){
					$q.seqAll(promises).then(
						function(){
							if( $scope.resultSection.viewGraph[graphTypes[0]] === false && $scope.resultSection.viewGraph[graphTypes[1]] === false ){
								pcModalService.openAlert({
									title: $translate.instant("lang_alert"),
									message: $translate.instant("lang_msg_area_select")
								});
							}else{
								$scope.resultSection.view = true;
								$timeout(function(){
									gs.resizeHandle();
								});
								$timeout(function(){
									gs.resizeHandle();
								}, 1000);
							}
							deferred.resolve("Success");
						}, 
						failCallback
					);
				}
			}

			return deferred.promise;
		}
	};

	function exportSuccessCallback(data){
        var specialHeaders = [];
        specialHeaders[0] = {};
        specialHeaders[0].Type = 'Content-Type';
        specialHeaders[0].Header = 'application/json';

        var dateForm = $scope.pcConditionsDateForm;
		var toCalenderTimeStamp = dateForm.toCalender;
		var fromCalenderTimeStamp = dateForm.fromCalender;

		var changeFormat = function(dateObj){
			var year = dateObj.getFullYear();
	        var month = dateObj.getMonth() + 1;
	        var day = dateObj.getDate();
	        var hour = dateObj.getHours();
	        var minute = dateObj.getMinutes();
	        var second = dateObj.getSeconds();

			month = month < 10 ? "0" + month : month;
	        day = day < 10 ? "0" + day : day;
	        hour = hour < 10 ? "0" + hour : hour;
	        minute = minute < 10 ? "0" + minute : minute;
			second = second < 10 ? "0" + second : second;

			var str = [
				year,
				'-',
				month,
				'-',
				day,
				' ',
				hour,
				':',
				minute,
				':',
				second
			];

			return str.join('');
		};

        var postData = {
            'fileTitle': data.title,
            'fileDesc': data.description,
            'fileName': data.fileName,
            'fileType': data.extension,
            'countandzone': $translate.instant($scope.lang.queueManagement),
            'period': changeFormat(fromCalenderTimeStamp) + ' - ' + changeFormat(toCalenderTimeStamp),
            'currentDateStr': changeFormat(new Date()),
            'searchResultData': {
	        	"format":"",
	        	"recCnt":"",
	        	"curOffset":"0",	        	
	        	"recInfo":[]
	    	}
        };

        var format = $scope.resultSection.getXAxisFormat();
        format = format.replace(format[0], format[0].toUpperCase()) + 's';
        postData.searchResultData.format = format;

		var recInfo = [];
		var resultTableData = $scope.resultSection.getTableData();

        postData.searchResultData.recCnt = resultTableData.timeTable.length + "";

        for(var i = 0, len = resultTableData.timeTable.length; i < len; i++){
        	var recInfoItem = {};
        	recInfoItem.time = resultTableData.timeTable[i];
        	//Zero index is always rule name.
        	for(var j = 0, jLen = resultTableData.rules.length; j < jLen; j++){
        		var name = resultTableData.rules[j][0];
	        	recInfoItem[name] = resultTableData.rules[j][i + 1] + "";
        	}

        	recInfo.push(recInfoItem);
        }

        postData.searchResultData.recInfo = recInfo;

        //searchResultData have to be string.
        postData.searchResultData = JSON.stringify(postData.searchResultData);

        var encodedta = encodeURI(JSON.stringify(postData));

        var url = "/home/exportToExcel.cgi?dumy=" + new Date().getTime();
        SunapiClient.file(url,
            function (response) {
                var filename = postData.fileName + '.' +postData.fileType;
                var contentType = 'text/plain';
                var success = false;
                if(postData.fileType==='.xlsx'){
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                }                    
                try{
                    console.log("Trying SaveBlob method ...");

                    var blob = new Blob([response.data], {type: contentType});
                    if (navigator.msSaveBlob) {
                        navigator.msSaveBlob(blob, filename);
                    }
                    else {
                        var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
                        if (saveBlob === undefined) {
                            throw "Not supported";
                        }
                        saveBlob(blob, filename);
                    }
                    console.log("SaveBlob succeded");
                    success = true;
                }
                catch (ex) {
                    console.log("SaveBlob method failed with the exception: ", ex);
                }

                if (!success) {
                    var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
                    if (urlCreator) {
                        var link = document.createElement('a');
                        if ('download' in link) {
                            try {
                                console.log("Trying DownloadLink method ...");

                                var blob = new Blob([response.data], {type: contentType});
                                var url = urlCreator.createObjectURL(blob);
                                link.setAttribute('href', url);
                                link.setAttribute("download", filename);

                                var event = document.createEvent('MouseEvents');
                                event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                                link.dispatchEvent(event);

                                console.log("Succeeded File Export");
                                success = true;
                            }
                            catch (ex) {
                                console.log("DownloadLink method failed with exception: ", ex);
                            }
                        }
                        if (!success) {
                            try {
                                console.log("Trying DownloadLink method with WindowLocation ...");
                                var blob = new Blob([response.data], {type: contentType});
				                var reader = new FileReader();
				                var downloadText = function(){
				                	var text = reader.result;
				                	var form = document.createElement('form');
						            var input = document.createElement('input');
						            var input2 = document.createElement('input');
						            var iframe = document.createElement('iframe');

						            form.action = '/home/setup/imagedownload.cgi';
						            form.method = 'POST';
						            form.id = 'captureForm';

						            input.type = 'hidden';
						            input.name = 'backupfileData';
						            input.id = 'backupfileData';
						            input.value = text;

						            input2.type = 'hidden';
						            input2.name = 'fileName';
						            input2.id = 'fileName';
						            input2.value = filename;

						            form.appendChild(input);
						            form.appendChild(input2);

						            iframe.style.display = 'none';
						            iframe.name = 'captureFrame';
						            iframe.id = 'captureFrame';
						            iframe.width = '0px';
						            iframe.height = '0px';

						            form.target = 'captureFrame';
						            document.body.appendChild(iframe);
						            document.body.appendChild(form);
						            
						            form.submit();

						            var interval;
						            var captureFrame = $('#' + iframe.id);
						            var captureForm = $('#' + form.id);
						            captureFrame.unbind();
						            interval = setTimeout(function(){

						                captureFrame.unbind();
						                captureForm.remove();
						                captureFrame.remove();
						            }, 1000);
				                };
				                reader.readAsText(blob);
				                reader.onload = downloadText;
                                console.log("DownloadLink method with WindowLocation succeeded");
                                success = true;
                            }
                            catch (ex) {
                                console.log("DownloadLink method with WindowLocation failed with exception: ", ex);
                            }
                        }
                    }
                }

                if (!success) {
                    console.log("No methods worked for saving the arraybuffer, Using Resort window.open");
                    var httpPath = '';
                    window.open(httpPath, '_blank', '');
                }
            }, 
            function (errorData) {
                console.log(errorData);
            }, $scope, encodedta, specialHeaders);
	}

	$scope.resultSection = {
		view: false,
		show: function(){
			$scope.resultSection.showResults = true;
		},
		hide: function(){
			$scope.resultSection.showResults = false;
		},
		viewGraph: {
			average: false,
			cumulative: false
		},
		noResults: true,
		tableData: {
			rules: [],
			timeTable: []
		},
		setTable: function(data){
			$scope.resultSection.tableData = data;
		},
		getTableData: function(){
			return $scope.resultSection.tableData;
		},
		resetTableData: function(){
			$scope.resultSection.tableData = {
				rules: [],
				timeTable: []
			};
		},
		getReport: function(){
		  pcModalService.openReportForm().then(
		  	exportSuccessCallback, 
		  	function(){
		  		console.log("Fail Report");
		  	}
		  );
		},
		xAxisFormat: '',
		setXAxisFormat: function(resultInterval){
			var format = '';
			switch(resultInterval){
				case 'Hourly':
					format = 'hour';
				break;
				case 'Daily':
					format = 'day';
				break;
				case 'Monthly':
					format = 'month';
				break;
			}

			$scope.resultSection.xAxisFormat = format;
		},
		getXAxisFormat: function(){
			return $scope.resultSection.xAxisFormat;
		}
	};

	function changeDateFormat(date, useMonth, useDay, useTime){
		var useMonth = useMonth === false ? false : true;
		var useDay = useDay === false ? false : true;

		var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var str = year;

        month = month < 10 ? "0" + month : month;
        day = day < 10 ? "0" + day : day;

        if(useMonth === true){
        	str += '-' + month;
        }

        if(useDay === true){
        	str += '-' + day;	
        }

        return str;
	}

	function getCalenderDate(){
		var dateForm = $scope.pcConditionsDateForm;

		var FromDate = null;
		var ToDate = null;

		var fromCalender = dateForm.fromCalender;
		var toCalender = dateForm.toCalender;

		FromDate = changeDateFormat(fromCalender) + "T00:00:00Z";
		ToDate = changeDateFormat(toCalender) + "T23:59:59Z";

		return {
			FromDate: FromDate,
			ToDate: ToDate
		};
	}

	function showVideo() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, function(response) {
            var viewerWidth = 640;
            var viewerHeight = 360;
            var maxWidth = mAttr.MaxROICoordinateX;
            var maxHeight = mAttr.MaxROICoordinateY;
            var rotate = response.data.Flip[0].Rotate;
            var flip = response.data.Flip[0].VerticalFlipEnable;
            var mirror = response.data.Flip[0].HorizontalFlipEnable;
            var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;
            $scope.videoinfo = {
                width: viewerWidth,
                height: viewerHeight,
                maxWidth: maxWidth,
                maxHeight: maxHeight,
                flip: flip,
                mirror: mirror,
                support_ptz: false,
                rotate: rotate,
                adjust: adjust,
                currentPage: 'Queue'
            };
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

	/**
	 * @param options {Object} view, controller, iconClass, title, message, data
	 * @return Promise {Promise}
	 */
	function openAlert(options){
		if(asyncInterrupt){
			return;
		}
		var view = options.view || 'views/setup/peoplecounting/modals/alert.html';
		var controller = options.controller || 'alertModalCtrl';
		var size = options.size || 'sm';
		var data = {
        	iconClass: function(){
        		return options.iconClass;
        	},
        	title: function(){
    			return options.title;
        	},
            message: function ()
            {
                return options.message;
            }
        };
        data = $.extend(data, options.data);

		modalInstance = $uibModal.open({
            templateUrl: view,
            controller: controller,
            resolve: data,
            size: size
        });

        return modalInstance.result;
	}

	/**
	 * @param options {Object} view, controller, title, message, data
	 * @return Promise {Promise}
	 */
	function openConfirm(options){
		if(asyncInterrupt){
			return;
		}
		var view = options.view || 'views/setup/peoplecounting/modals/confirm.html';
		var controller = options.controller || 'confirmModalCtrl';
		var data = {
        	title: function(){
    			return options.title;
        	},
            message: function ()
            {
                return options.message;
            }
        };
        data = $.extend(data, options.data);

		modalInstance = $uibModal.open({
            templateUrl: view,
            controller: controller,
            resolve: data,
            size: 'sm'
        });

		return modalInstance.result;
	}

    function getPercent(val, max){
		return (val / max)*100;
	}

	function getPeopleData(id){
		var max = $scope.queueData.Queues[id].MaxPeople;
		var high = $scope.queueData.Queues[id].QueueLevels[0].Count;
		var mid = Math.ceil( high / 2 );

		return {
			max: max,
			high: high,
			mid: mid
		};
	}

	var gaugeTimer = {
		timer0: null,
		timer1: null,
		timer2: null
	};
	$scope.queueLevelSection = {
		maxArr: {},
		start: function(id){
			$scope.queueLevelSection.change(id);

			gaugeTimer['timer' + id] = setInterval(function(){
				$scope.queueLevelSection.change(id);
			}, 1000);
		},
		stop: function(id){
			var name = 'timer' + id;
			if(gaugeTimer[name] !== null){
				clearInterval(gaugeTimer[name]);
				gaugeTimer[name] = null;
			}
		},
		change: function(id){
			var successCallback = function(response){
				var queue = response[0].Count;
				var data = getPeopleData(id);
				var parent = $("#qm-bar-" + id);

				var colorList = ["#2beddb", "#0dd8eb", "#57ed06", "#0ec20e", "#ffab33", "#ff5400"];
				var colorNameList = ["#1be2e4", "#31d70a", "#ff7f19"];

				parent.find(".qm-bar-mask").css({
					width: (100 - getPercent(queue, data.max)) + "%"
				});

				//Bar 2
				var colorName = null;
				var startColor = null;
				var endColor = null;
				if(queue < data.mid){
					colorName = colorNameList[0];
					startColor = colorList[0];
					endColor = colorList[1];
				}else if(queue < data.high){
					colorName = colorNameList[1];
					startColor = colorList[2];
					endColor = colorList[3];
				}else{
					colorName = colorNameList[2];
					startColor = colorList[4];
					endColor = colorList[5];
				}

				parent.find(".qm-bar").css({
					// background: colorName,
					// background: "-webkit-linear-gradient(left, " + startColor + ", " + endColor + ")",
					// background: "-o-linear-gradient(right, " + startColor + ", " + endColor + ")",
					// background: "-moz-linear-gradient(right, " + startColor + ", " + endColor + ")",
					background: "linear-gradient(to right, " + startColor + ", " + endColor + ")"
				});
			};

			var failCallback = function(failData){
				console.error(failData);
			};

			qmModel.checkData(
				{
					Channel: channel,
					QueueIndex: (id + 1)
				}
			).then(successCallback, failCallback);
		}
	};

	$scope.init = function(){
		var deferred = $q.defer();
		/**
		 * When page is setted newly, Scroll of Browser have to set the top.
		 */
		$('.main.setup-wrapper').scrollTop(0);

		if(setMaxResolution() === false){
			console.error("Getting Maxinum Resolution of Video is Wrong!");
		}

		var failCallback = function(errorData){
			console.error(errorData);
			deferred.reject("Fail");
		};

		var resizeGraph = function(){
			setTimeout(function(){
				$scope.graphSection.resizeHandle();	
			}, 100);
		}

		qmModel.initModel().then(
			function(){
				qmModel.getData().then(
					function(data){
						$scope.queueData = data;
						$scope.queueData.dataLoad = true;
						console.info($scope.queueData);

						//Search
						$scope.pcConditionsDateForm.init(
							function(){
								console.info("Success");
							},
							failCallback
						);
						if(data.Enable === true){
							// Queue Level(Start graph)
							$scope.queueLevelSection.start(0);
							$scope.queueLevelSection.start(1);
							$scope.queueLevelSection.start(2);
							// Preview
							$scope.previewSection.init();
							//Graph
							$scope.graphSection.init().then(
								function(){
									resizeGraph();
									deferred.resolve("Success");
								},
								failCallback
							)
						}else{
							deferred.resolve("Success");
						}
					}, 
					failCallback
				);
			},
			failCallback
		);

		return deferred.promise;
	};

	/* Destroy Area Start
	------------------------------------------ */
	$scope.$on("$destroy", function(){
		// asyncInterrupt = true;
		// if(modalInstance !== null){
		// 	modalInstance.close();
		// 	modalInstance = null;
		// }
    });

    /* Queue management Search page를 벗어 날 때 */
    $scope.$on('$stateChangeStart',function (event, toState, toParams, fromState, fromParams) {
        if(fromState.controller === 'QMStatisticsCtrl'){
        	$scope.graphSection.unbindResize();
			$scope.queueLevelSection.stop(0);
			$scope.queueLevelSection.stop(1);
			$scope.queueLevelSection.stop(2);
			qmModel.cancelSearch();
        }
    });

	/* Destroy Area End
	------------------------------------------ */
	function view(){
		var failCallback = function(errorData){
			console.log(errorData);
			$scope.pageLoaded = true;
		};

		showVideo()
			.then(
				function(){
					$scope.init()
						.then(
							function(){
								$scope.pageLoaded = true;
							}, 
							failCallback
						);
				}, 
				failCallback
			);
	}

	$scope.view = view;

	(function wait(){
		$timeout(function(){
			if (!mAttr.Ready) {
				$timeout(function () {
					mAttr = Attributes.get();
					wait();
				}, 500);
			} else {
				getAttributes().finally(function() {
					view();
				});
			}
		});
	})();
});