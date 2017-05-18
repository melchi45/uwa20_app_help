kindFramework.controller('ModalInstnceCropCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', '$sce', 'data', '$timeout','UniversialManagerService', 'sketchbookService', '$translate', 'Attributes', 'SunapiClient', 'COMMONUtils',
  function ($scope, $rootScope, $uibModalInstance, $sce, data, $timeout, UniversialManagerService, sketchbookService, $translate, Attributes, SunapiClient, COMMONUtils) {
    "use strict";

    $scope.data = data;
    var cropArea = data.cropArea.split(",");
    var cropRatio = data.cropRatio;
    var cropEnable = data.cropEnable;
    var channelId = data.channelId;
    var mAttr = Attributes.get();
    var viewerWidth = 640;
    var viewerHeight = 360;
    var maxWidth;
    var maxHeight;
    var rotate;
    var flip;
    var mirror;
    var adjust;
    var cropInfo;
    var minCropResolution;
    var maxCropResolution;

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.ok = function() {
      var cropArray = sketchbookService.get();

      var data = {'cropArray' : cropArray,
                  'ratio':$scope.cropOption.selected, 
                  'enable':cropEnable,
                  'rotate':rotate};
      $uibModalInstance.close(data);
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.cropOption = {
      selected: cropRatio,
      options: ['16:9','4:3','Manual'],
    };

    $scope.$watch(function() { return $scope.cropOption.selected; }, function(newVal, oldVal) {
      console.log("cropOption = newVal :" + newVal + ", oldVal :" + oldVal);
      if (newVal !== oldVal) {
        $scope.ratio = newVal;
        setCropResolution();
        $scope.videoinfo.minCropResolution = minCropResolution;
        $scope.videoinfo.maxCropResolution = maxCropResolution;
        sketchbookService.changeRatio(newVal);
      }
    });

    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function (args)
    {
      var coordinates = sketchbookService.get();
      
      if(!$scope.$$phase) {
        $scope.$apply(function(){
          $scope.displayCoordi = "x: " + coordinates.x1 + " y: " + coordinates.y1 + " width: " + coordinates.width + " height :" + coordinates.height;
        });
      }else{
        $scope.displayCoordi = "x: " + coordinates.x1 + " y: " + coordinates.y1 + " width: " + coordinates.width + " height :" + coordinates.height;
      }        
    },$scope);

    $scope.VA = [];
    $scope.coordinates = null;
    $scope.coordinates = new Array(1);
    $scope.coordinates[0] = {x1: cropArea[0], y1: cropArea[1], width:(cropArea[2] - cropArea[0]), height:(cropArea[3] - cropArea[1])};
    $scope.displayCoordi = "x: " + $scope.coordinates[0].x1 + " y: " + $scope.coordinates[0].y1 + " width: " + $scope.coordinates[0].width + " height :" + $scope.coordinates[0].height;
    $scope.ratio = $scope.cropOption.selected;

    /* jshint ignore:start */
    if((mAttr.MaxROICoordinateX/mAttr.MaxROICoordinateY).toFixed(1) == 1.3){        //4:3
        viewerHeight = 480;
    }else if((mAttr.MaxROICoordinateX/mAttr.MaxROICoordinateY).toFixed(1) == 1.8){  //16:9
        viewerHeight = 360;
    }
    /* jshint ignore:end */

    function setCropResolution() {
      for (var i = 0; i < cropInfo.length; i++) {
        if ($scope.ratio === cropInfo[i].CropRatio) {
          minCropResolution = cropInfo[i].MinCropResolution;
          maxCropResolution = cropInfo[i].MaxCropResolution;
          break;
        }
      }
    }

    function showVideo() {
        var getData = {};
        SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, 
          function(response) {
            viewerWidth = 640;
            viewerHeight = 360;
            maxWidth = mAttr.MaxROICoordinateX;
            maxHeight = mAttr.MaxROICoordinateY;
            rotate = response.data.Flip[0].Rotate;
            flip = response.data.Flip[0].VerticalFlipEnable;
            mirror = response.data.Flip[0].HorizontalFlipEnable;
            adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

            SunapiClient.get('/stw-cgi/media.cgi?msubmenu=mediaoptions&action=view', getData, function(response) {
              cropInfo = response.data.MediaOptions[0].ViewModes[0].ResolutionsByCropRatio;
              setCropResolution();

              $timeout(function(){
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
                  minCropResolution : minCropResolution,
                  maxCropResolution : maxCropResolution,
                  channelId : channelId
                };

                $scope.sketchinfo = {
                  workType: "crop",
                  shape: 0,
                  maxNumber: 0,
                  modalId: null
                };
              });
            }, function(errorData) {
              console.log(errorData);
            }, '', false);
        }, function(errorData) {
            console.log(errorData);
        }, '', false);
    }

    showVideo();
}]);