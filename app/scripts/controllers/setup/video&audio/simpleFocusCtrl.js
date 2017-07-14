/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('simpleFocusCtrl', function($scope, SunapiClient, Attributes, $timeout, COMMONUtils, sketchbookService, $q, $rootScope, UniversialManagerService, $uibModal) {
  "use strict";

  $scope.PTRZModel = false;
  $scope.FastAutoFocusDefined = true;
  $scope.ZoomOptionsDefined = true;
  $scope.FastAutoFocus = true;

  $scope.PageData = {};

  $scope.ptzinfo = {
      type: 'EPTZ'
  };

  var mAttr = Attributes.get();
  COMMONUtils.getResponsiveObjects($scope);

  $scope.Lens = null;
  $scope.IRShiftOptions = [];
  $scope.FBAdjustEnable = false;
  $scope.TCEnable = false;
  $scope.IRShift = '';
  $scope.ICSLensSupport = false;

  function getAttributes() {
    var defer = $q.defer();
    if (typeof mAttr.SimpleFocusOptions !== 'undefined') {
      $scope.SimpleFocusOptions = mAttr.SimpleFocusOptions;
      $scope.SimpleZoomOptions = mAttr.SimpleZoomOptions;
      $scope.FastAutoFocusEnable = mAttr.FastAutoFocusEnable;
      if (typeof $scope.FastAutoFocusEnable === 'undefined') {
        $scope.FastAutoFocusDefined = false;
      }
      if (typeof $scope.SimpleZoomOptions === 'undefined') {
        $scope.ZoomOptionsDefined = false;
      }
      $scope.FocusModeOptions = mAttr.FocusModeOptions;
      $scope.MaxChannel = mAttr.MaxChannel;
      // $scope.IRShiftOptions = mAttr.IRShiftOptions;
      $scope.IRShiftOptions = ["Off", "On"];
      $scope.IrisModeOptions = mAttr.IrisModeOptions;
      checkICSLensSupport();
    }

    // Check Support PTRZ
    $scope.PTRZModel = mAttr.PTRZModel | $scope.PTRZModel;
    if ($scope.PTRZModel) {
      $scope.getTitle = 'PTRZ Setup';
      $scope.PtrControlOptions = [-100, -10, -1, 1, 10, 100];
    } else {
      $scope.getTitle = 'lang_menu_focus';
    }

    defer.resolve("success");
    return defer.promise;
  }

  $scope.isSupportedFocusMode = function(mode) {
    var retVal = false;

    if (typeof $scope.FocusModeOptions !== 'undefined') {
      if ($scope.FocusModeOptions.indexOf(mode) !== -1) {
        return true;
      }
    }

    return retVal;
  };

  getAttributes();

  function manualFocus(level) {
    var setData = {};

    setData.Focus = level;
    setData.Channel = UniversialManagerService.getChannelId();

    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function manualZoom(level) {
    var setData = {};

    setData.Zoom = level;
    setData.Channel = UniversialManagerService.getChannelId();

    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function focusMode(mode) {
    var setData = {};

    setData.Mode = mode;
    setData.Channel = UniversialManagerService.getChannelId();
    var coordi = sketchbookService.get();
    if (coordi[0].isSet) {
      setData.FocusAreaCoordinate = coordi[0].x1 + "," + coordi[0].y1 + "," + coordi[0].x2 + "," + coordi[0].y2;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }



  function SaveFAFSettings() {
    var setData = {};
    setData.FastAutoFocus = $scope.FastAutoFocus;
    setData.Channel = UniversialManagerService.getChannelId();
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
      function(response) {
        view();
      },
      function(errorData) {
        view();
        console.log(errorData);
      }, '', true);
  }


  function setFastAutoFocus() {
    // COMMONUtils.ApplyConfirmation(SaveFAFSettings);
    COMMONUtils.ApplyConfirmation(function() {
      SaveFAFSettings();
    }, 
    'sm',
    function() {
      $scope.FastAutoFocus = !$scope.FastAutoFocus;
    });
  }

  function setTCEnable() {
    // COMMONUtils.ApplyConfirmation(SaveTCEnable);
    COMMONUtils.ApplyConfirmation(function() {
      SaveTCEnable();
    }, 
    'sm',
    function() {
      $scope.TCEnable = !$scope.TCEnable;
    });
  }

  function focusView() {
    var jData = {};
    jData.Channel = UniversialManagerService.getChannelId();
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=view', jData,
      function(response) {
        $scope.PageData = response.data;
        $scope.FastAutoFocus = response.data.Focus[0].FastAutoFocus;
        $scope.TCEnable = angular.copy(response.data.Focus[0].TemperatureCompensationEnable);
        $scope.IRShift = angular.copy(response.data.Focus[0].IRShift);
        if ($scope.IRShift !== "Off") {
          $scope.IRShift = "On";
        }
      },
      function(errorData) {}, '', true);
  }

  function cameraView() {
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=view', '',
      function(response) {
        $scope.Camera = response.data.Camera[0];
        $scope.Lens = angular.copy($scope.Camera.IrisMode);
        if(typeof $scope.Lens !== 'undefined') {
          if ($scope.Lens.substring(0, 3) === 'ICS') {
            $scope.Lens = 'ICS';
          }
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function checkICSLensSupport() {
    if (typeof $scope.IrisModeOptions !== 'undefined') {
      for (var i = 0; i < $scope.IrisModeOptions.length; i++) {
        var option = $scope.IrisModeOptions[i];
        if (option.indexOf('ICS') !== -1) {
          $scope.ICSLensSupport = true;
          return;
        }
      }
    }
  }

  function SaveTCEnable() {
    var setData = {};
    setData.TemperatureCompensationEnable = $scope.TCEnable;
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  };

  $scope.IRShiftChange = function() {
    var setData = {};
    if ($scope.IRShift !== "Off") {
      setData.IRShift = "850";
    } else {
      setData.IRShift = $scope.IRShift;
    }

    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  };

  function view() {
    var promises = [];

    promises.push(focusView);

    promises.push(cameraView);

    $q.seqAll(promises).then(
      function() {
        $scope.pageLoaded = true;
        $rootScope.$emit('changeLoadingBar', false);
        showVideo().finally(function() {
          $("#simplefocuspage").show();
        });
      },
      function(errorData) {
        $rootScope.$emit('changeLoadingBar', false);
        console.log(errorData);
      }
    );
  }

  function showVideo() {
    var getData = {};
    getData.Channel = UniversialManagerService.getChannelId();
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
      function(response) {
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
          channelId: UniversialManagerService.getChannelId()
        };

        $scope.coordinates = new Array(1);
        $scope.coordinates[0] = {
          isSet: false,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        };

        $scope.sketchinfo = {
          workType: "simpleFocus",
          shape: 0,
          maxNumber: 1,
          modalId: null
        };
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  $rootScope.$saveOn('channelSelector:selectChannel', function(event, index) {
    $rootScope.$emit('changeLoadingBar', true);
    $rootScope.$emit("channelSelector:changeChannel", index);
    view();
  }, $scope);

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      getAttributes().finally(function() {
        view();
      });
    }
  })();

  $scope.manualFocus = manualFocus;
  $scope.manualZoom = manualZoom;
  $scope.focusMode = focusMode;
  $scope.setFastAutoFocus = setFastAutoFocus;
  $scope.setTCEnable = setTCEnable;

});