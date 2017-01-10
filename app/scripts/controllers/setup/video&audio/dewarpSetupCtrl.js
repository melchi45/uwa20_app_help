kindFramework.controller('dewarpSetupCtrl',
	function ($scope, Attributes, $timeout, DewarpModel, SunapiClient, COMMONUtils){
	"use strict";

	var mAttr = Attributes.get("image");
    COMMONUtils.getResponsiveObjects($scope);

	var dewarpModel = null;
	var lang = null;

	$scope.langTitle = null;
	$scope.langCamMntMode = null;
	$scope.langViews = null;

	$scope.dewarpModeData = null;

	$scope.selectedDewarpMode = null;
	$scope.selectedDewarpView = null;

	$scope.pageLoaded = false;

	// attrs
	$scope.viewModeType = null;
	$scope.cameraPosition = null;
	$scope.lensModel = null;
	$scope.viewModeIndex = null;

	// current settings
	$scope.viewModes = null;

	var isRebooted = false;

	var pageData = {};

	function getAttributes() {
		$scope.lensModelList = mAttr.LensModel;
		
		if(mAttr.ViewModeIndex !== undefined)
		{
			$scope.minViewModeIndex = mAttr.ViewModeIndex.minValue;
			$scope.maxViewModeIndex = mAttr.ViewModeIndex.maxValue;
			$scope.cameraPositionList = mAttr.CameraPosition; // "Wall", "Ceiling"
			$scope.viewModeTypeList = mAttr.ViewModeType; // "QuadView", "DoublePanorama", "360Panorama", "Panorama"
		}		
	}

	function get() {
		return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=fisheyesetup&action=view', '',
            function (response) {
                $scope.viewModes = response.data.Viewmodes[0];
                pageData.viewModeIndex = angular.copy($scope.viewModes.ViewModeIndex);
                pageData.lensModel = angular.copy($scope.viewModes.LensModel);
				pageData.dewarpMode = angular.copy($scope.viewModes.CameraPosition);
				pageData.viewModeType = angular.copy($scope.viewModes.ViewModeType);
				for(var i = 0; i < $scope.dewarpModeData.length; i++) {
					if($scope.dewarpModeData[i].type === $scope.viewModes.CameraPosition) {
						$scope.selectedDewarpMode = $scope.dewarpModeData[i];
						for(var k = 0; k < $scope.selectedDewarpMode.views.length; k++) {
							if($scope.selectedDewarpMode.views[k].type === $scope.viewModes.ViewModeType) {
								$scope.selectedDewarpView = $scope.selectedDewarpMode.views[k];
								break;
							}
						}
						break;
					}
				}
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
	}

	function set() {
		if(pageData.dewarpMode !== $scope.selectedDewarpMode.type) {
            COMMONUtils.ShowConfirmation(successCallback, 'lang_msg_mountModeChange', 'md');
		} else {
             COMMONUtils.ApplyConfirmation(setDewarping);
		}
	}

	function setDewarping() {
		return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=fisheyesetup&action=set&ViewModeIndex='
								+ pageData.viewModeIndex + '&ViewModeType='
								+ $scope.selectedDewarpView.type
								+ '&CameraPosition='
								+ $scope.selectedDewarpMode.type, '',
            function (response) {
            	if(isRebooted) {
	            	COMMONUtils.onLogout();
	            }
            },
            function (errorData) {
            	console.log(errorData);
            }, '', true);
	}

	var successCallback = function() {
		isRebooted = true;
		setDewarping();
	};

	$scope.onModeSelected = function(data) {
		$scope.selectedDewarpView = data.views[0];
	};

	function view(){

		dewarpModel = new DewarpModel();
		lang = dewarpModel.getLang();

		$scope.langTitle = lang.langTitle;
		$scope.langCamMntMode = lang.langCamMntMode;
		$scope.langViews = lang.langViews;

		$scope.dewarpModeData = dewarpModel.getDewarpMode();

		getAttributes();

		get().then(function(success) {
			$scope.pageLoaded = true;
		},
		function(error) {
			console.log(error);
		});
	}

	$scope.view = view;
	$scope.submit = set;

	(function wait(){
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            try{
                Attributes.getAttributeSection().then(function(){
                    console.log("Attributes.getAttributeSection()");
                    mAttr = Attributes.get();
                    view();
                });
            }catch(e){
                view();
            }
        }
	})();
});