kindFramework.controller('profileCtrl', function($scope, $uibModal, $timeout, $cookieStore, $rootScope, $location,
  SunapiClient, XMLParser, Attributes, COMMONUtils, LogManager, SessionOfUserManager, ModalManagerService, CameraSpec, $q, $filter, UniversialManagerService) {

  "use strict";
  $scope.pageLoaded = false;

  COMMONUtils.getResponsiveObjects($scope);

  if (SessionOfUserManager.isLoggedin()) {
    LogManager.debug("Setup login is success.");
  }

  var mAttr = Attributes.get("media");
  var pageData = {};
  var cropInitSize_2M = {
    x: 320,
    y: 28,
    width: 1280,
    height: 1024,
  };
  var cropInitSize_5M = {
    x: 480,
    y: 360,
    width: 1600,
    height: 1200,
  };

  $scope.showAdvancedMenu = false;
  $scope.showAdvancedLabel = 'lang_show';
  $scope.EnableAddButton = true;
  $scope.GOVLengthRange = {};
  $scope.DynamicGovRange = {};
  $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
  $scope.isNewProfile = false;
  $scope.getTranslatedOption = COMMONUtils.getTranslatedOption;
  $scope.maxChannel = mAttr.MaxChannel;

  $scope.isMultiChannel = false;
  $scope.targetChannel = UniversialManagerService.getChannelId();


  function getAttributes() {
    if (mAttr.MaxChannel > 1) {
      $scope.isMultiChannel = true;
    }
    $scope.ch = 0;
    $scope.pro = 0;
    $scope.DeviceType = mAttr.DeviceType;
    $scope.MaxIPV4Len = mAttr.MaxIPV4Len;
    $scope.IPv4Pattern = mAttr.IPv4;
    $scope.MaxProfiles = mAttr.MaxProfile;
    $scope.MaxProfileName = mAttr.ProfileName.maxLength;
    $scope.cropSupport = mAttr.CropSupport;
    $scope.ATCTrigger = mAttr.ATCTrigger;
    $scope.ATCModes = mAttr.ATCModes;
    $scope.SensorCaptureSize = mAttr.SensorCaptureSize;
    $scope.OnlyNumStr = mAttr.OnlyNumStr;
    $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
    $scope.DigitalPtzSupported = mAttr.isDigitalPTZ;
    $scope.FisheyeLens = mAttr.FisheyeLens;
    $scope.PTZModeOptions = mAttr.PTZModeOptions;

    /** PTZ Mode Menu available for Camera that support ExternalPTZ, DigitalPTZ at the sametime */
    if (mAttr.RS485Support && mAttr.isDigitalPTZ && (mAttr.MaxPreset > 0)) {
      $scope.PTZModeSupport = true;
      getPTZMode();
    } else {
      $scope.PTZModeSupport = false;
    }

    /** Fisheye model doesnt support profile based DPTZ  */
    if ($scope.FisheyeLens === false) {
      $scope.profileBasedDPTZ = mAttr.profileBasedDPTZ;
    }

    if (typeof mAttr.DynamicGOVSupport === 'undefined' || mAttr.DynamicGOVSupport === false) {
      $scope.DynamicGovSupported = false;
    } else {
      $scope.DynamicGovSupported = true;
    }

    $scope.viewModeIndex = mAttr.viewModeIndex;
    $scope.profileViewModeType = mAttr.profileViewModeType;
    /** Show only dewarped or modified view modes, dont list original view as a option  */
    if (typeof $scope.profileViewModeType !== 'undefined') {
      $scope.profileDewarpViewModeType = [];
      for (var i = 0; i < $scope.profileViewModeType.length; i++) {
        if ($scope.profileViewModeType[i] === 'Overview') {
          continue;
        }

        $scope.profileDewarpViewModeType.push($scope.profileViewModeType[i]);
      }
    }

    $scope.cameraPositionDetails = CameraSpec.getSupportedViewModesByMounting();

    initATCDetails();
    initEncoderDetails();
    initCompressionList();

    if (typeof mAttr.Bitrate !== 'undefined') {

      if (typeof $scope.BitRateRange === 'undefined') {
        setBitRateRange(mAttr.Bitrate.minValue, mAttr.Bitrate.maxValue);
      }
    }

    initMulticastDetails();
    view();
  }

  function getProfilePolicyTableData() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=view', getData,
      function(response) {
        $scope.videoProfilePoliciesArray = response.data.VideoProfilePolicies;
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getProfileTableData() {
    $scope.infoTableData = [];
    var getData = {};

    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', getData,
      function(response) {
        var videoProfiles = response.data.VideoProfiles;

        for (var i = 0; i < videoProfiles.length; i++) {
          var data = {};
          data.channel = videoProfiles[i].Channel;
          data.profiles = [];
          var profiles = angular.copy(videoProfiles[i].Profiles);
          for (var k = 0; k < profiles.length; k++) {
            if (profiles[k].Profile === $scope.videoProfilePoliciesArray[i].DefaultProfile) {
              var subData = {};
              var profile = profiles[k];
              subData.name = profile.Name;
              subData.resolution = profile.Resolution;
              subData.frameRate = profile.FrameRate;
              subData.bitrate = profile.Bitrate;
              subData.codec = profile.EncodingType;
              if (profile.EncodingType === 'MJPEG') {
                subData.codec = 'MJPEG';
              } else if (profile.EncodingType === 'MPEG4') {
                subData.codec = 'MPEG4';
              } else if (profile.EncodingType === 'H264') {
                subData.codec = 'H.264';
              } else if (profile.EncodingType === 'H265') {
                subData.codec = 'H.265';
              }
              subData.GOVLength = '';
              if (subData.codec === "H.264") {
                subData.GOVLength = profile.H264.GOVLength;
              } else if (subData.codec === "H.265") {
                subData.GOVLength = profile.H265.GOVLength;
              }
              data.profiles.push(subData);
            }
          }
          $scope.infoTableData.push(data);
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function initMulticastDetails() {

    if (typeof mAttr.SVNPMulticastPort !== 'undefined') {
      $scope.SVNPMulticastPortRange = {};
      $scope.SVNPMulticastPortRange.min = mAttr.SVNPMulticastPort.minValue;
      $scope.SVNPMulticastPortRange.max = mAttr.SVNPMulticastPort.maxValue;
    }

    if (typeof mAttr.SVNPMulticastTTL !== 'undefined') {
      $scope.SVNPMulticastTTLRange = {};
      $scope.SVNPMulticastTTLRange.min = mAttr.SVNPMulticastTTL.minValue;
      $scope.SVNPMulticastTTLRange.max = mAttr.SVNPMulticastTTL.maxValue;
    }

    if (typeof mAttr.RTPMulticastPort !== 'undefined') {
      $scope.RTPMulticastPortRange = {};
      $scope.RTPMulticastPortRange.min = mAttr.RTPMulticastPort.minValue;
      $scope.RTPMulticastPortRange.max = mAttr.RTPMulticastPort.maxValue;
    }

    if (typeof mAttr.RTPMulticastTTL !== 'undefined') {
      $scope.RTPMulticastTTLRange = {};
      $scope.RTPMulticastTTLRange.min = mAttr.RTPMulticastTTL.minValue;
      $scope.RTPMulticastTTLRange.max = mAttr.RTPMulticastTTL.maxValue;
    }
  }

  function initCompressionList() {
    var i = 0;

    if (typeof $scope.CompressionLevelList !== 'undefined') {
      // avoid multiple init
      return;
    }

    $scope.compressionRange = {};
    $scope.compressionRange.min = mAttr.CompressionLevel.minValue;
    $scope.compressionRange.max = mAttr.CompressionLevel.maxValue;

    $scope.CompressionLevelList = [];
    for (i = mAttr.CompressionLevel.minValue; i <= mAttr.CompressionLevel.maxValue; i++) {
      var option = {};
      if (i === mAttr.CompressionLevel.minValue) {
        option.Text = 'Best';
      } else if (i === mAttr.CompressionLevel.maxValue) {
        option.Text = 'Worst';
      } else {
        option.Text = i;
      }
      option.Value = i;

      $scope.CompressionLevelList.push(option);
    }
  }

  function initEncoderDetails() {
    if (typeof mAttr.EncodingTypes !== 'undefined') {
      $scope.EncodingTypes = [];

      for (var i = 0; i < mAttr.EncodingTypes.length; i++) {
        var temp = {};
        temp.Value = mAttr.EncodingTypes[i];
        if (mAttr.EncodingTypes[i] === 'MJPEG') {
          temp.Text = 'MJPEG';
        } else if (mAttr.EncodingTypes[i] === 'MPEG4') {
          temp.Text = 'MPEG4';
        } else if (mAttr.EncodingTypes[i] === 'H264') {
          temp.Text = 'H.264';
        } else if (mAttr.EncodingTypes[i] === 'H265') {
          temp.Text = 'H.265';
        }
        $scope.EncodingTypes.push(temp);

        if (typeof $scope.viewModeIndex !== 'undefined') {
          $scope.EncodingTypesByProfile = angular.copy($scope.EncodingTypes);
          $scope.profileSupportedEnodings = CameraSpec.profileBasedEnodingType();
        }
      }
    }
  }

  function initATCDetails() {
    var i = 0,
      j = 0, temp = {};
    /** Map Enum Values and Display strings */
    if (typeof mAttr.ATCModes !== 'undefined') {
      $scope.ATCModeOptions = [];

      for (i = 0; i < mAttr.ATCModes.length; i++) {
        temp = {};
        temp.Value = mAttr.ATCModes[i];
        if (mAttr.ATCModes[i] === 'Disabled') {
          temp.Text = 'lang_disable';
        } else if (mAttr.ATCModes[i] === 'AdjustFramerate') {
          temp.Text = 'lang_control_framerate';
        } else if (mAttr.ATCModes[i] === 'AdjustCompressionlevel') {
          temp.Text = 'lang_control_compression';
        }
        $scope.ATCModeOptions.push(temp);
      }
    }


    if (typeof mAttr.ATCTrigger !== 'undefined' && typeof mAttr.ATCEventType !== 'undefined') {
      for (i = 0; i < mAttr.ATCTrigger.length; i++) {
        if (mAttr.ATCTrigger[i] === 'Event') {
          for (j = 0; j < mAttr.ATCEventType.length; j++) {
            temp = {};
            if (mAttr.ATCEventType[j] === 'MotionDetection') {
              temp.Value = 'Event-MD';
              temp.Text = 'lang_eventMD';
              $scope.ATCModeOptions.push(temp);
            }
          }
        }
      }
    }

    if (typeof mAttr.ATCSensitivityOptions !== 'undefined') {
      $scope.ATCSensitivityOptions = [];

      for (i = 0; i < mAttr.ATCSensitivityOptions.length; i++) {
        temp = {};
        temp.Value = mAttr.ATCSensitivityOptions[i];
        if (mAttr.ATCSensitivityOptions[i] === 'VeryLow') {
          temp.Text = 'lang_very_low';
        } else if (mAttr.ATCSensitivityOptions[i] === 'VeryHigh') {
          temp.Text = 'lang_very_high';
        } else if (mAttr.ATCSensitivityOptions[i] === 'Low') {
          temp.Text = 'lang_low';
        } else if (mAttr.ATCSensitivityOptions[i] === 'Medium') {
          temp.Text = 'lang_normal';
        } else if (mAttr.ATCSensitivityOptions[i] === 'High') {
          temp.Text = 'lang_high';
        }

        $scope.ATCSensitivityOptions.push(temp);
      }
    }

    $scope.ATCLimitRange = {};
    if (typeof mAttr.ATCLimit !== 'undefined') {
      if (typeof mAttr.ATCLimit.minValue !== 'undefined') {
        $scope.ATCLimitRange.Min = mAttr.ATCLimit.minValue;
      } else {
        $scope.ATCLimitRange.Min = 10;
      }

      if (typeof mAttr.ATCLimit.maxValue !== 'undefined') {
        $scope.ATCLimitRange.Max = mAttr.ATCLimit.maxValue;
      } else {
        $scope.ATCLimitRange.Max = 50;
      }
    }
  }

  $scope.advacedMenu = function() {

    if ($scope.showAdvancedMenu === false) {
      $scope.showAdvancedMenu = true;
      $scope.showAdvancedLabel = 'lang_hide';
    } else {
      $scope.showAdvancedMenu = false;
      $scope.showAdvancedLabel = 'lang_show';
    }
  };

  $scope.setPTZMode = function() {
    var setData = {};
    setData.Mode = $scope.PtzMode.Mode;
    return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=ptzmode&action=set", setData,
      function() {
        window.location.reload(true);
      },
      function(errorData) {}, "", true);
  };

  function getPTZMode() {
    /* Doesn't use ptzmode sunapi call for minimizing http calls */
    $scope.PtzMode = {};

    if (mAttr.ExternalPTZModel) {
      $scope.PtzMode.Mode = mAttr.PTZModeOptions[0]; //External PTZ
    } else {
      $scope.PtzMode.Mode = mAttr.PTZModeOptions[1]; //Digital PTZ
    }
  }

  /**
   * GCD for finding the aspect ratio
   * @param  {int} a first value
   * @param  {int} b second value
   * @return {int}   gcd
   */
  function gcd(a, b) {
    return (b === 0) ? a : gcd(b, a % b);
  }

  function fillProfileDetails(to, from, encoding, general) {
    to.Resol = [];
    for (var j = 0; j < from.length; j++) {
      var option = {},
        aspectRatio = 0,
        aspectWitdth = 0,
        aspectHeight = 0;

      aspectRatio = gcd(from[j].Width, from[j].Height);
      aspectWitdth = from[j].Width / aspectRatio;
      aspectHeight = from[j].Height / aspectRatio;

      if (aspectWitdth > 16) {
        aspectWitdth = 16;
      }

      if (aspectHeight > 9) {
        aspectHeight = '9+';
      }
      /**
       * Fill resolution details
       */
      option.Text = from[j].Width + ' X ' + from[j].Height + ' (' + aspectWitdth + ':' + aspectHeight + ')';
      option.Value = from[j].Width + 'x' + from[j].Height;

      /**
       * Fill frame rate details
       */
      if (typeof from[j].MaxFPS !== 'undefined') {
        option.MaxFPS = from[j].MaxFPS;
      } else if (typeof general.Resol[j].MaxFPS !== 'undefined') {
        /**
         * Assumed here that General and The current profiles has same resolution list
         */
        option.MaxFPS = general.Resol[j].MaxFPS;
      }

      /**
       *  Camera provides FPS in 1000 units
       */
      if (option.MaxFPS >= 1000) {
        option.MaxFPS /= 1000;
      }

      /**
       * Fill default frame rate details
       */
      if (typeof from[j].DefaultFPS !== 'undefined') {
        option.DefaultFPS = from[j].DefaultFPS;
      } else if (typeof general.Resol[j].DefaultFPS !== 'undefined') {
        /**
         * Assumed here that General and The current profiles has same resolution list
         */
        option.DefaultFPS = general.Resol[j].DefaultFPS;
      }

      if (option.DefaultFPS >= 1000) {
        option.DefaultFPS /= 1000;
      }

      /**
       * fill frame rate details
       */
      to.Resol.push(option);
    }
  }

  $scope.setProfileType = function(type, profileNo) {
    var profiles = null, policy = null;
    var key = type + 'Profile';

    var requireType = {
      DefaultProfile: 2,
      EventProfile: 1,
      RecordProfile: 1,
    };

    profiles = $scope.VideoProfiles[$scope.ch].Profiles;
    policy = $scope.VideoProfilePolicies[$scope.ch];

    if (profiles[$scope.selectedProfile][key] === true) {
      policy[key] = profileNo;

      profiles[$scope.selectedProfile][key] = true;
    } else {
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i][key]) {
          requireType[key] = profiles[i].Profile;
          break;
        }
      }

      policy[key] = requireType[key];
    }

    // for ( i=0 ; i<profiles.length ; i++ ) {
    //     fillProfileType(profiles[i], $scope.ch);
    // }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile) {
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropEncodingEnable = false;
    }
    $scope.selectResolutionList(true, false, true);
    $scope.selectGOVLength(true);
  };

  function isDptzSupportedProfile(profIdx) {
    var retVal = false,
      prof = {};

    if ($scope.DigitalPtzSupported === false) {
      return false;
    }
    if ($scope.FisheyeLens === true) {
      return false;
    }

    if (typeof $scope.VideoProfiles !== 'undefined' && typeof $scope.VideoCodecInfo !== 'undefined' &&
      typeof $scope.VideoProfiles[$scope.ch].Profiles[profIdx] !== 'undefined') {
      prof = $scope.VideoProfiles[$scope.ch].Profiles[profIdx];
      var profileViewMode = prof.ViewModeType;
      var encoding = prof.EncodingType;
      var viewModeList = $scope.VideoCodecInfo[$scope.ch].ViewModes;

      for (var viewModeCnt = 0; viewModeCnt < viewModeList.length; viewModeCnt++) {
        if (viewModeList[viewModeCnt].ViewMode === profileViewMode) {
          var selViewMode = viewModeList[viewModeCnt];
          for (var encodingCnt = 0; encodingCnt < selViewMode.Codecs.length; encodingCnt++) {
            if (selViewMode.Codecs[encodingCnt].EncodingType === encoding) {
              if (typeof selViewMode.Codecs[encodingCnt].IsDigitalPTZSupported !== 'undefined') {
                retVal = selViewMode.Codecs[encodingCnt].IsDigitalPTZSupported;
                break;
              }
            }
          }

        }
      }
    }

    return retVal;
  }

  $scope.isDptzSupportedProfile = isDptzSupportedProfile;

  function resetDefaultResolution() {
    var defaultResolutionIndex = 0;
    var resolFound = false;

    /**Reset the resoltion only if selected resolution is not found in the resoltion list */
    for (var resCnt = 0; resCnt < $scope.ResoltionList.length; resCnt++) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution === $scope.ResoltionList[resCnt].Value) {
        resolFound = true;
      }
    }

    if (resolFound === true) {
      return;
    }

    /** In case of DPTZ minimum resolution should be set as default  */
    if (isDptzSupportedProfile($scope.selectedProfile)) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile === true) {
        defaultResolutionIndex = getMinResolutionIndex($scope.ResoltionList);
      }
    }

    if ($scope.ResoltionList.length > 0) {
      LogManager.debug("selecing default Resoltion ", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution,
        ' -> ', $scope.ResoltionList[defaultResolutionIndex].Value);
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution = $scope.ResoltionList[defaultResolutionIndex].Value;
      LogManager.debug("Adjusting the Framerate and framerate list for default resoltion", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate, " -> ", $scope.ResoltionList[1].MaxFPS);
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate = $scope.ResoltionList[defaultResolutionIndex].MaxFPS;
    }
  }

  $scope.isSupportedProfile = function(option) {
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile) {
      var i = 0;
      for (i = 0; i < CameraSpec.DisabledRecordEncodingProfiles.length; i++) {
        if (option === CameraSpec.DisabledRecordEncodingProfiles[i]) {
          return false;
        }
      }
    }
    return true;
  };

  $scope.isDynamicGovSupported = function() {
    if (!$scope.pageLoaded) {
      return;
    }

    if (typeof $scope.VideoProfilePolicies === 'undefined' || typeof $scope.ch === 'undefined') {
      return false;
    }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile ||
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile ||
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType === 'CBR' ||
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate === 1 ||
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode !== 'Disabled') {
      return false;
    }
    return true;
  };

  $scope.isDynamicFPSSupported = function() {
    if (!$scope.pageLoaded) {
      return;
    }

    if (typeof $scope.VideoProfilePolicies === 'undefined' || typeof $scope.ch === 'undefined') {
      return false;
    }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile ||
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile ||
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType === 'CBR' ||
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode !== 'Disabled') {
      return false;
    }
    return true;
  };

  $scope.handleViewModeChange = function() {

    /** When changing to dewarp mode, set default value */
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeIndex === 1) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeType === "Overview") {
        if ($scope.FisheyeLens) {
          LogManager.debug("setting default dewarp view mode ", $scope.selectedCameraPosition.ViewModes[0]);
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeType = $scope.selectedCameraPosition.ViewModes[0];
        } else {
          LogManager.debug("setting default dewarp view mode ", $scope.profileDewarpViewModeType[0]);
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeType = $scope.profileDewarpViewModeType[0];
        }
      }
    } else {
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeType = "Overview";
    }

    /** When Changing view mode, change the resoltion also */
    $scope.selectResolutionList(true, false, true);
  };

  $scope.isCodecChangeSupported = function() {
    var retVal = true;
    var supportedEncodings = [];

    for (var i = 0; i < $scope.profileSupportedEnodings.length; i++) {
      if ($scope.profileSupportedEnodings[i].Profile === $scope.selectedProfile + 1) {
        supportedEncodings = $scope.profileSupportedEnodings[i].SupportedEncoding;
        if (supportedEncodings.length === 1) {
          retVal = false;
        }
        break;
      }
    }

    return retVal;
  };

  function adjustSupportedCodecs() {
    /** Fishe- Eye new spec Profile #2,#3,#4 can change codec, event hough fixed profile
     It can support only H.264 and H.265 */
    if (typeof $scope.viewModeIndex !== 'undefined') {
      var supportedEncodings = [];
      $scope.EncodingTypesByProfile = [];

      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsFixedProfile) {
        /** Find the list of Encoding supported based on profile number  */
        for (var i = 0; i < $scope.profileSupportedEnodings.length; i++) {
          if ($scope.profileSupportedEnodings[i].Profile === $scope.selectedProfile + 1) {
            supportedEncodings = $scope.profileSupportedEnodings[i].SupportedEncoding;
          }
        }

        for (var j = 0; j < supportedEncodings.length; j++) {
          var temp = {};
          temp.Value = supportedEncodings[j];
          if (supportedEncodings[j] === 'MJPEG') {
            temp.Text = 'MJPEG';
          } else if (supportedEncodings[j] === 'MPEG4') {
            temp.Text = 'MPEG4';
          } else if (supportedEncodings[j] === 'H264') {
            temp.Text = 'H.264';
          } else if (supportedEncodings[j] === 'H265') {
            temp.Text = 'H.265';
          }
          $scope.EncodingTypesByProfile.push(temp);
        }
      }

      if ($scope.EncodingTypesByProfile.length === 0) {
        $scope.EncodingTypesByProfile = angular.copy($scope.EncodingTypes);
      }
    }
  }


  $scope.handleProfileChange = function() {
    $scope.selectResolutionList(false);

    adjustSupportedCodecs();
  };


  $scope.selectResolutionList = function(isAdjustBitRate, isCodecChange, isAdjustResolution) {
    var i = 0,
      frameRateSet = false,
      resolSelected = false,
      selectedProfileDetails = {},
      defaultFPS = 0;

    if (typeof $scope.viewModeIndex !== 'undefined' && typeof $scope.VideoProfiles !== 'undefined' && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeIndex === 1) {
      LogManager.debug("selecing Dewarp Profile details");
      selectedProfileDetails = $scope.dewarpProfileDetails[$scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeType];
    } else {
      LogManager.debug("selecing Source Profile details");
      selectedProfileDetails = $scope.ProfileDetails;
    }

    if (typeof selectedProfileDetails === 'undefined' || selectedProfileDetails.length === 0) {
      LogManager.debug("profile details is empty ");
      return;
    }


    for (i = 0; i < selectedProfileDetails.length; i++) {
      if (selectedProfileDetails[i].EncodingType === $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType) {

        if (isDptzSupportedProfile($scope.selectedProfile)) {
          if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile === true &&
            typeof selectedProfileDetails[i].DigitalPTZ !== 'undefined') {
            $scope.ResoltionList = selectedProfileDetails[i].DigitalPTZ.Resol;
            resolSelected = true;
            LogManager.debug("selecing DPTZ Resoltion List");
            break;
          }
        }

        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile &&
          typeof selectedProfileDetails[i].Record !== 'undefined') {
          $scope.ResoltionList = selectedProfileDetails[i].Record.Resol;
          resolSelected = true;
          LogManager.debug("selecing Record Resoltion List");
          break;
        }

        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EventProfile &&
          typeof selectedProfileDetails[i].Email !== 'undefined') {
          $scope.ResoltionList = selectedProfileDetails[i].Email.Resol;
          LogManager.debug("selecing Email Resoltion List");
          resolSelected = true;
          break;
        }

        if (resolSelected === false) {
          $scope.ResoltionList = selectedProfileDetails[i].General.Resol;
          LogManager.debug("selecing General Resoltion List");
          break;
        }
      }
    }

    /**
     * Resolution will be rest in the following scenarios,
     * 1. When changing to DPTZ profile, adjust default resolution
     * 2.  When changging view mode in Fish Eye
     */
    if (isAdjustResolution === true) {
      resetDefaultResolution();
    }


    for (i = 0; i < $scope.ResoltionList.length; i++) {
      if ($scope.ResoltionList[i].Value === $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution) {
        if (typeof $scope.ResoltionList[i].DefaultFPS !== 'undefined') {
          defaultFPS = $scope.ResoltionList[i].DefaultFPS;
        }
        if (isDptzSupportedProfile($scope.selectedProfile)) {
          if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile === true) {
            $scope.selectFrameRate($scope.ResoltionList[i].MaxFPS, defaultFPS, isAdjustBitRate);
            $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType = 'CBR';
            $scope.DisableBitrateSelection = true;
          } else {
            $scope.selectFrameRate($scope.ResoltionList[i].MaxFPS, defaultFPS, isAdjustBitRate);
            if (typeof pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] !== 'undefined') {
              /**
               * MJPEG���� H265���� �� �������� ���� ���¿���
               * Resolution ���� �� Bitrate Control�� ���ǰ� ������ �ʱ� ������
               * VBR�� �⺻���� �����Ѵ�.
               */
              if (typeof pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType !== 'undefined') {
                $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType;
              } else {
                $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType = 'VBR';
              }
            } else {
              $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType = 'VBR';
            }
            $scope.DisableBitrateSelection = false;
          }
        } else {
          $scope.selectFrameRate($scope.ResoltionList[i].MaxFPS, defaultFPS, isAdjustBitRate);
          $scope.DisableBitrateSelection = false;
        }
        frameRateSet = true;
        break;
      }
    }

    /**
     *   just in case if not able to select correct frame rate set the camera max fps
     */
    if (frameRateSet === false) {
      $scope.selectFrameRate(mAttr.FrameRateLimit.maxValue);
    }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType === 'MJPEG') {
      $scope.selectEncoderSettings(false);
      if (isCodecChange) {
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].PriorityType = "Bitrate";
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = 6144;
      }
    } else {
      if (isAdjustBitRate === false) {
        $scope.selectEncoderSettings(false);
      } else {
        $scope.selectEncoderSettings(true);
      }
      if (isCodecChange) {
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].PriorityType = "FrameRate";
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = 5120;
      }
    }

    $scope.checkRecordProfileSettings();

    if (typeof mAttr.Bitrate !== 'undefined') {
      $scope.selectBitRate(isAdjustBitRate);
    }

    if (typeof isCodecChange !== 'undefined') {
      if (isCodecChange === true) {
        handleCodecChange();
      }
    }

    if (isDptzSupportedProfile($scope.selectedProfile) && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile === true) {
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode = "Disabled";
    } else if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile === true) {
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode = "Disabled";
    } else {
      if (typeof pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] !== 'undefined' &&
        typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode === 'undefined') {
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode;
      }
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType === 'MJPEG') {
        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode === 'Event-MD') {
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode = 'Disabled';
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCTrigger = 'Network';
        }
      }
    }
  };

  $scope.checkRecordProfileSettings = function() {
    /** If a Profile is a recording profile, then GOV length and Entropy Encoding should be adjusted  */
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType === 'MJPEG') {
      return;
    }

    /** If selected profile in Record Profile  */
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EntropyCoding !== CameraSpec.RecordEntropyEncoding) {
        LogManager.debug("Adjust Record Profile EntropyCoding ", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EntropyCoding, " -> ", CameraSpec.RecordEntropyEncoding);
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EntropyCoding = CameraSpec.RecordEntropyEncoding;
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncoderProfile = CameraSpec.DefaultRecordEncodingProfile;
      }

      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength > Math.ceil($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate / 2)) {
        LogManager.debug("Adjust Record Profile Gov Length ", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength, " -> ", Math.ceil($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate / 2));
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength = Math.ceil($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate / 2);
      }
    }
  };

  $scope.selectFrameRate = function(maxfps, defaultfps, tIsAdjustFrate) {
    var limitFPS = 0, isAdjustFrate = null;

    if (typeof maxfps === 'undefined' || maxfps === 0) {
      LogManager.error('selectFrameRate error', maxfps, $scope.VideoCodecInfo);
      return;
    }

    if (typeof defaultfps === 'undefined') {
      if (typeof $scope.FrameRateList !== 'undefined' && $scope.FrameRateList.length === maxfps) {
        return;
      }
      limitFPS = maxfps;
    } else {
      limitFPS = defaultfps;
    }

    if (typeof tIsAdjustFrate === 'undefined') {
      isAdjustFrate = false;
    } else {
      isAdjustFrate = tIsAdjustFrate;
    }
    
    /*
    If the current frame rate is more than allowed frame rate.
    Automatically set it to Max FPSselectResolutionList*/

    if (typeof pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] === 'undefined') {
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate = defaultfps;
    } else {
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate;
    }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate > limitFPS && isAdjustFrate === true) {
      LogManager.debug("Adjusting Frame Rate ", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate, " -> ", limitFPS);
      $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate = limitFPS;
    }

    $scope.FrameRateList = [];
    $scope.FrameRateList = COMMONUtils.getDescendingArray(maxfps);
  };


  function handleCodecChange() {
    var profile = null;

    profile = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile];

    if ((profile.EncodingType === 'H264') && (typeof profile.H264 === 'undefined')) {
      getDefaultEncoderSettings(profile);
    } else if ((profile.EncodingType === 'H265') && (typeof profile.H265 === 'undefined')) {
      getDefaultEncoderSettings(profile);
    } else if (profile.EncodingType === 'MJPEG') {
      /**
       * When in CBR, bit rate will be shown as Traget bitrate,
       * but for MJPEG, it should be shown as maximum bit rate. Hence toggle bitrate type when moving to MJPEG profile
       */
      if (profile.BitrateControlType === 'CBR') {
        profile.BitrateControlType = 'VBR';
        LogManager.debug("Reset Bitrate type to VBR ");
      }
      if (profile.IsDigitalPTZProfile === true) {
        profile.IsDigitalPTZProfile = false;
        LogManager.debug("Reset IsDigitalPTZProfile ");
      }
      if (profile.RecordProfile === true) {
        profile.Bitrate = 6144;
      }
    }

    /**Reset H265 Encoder profile, since it supports only Main */
    if (profile.EncodingType === 'H265') {
      profile.EncoderProfile = 'Main';
      profile.EntropyCoding = 'CABAC';
    } else if (profile.EncodingType === 'H264') {
      profile.EncoderProfile = 'High';
    }
  }

  $scope.selectBitRate = function(isAdjustBitRate) {

    var resolCnt = 0,
      minBitrate = 64,
      maxBitrate = 0,
      defaultBitrate = 0,
      GenResoltionList = {},
      RecResoltionList = {},
      DPTZResolutionList = {},
      viewMode = "",
      viewModeList = [],
      codecInfo = [];

    viewMode = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ViewModeType;
    viewModeList = $scope.VideoCodecInfo[$scope.ch].ViewModes;

    for (var i = 0; i < viewModeList.length; i++) {
      if (viewModeList[i].ViewMode === viewMode) {
        codecInfo = viewModeList[i].Codecs;
      }

      for (var j = 0; j < codecInfo.length; j++) {
        if (codecInfo[j].EncodingType === $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType) {
          RecResoltionList = codecInfo[j].Record;
          GenResoltionList = codecInfo[j].General;
          DPTZResolutionList = codecInfo[j].DigitalPTZ;
        }
      }
    }

    for (resolCnt = 0; resolCnt < GenResoltionList.length; resolCnt++) {
      var resol = GenResoltionList[resolCnt].Width + 'x' + GenResoltionList[resolCnt].Height;
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution === resol) {

        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType === 'VBR') {

          if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile) {

            /**
             * Record profile info doesnt have min bit rate details.
             * Need to refer min profile in General
             */
            if (typeof RecResoltionList[resolCnt].MaxVBRTargetBitrate !== 'undefined') {
              maxBitrate = RecResoltionList[resolCnt].MaxVBRTargetBitrate;
            }

            if (typeof RecResoltionList[resolCnt].MinVBRTargetBitrate !== 'undefined') {
              minBitrate = RecResoltionList[resolCnt].MinVBRTargetBitrate;
            }

            if (typeof RecResoltionList[resolCnt].DefaultVBRTargetBitrate !== 'undefined') {
              defaultBitrate = RecResoltionList[resolCnt].DefaultVBRTargetBitrate;
            }

          } else {
            if (typeof GenResoltionList[resolCnt].MaxVBRTargetBitrate !== 'undefined') {
              maxBitrate = GenResoltionList[resolCnt].MaxVBRTargetBitrate;
            }

            if (typeof GenResoltionList[resolCnt].MinVBRTargetBitrate !== 'undefined') {
              minBitrate = GenResoltionList[resolCnt].MinVBRTargetBitrate;
            }

            defaultBitrate = GenResoltionList[resolCnt].DefaultVBRTargetBitrate;
          }

          if (typeof pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] !== 'undefined') {
            $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate;
          } else {
            if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate > maxBitrate && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate < minBitrate) {
              $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = defaultBitrate;
            }
          }

        } else {

          if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile) {
            if (typeof RecResoltionList[resolCnt].MaxCBRTargetBitrate !== 'undefined') {
              maxBitrate = RecResoltionList[resolCnt].MaxCBRTargetBitrate;
            }
            if (typeof RecResoltionList[resolCnt].MinCBRTargetBitrate !== 'undefined') {
              minBitrate = RecResoltionList[resolCnt].MinCBRTargetBitrate;
            }
            if (typeof RecResoltionList[resolCnt].DefaultCBRTargetBitrate !== 'undefined') {
              defaultBitrate = RecResoltionList[resolCnt].DefaultCBRTargetBitrate;
            }

          } else {
            if (typeof GenResoltionList[resolCnt].MaxCBRTargetBitrate !== 'undefined') {
              maxBitrate = GenResoltionList[resolCnt].MaxCBRTargetBitrate;
            }
            if (typeof GenResoltionList[resolCnt].MinCBRTargetBitrate !== 'undefined') {
              minBitrate = GenResoltionList[resolCnt].MinCBRTargetBitrate;
            }

            defaultBitrate = GenResoltionList[resolCnt].DefaultCBRTargetBitrate;
          }



          if (typeof pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] !== 'undefined') {
            $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate;
          } else {
            if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate > maxBitrate && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate < minBitrate) {
              $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = defaultBitrate;
            }
          }

          if (isDptzSupportedProfile($scope.selectedProfile)) {
            if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile === true) {
              var indx = 0;
              for (indx = 0; indx < $scope.ResoltionList.length; indx++) {
                if (resol === $scope.ResoltionList[indx].Value) {
                  if (typeof DPTZResolutionList[indx].MaxCBRTargetBitrate !== 'undefined') {
                    maxBitrate = DPTZResolutionList[indx].MaxCBRTargetBitrate;
                  }

                  if (typeof DPTZResolutionList[indx].MinCBRTargetBitrate !== 'undefined') {
                    minBitrate = DPTZResolutionList[indx].MinCBRTargetBitrate;
                  }
                  defaultBitrate = DPTZResolutionList[indx].DefaultCBRTargetBitrate;
                  $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = defaultBitrate;
                  break;
                }
              }
            } else {
              $scope.selectFrameRate($scope.ResoltionList[0].MaxFPS);
            }
            /* else if($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsDigitalPTZProfile === true && $scope.VideoProfilePolicies[$scope.ch].RecordProfile === $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Profile)
             {
                 $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = defaultBitrate;
             }
             */

          }
        }

        break;
      }

      restrictBitcontrolType();
    }

    /*
    Bit Rate Manipulation
     */
    setBitRateRange(minBitrate, maxBitrate);
    if (isAdjustBitRate === true) {
      adjustBitrate(defaultBitrate, maxBitrate);
    }

    /*
        Handle Video Codec Change
        When Video Codec is changed from MPEG -> H264,H265 default codec specifc details should be shown
     */
    if (pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] !== undefined) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType !== pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType) {
        handleCodecChange();
      }
    }
  };


  function adjustBitrate(defaultBitrate, maxBitrate) {
    if (defaultBitrate <= maxBitrate) {
      if (maxBitrate === 0) {
        LogManager.debug("Not Adjusting Bitrate since max Bitrate is zero ");
        return;
      }
      /**
       * correct the default bit rate as well
       */
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate !== defaultBitrate) {
        LogManager.debug("Adjusting Bitrate to default ", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate, " -> ", defaultBitrate);
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = defaultBitrate;
      }
    } else if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] !== 'undefined' && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate > maxBitrate) {
      /**
       * if the current Bitrate is more than max bitrate.
       * Adjust the bitrate automatically
       */
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate !== maxBitrate) {
        LogManager.debug("Adjusting Bitrate to Max ", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate, " -> ", maxBitrate);
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate = maxBitrate;
      }
      }
    }

  function setBitRateRange(min, max) {
    if (typeof min === 'undefined' || typeof max === 'undefined') {
      return;
    }

    $scope.BitRateRange = {};
    $scope.BitRateRange.Min = min;
    $scope.BitRateRange.Max = max;
  }

  $scope.selectGOVLength = function(updateGov) {
    var encodingType = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType;

    if (typeof mAttr.GOVLength.H264 === 'undefined' || encodingType === "MJPEG") {
      return;
    }

    $scope.GOVLengthRange.Min = 1;

    var maxGOV = mAttr.GOVLength[encodingType].maxValue;
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate === 1) {
      $scope.GOVLengthRange.Max = 1;
    } else {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 8 > maxGOV) {
        $scope.GOVLengthRange.Max = maxGOV;
      } else {
        $scope.GOVLengthRange.Max = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 8;
      }
    }

    if (updateGov === true) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile === false) {
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 2;
        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate === 1) {
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength = 1;
        }
      } else {
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength = Math.ceil($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate / 2);
      }
    }

    $scope.selectDynamicGOVLength(updateGov);

  };

  $scope.selectDynamicGOVLength = function(updateGov) {
    var encodingType = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType;

    if (encodingType === "MJPEG") {
      return;
    }
    var maxDynamicGOV = mAttr.DynamicGOV[encodingType].maxValue;
    if ($scope.DynamicGovSupported) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate === 1) {
        $scope.DynamicGovRange.Min = 1;
        $scope.DynamicGovRange.Max = 1;
      } else {
        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength !== 'undefined' &&
          COMMONUtils.getIntegerValue($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength) !== 0 &&
          COMMONUtils.getIntegerValue($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength) < $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 8) {
          $scope.DynamicGovRange.Min = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength;
        } else {
          $scope.DynamicGovRange.Min = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 8;
        }
        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 16 > maxDynamicGOV) {
          $scope.DynamicGovRange.Max = maxDynamicGOV;
        } else {
          $scope.DynamicGovRange.Max = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 16;
        }
      }

      if (updateGov === true) {
        /** Default Dynamic GOV is frame rate mutiplied by 8 */
        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate === 1) {
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].DynamicGOVLength = 1;
        } else {
          if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RecordProfile === false) {
            $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].DynamicGOVLength = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate * 8;
          } else {
            $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].DynamicGOVLength = Math.ceil($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].FrameRate / 2);
          }
        }
      }
    }
  };


  $scope.adjustEntropyEncoding = function() {
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncoderProfile === 'BaseLine') {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EntropyCoding !== CameraSpec.DefaultBaselineProfileEntropyEncoding) {
        LogManager.debug("Adjusting Entropy Coding ", $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EntropyCoding, " -> ",
          CameraSpec.DefaultBaselineProfileEntropyEncoding);
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EntropyCoding = CameraSpec.DefaultBaselineProfileEntropyEncoding;
      }
    }

  };

  $scope.selectEncoderSettings = function(updateGov) {
    var i = 0,
      j = 0,
      priorityOptions = null,
      SmartCodecEnableOptions = null,
      temp = {};

    if (typeof mAttr.BitrateControlType.H264 !== 'undefined') {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType === 'H264') {
        $scope.BitrateControlOptions = mAttr.BitrateControlType.H264;
        priorityOptions = mAttr.PriorityType.H264;
        $scope.EncoderProfileOptions = mAttr.EnocoderProfile.H264;
        $scope.EntropyCodingOptions = mAttr.EntropyCoding.H264;
        SmartCodecEnableOptions = mAttr.SmartCodecEnable.H264;
      }
    }

    if (typeof mAttr.BitrateControlType.H265 !== 'undefined') {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType === 'H265') {
        $scope.BitrateControlOptions = mAttr.BitrateControlType.H265;
        priorityOptions = mAttr.PriorityType.H265;
        $scope.EncoderProfileOptions = mAttr.EnocoderProfile.H265;
        $scope.EntropyCodingOptions = mAttr.EntropyCoding.H265;
        SmartCodecEnableOptions = mAttr.SmartCodecEnable.H265;
      }
    }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType === 'MJPEG') {
      priorityOptions = mAttr.PriorityType.MJPEG;
    }

    /**
     * Encoding Priority
     */
    if (typeof priorityOptions !== 'undefined') {
      $scope.PriorityOptions = [];

      for (i = 0; i < priorityOptions.length; i++) {
        temp = {};
        temp.Value = priorityOptions[i];
        if (priorityOptions[i] === 'FrameRate') {
          temp.Text = 'lang_framerate';
        } else if (priorityOptions[i] === 'CompressionLevel') {
          temp.Text = 'lang_compression';
        } else if (priorityOptions[i] === 'Bitrate') {
          temp.Text = 'lang_bitrate';
        }
        $scope.PriorityOptions.push(temp);
      }
    }

    /*
        GoV Length
     */
    if (typeof updateGov === 'undefined' || updateGov === false) {
      $scope.selectGOVLength(false);
    } else {
      $scope.selectGOVLength(true);
    }

    /**
     *  Smart Codec
     */
    if (typeof SmartCodecEnableOptions !== 'undefined') {
      $scope.SmartCodecEnableOptions = [];

      for (i = 0; i < 2; i++) {
        temp = {};
        if (i === 0) {
          temp.Value = true;
          temp.Text = 'lang_enable';
        } else {
          temp.Value = false;
          temp.Text = 'lang_disable';
        }
        $scope.SmartCodecEnableOptions.push(temp);
      }
    }


  };

  $scope.dewarpProfileDetails = {};

  function getResoltionList() {
    var from = null, i = 0, to = null, selectedCodecInfo = null, isSourceView = false,
      codecInfoList = {},
      viewMode = "";

    codecInfoList = $scope.VideoCodecInfo[$scope.ch].ViewModes;

    for (var viewModeCnt = 0; viewModeCnt < codecInfoList.length; viewModeCnt++) {

      viewMode = codecInfoList[viewModeCnt].ViewMode;

      if (viewMode === "Overview") {
        isSourceView = true;
      } else {
        isSourceView = false;
      }

      selectedCodecInfo = codecInfoList[viewModeCnt];

      if (isSourceView) {
        $scope.ProfileDetails = [];
      } else {
        $scope.dewarpProfileDetails[viewMode] = [];
      }

      for (i = 0; i < selectedCodecInfo.Codecs.length; i++) {
        var temp = {};

        if (isSourceView === true) {
          from = selectedCodecInfo.Codecs[i];
          $scope.ProfileDetails[i] = {};
          to = $scope.ProfileDetails[i];
        } else {
          from = selectedCodecInfo.Codecs[i];
          temp = $scope.dewarpProfileDetails[viewMode];

          temp[i] = {};
          to = temp[i];
        }

        to.EncodingType = from.EncodingType;

        if (typeof from.General !== 'undefined') {
          /** General Profile details */
          to.General = {};
          fillProfileDetails(to.General, from.General, to.EncodingType);
        }

        if (typeof from.Record !== 'undefined') {
          /** Record Profile details */
          to.Record = {};
          if (isSourceView === true) {
            fillProfileDetails(to.Record, from.Record, to.EncodingType, $scope.ProfileDetails[i].General);
          } else {
            fillProfileDetails(to.Record, from.Record, to.EncodingType, temp.General);
          }
        }

        if (typeof from.Email !== 'undefined') {
          /** Email Profile details */
          if (to.EncodingType === 'MJPEG') {
            to.Email = {};
            if (isSourceView === true) {
              fillProfileDetails(to.Email, from.Email, to.EncodingType, $scope.ProfileDetails[i].General);
            } else {
              fillProfileDetails(to.Email, from.Email, to.EncodingType, temp.General);
            }
          }
        }

        if (typeof from.DigitalPTZ !== 'undefined') {
          if (to.EncodingType !== 'MJPEG') {
            to.DigitalPTZ = {};
            if (isSourceView === true) {
              fillProfileDetails(to.DigitalPTZ, from.DigitalPTZ, to.EncodingType, $scope.ProfileDetails[i].General);
            } else {
              fillProfileDetails(to.DigitalPTZ, from.DigitalPTZ, to.EncodingType, temp.General);
            }
          }
        }
      }
    }
  }

  function getVideoParms() {
    /** Get the completed resolution list for all the codecs*/
    getResoltionList();

    /** select any one set based on the video encoding of the profile */
    $scope.selectResolutionList(false);
  }

  // $scope.channelSelect = function () {
  //     setDefaultProfile();

  /** select any one set based on the video encoding of the profile */
  //     $scope.selectResolutionList(false);
  // };

  function getIndexByProfileNo(profileNo) {
    var i = 0;

    for (i = 0; i < $scope.VideoProfiles[$scope.ch].Profiles.length; i++) {
      if ($scope.VideoProfiles[$scope.ch].Profiles[i].Profile === profileNo) {
        break;
      }
    }

    /**
     * Error case, just in case not able to find the profile. Select the first profile
     */
    if (i >= $scope.VideoProfiles[$scope.ch].Profiles.length) {
      i = 0;
      LogManager.error('Couldnot get profile index ', $scope.VideoProfiles);
    }
    return i;
  }

  function getVideoSource() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=view', getData,
      function(response) {
        $scope.VideoSources = response.data.VideoSources[0];
        pageData.VideoSources = angular.copy($scope.VideoSources);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setCurrentCameraPositionDetails() {
    var positionList = $scope.cameraPositionDetails.CameraPositions;

    for (var i = 0; i < positionList.length; i++) {

      if ($scope.fishEyeSetup.CameraPosition === positionList[i].CameraPosition) {
        $scope.selectedCameraPosition = positionList[i];
      }
    }
  }

  function getFisheyeSetup() {
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=fisheyesetup&action=view', '',
      function(response) {
        $scope.fishEyeSetup = response.data.Viewmodes[$scope.ch];
        pageData.fishEyeSetup = angular.copy($scope.fishEyeSetup);
        setCurrentCameraPositionDetails();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setVideoSource() {
    var setData = {},
      ignoredKeys = null;

    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }
    ignoredKeys = [];

    COMMONUtils.fillSetData(setData, $scope.VideoSources, pageData.VideoSources,
      ignoredKeys, false);

    SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=set', setData,
      function(response) {
        COMMONUtils.onLogout();
      },
      function(errorData) {
        $scope.VideoSources.SensorCaptureSize = pageData.VideoSources.SensorCaptureSize;
        console.log(errorData);
      }, '', true);
  }

  $scope.changeResolutionMode = function(mode) {
    var msg = '';

    if (mode === '2M') {
      msg = 'lang_msg_2megamode_change';
    } else if (mode === '3M') {
      msg = 'lang_msg_3megamode_change';
    } else {
      msg = 'lang_msg_megamode_change';
    }

    COMMONUtils.ShowConfirmation(function() {
      setVideoSource();
    }, 
    msg,
    'sm',
    function() {
      $scope.VideoSources.SensorCaptureSize = pageData.VideoSources.SensorCaptureSize;
    });
  };

  function getVideoCodecInfo() {
    var getData = {};
    getData.ViewMode = "All";
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videocodecinfo&action=view', getData,
      function(response) {
        $scope.VideoCodecInfo = response.data.VideoCodecInfo;
        getVideoParms();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getConnectionPolicy() {
    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=rtsp&action=view', '',
      function(response) {
        if (typeof response.data.ProfileSessionPolicy !== 'undefined') {
          if (response.data.ProfileSessionPolicy === 'Continue') {
            $scope.ProfileSessionPolicy = true;
          } else {
            $scope.ProfileSessionPolicy = false;
          }
          pageData.ProfileSessionPolicy = angular.copy($scope.ProfileSessionPolicy);
          $scope.ConnectionPolicySupport = true;
        } else {
          $scope.ConnectionPolicySupport = false;
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getVideoProfilePolicies() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=view', getData,
      function(response) {
        $scope.VideoProfilePolicies = response.data.VideoProfilePolicies;

        /** Dependancy between video profile policy and video profiles */
        // getProfiles();
        pageData.VideoProfilePolicies = angular.copy($scope.VideoProfilePolicies);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getVideoRotate() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
      function(response) {
        $scope.rotate = response.data.Flip[0].Rotate;
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setDefaultProfile() {
    /** Select the default selected profile, In case of NVR by default show Live profile details */
    if (typeof $scope.VideoProfilePolicies[$scope.ch].DefaultProfile !== 'undefined') {
      $scope.selectedProfile = getIndexByProfileNo($scope.VideoProfilePolicies[$scope.ch].DefaultProfile);
    } else {
      $scope.selectedProfile = getIndexByProfileNo($scope.VideoProfilePolicies[$scope.ch].LiveProfile);
    }

    /** Error handling, just in case if no profile is selected. show the first profile */
    if (typeof $scope.selectedProfile === 'undefined') {
      $scope.selectedProfile = 0;
    }
  }

  function fillProfileType(profile) {
    var profCnt = 0,
      typeCnt = 0,
      profType = [],
      policy = null,
      profList = null;

    var checkList = [
      'Default',
      'Record',
      'Event',
      'Live',
      'Network',
    ];
    var typename = '';

    policy = $scope.VideoProfilePolicies[0];
    if (typeof $scope.VideoProfilePolicies !== 'undefined') {

      profile.Type = '';
      profile.DefaultProfile = false;
      profile.RecordProfile = false;
      profile.EventProfile = false;
      profile.LiveProfile = false;
      profile.NetworkProfile = false;

      for (typeCnt = 0; typeCnt < checkList.length; typeCnt++) {
        typename = checkList[typeCnt] + 'Profile';
        if (profile.Profile === policy[typename]) {
          profType.push(checkList[typeCnt]);
          profile[typename] = true;
        }
      }

      profList = $scope.VideoProfiles[$scope.ch].Profiles;
      for (profCnt = 0; profCnt < profList.length; profCnt++) {
        if (profile.Profile === profList[profCnt].Profile && profList[profCnt].IsDigitalPTZProfile === true) {
          profType.push('DPTZ');
        }
      }

      profile.Type = profType.join(' / ');
    }


  }

  function manipulateEncoderSettings(profile) {
    var k = 0;
    /**
     * change Enocoder specific variables as common variables, so that
     * same variable can be used in the view
     */
    if (profile.EncodingType === 'H264') {
      for (k in profile.H264) {
        if (profile.H264.hasOwnProperty(k)) {
          if (k === 'Profile') {
            profile.EncoderProfile = profile.H264[k];
          } else {
            profile[k] = profile.H264[k];
          }
        }
      }
    } else if (profile.EncodingType === 'H265') {
      for (k in profile.H265) {
        if (profile.H265.hasOwnProperty(k)) {
          if (k === 'Profile') {
            profile.EncoderProfile = profile.H265[k];
          } else {
            profile[k] = profile.H265[k];
          }
        }
      }
    }
  }

  function getProfiles() {
    var Profiles = null,
      profCnt = 0;
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', getData,
      function(response) {
        $scope.VideoProfiles = response.data.VideoProfiles;

        Profiles = $scope.VideoProfiles[0].Profiles;

        for (profCnt = 0; profCnt < Profiles.length; profCnt++) {
          /**
           * Identify the profile type
           */
          fillProfileType(Profiles[profCnt]);
          /**
           * fill Encoder Details
           */
          manipulateEncoderSettings(Profiles[profCnt]);
          adjustATCMode(Profiles[profCnt]);
        }
        setDefaultProfile();
        /** Fish Eye model adjust supported encoding type based on profile index*/
        adjustSupportedCodecs();

        pageData.VideoProfiles = angular.copy($scope.VideoProfiles);

        if ($scope.VideoProfiles[$scope.ch].Profiles.length === $scope.MaxProfiles) {
          $scope.EnableAddButton = false;
        } else {
          $scope.EnableAddButton = true;
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function saveConnectionPolicy() {
    var setData = {},
      retVal = true;

    /** Not supported in this model */
    if ($scope.ConnectionPolicySupport === false) {
      return;
    }

    if (pageData.ProfileSessionPolicy !== $scope.ProfileSessionPolicy) {
      pageData.ProfileSessionPolicy = $scope.ProfileSessionPolicy;

      if ($scope.ProfileSessionPolicy === true) {
        setData.ProfileSessionPolicy = 'Continue';
      } else {
        setData.ProfileSessionPolicy = 'Disconnect';
      }
    }

    SunapiClient.get('/stw-cgi/network.cgi?msubmenu=rtsp&action=set', setData,
      function(response) {
        return retVal;
      },
      function(errorData) {
        console.log(errorData);
        retVal = false;
        return retVal;
      }, '', true);
  }

  function setConnectionPolicy() {
    var msg = '';
    if ($scope.ProfileSessionPolicy === true) {
      msg = 'lang_msg_change_setting';
    } else {
      msg = 'lang_msg_change_connection_policy';
    }
    
    COMMONUtils.ShowConfirmation(
      function() {
        saveConnectionPolicy();
      },
      msg,
      'sm',
      function() {
        $scope.ProfileSessionPolicy = !$scope.ProfileSessionPolicy;
      }
    );
  }

  $scope.setConnectionPolicy = setConnectionPolicy;

  function getUniqueProfileIndex() {
    var i = 0,
      profiles = {};

    profiles = $scope.VideoProfiles[$scope.ch].Profiles;

    for (i = 0; i < profiles.length; i++) {
      if (profiles[i].Profile !== i + 1) {
        break;
      }
    }

    return i + 1;
  }

  function getPRofileDetailsbyEncoding(encoding) {
    var i = 0,
      resols = {};

    for (i = 0; i < $scope.ProfileDetails.length; i++) {
      if ($scope.ProfileDetails[i].EncodingType === encoding) {
        resols = $scope.ProfileDetails[i].General.Resol;
      }
    }

    return resols;
  }

  function getMaxResolutionIndex() {
    var i = 0,
      width = 0,
      height = 0,
      resols = null,
      maxPixels = 0,
      maxIndex = 0;

    resols = getPRofileDetailsbyEncoding('H264');

    for (i = 0; i < resols.length; i++) {
      width = resols[i].Value.split('x')[0];
      height = resols[i].Value.split('x')[1];
      if (maxPixels < (width * height)) {
        maxPixels = width * height;
        maxIndex = i;
      }
    }
    return maxIndex;
  }

  function getMinResolutionIndex(resolList) {
    var i = 0,
      width = 0,
      height = 0,
      minPixels = 0,
      maxIndex = 0;

    for (i = 0; i < resolList.length; i++) {
      width = parseInt(resolList[i].Value.split('x')[0], 10);
      height = parseInt(resolList[i].Value.split('x')[1], 10);
      if (minPixels > (width * height) || minPixels === 0) {
        minPixels = width * height;
        maxIndex = i;
      }
    }
    return maxIndex;
  }


  function getDefaultEncoderSettings(profile) {

    if (typeof $scope.EncoderProfileOptions !== 'undefined') {
      if (profile.EncodingType === 'H264') {
        profile.EncoderProfile = 'High';
        profile.H264 = {};
      } else if (profile.EncodingType === 'H265') {
        profile.EncoderProfile = 'Main';
        profile.EntropyCoding = "CABAC";
        profile.H265 = {};
      }
    }

    /**
     * Dont change any of the encoder setting, when moving between H264 and H265
     */
    if (typeof profile.BitrateControlType === 'undefined') {
      profile.BitrateControlType = 'VBR';
    }

    if (typeof profile.PriorityType === 'undefined') {
      profile.PriorityType = 'FrameRate';
    }


    if (typeof profile.EncoderProfile === 'undefined') {
      profile.EncoderProfile = 'High';
    }

    if (typeof profile.EntropyCoding === 'undefined') {
      profile.EntropyCoding = 'CABAC';
    }



    if ($scope.VideoProfilePolicies[$scope.ch].RecordProfile === profile.Profile) {
      LogManager.debug("getDefaultEncoderSettings Adjust Gov Length", profile.GOVLength, ' -> ', Math.ceil(profile.FrameRate / 2));
      profile.GOVLength = Math.ceil(profile.FrameRate / 2);

      LogManager.debug("getDefaultEncoderSettings Adjust Dynamic Gov Length", profile.GOVLength, ' -> ', Math.ceil(profile.FrameRate / 2));
      profile.DynamicGOVLength = Math.ceil(profile.FrameRate / 2);


    } else {
      LogManager.debug("getDefaultEncoderSettings Adjust Gov Length", profile.GOVLength, ' -> ', profile.FrameRate);
      profile.GOVLength = profile.FrameRate * 2;
      if (profile.FrameRate === 1) {
        profile.GOVLength = 1;
      }

      if (profile.FrameRate === 1) {
        profile.DynamicGOVLength = 1;
        LogManager.debug("getDefaultEncoderSettings Adjust Dynamic Gov Length", profile.GOVLength, ' -> ', 1);
      } else {
        profile.DynamicGOVLength = profile.FrameRate * 8;
        LogManager.debug("getDefaultEncoderSettings Adjust Dynamic Gov Length", profile.GOVLength, ' -> ', profile.FrameRate * 8);
      }

    }

    if (typeof profile.SmartCodecEnable === 'undefined' && typeof $scope.SmartCodecEnableOptions !== 'undefined') {
      profile.SmartCodecEnable = false;
    }

    if (typeof $scope.profileBasedDPTZ !== 'undefined') {
      if (typeof profile.IsDigitalPTZProfile === 'undefined' && $scope.DigitalPtzSupported === true) {
        profile.IsDigitalPTZProfile = false;
      }
    }

  }

  function getDefaultProfile() {
    var profile = null,
      maxResolIndex = 0;

    profile = angular.copy($scope.VideoProfiles[$scope.ch].Profiles[1]);

    profile.Profile = getUniqueProfileIndex();
    profile.Name = "";
    profile.IsFixedProfile = false;
    profile.EncodingType = 'H264';
    /*
        Default Profile Type Settings
     */
    profile.Type = "";
    profile.DefaultProfile = false;
    profile.RecordProfile = false;

    if ($scope.DigitalPtzSupported === true && typeof $scope.profileBasedDPTZ !== 'undefined') {
      profile.IsDigitalPTZProfile = false;
    }

    /*
        Default RTP Settings
     */
    profile.RTPMulticastEnable = false;
    profile.RTPMulticastAddress = "";
    profile.RTPMulticastPort = 0;
    profile.RTPMulticastTTL = 5;

    /*
        Default ATC Settings
     */
    profile.ATCMode = "Disabled";
    profile.ATCSensitivity = 'VeryHigh';
    profile.ATCLimit = 50;
    profile.ATCTrigger = "Network";

    if ($scope.cropSupport === true) {
      /*
          Default CROP Encoding Settings
       */
      profile.CropEncodingEnable = false;
      profile.CropAreaCoordinate = "";
    }

    /*
        Default AudioInput Encoding Settings
     */
    if (mAttr.MaxAudioInput > 0) {
      profile.AudioInputEnable = false;
    }

    /*
        Resoltion and Bitrate settins
     */
    maxResolIndex = getMaxResolutionIndex();
    profile.Resolution = $scope.ProfileDetails[1].General.Resol[maxResolIndex].Value;
    profile.FrameRate = $scope.ProfileDetails[1].General.Resol[maxResolIndex].MaxFPS;
    profile.CompressionLevel = 10;
    /**
     * Encoder Specific details
     */
    getDefaultEncoderSettings(profile);

    return profile;
  }

  $scope.isAtcOptionDisabled = function(option) {
    if (typeof $scope.VideoProfiles !== 'undefined') {
      if (option.Value === 'Event-MD' && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType === 'MJPEG') {
        return true;
      }
    }
    return false;
  };

  function adjustATCMode(profile) {
    /*
    Below code is required for combining ATC Mode and ATC Trigger parameter
     */

    if (profile.ATCTrigger === 'Event' && profile.ATCEventType === 'MotionDetection') {
      profile.ATCMode = 'Event-MD';
    }
  }

  function restrictBitcontrolType() {
    var selectedProfile = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile];

    if (selectedProfile.BitrateControlType === 'CBR') {
      switch (selectedProfile.ATCMode) {
        case 'Event-MD':
          selectedProfile.PriorityType = 'FrameRate';
          break;
        case 'AdjustFramerate':
          selectedProfile.PriorityType = 'CompressionLevel';
          break;
        case 'AdjustCompressionlevel':
          selectedProfile.PriorityType = 'FrameRate';
          break;
        case 'Disabled':
          break;
      }
    }
  }

  $scope.setATCMode = function() {
    var selectedProfile = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile];

    if (selectedProfile.ATCMode === 'Event-MD') {
      selectedProfile.ATCTrigger = 'Event';
      selectedProfile.ATCEventType = 'MotionDetection';
    } else {
      selectedProfile.ATCTrigger = 'Network';
    }

    restrictBitcontrolType();
  };

  $scope.addProfile = function() {
    var profCnt = 0,
      profiles = null, profile = null;
    if ($scope.VideoProfiles[$scope.ch].Profiles.length === $scope.MaxProfiles) {
      console.log("max profiles reached");
      return;
    }

    profiles = $scope.VideoProfiles[$scope.ch].Profiles;

    for (profCnt = 0; profCnt < profiles.length; profCnt++) {
      /** Refer exising H.264 profile to get default settings  */
      if (profiles[profCnt].EncodingType === 'H264') {
        break;
      }
    }

    $scope.selectedProfile = profiles.length;
    profile = getDefaultProfile();

    profiles.push(profile);

    /** Init Codec details again, since codec supported for fixed profile changes in fisheye model */
    if (typeof $scope.viewModeIndex !== 'undefined') {
      initEncoderDetails();
    }

    $scope.EnableAddButton = false;

    $scope.selectResolutionList(true);
  };


  function del_profile() {
    var setData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }
    if (typeof pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile] !== 'undefined') {
      setData.Profile = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Profile;
      SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=remove', setData,
        function(response) {
          view();
        },
        function(errorData) {
          console.log(errorData);
        }, '', true);
    } else {
      view();
    }
  }

  function getCropInitSize() {
    var resolution = $scope.ResoltionList[0].Value.split('x');
    var size = resolution[0] * resolution[1];
    var cropSize = "";
    if (size > 1920 * 1080) { //5M
      if ($scope.rotate === "0") {
        cropSize = cropInitSize_5M.x + "," + cropInitSize_5M.y + "," + (cropInitSize_5M.x + cropInitSize_5M.width) + "," + (cropInitSize_5M.y + cropInitSize_5M.height);
      } else {
        cropSize = cropInitSize_5M.y + "," + cropInitSize_5M.x + "," + (cropInitSize_5M.y + cropInitSize_5M.height) + "," + (cropInitSize_5M.x + cropInitSize_5M.width);
      }
    } else { //2M
      if ($scope.rotate === "0") {
        cropSize = cropInitSize_2M.x + "," + cropInitSize_2M.y + "," + (cropInitSize_2M.x + cropInitSize_2M.width) + "," + (cropInitSize_2M.y + cropInitSize_2M.height);
      } else {
        cropSize = cropInitSize_2M.y + "," + cropInitSize_2M.x + "," + (cropInitSize_2M.y + cropInitSize_2M.height) + "," + (cropInitSize_2M.x + cropInitSize_2M.width);
      }
    }
    return cropSize;
  }

  $scope.deleteProfile = function() {
    COMMONUtils.ShowConfirmation(del_profile, 'lang_msg_confirm_remove_profile');
  };

  $scope.changeCropStatus = function() {
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropEncodingEnable === true) {
      var tempCoordi = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropAreaCoordinate.split(',');
      if (tempCoordi.length < 4) {
        tempCoordi = getCropInitSize().split(',');
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropAreaCoordinate = getCropInitSize();
      }
      if (tempCoordi.length > 0) {
        for (var i = 0; i < $scope.ResoltionList.length; i++) {
          var tempResol = $scope.ResoltionList[i].Text.substring(0, $scope.ResoltionList[i].Text.length - 1).split("(");
          var resolArray = tempResol[0].split('X');
          var width = parseInt(resolArray[0], 10);
          var height = parseInt(resolArray[1], 10);
          var resolRatio = tempResol[1];
          var cropWidth = parseInt(tempCoordi[2] - tempCoordi[0], 10);
          var cropHeight = parseInt(tempCoordi[3] - tempCoordi[1], 10);

          if ($scope.rotate !== "0") {
            var tempWidth = cropWidth;
            cropWidth = cropHeight;
            cropHeight = tempWidth;
          }

          if (cropWidth >= width && cropHeight >= height) {
            if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio === resolRatio ||
              $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio === "Manual") {
              $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution = $scope.ResoltionList[i].Value;
              break;
            }
          }
        }
      }
    } else {
      //$scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution;
    }
    $scope.selectResolutionList(true);
  }

  $scope.setCropArea = function() {
    var cropArea = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropAreaCoordinate;
    var cropRatio = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio;
    var cropEnable = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropEncodingEnable;

    var modalInstance = $uibModal.open({
      templateUrl: 'views/livePlayback/modal/ModalCrop.html',
      controller: 'ModalInstnceCropCtrl',
      windowClass: 'modal-position-middle',
      size: 'sm',
      resolve: {
        data: function() {
          return {
            'buttonCount': 1,
            'message': 'lang_crop_set_area',
            'cropArea': cropArea,
            'cropRatio': cropRatio,
            'cropEnable': cropEnable,
            'channelId': UniversialManagerService.getChannelId(),
          };
        },
      },
    });

    modalInstance.result.then(cropSuccessCallback, function() {});
  };

  function cropSuccessCallback(data) {
    var cropArea = data.cropArray.x1 + "," + data.cropArray.y1 + "," + (parseInt(data.cropArray.x1, 10) + parseInt(data.cropArray.width, 10)) + "," +
      (parseInt(data.cropArray.y1, 10) + parseInt(data.cropArray.height, 10));
    $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropAreaCoordinate = cropArea;
    $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio = data.ratio;
    $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropEncodingEnable = data.enable;

    var cropWidth = (data.rotate === "0" ? parseInt(data.cropArray.width, 10) : parseInt(data.cropArray.height, 10));
    var cropHeight = (data.rotate === "0" ? parseInt(data.cropArray.height, 10) : parseInt(data.cropArray.width, 10));

    for (var i = 0; i < $scope.ResoltionList.length; i++) {
      var tempResol = $scope.ResoltionList[i].Text.substring(0, $scope.ResoltionList[i].Text.length - 1).split("(");
      var resolArray = tempResol[0].split('X');
      var width = parseInt(resolArray[0], 10);
      var height = parseInt(resolArray[1], 10);
      var resolRatio = tempResol[1];
      if (cropWidth >= width && cropHeight >= height) {
        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio === resolRatio ||
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio === "Manual") {
          $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Resolution = $scope.ResoltionList[i].Value;
          break;
        }
      }
    }
    $scope.selectResolutionList(true);
  }

  $scope.cropEncodingSupport = function(resolution) {
    var returnValue = false;
    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropEncodingEnable === true) {
      var tempCoordi = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropAreaCoordinate.split(',');
      var tempResol = resolution.substring(0, resolution.length - 1).split("(");
      if (tempCoordi.length > 0) {
        var currentResolution = tempResol[0].split(' X ');
        var currentRatio = tempResol[1];
        var width = parseInt(tempCoordi[2] - tempCoordi[0], 10);
        var height = parseInt(tempCoordi[3] - tempCoordi[1], 10);

        if ($scope.rotate !== "0") {
          var tempWidth = width;
          width = height;
          height = tempWidth;
        }

        if (parseInt(currentResolution[0], 10) > width || parseInt(currentResolution[1], 10) > height) {
          returnValue = true;
        } else {
          if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio !== "Manual") {
            if (currentRatio !== $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].CropRatio) {
              returnValue = true;
            }
          }

        }

      }
    }
    return returnValue;
  }

  function setProfiles() {
    var newVal = null, oldVal = null,
      setData = {},
      k = 0, ignoredKeys = null, encoderParams = null, dptzParams = null,
      url = '',
      SVNPParam = null, rtpParams = null,
      atcParam = null, changed = false;

    newVal = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile];
    oldVal = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile];

    /*
    Request to create new profile
     */
    if (typeof oldVal === 'undefined') {
      oldVal = {};
      $scope.isNewProfile = true;
    }

    ignoredKeys = ['$$hashKey', 'H264', 'H265', 'DefaultProfile', 'RecordProfile', 'EventProfile', 'LiveProfile', 'NetworkProfile', 'Type', 'IsFixedProfile', 'MaxGOVLength', 'MinGOVLength', 'MaxDynamicGOVLength', 'ProfileToken'];
    encoderParams = ['BitrateControlType', 'PriorityType', 'GOVLength', 'EncoderProfile', 'EntropyCoding', 'SmartCodecEnable', 'DynamicGOVEnable', 'DynamicGOVLength', 'DynamicFPSEnable'];
    dptzParams = ['IsDigitalPTZProfile'];
    SVNPParam = ['SVNPMulticastAddress', 'SVNPMulticastPort', 'SVNPMulticastTTL'];
    rtpParams = ['RTPMulticastAddress', 'RTPMulticastPort', 'RTPMulticastTTL'];
    atcParam = ['ATCSensitivity', 'ATCLimit'];

    if ($scope.cropSupport === false) {
      ignoredKeys.push('CropEncodingEnable');
      if (newVal.CropEncodingEnable === false) {
        ignoredKeys.push('CropAreaCoordinate');
      }
    }

    if ($scope.isNewProfile === true) {
      ignoredKeys.push('Profile');
    }

    if (newVal.EncodingType === 'MJPEG') {
      ignoredKeys = ignoredKeys.concat(encoderParams);
      ignoredKeys = ignoredKeys.concat(dptzParams);
      setData['MJPEG.PriorityType'] = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].PriorityType;
    }

    if (typeof newVal.SVNPMulticastEnable !== 'undefined') {
      if (newVal.SVNPMulticastEnable === false) {
        ignoredKeys = ignoredKeys.concat('SVNPMulticastEnable');
        ignoredKeys = ignoredKeys.concat(SVNPParam);
      }
    }

    if (newVal.EncodingType === 'MJPEG') {
      if ($scope.DynamicGovSupported) {
        ignoredKeys.push('DynamicGOVEnable');
        ignoredKeys.push('DynamicGOVLength');
      }
      ignoredKeys.push('DynamicFPSEnable');
    }

    if (typeof newVal.RTPMulticastEnable !== 'undefined') {
      if (newVal.RTPMulticastEnable === false) {
        ignoredKeys = ignoredKeys.concat(rtpParams);
      }
    }

    if (newVal.ATCMode !== 'Disabled' && oldVal.RecordProfile && newVal.Profile === 1) {
      ignoredKeys.push('ATCMode');
      ignoredKeys = ignoredKeys.concat(atcParam);

    } else if (newVal.ATCMode === 'Event-MD' || newVal.ATCMode === 'Disabled') {
      ignoredKeys = ignoredKeys.concat(atcParam);
    }


    if (newVal.ATCTrigger !== 'Event') {
      ignoredKeys.push('ATCEventType');
    } else {
      ignoredKeys.push('ATCMode');
    }

    if ($scope.DigitalPtzSupported === false || typeof $scope.profileBasedDPTZ === 'undefined' || $scope.FisheyeLens === true ||
      isDptzSupportedProfile($scope.selectedProfile) === false) {
      ignoredKeys.push('IsDigitalPTZProfile');
    }

    if (!angular.equals(oldVal, newVal)) {
      for (k in newVal) {
        if (newVal.hasOwnProperty(k)) {
          if (ignoredKeys.indexOf(k) !== -1) {
            continue;
          }
          if (oldVal[k] !== newVal[k]) {
            if (newVal[k] !== '' && typeof newVal[k] !== 'undefined') {
              /** Change Common Encoder param to individual encoder params */
              if (encoderParams.indexOf(k) !== -1) {
                var tmp = '';
                if (k === 'EncoderProfile') {
                  tmp = newVal.EncodingType + '.Profile';
                } else {
                  tmp = newVal.EncodingType + '.' + k;
                }
                setData[tmp] = newVal[k];
              } else {
                setData[k] = newVal[k];
              }

              changed = true;
            } else {
              LogManager.error("Invalid argument ", k, "=", newVal[k]);
            }

          } else {
            if (typeof newVal.SVNPMulticastEnable !== 'undefined') {
              if (newVal.SVNPMulticastEnable === true) {

                if ((newVal.SVNPMulticastEnable !== oldVal.SVNPMulticastEnable) ||
                  (newVal.SVNPMulticastAddress !== oldVal.SVNPMulticastAddressl) ||
                  (newVal.SVNPMulticastPort !== oldVal.SVNPMulticastPort) ||
                  (newVal.SVNPMulticastTTL !== oldVal.SVNPMulticastTTL)) {

                  if (k === 'SVNPMulticastEnable' || k === 'SVNPMulticastAddress' || k === 'SVNPMulticastPort' || k === 'SVNPMulticastTTL') {
                    setData[k] = newVal[k];
                  }
                }
              }
            }

            if (typeof newVal.RTPMulticastEnable !== 'undefined') {
              if (newVal.RTPMulticastEnable === true) {
                if ((newVal.RTPMulticastEnable !== oldVal.RTPMulticastEnable) ||
                  (newVal.RTPMulticastAddress !== oldVal.RTPMulticastAddress) ||
                  (newVal.RTPMulticastPort !== oldVal.RTPMulticastPort) ||
                  (newVal.RTPMulticastTTL !== oldVal.RTPMulticastTTL)) {
                  if (k === 'RTPMulticastEnable' || k === 'RTPMulticastAddress' || k === 'RTPMulticastPort' || k === 'RTPMulticastTTL') {
                    setData[k] = newVal[k];
                  }
                }
              }
            }

            if (typeof newVal.CropEncodingEnable !== 'undefined') {
              if (newVal.CropEncodingEnable === true) {
                if ((newVal.CropEncodingEnable !== oldVal.CropEncodingEnable)) {
                  if (k === 'CropEncodingEnable' || k === 'CropAreaCoordinate' || k === 'CropRatio') {
                    setData[k] = newVal[k];
                  }
                }
              }
            }
          }
        }
      }
    }

    if ($scope.isNewProfile === false) {
      setData.Profile = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Profile;
    }

    if (newVal.EncodingType !== 'MJPEG') {
      if (newVal.EncodingType === 'H264') {
        if (setData.hasOwnProperty('FrameRate') || setData.hasOwnProperty('H264.GOVLength') || setData.hasOwnProperty('H264.DynamicGOVLength')) {
          setData['H264.GOVLength'] = newVal.GOVLength;
          setData['H264.DynamicGOVLength'] = newVal.DynamicGOVLength;
        }
      } else if (newVal.EncodingType === 'H265') {
        if (setData.hasOwnProperty('FrameRate') || setData.hasOwnProperty('H265.GOVLength') || setData.hasOwnProperty('H265.DynamicGOVLength')) {
          setData['H265.GOVLength'] = newVal.GOVLength;
          setData['H265.DynamicGOVLength'] = newVal.DynamicGOVLength;
        }
      }
    } else {
      if (oldVal.PriorityType !== newVal.PriorityType) {
        setData['MJPEG.PriorityType'] = newVal.PriorityType;
        changed = true;
      }
    }
    /** Always send frame rate */
    setData.FrameRate = newVal.FrameRate;

    if (changed === true) {
      url = '/stw-cgi/media.cgi?msubmenu=videoprofile&';
      if ($scope.isNewProfile === true) {
        url += 'action=add';
      } else {
        url += 'action=update';
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }
      return SunapiClient.get(url, setData,
        function(response) {
          if ($scope.VideoProfiles[$scope.ch].Profiles.length !== $scope.MaxProfiles) {
            $scope.EnableAddButton = true;
          }
        },
        function(errorData) {
          //alert(errorData);
          LogManager.debug("SetProfiles failed ");
        }, '', true);
    }

    // return retVal;
  }


  function setVideoProfilePolicies() {
    var key = '', obj = null, setData = {};
    obj = $scope.VideoProfilePolicies[$scope.ch];
    var ignoredKeys = ['IsDigitalPTZProfile'];
    for (key in obj) {
      var a = ignoredKeys.indexOf(key);
      if (a !== -1) {
        continue;
      }
      if (obj.hasOwnProperty(key)) {
        if (obj[key] <= $scope.MaxProfiles) {
          setData[key] = obj[key];
        }
      }
    }

    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=set', setData,
      function(response) {},
      function(errorData) {
        //alert(errorData);
        LogManager.debug("Set Profile Polcy failed ", errorData);
      }, '', true);
  }

  function CheckMulticast(ip, port, ttl, isRTP) {
    var mcastArray = null, ErrorMessage = '';
    if (ip.search(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) !== -1) {
      mcastArray = ip.split(/\./);
    }

    var thisSegment = null;

    if (mcastArray === null || !COMMONUtils.TypeCheck(ip, COMMONUtils.getNUM() + '.')) {
      ErrorMessage = 'lang_msg_check_multicast';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    thisSegment = mcastArray[0];
    if (thisSegment < 224 || thisSegment > 239) {
      ErrorMessage = 'lang_msg_check_multicast';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    for (var index = 1; index < 4; ++index) {
      thisSegment = mcastArray[index];
      if (thisSegment > 255) {
        ErrorMessage = 'lang_msg_check_multicast';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }
    }
    thisSegment = mcastArray[3];
    if (thisSegment > 254) {
      ErrorMessage = 'lang_msg_check_multicast';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    var intport = COMMONUtils.getIntegerValue(port);
    if (isRTP === true) {
      if ((intport % 2) !== 0 || intport === 3702 || intport < 1024 || intport > 65535 || !COMMONUtils.TypeCheck(port, COMMONUtils.getNUM())) {
        ErrorMessage = 'lang_msg_error_multicast_rtp';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }
    } else {
      if (intport === 3702 || intport < 1024 || intport > 65535 || !COMMONUtils.TypeCheck(port, COMMONUtils.getNUM())) {
        ErrorMessage = 'lang_msg_error_multicast_svnp';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }
    }

    var intttl = COMMONUtils.getIntegerValue(ttl);

    if (ttl === "" || intttl < 0 || intttl > 255 || !COMMONUtils.TypeCheck(ttl, COMMONUtils.getNUM())) {
      ErrorMessage = 'lang_msg_check_ttl';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    return true;
  }



  function validatePage() {
    var retVal = true;
    var ErrorMessage = '';
    // var newVal = $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile];
    var oldVal = pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile];
    $scope.isNewProfile = false;
    if (typeof oldVal === 'undefined') {
      oldVal = {};
      $scope.isNewProfile = true;
    }

    var invalidProfile_Name = false;
    var prfInd = 0;


    if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name === 'undefined') {
      ErrorMessage = 'lang_msg_invalid_name';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }

    for (prfInd = 1; prfInd <= $scope.MaxProfiles; prfInd++) {
      var profileNm = "profile" + prfInd;
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name === profileNm) {
        if ($scope.isNewProfile === false) {
          if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name !== pageData.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name) {
            invalidProfile_Name = true;
          }
        } else {
          invalidProfile_Name = true;
        }
        break;
      }

    }

    if ($scope.isNewProfile === true) {
      for (var ii = 0; ii < pageData.VideoProfiles[$scope.ch].Profiles.length; ii++) {
        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name === pageData.VideoProfiles[$scope.ch].Profiles[ii].Name) {
          invalidProfile_Name = true;
        }
      }
    } else {
      for (var jj = 0; jj < pageData.VideoProfiles[$scope.ch].Profiles.length; jj++) {
        if (jj !== $scope.selectedProfile && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name === pageData.VideoProfiles[$scope.ch].Profiles[jj].Name) {
          invalidProfile_Name = true;
        }
      }
    }


    if (COMMONUtils.CheckSpace($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name)) {
      invalidProfile_Name = true;
    }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].IsFixedProfile === false) {
      if (!COMMONUtils.TypeCheck($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Name, COMMONUtils.getNUM() + COMMONUtils.getALPHA())) {
        invalidProfile_Name = true;
      }
    }

    if (invalidProfile_Name === true) {
      ErrorMessage = 'lang_msg_invalid_name';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }

    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCMode !== 'Disabled') {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCLimit < $scope.ATCLimitRange.Min ||
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCLimit > $scope.ATCLimitRange.Max ||
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCLimit === '' ||
        typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].ATCLimit === 'undefined') {
        ErrorMessage = 'lang_msg_invalid_profile_atc_limit';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }
    }


    if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate !== 'undefined') {

      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate < $scope.BitRateRange.Min ||
        $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].Bitrate > $scope.BitRateRange.Max
      ) {

        if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType === 'VBR') {
          ErrorMessage = $filter('translate')("lang_msg_maximum_bitrate0") + $scope.BitRateRange.Min + $filter('translate')("lang_msg_maximum_bitrate1") +
            $scope.BitRateRange.Max + $filter('translate')("lang_msg_maximum_bitrate2");
        } else {
          ErrorMessage = $filter('translate')("lang_msg_target_bitrate0") + $scope.BitRateRange.Min + $filter('translate')("lang_msg_target_bitrate1") +
            $scope.BitRateRange.Max + $filter('translate')("lang_msg_target_bitrate2");
        }
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }

    } else {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType === 'VBR') {
        ErrorMessage = $filter('translate')("lang_msg_maximum_bitrate0") + $scope.BitRateRange.Min + $filter('translate')("lang_msg_maximum_bitrate1") +
          $scope.BitRateRange.Max + $filter('translate')("lang_msg_maximum_bitrate2");
      } else {
        ErrorMessage = $filter('translate')("lang_msg_target_bitrate0") + $scope.BitRateRange.Min + $filter('translate')("lang_msg_target_bitrate1") +
          $scope.BitRateRange.Max + $filter('translate')("lang_msg_target_bitrate2");
      }
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }


    if (typeof $scope.GOVLengthRange !== 'undefined' && $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].EncodingType !== "MJPEG") {
      if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength === 'undefined') {
        ErrorMessage = 'lang_msg_check_gov';
        retVal = false;


        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }

      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength < $scope.GOVLengthRange.Min || $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength > $scope.GOVLengthRange.Max) {
        ErrorMessage = 'lang_msg_check_gov';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }

      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].BitrateControlType === 'VBR') {

        var intDynamicGov = COMMONUtils.getIntegerValue($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].DynamicGOVLength);
        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].DynamicGOVLength === 'undefined' ||
          intDynamicGov < COMMONUtils.getIntegerValue($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].GOVLength) ||
          intDynamicGov > $scope.DynamicGovRange.Max) {
          ErrorMessage = "Check DynamicGOVLength";
          retVal = false;
          COMMONUtils.ShowError(ErrorMessage);
          return retVal;
        }
      }
    }



    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastEnable !== 'undefined') {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastEnable) {
        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastAddress === 'undefined') {
          ErrorMessage = 'lang_msg_check_multicast';
          retVal = false;
          COMMONUtils.ShowError(ErrorMessage);
          return retVal;
        }

        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastPort === 'undefined') {
          ErrorMessage = 'lang_msg_error_multicast_svnp';
          retVal = false;
          COMMONUtils.ShowError(ErrorMessage);
          return retVal;
        }

        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastTTL === 'undefined') {
          ErrorMessage = 'lang_msg_check_ttl';
          retVal = false;
          COMMONUtils.ShowError(ErrorMessage);
          return retVal;
        }

        if (!CheckMulticast($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastAddress, $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastPort.toString(),
            $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].SVNPMulticastTTL.toString(), false)) {
          retVal = false;
          return retVal;
        }
      }
    }


    if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastEnable !== 'undefined') {
      if ($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastEnable) {
        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastAddress === 'undefined') {
          ErrorMessage = 'lang_msg_check_multicast';
          retVal = false;
          COMMONUtils.ShowError(ErrorMessage);
          return retVal;
        }

        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastPort === 'undefined') {
          ErrorMessage = 'lang_msg_error_multicast_rtp';
          retVal = false;
          COMMONUtils.ShowError(ErrorMessage);
          return retVal;
        }

        if (typeof $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastTTL === 'undefined') {
          ErrorMessage = 'lang_msg_check_ttl';
          retVal = false;
          COMMONUtils.ShowError(ErrorMessage);
          return retVal;
        }

        if (!CheckMulticast($scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastAddress, $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastPort.toString(),
            $scope.VideoProfiles[$scope.ch].Profiles[$scope.selectedProfile].RTPMulticastTTL.toString(), true)) {
          retVal = false;
          return retVal;
        }
      }
    }

    return retVal;
  }

  function view() {
    $scope.EnableAddButton = true;
    $scope.isNewProfile = false;
    var promises = [getConnectionPolicy, getVideoSource, getVideoProfilePolicies, getProfiles, getVideoCodecInfo, getVideoRotate];

    if ($scope.FisheyeLens === true) {
      promises.push(getFisheyeSetup);
    }

    if ($scope.isMultiChannel) {
      promises.push(getProfilePolicyTableData);
      promises.push(getProfileTableData);
    }

    $q.seqAll(promises).then(
      function(result) {
        $scope.pageLoaded = true;
        $("#profilepage").show();
        $rootScope.$emit('changeLoadingBar', false);
        $rootScope.$emit("channelSelector:changeChannel", $scope.targetChannel);
      },
      function(error) {});
  }


  function retrySavingProfilePolicy() {
    $timeout(function() {
      /** If it is a new profile, then add the profile first and then set the profile policy .
      Give some time for profile to be created then send the policy command.
      Sometime is it not working, without delay */
      setVideoProfilePolicies().then(function(response) {
        LogManager.debug("Set Video Profile policies succeded ");
        UniversialManagerService.setChannelId($scope.targetChannel);
        view();
      },
        function(error) {
          LogManager.debug("Set Video Profile policies failed ", error);
          view();
        });
    }, 500);
  }

  function saveSettings() {
    var promises = [];

    /* Try to set profile policy both before and after setting video profile,
       during video codec change it is needed to set profile policy after changing video codec.
       Bcoz Email/FTP is applicable only for MJPEG profile */
    if ($scope.isNewProfile === false) {
      /** In case of creating new profile, not set profile policy  */
      if (!angular.equals(pageData.VideoProfilePolicies, $scope.VideoProfilePolicies)) {
        promises.push(setVideoProfilePolicies);
      }
    }

    if (!angular.equals(pageData.VideoProfiles, $scope.VideoProfiles)) {
      promises.push(setProfiles);
    }
    if (promises.length <= 0) {
      return; 
    }

    $q.seqAll(promises).then(
      function(result) {
        retrySavingProfilePolicy();
      },
      function(error) {
        LogManager.debug("Save settings promise failed ");
        retrySavingProfilePolicy();
      });
  }

  $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
    if (!angular.equals(pageData.VideoProfilePolicies, $scope.VideoProfilePolicies) ||
      !angular.equals(pageData.VideoProfiles, $scope.VideoProfiles)) {
      COMMONUtils.
        confirmChangeingChannel().then(function() {
          if (validatePage()) {
            $rootScope.$emit('changeLoadingBar', true);
            $scope.targetChannel = data;
            saveSettings();
          }
        },
          function() {});
    } else {
      $rootScope.$emit('changeLoadingBar', true);
      $scope.targetChannel = data;
      UniversialManagerService.setChannelId(data);
      $rootScope.$emit("channelSelector:changeChannel", data);
      view();
    }
  }, $scope);

  $rootScope.$saveOn("channelSelector:showInfo", function(event, data) {
    $uibModal.open({
      size: 'lg',
      templateUrl: 'views/setup/basic/modal/ModalVideoProfileInfo.html',
      controller: 'ModalInstanceVideoProfileInfoCtrl',
      windowClass: 'modal-position-middle',
      resolve: {
        infoTableData: function() {
          return $scope.infoTableData;
        },
      },
    });
  }, $scope);

  function set() {
    if (validatePage()) {
      COMMONUtils.ApplyConfirmation(saveSettings);
    }
  }

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get("media");
        wait();
      }, 500);
    } else {
      getAttributes();
    }
  })();

  $scope.submit = set;
  $scope.view = view;
});