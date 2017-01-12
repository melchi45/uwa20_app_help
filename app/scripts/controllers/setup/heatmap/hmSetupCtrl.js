/* global sessionStorage */
"use strict";

kindFramework.controller('HMSetupCtrl', function (
	$scope, 
	$uibModal, 
	$state, 
	$timeout,
	Attributes,
	COMMONUtils,
	ConnectionSettingService, 
	HMSetupModel
	){
	var mAttr = Attributes.get();
	var HMSetupModel = new HMSetupModel();

	$scope.openFTPEmail = function() {
    	$state.go('^.event_ftpemail');
    };

	function view(){
		$scope.pcSetupReport.getReport();
	}

	function setReport(){
		$scope.pcSetupReport.setReport();
	}

	function set(){
		if($scope.pcSetupReport.validate()){
        	COMMONUtils.ApplyConfirmation(setReport);	
		}
        return;
	}

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