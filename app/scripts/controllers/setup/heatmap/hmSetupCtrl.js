/* global sessionStorage */
"use strict";

kindFramework.controller('HMSetupCtrl', function (
	$scope, 
	$rootScope,
	$uibModal, 
	$state, 
	$timeout,
    $q,
    $translate,
	Attributes,
	COMMONUtils,
	ConnectionSettingService, 
	HMStatisticsModel,
	SunapiClient,
    pcSetupService,
    sketchbookService
	){
	var mAttr = Attributes.get();
    var HMStatisticsModel = new HMStatisticsModel();

    var asyncInterrupt = false;
    var modalInstance = null;
    var BrowserDetect = COMMONUtils.getBrowserDetect();

    $scope.support = {
        isIE: BrowserDetect.isIE
    };

    $scope.pageLoaded = false;

	$scope.currentTapStatus = [true, false];
	$scope.changeTabStatus = function(value){
		var flag = '';
		
		for(var i = 0, len = $scope.currentTapStatus.length; i < len; i++){
			if(i === value){
				$scope.currentTapStatus[i] = true;
			}else{
				$scope.currentTapStatus[i] = false;
			}
		}

		//Configuration
		if($scope.currentTapStatus[0] === true){
			flag = '';
		}else if($scope.currentTapStatus[1] === true){
			flag = 'area';
		}

		$scope.sketchinfo = getSketchinfo(flag);
	};

    function setMaxResolution(){
        return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
    }

    function setImageSize(){
        var defaultResolution = pcSetupService.getDefaultResolution();
        var imageSize = {
            width: defaultResolution.width + "px",
            height: defaultResolution.height + "px"
        };

        $(".hm-setup-overlay-heatmap img").css(imageSize);
        $(".hm-setup-overlay-heatmap").css(imageSize);
    }

	function getSketchinfo(flag){
		var sketchinfo = {
			shape: 1,
			modalId: "./views/setup/common/confirmMessage.html"
		};
		$scope.coordinates = [];
		var data = null;
        
        //Exclude Area
        if(flag === "area") {
        	for(var i = 0, ii = $scope.excludeAreaSection.data.length; i < ii; i++){
        		var self = $scope.excludeAreaSection.data[i];
        		var isEmpty = self.points.length === 0;
        		var coordinatesInfo = {
        			isSet: !isEmpty,
        			enable: self.isEnable,
        			points: self.points
        		};

        		$scope.coordinates.push(coordinatesInfo);
        	}

        	sketchinfo.workType = 'fdArea';
        	sketchinfo.maxNumber = 4;
        	sketchinfo.color = 1;
        //Configuration
        }else{
        	sketchinfo = null;
        }

        return angular.copy(sketchinfo);
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
                currentPage: 'Heatmap'
            };
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    $scope.colorLevelSection = {
        /**
        BackgroundColourLevel 100 : Full Color 0 : Gray Color
        */
        BackgroundColourLevel: 'false',
        init: function(val){
            var enable = val === 100 ? 'true' : 'false';
            $scope.colorLevelSection.BackgroundColourLevel = enable;
            $scope.colorLevelSection.changeColorTone();
        },
        toggleColorTone: function(status){
            var previewVideo = $("#livecanvas");
            var filterOption = {
                on: {
                    'filter': 'grayscale(100%)',
                    '-webkit-filter': 'grayscale(100%)'
                },
                off: {
                    'filter': 'grayscale(0%)',
                    '-webkit-filter': 'grayscale(0%)'
                }
            };

            var options = null;

            if(BrowserDetect.isIE !== true){
                options = status === true ? filterOption.on : filterOption.off;
                previewVideo.css(options);   
            }
        },
        changeColorTone: function(){
            try{
                var enable = $scope.colorLevelSection.BackgroundColourLevel;
                
                if(enable === 'true'){
                    $scope.colorLevelSection.toggleColorTone(false);
                }else{
                    $scope.colorLevelSection.toggleColorTone(true);
                }
            }catch(e){
                console.error(e);
            }
        }
    };

    $scope.excludeAreaSection = {
        data: [],
        backupData: [],
        update: function(index, data){
            $scope.excludeAreaSection.data[index] = data;
        },
        backup: function(){
            $scope.excludeAreaSection.backupData = angular.copy($scope.excludeAreaSection.data);
        },
        updatePoints: function(index, points){
            $scope.excludeAreaSection.data[index].points = points;
        },
        select: function(index){
            for(var i = 0, ii = $scope.excludeAreaSection.data.length; i < ii; i++){
                $scope.excludeAreaSection.data[i].isSelected = i === index;
            }

            sketchbookService.activeShape(index);
        }
    };

    $scope.configurationSection = {
        enableHeatMap: false,
        show: function(src){
            $scope.configurationSection.enableHeatMap = true;
        },
        hide: function(){
            $scope.configurationSection.enableHeatMap = false;
        },
        loadImage: function(SearchToken){
            var src = HMStatisticsModel.getResultPath(SearchToken);
            var imgTag = $('.hm-setup-overlay-heatmap img');
            var deferred = $q.defer();
            
            imgTag.attr('src', src);
            imgTag.on("load", function(){
                deferred.resolve(true);
            });
            imgTag.on("error", function(){
                deferred.reject(false);
            });

            return deferred.promise;
        }
    };


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

    var isErrorFirst = false;
    $scope.conditionsSection = {
        startSearch: function(withoutBG){
            isErrorFirst = false;

            if(asyncInterrupt || !$scope.useHeatmap || $scope.checkSearching){
                return;
            }

            if(withoutBG){
                $scope.configurationSection.hide();
            }

            cameraLocalTime.set().then(function(){
                var localTime = cameraLocalTime.getDateObj();

                var searchFromDate = changeDateFormat(localTime) + "T00:00:00Z";
                var searchToDate = changeDateFormat(localTime) + "T23:59:59Z";

                var ResultImageType = withoutBG ? "WithoutBackground" : "WithBackground";

                HMStatisticsModel.startSearch(searchFromDate, searchToDate, ResultImageType).then(
                    function(responseData){
                        $scope.conditionsSection.checkSearch(withoutBG, responseData.SearchToken, 0);
                    },
                    function(failData){
                        $scope.conditionsSection.errorSearch(failData);
                    }
                );
            });
        },
        checkSearch: function(withoutBG, SearchToken, time){
            if(asyncInterrupt || time >= 60000){
                $scope.conditionsSection.cancelSearch(SearchToken);
                return;
            }
            var next = function(){
                time += 100;
                setTimeout(function(){
                    $scope.conditionsSection.checkSearch(withoutBG, SearchToken, time);
                }, 100);
            };

            HMStatisticsModel.checkSearch(SearchToken).then(
                function(responseData){
                    console.log(responseData);
                    if(responseData.Status === "Completed"){
                        if(withoutBG){
                            $scope.configurationSection.loadImage(SearchToken).then(
                                function(successData){
                                    $scope.configurationSection.show();
                                },
                                function(failData){
                                    $scope.conditionsSection.errorSearch(failData);
                                }
                            );
                        }

                        $scope.conditionsSection.cancelSearch(SearchToken);
                    }else{
                        next();
                    }
                },
                function(failData){
                    //security.cgi 와 충돌 되면서 cancel되어 첫번째 Error는 예외처리.
                    if(failData === 'HTTP Error : ' && isErrorFirst === false){
                        isErrorFirst = true;
                        next();
                    }else{
                        $scope.conditionsSection.errorSearch(failData);
                    }
                }
            );
        },
        cancelSearch: function(SearchToken){
            $scope.checkSearching = false;
            /*
            HMStatisticsModel.cancelSearch(SearchToken).then(
                function(responseData){
                    console.log(responseData);
                },
                function(failData){
                    console.log(failData);
                }
            );
            */
        },
        errorSearch: function(failData){
            $scope.checkSearching = false;
            openAlert({
                title: $translate.instant('lang_heatmap'),
                message: $translate.instant('lang_msg_heatmap_error')
            });
        },
        openReport : function(){
            openAlert({
                view: 'views/setup/heatmap/modals/report.html',
                controller: 'hmReportModalCtrl',
                size: 'md',
                data: {
                    CameraName: function(){
                        return $scope.deviceName;
                    },
                    FromDate: function(){
                        return searchFromDate;
                    },
                    ToDate: function(){
                        return searchToDate;
                    }
                }
            });
        }
    };

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

    $scope.$on("$destory", function(){
        asyncInterrupt = true;
        if(modalInstance !== null){
            modalInstance.close();
            modalInstance = null;
        }
    });

    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args) {
        var modifiedIndex = args[0];
        var modifiedType = args[1]; //생성: create, 삭제: delete
        var modifiedPoints = args[2];
        var modifiedDirection = args[3];
        var vaLinesIndex = null;
        var vaAreaIndex = null;

        // console.log("updateCoordinates", modifiedIndex, modifiedType, modifiedPoints, modifiedDirection);

        var coordinates = [];
        var mode = [];

		if($scope.currentTapStatus[1] === true){ //Exclude area
        	switch(modifiedType){
                case 'create':
                    $scope.excludeAreaSection.update(modifiedIndex, {
                        points: modifiedPoints,
                        isEnable: true,
                        isSelected: false
                    });
                break;
                case 'mouseup':
                    $scope.excludeAreaSection.updatePoints(modifiedIndex, modifiedPoints);
                break;
                case 'delete':
                    $scope.excludeAreaSection.update(modifiedIndex, {
                        points: [],
                        isEnable: false,
                        isSelected: false
                    });
                break;
            }

            if(modifiedType !== "delete"){
                sketchbookService.activeShape(modifiedIndex);
                $scope.excludeAreaSection.select(modifiedIndex);
            }

        	$timeout(function(){});
        }
    }, $scope);

	$scope.openFTPEmail = function() {
    	$state.go('^.event_ftpemail');
    };

    function failCallback(failData){
        console.log(failData);
    }

	function view(){
        $scope.configurationSection.hide();
        
		showVideo().then(function(){
            HMStatisticsModel.deviceInfo().then(function(successData){
                $scope.deviceName = successData.DeviceName;
                $scope.Model = successData.Model;

                setMaxResolution();
                // setImageSize();

                //Exclude Area 임의 설정
                HMStatisticsModel.getReportInfo().then(function(data){
                    try{
                        //초기화
                        for(var i = 0; i < 4; i++){
                            $scope.excludeAreaSection.update(i, {
                                points: [],
                                isEnable: false,
                                isSelected: false
                            });
                        }

                        if("Areas" in data){
                            for(var i = 0, ii = data.Areas.length; i < ii; i++){
                                var self = data.Areas[i];
                                var coordinates = self.Coordinates;
                                var points = [];

                                for(var j = 0, jj = coordinates.length; j < jj; j++){
                                    var jSelf = coordinates[j];
                                    points.push([
                                        jSelf.x,
                                        jSelf.y
                                    ]);
                                }

                                $scope.excludeAreaSection.update(self.Area - 1, {
                                    points: points,
                                    isEnable: true,
                                    isSelected: false
                                }); 
                            }
                        }

                        if("BackgroundColourLevel" in data){
                            $scope.colorLevelSection.init(data.BackgroundColourLevel);
                        }

                        $scope.excludeAreaSection.backup();
                    }catch(e){
                        console.error(e);
                    }

                    $scope.pcSetupReport.getReport();
                    $scope.conditionsSection.startSearch(true);

                    $timeout(function(){
                        $scope.pageLoaded = true;

                        if($scope.currentTapStatus[1] === true){
                            $scope.changeTabStatus(1);
                        }
                    });
                }, failCallback);
            }, failCallback);
		}, failCallback);
	}

	function setReport(){
        var requestData = {};
        var deleteAreaData = [];

        var setHeatMap = function(){
            return SunapiClient.get(
                '/stw-cgi/eventsources.cgi?msubmenu=heatmap&action=set', 
                requestData,
                function(){
                    $scope.pcSetupReport.setReport().then(view, view);
                }, 
                failCallback, '', true);
        };

        for(var i = 0, ii = $scope.excludeAreaSection.data.length; i < ii; i++){
            var self = $scope.excludeAreaSection.data[i];
            var backupSelf = $scope.excludeAreaSection.backupData[i];
            //Exclude Area이기 때문에 항상 Outside로 설정
            if(self.points.length > 0){
                requestData['Area.' + (i + 1) + '.Type'] = 'Outside';
                requestData['Area.' + (i + 1) + '.Coordinates'] = self.points.join(',');    
            }else if(backupSelf.points.length > 0){
                deleteAreaData.push(i + 1);
            }
        }

        requestData['BackgroundColourLevel'] = $scope.colorLevelSection.BackgroundColourLevel === 'true' ? 100 : 0;

        if(deleteAreaData.length > 0){
            if(deleteAreaData.length === 4){
                deleteAreaData = ['All'];
            }
            SunapiClient.get(
                '/stw-cgi/eventsources.cgi?msubmenu=heatmap&action=remove', 
                {
                    AreaIndex: deleteAreaData.join(',')
                }, 
                setHeatMap, 
                failCallback, '', true);
        }else{
            setHeatMap();
        }
	}

	function set(){
		if($scope.pcSetupReport.validate()){
        	COMMONUtils.ApplyConfirmation(setReport);	
		}
        return;
	}

	$scope.submitEnable = function(){
		modalInstance = $uibModal.open({
	        templateUrl: 'views/setup/common/confirmMessage.html',
	        controller: 'confirmMessageCtrl',
	        size: 'sm',
	        resolve: {
	            Message: function() {
	                return 'lang_apply_question';
	            }
	        }
	    });
	    modalInstance.result.then(function() {
	 		$scope.pcSetupReport.setReport().then(function(){
	 			$timeout(view);
	 		}, function(errorData){
	 			console.error(errorData);
	 		});     
	    }, function(){
	    	$scope.useHeatmap = !$scope.useHeatmap;
	    });
	};

	$scope.submit = set;
	$scope.view = view;

	(function wait(){
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            view();
        }
	})();
});