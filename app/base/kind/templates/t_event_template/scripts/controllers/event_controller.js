kindFramework.controller('eventCtrl', function ($scope, $rootScope, KindEventService) {

    $("#tabs").tabs();
    angular.element("#startTime").datepicker({
        dateFormat:'yy-mm-dd',
        maxDate:'today',
        onClose:function(date){
            angular.element("#endTime").datepicker("option","minDate",date);
        }
    });
    
    angular.element("#endTime").datepicker({
        dateFormat:'yy-mm-dd',
        maxDate:'today',
        onClose:function(date){
            var maxDate = date == '' ? 'today' : date;
            angular.element("#startTime").datepicker("option","maxDate",maxDate);
        }
    });
    
    $scope.types=['All','Normal','Event','AlarmInput','VideoAnalysis','MotionDetection','NetworkDisconnect','FaceDetection','TamperingDetection','AudioDetection','Tracking','UserInput'];
    
    $scope.eventDatas = [];
    $scope.clickEventList = function () {
        var changeData = {
                FromDate:$scope.startTime + " 00:00:01",
                ToDate:$scope.endTime + " 23:59:59",
                Type:$scope.type
            }

        var connectionSettings = {
            cameraUrl: $scope.cameraIp,
            echo_sunapi_server: "55.101.78.176:5000",
            user: $scope.cameraId,
            password: $scope.cameraPassword,
            options:changeData
        }
        
        
        
        KindEventService.setDeviceConnectionInfo(connectionSettings);
        
        
//        $scope.eventController = new EventController(connectionSettings);
//        $scope.eventController.setDeviceConnectionInfo(connectionSettings);
        
        KindEventService.getEventList(changeData).then(function(value){
            $scope.eventDatas = value.TimeLineSearchResults[0].Results;    
            
        },function(){
            console.log('No search result found');   
        });
        return false;
    };


    $scope.eventListOptions = {
        data: 'eventDatas',
        headerRowHeight: 33,
        rowHeight: 42,
        columnDefs: [
            {
                field: 'StartTime',
                displayName: 'Time',
                cellFilter: 'changeTimeStamp'
            },
            {
                field: 'Type',
                displayName: 'Events'
            }
        ],

    };


});