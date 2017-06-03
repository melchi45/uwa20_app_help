kindFramework.controller('ptLimitCtrl', function($scope, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, $translate) {
  "use strict";

  var mAttr = Attributes.get();

  $scope.IsPTStarted = false;
  $scope.IsEntered = false;

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function getAttributes() {
    $scope.PTLimitMode = {};
    $scope.PTLimitMode.SelectedIndex = 0;
    if (mAttr.PTLimitModes !== undefined) {
      $scope.PTLimitModes = mAttr.PTLimitModes;
    }

    if (mAttr.UseOptions !== undefined) {
      $scope.UseOptions = mAttr.UseOptions;
    }

    if (mAttr.ProportionalPTSpeedModes !== undefined) {
      $scope.ProportionalPTSpeedModes = mAttr.ProportionalPTSpeedModes;
    }
    if (mAttr.TiltRangeOptions !== undefined) {
      $scope.TiltRangeOptions = mAttr.TiltRangeOptions;
    }
  }

  function getPTLimits() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptlimits&action=view', getData,
      function(response) {
        $scope.Use = [];
        $scope.Use[$scope.PTLimitModes.indexOf('PanLimit')] = response.data.PTLimits[0].PanLimitEnable ? true : false;
        $scope.Use[$scope.PTLimitModes.indexOf('TiltLimit')] = response.data.PTLimits[0].TiltLimitEnable ? true : false;
        //$scope.Use[$scope.PTLimitModes.indexOf('PanLimit')] = response.data.PTLimits[0].PanLimitEnable ? $scope.UseOptions[0] : $scope.UseOptions[1];
        //$scope.Use[$scope.PTLimitModes.indexOf('TiltLimit')] = response.data.PTLimits[0].TiltLimitEnable ? $scope.UseOptions[0] : $scope.UseOptions[1];
        $scope.PTLimit = {};
        $scope.PTLimit.TiltRange = response.data.PTLimits[0].TiltRange;
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function getPTZSettings() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=view', getData,
      function(response) {
        $scope.PTZSettings = response.data.PTZSettings[0];
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function setPTLimits() {
    var setData = {};

    setData.Channel = 0;
    setData.PanLimitEnable = $scope.Use[$scope.PTLimitModes.indexOf('PanLimit')];
    setData.TiltLimitEnable = $scope.Use[$scope.PTLimitModes.indexOf('TiltLimit')];
    //setData.PanLimitEnable = $scope.Use[$scope.PTLimitModes.indexOf('PanLimit')] === $scope.UseOptions[0] ? true : false;
    //setData.TiltLimitEnable = $scope.Use[$scope.PTLimitModes.indexOf('TiltLimit')] === $scope.UseOptions[0] ? true : false;
    setData.TiltRange = $scope.PTLimit.TiltRange;

    SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptlimits&action=set', setData,
      function(response) {

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function setPTZSettings() {
    var setData = {};

    setData.Channel = 0;
    setData.ProportionalPTSpeedMode = $scope.PTZSettings.ProportionalPTSpeedMode;

    SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set', setData,
      function(response) {

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function controlPTLimit(Mode) {
    var setData = {};

    setData.Channel = 0;
    setData.Mode = Mode;

    SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptlimits&action=control', setData,
      function(response) {

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function view() {
    getAttributes();
    var promises = [];
    promises.push(getPTLimits);
    promises.push(getPTZSettings);
    $q.seqAll(promises).then(
      function() {
        $scope.pageLoaded = true;
        showVideo().finally(function() {
          $("#ptlimitpage").show();
        });
      },
      function(errorData) {
        //alert(errorData);
      }
    );
  }

  function showVideo() {
    var getData = {};
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
          adjust: adjust
        };

        $scope.ptzinfo = {
          type: 'none'
        };
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  $scope.isTiltShow = function() {
    return $scope.PTLimitModes.indexOf('TiltLimit') == $scope.PTLimitMode.SelectedIndex;
  };
  $scope.changePTLimit = function() {
    setPTLimits();
    COMMONUtils.ShowInfo('lang_savingCompleted');
  };

  $scope.startPTLimit = function() {
    $scope.IsPTStarted = true;

    var status;
    var selectedPTLimitMode = parseInt($scope.PTLimitMode.SelectedIndex);
    selectedPTLimitMode ? status = 3 : status = 1;
    $scope.sketchinfo = {
      workType: "ptLimit",
      ptStatus: status,
      guideText: $translate.instant("lang_msg_start_limit")
    };
  };

  $scope.exitPTLimit = function() {
    $scope.IsPTStarted = false;
    $scope.IsEntered = false;

    var controlMode = 'Exit';
    if (mAttr.PTLimitControlModes.indexOf(controlMode) !== -1) {
      controlPTLimit(controlMode);
    }

    $scope.sketchinfo = {
      workType: "ptLimit",
      ptStatus: 0,
      guideText: ""
    };

  };

  $scope.enterPTLimit = function() {
    var controlMode;
    var selectedPTLimitMode = parseInt($scope.PTLimitMode.SelectedIndex);
    var stauts = 0;
    var stautsText = "";
    if ($scope.IsEntered) {
      $scope.IsEntered = false;
      $scope.IsPTStarted = false;

      selectedPTLimitMode ? controlMode = 'TiltEnd' : controlMode = 'PanEnd';

      if (mAttr.PTLimitControlModes.indexOf(controlMode) !== -1) {
        controlPTLimit(controlMode);
      }
      stauts = 0;
      stautsText = "";
    } else {
      $scope.IsEntered = true;

      if (selectedPTLimitMode) {
        controlMode = 'TiltBegin';
        stauts = 4;
      } else {
        controlMode = 'PanBegin';
        stauts = 2;
      }

      if (mAttr.PTLimitControlModes.indexOf(controlMode) !== -1) {
        controlPTLimit(controlMode);
      }

      stautsText = $translate.instant("lang_msg_end_limit");
    }
    $scope.sketchinfo = {
      workType: "ptLimit",
      ptStatus: stauts,
      guideText: stautsText
    };
  };

  $scope.changePTSpeed = function() {
    COMMONUtils.ShowInfo('lang_savingCompleted', function() {
      setPTZSettings();
    });
  };

  $scope.view = view;

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      view();
    }
  })();

});