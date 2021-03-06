/* global sessionStorage, setTimeout, alert */
"use strict";
var wn5OnlineHelp = angular.module(
  'wn5OnlineHelp', [
    'ui.router'
  ]
);

wn5OnlineHelp.
config(function ($stateProvider, $urlRouterProvider) {
  var supportRoute = null;
  try {
    if (!("supportRoute" in sessionStorage)) {
      // alert("Wrong Access");
      window.close();
      return;
    } else {
      supportRoute = JSON.parse(sessionStorage.supportRoute);
    }

    for (var i = 0, ii = supportRoute.length; i < ii; i++) {
      var self = supportRoute[i];

      $stateProvider.state(self.stateName, {
        url: self.urlName,
        templateUrl: self.templateUrl || null,
        controller: "onlineHelpCtrl"
      });
    }

    $urlRouterProvider.otherwise(supportRoute[0].urlName + supportRoute[1].urlName);
  } catch (error) {
    console.error(error);
  }

  /*
  $stateProvider.state('help', {
    url: '/help',
    templateUrl: 'main.html',
    controller: 'onlineHelpCtrl'
  });

  $stateProvider.state('help.basic_videoProfile', {
    url: '/basic_videoProfile',
    templateUrl: 'basic/profile.html',
    controller: 'onlineHelpCtrl'
  });
  */
}).
controller("onlineHelpWrapperCtrl", function ($scope, $state) {
  var debugMode = true;
  var supportMenu = null;
  var supportFeatures = null;
  var isNewHelp = true;
  var attr = {};

  if ("supportMenu" in sessionStorage) {    //New Version
    supportMenu = JSON.parse(sessionStorage.supportMenu);
    supportFeatures = JSON.parse(sessionStorage.supportFeatures);
    $scope.langOnlineHelp = sessionStorage.langOnlineHelp;
    for (var featureName in supportFeatures) {
      attr[featureName] = supportFeatures[featureName];
    }
    if (sessionStorage.languageClass) {
      document.body.classList.add(sessionStorage.languageClass);
    }
  } else {
    if ("supportMenu" in localStorage) {    //Old Version
      supportMenu = JSON.parse(localStorage.supportMenu);
      supportFeatures = JSON.parse(localStorage.supportFeatures);
      $scope.langOnlineHelp = localStorage.langOnlineHelp;
      isNewHelp = false;
      for (var key in supportFeatures) {
        $scope[key] = supportFeatures[key];
      }
    } else {
      return;
    }
  }

  $scope.menuData = supportMenu;
  
  if (isNewHelp) {
    try {
      /*  attr.xxxx.indexOf('something') !== -1 : 'something'?????? ????????????????????? true, ?????????????????? ????????? false  */
      $scope.PPPoE = (
        attr.IPv4TypeOptions && attr.IPv4TypeOptions.indexOf('PPPoE') !== -1
      );
      $scope.IR = attr.IRledModeOptions;
      $scope.Heater = (
        attr.AuxCommands && attr.AuxCommands.indexOf('HeaterOn') !== -1
      );
      $scope.Fan = (
        attr.AuxCommands && attr.AuxCommands.indexOf('FanOn') !== -1
      );
      $scope.LDCAuto = (
      attr.LDCModeOptions && attr.LDCModeOptions.indexOf('Auto') !== -1
      );
      $scope.PresetAction = (
        attr.EventActions && attr.EventActions.indexOf('GoToPreset') !== -1
      );
      $scope.IrisModeOptions = (
        attr.IrisModeOptions && !attr.ExternalPTZModel
      );
      $scope.Lens = (
        attr.IrisModeOptions && attr.ExternalPTZModel
      );
      $scope.InternalMic = (
        attr.AudioInSourceOptions && attr.AudioInSourceOptions.indexOf('MIC') !== -1
      );
      $scope.ExternalMIC = (
        attr.AudioInSourceOptions && attr.AudioInSourceOptions.indexOf('ExternalMIC') !== -1
      );
      $scope.LineIn = (
        attr.AudioInSourceOptions && attr.AudioInSourceOptions.indexOf('LineIn') !== -1
      );
      $scope.DayNightMode_ExternalBW = (
        attr.DayNightModeOptions && attr.DayNightModeOptions.indexOf('ExternalBW') !== -1
      );
      $scope.FastAutoFocusDefined = attr.FastAutoFocusEnable;
      $scope.ZoomOptionsDefined = attr.SimpleZoomOptions;
      $scope.PTZMode = (
        attr.RS485Support &&
        attr.isDigitalPTZ &&
        (attr.MaxPreset > 0)
      );
      $scope.Focus = (
        attr.PTZModel === true ||
        attr.ZoomOnlyModel === true
      );
      $scope.Zoom = attr.ZoomOnlyModel;
      $scope.ICS = checkIrisModeSupport('ICS');
      $scope.PIrisInIrisList = checkIrisModeSupport('P-Iris');
      $scope.DPTZSetupPage = attr.isDigitalPTZ && attr.MaxGroupCount > 0;
      $scope.ExternalPTZPage = attr.ExternalPTZModel;
      $scope.PTZSetupPage = attr.PTZModel === true;
      $scope.PresetSetupPage = attr.ZoomOnlyModel;
      $scope.HallwayView = attr.RotateOptions;
      $scope.AutoPan = (
        attr.AutoRunModes && attr.AutoRunModes.indexOf("AutoPan") !== -1
      );
      $scope.Crop = attr.CropSupport;
      $scope.AutoFlip = attr.AutoFlipEnable;

      $scope.Statistics = attr.QueueManagement || attr.PeopleCount || attr.HeatMap;
      $scope.PresetSupport = attr.PresetNumberRange;
      $scope.ContinousZoom = attr.ContinousZoom;
      $scope.ImagePresetMode = attr.ImagePresetModeOptions;
      $scope.ImagePresetIndoor = (
        attr.ImagePresetModeOptions && attr.ImagePresetModeOptions.indexOf('Indoor') !== -1
      );
      $scope.ImagePresetOutdoor = (
        attr.ImagePresetModeOptions && attr.ImagePresetModeOptions.indexOf('Outdoor') !== -1
      );
      $scope.ActivationTime = (
        attr.ImagePresetModeOptions && !attr.PTZModel
      );
      $scope.Sensor = attr.sensorCaptureFrameRate;
      $scope.WhiteBalance = attr.whiteBalanceSupport;
      $scope.BackLight = attr.CompensationModeOptions && attr.CompensationModeOptions.indexOf('BLC') !== -1;
      $scope.HLC = attr.CompensationModeOptions && attr.CompensationModeOptions.indexOf('HLC') !== -1;
      $scope.WDR = attr.CompensationModeOptions && attr.CompensationModeOptions.indexOf('WDR') !== -1;
      $scope.DayNight = attr.dayNightSupport;
      $scope.ColorPalette = attr.thermalColorPaletteOptions;
      $scope.ColorPaletteWisenet = attr.thermalColorPaletteOptions && attr.thermalColorPaletteOptions.Wisenet;
      $scope.PrivacyMaskSupport = attr.MaxPrivacyMaskByChannel &&
        attr.MaxPrivacyMaskByChannel.some(function (maxByChannel) {
          return maxByChannel.toString() !== '0';
        });
      $scope.IsAdmin = attr.IsAdminUse;
      $scope.AlarmOutputNormalOpen = (
        attr.AlarmOutputIdleStateOptions && attr.AlarmOutputIdleStateOptions.indexOf("NormallyOpen") > -1
      );
      $scope.AlarmOutputNormalClose = (
        attr.AlarmOutputIdleStateOptions && attr.AlarmOutputIdleStateOptions.indexOf("NormallyClose") > -1
      );


      // $scope.CompressionLevel = (
      //   attr.CompressionLevel && attr.CompressionLevel.minValue !== attr.CompressionLevel.maxValue
      // );
      // /* TNU-6321?????? ????????? ????????? ????????? ?????? ?????? */
      // $scope.CompressionLevel = (
      //   attr.CompressionLevel.minValue !== attr.CompressionLevel.maxValue
      // );
      // /* TNU-6321?????? ????????? ????????? ????????? ?????? ??????????????? XNP-9300 ?????? ?????? ?????????????????? ?????? */      
      // $scope.CompressionLevel = (
      //   attr.CompressionLevel && attr.CompressionLevel.minValue !== attr.CompressionLevel.maxValue
      // );
      // /* TNO-6322ER?????? hide????????? ??????. ????????? ?????????. 2020-09-07 */      
      // $scope.CompressionLevel = (
      //   attr.CompressionLevel.minValue !== attr.CompressionLevel.maxValue
      // );
      // /* TNO-6322ER?????? hide????????? ??????. ????????? ?????????. 2020-09-09 ?????????. */      
      // $scope.CompressionLevel = attr.CompressionLevel;      
      // /* TNO-6322ER?????? hide????????? ??????. ????????? ?????????. 2020-09-10 ?????????. */ 
      // $scope.CompressionLevel = (
      //   attr.CompressionLevel && (attr.CompressionLevel.minValue !== attr.CompressionLevel.maxValue)
      // ); 
      // /* scope??? attribute ?????? ?????? ?????? ????????? ??????. ????????? ?????????. 2020-09-10 ??????. */  
      $scope.VideoCompression = (
        attr.CompressionLevel && attr.CompressionLevel.minValue !== attr.CompressionLevel.maxValue
      ); 
      


      
      $scope.ShowLanguage = (
        attr.Languages && attr.Languages.length > 1
      );
      $scope.SSNRLevel = (
        attr.SSNRModeOptions && !attr.SSNR2DLevel && !attr.SSNR3DLevel
      );
      $scope.IvaAppearDisappear = attr.VirtualAreaModeOptions && attr.VirtualAreaModeOptions.indexOf('AppearDisappear') !== -1;
      $scope.IvaEntering = attr.VirtualAreaModeOptions &&  attr.VirtualAreaModeOptions.indexOf('Entering') !== -1;
      $scope.IvaExiting = attr.VirtualAreaModeOptions && attr.VirtualAreaModeOptions.indexOf('Exiting') !== -1;
      $scope.IvaIntrusion = attr.VirtualAreaModeOptions && attr.VirtualAreaModeOptions.indexOf('Intrusion') !== -1;
      $scope.IvaLoitering = attr.VirtualAreaModeOptions && attr.VirtualAreaModeOptions.indexOf('Loitering') !== -1;
      $scope.IRModeOptionManual = attr.IRledModeOptions && attr.IRledModeOptions.indexOf("Manual") !== -1;
      $scope.IRModeOptionAuto2 = attr.IRledModeOptions && attr.IRledModeOptions.indexOf("Auto2") !== -1;
      $scope.SupportAAC = attr.AudioInEncodingOptions && attr.AudioInEncodingOptions.indexOf("AAC") !== -1;
      $scope.EntropyCodingOptionCAVLC = attr.EntropyCoding && attr.EntropyCoding.H264 && attr.EntropyCoding.H264.indexOf("CAVLC") !== -1;
      $scope.PrivacyMaskRectangle = attr.PrivacyMaskRectangle > 0;

      /* WN7?????? ????????? ??? */
      $scope.ConnectionMode = attr.ConnectionMode;
      $scope.AdminAccess = attr.AdminAccess;
      $scope.ClientCertificateAuthenticationEnable = attr.ClientCertificateAuthenticationEnable;
      $scope.AGCLevel = attr.AGCLevel;
      $scope.AGCMaxGainLevel = attr.AGCMaxGainLevel;
      $scope.XCELevel = attr.XCELevel;
      $scope.GammaControl = attr.GammaControl;
      
      /* TNB-9000??? ???????????? submodule??? develop??? ?????? ????????? */  
      $scope.SensorCaptureSize = (
        typeof attr.SensorCaptureSize !== 'undefined' && attr.SensorCaptureSize.length > 0
);

      /* WN7 PTZ?????? ????????? ??? */
      $scope.PTCorrectionSupport = attr.PTCorrectionSupport;
      $scope.WiperOn = attr.AuxCommands && attr.AuxCommands.indexOf("WiperOn") !== -1;
      $scope.HeaterOn = attr.AuxCommands && attr.AuxCommands.indexOf("HeaterOn") !== -1;
      $scope.AutoTrackObjectSize = attr.AutoTrackObjectSize;
/* TNO-6322?????? ????????? ????????? ?????? ??????.  2020-09-07 ??????  */
//       $scope.FocusPresetSupportByChannel = (
//         typeof attr.FocusPresetSupportByChannel !== 'undefined' && attr.FocusPresetSupportByChannel.length > 0
// );

    /* TNO-6322ER ????????? ????????? ?????? ??????.  2020-09-08 ??????  */
//       $scope.FocusPresetSupportByChannel = (
//         typeof attr.FocusPresetSupportByChannel && attr.FocusPresetSupportByChannel.length > 0
// );
/* TNO-6322ER?????? ????????? ????????? ?????? ??????.  2020-09-08 ??????  */
      $scope.FocusPresetSupport = attr.FocusPresetSupport;

      $scope.CameraIDEnable = attr.CameraIDEnable;


      /* TNU-6321?????? ????????? ??? */
      $scope.PeerConnectionInfoClientHttpsStatus = attr.PeerConnectionInfoClientHttpsStatus;
//       $scope.AreaZoomSupportbyChannel = (
//         typeof attr.AreaZoomSupportbyChannel !== 'undefined' && attr.AreaZoomSupportbyChannel.length > 0
// );  => ?????? ??? attribute ???????????? ?????? ?????? ?????? AreaZoomSupport ??????
      $scope.RememberLastPosition = attr.RememberLastPosition;
      $scope.PanZeroPositionSupport = attr.PanZeroPositionSupport;
      $scope.WDRControlModeOptions = attr.WDRControlModeOptions;
      $scope.AGCMaxGainLevel = attr.AGCMaxGainLevel;
      $scope.AGCModeOptions = attr.AGCModeOptions;
      /* TNU-6321?????? ????????? ????????? ????????? ?????? ??????. ???????????? ?????? */
      $scope.AGCModeOptions = attr.AGCModeOptions;
      $scope.AudioClipCountRange = attr.AudioClipCountRange; 
      // /* TNU-6321?????? ????????? ???????????? ?????? ?????? ??? ?????? */      
      // $scope.HDMISupport = attr.VideoTypeOptions.indexOf('HDMI_1080p') !==??-1??||??attr.VideoTypeOptions.indexOf('HDMI_720p')??!==??-1;


      /* XNF-9010RVM?????? ????????? ???. */
      $scope.IRledZoneLevel = attr.IRledZoneLevel;
      
      /* PNM-9000QB?????? ????????? ???. */
      $scope.GlobalRotateViewSupport = attr.GlobalRotateViewSupport;

 
      // TNO-6322ER?????? ??????. ????????? ?????????. 2020-09-08 ??????
      $scope.WasherWiperOn = attr.AuxCommands && attr.AuxCommands.indexOf("WasherWiperOn") !== -1; 
      $scope.AutoRunModes = attr.AutoRunModes;    
      
      // TNM-3620TDY ?????? ?????? ?????????. ????????? ?????????. 2020-09-09 ??????
      $scope.HybridThermal = attr.HybridThermal; 

      // PNM-9000QB. ????????? ?????????. 2020-09-10 ??????
      $scope.GlobalSensorModeSupport = attr.GlobalSensorModeSupport; 
      $scope.GlobalLDCModeSupport = attr.GlobalLDCModeSupport; 
      $scope.GlobalRecordFileTypeSupport = attr.GlobalRecordFileTypeSupport; 
      $scope.GlobalMaskPatternSupport = attr.GlobalMaskPatternSupport; 
      $scope.AlarmInputNormalOpen = (
        attr.AlarmInputStateOptions && attr.AlarmInputStateOptions.indexOf('NormallyOpen') !== -1
      );
      $scope.AlarmInputNormalClose = (
        attr.AlarmInputStateOptions && attr.AlarmInputStateOptions.indexOf('NormallyClose') !== -1
      );

      /* XNP-9300R?????? ????????? ??? */
      $scope.SpinningDryOn = attr.AuxCommands && attr.AuxCommands.indexOf("SpinningDryOn") !== -1; 


      
      /*
        1. true values
          Object ??? ??? : {},
          Boolean?????? true??? ??? : true,
          ??????????????? 0?????? ??? ??? : Array.length > 0,
          0?????? ??? ??? : Number(x) > 0,
          string??? ??? : "xxx"

        2. false values
          undefined ??? ??? : undefined,
          Boolean?????? false??? ??? : false, 
          ??????????????? 0??? ??? : Array.length == 0,
          0??? ??? : Number(0),
          ????????? ??? : ""
      */
      for (var keyName in attr) {
        var val = null;

        val = attr[keyName];

        switch (typeof val) {
          case "undefined":
            val = false;
            break;
          case "number":
            break;
          case "object":
          case "string":
            val = true;
            break;
        }

        $scope[keyName] = val;
      }
    } catch (error) {
      console.error(error);
    }

    if (debugMode) {
      console.log("++++++ original Attr (from attr in SessionStorage) ++++++");
      console.log(attr);
      console.log("++++++ using html values ($scope) ++++++");
      console.log($scope);
    }
  }

  function checkIrisModeSupport(mode) {
    var irisModeOptions = attr.IrisModeOptions;
    var isSupport = false;
    var i = 0;
    var len = 0;
    var option = '';

    if (typeof irisModeOptions !== "undefined") {
      len = irisModeOptions.length;
      for (; i < len; i++) {
        option = irisModeOptions[i];
        if (option.indexOf(mode) !== -1) {
          isSupport = true;
          break;
        }
      }
    }

    return isSupport;
  }

  $scope.activeCheck = function (state) {
    var className = $state.current.name.indexOf(state) > -1 ? 'active in' : '';
    return className;
  };

  setTimeout(function () {
    $('body').css('min-width', 'initial');
    $('html, body').addClass('online-help');
    $("#side-menu").parent().metisMenu();
  });
}).
controller("onlineHelpCtrl", function () {
  setTimeout(function () {
    $("#side-menu").parent().metisMenu();
  });
});