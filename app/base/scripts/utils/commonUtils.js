kindFramework.factory('COMMONUtils', function($translate, $location, $uibModal, Attributes, SessionOfUserManager, EventStatusService, SunapiClient) {
  "use strict";
  var commonUtils = {};

  var mAttr = Attributes.get();

  var minLen = 8;

  var FRIENDLY_NAME = '~!@$_-|{}[],./?';
  var SIM = '~`!@$^*()_-|{}[];,./?';
  var NUM = '0123456789';
  var ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var PATH_SIM = '~`!@$^()_-{}[];,./\\';
  var FILE_SIM = '~`!@$^()_-{}[];,.';
  var SPACE = ' ';
  //var TAB = '\t';
  var CR = '\r';
  var LF = '\n';
  var IPv6 = '0123456789abcdefABCDEF:';
  var SIM2 = '#"%&';
  var QUOTATION = "'";
  var Directory = "`~!@#$%^&()-_=+[]{};',./";
  var Folder = "'-!#$%&(),;@[]^_`{}~+=";
  var PATTERN_NUM = /\d+/;
  var PATTERN_UPPER_ALPHA = /[A-Z]/;
  var PATTERN_LOWER_ALPHA = /[a-z]/;

  commonUtils.getResponsiveObjects = function($scope) {
    $scope.SmallLabelClass = "col-sm-2 col-xs-6 field-label control-label";
    $scope.LabelClass = "col-sm-3 col-xs-12";
    $scope.LabelClassLg = "col-lg-5 col-md-5 col-sm-5 col-xs-6 control-label";
    $scope.LabelClassVlg = "col-lg-6 col-md-6 col-sm-6 col-xs-8 control-label";
    $scope.FieldClass = "col-sm-6 col-xs-12";
    $scope.ErrorClass = "error col-lg-2 col-md-3 col-sm-4 col-xs-5 control-label";
    $scope.DropDownClassSm = "col-lg-2 col-md-2 col-sm-3 col-xs-4 control-label";
    $scope.DropDownClassLg = $scope.FieldClass;
    $scope.DropDownClassVlg = $scope.FieldClass;
    $scope.RadioClassSm = "col-sm-3 col-xs-6 field-radio-wrapper control-label";
    $scope.RadioClassLg = "col-sm-6 col-xs-12 field-radio-wrapper control-label";
    $scope.RadioClassVlg = "col-lg-5 col-md-6 col-sm-7 col-xs-9 field-radio-wrapper control-label";
    $scope.NumClassSm = "col-lg-2 col-md-4 col-sm-5 col-xs-6";
    $scope.TextClassVlg = "col-lg-3 col-md-4 col-sm-5 col-xs-7";
    $scope.TableWidthClass = "col-lg-8 col-md-11 col-sm-12 col-xs-12";
    $scope.TableElementClass = this.getTableElementClass();
    $scope.ModalLabelClass = "col-lg-1 col-md-2 col-sm-2 col-xs-4";
    $scope.ModalDropDown = "col-lg-2 col-md-2 col-sm-2 col-xs-4";
    $scope.SliderClass = "col-lg-4 col-md-4 col-sm-4 col-xs-4";
    $scope.SliderClassSm = "col-lg-2 col-md-4 col-sm-6 col-xs-8";
    $scope.SpanClass = "col-lg-1 col-md-1 col-sm-1 col-xs-2";
    $scope.TableSliderClass = "col-lg-12 col-md-14 col-sm-16 col-xs-18";
    $scope.ButtonLeftAlign = "col-lg-4 col-md-6 col-sm-6 col-xs-8";
    $scope.DropDownClassExlg = "col-lg-7 col-md-7 col-sm-8 col-xs-9 control-label";
    $scope.SliderFieldClass = "col-lg-3 col-md-4 col-sm-6 col-xs-8 control-label";
    $scope.FriendlyNameClass = "col-lg-5 col-md-5 col-sm-7 col-xs-7";
  };

  commonUtils.getTableElementClass = function(elemcnt) {
    var emwd = Math.ceil(12 / elemcnt);
    var ret = "col-lg-" + emwd + " col-md-" + emwd + " col-sm-" + emwd + " col-xs-" + emwd;
    return ret;
  };


  commonUtils.getFRIENDLY_NAME = function() {
    return FRIENDLY_NAME;
  };

  commonUtils.getSIM = function() {
    return SIM;
  };
  commonUtils.getNUM = function() {
    return NUM;
  };
  commonUtils.getALPHA = function() {
    return ALPHA;
  };
  commonUtils.getPATH_SIM = function() {
    return PATH_SIM;
  };

  commonUtils.getFILE_SIM = function() {
    return FILE_SIM;
  };

  commonUtils.getSPACE = function() {
    return SPACE;
  };

  commonUtils.getSIM2 = function() {
    return SIM2;
  };

  commonUtils.getQUOTATION = function() {
    return QUOTATION;
  };

  commonUtils.getDIRECTORY = function() {
    return Directory;
  };
  commonUtils.getFOLDER = function() {
    return Folder;
  };

  commonUtils.getBrowserDetect = function() {
    var BrowserDetectRes = {};
    BrowserDetectRes.isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
    BrowserDetectRes.isFirefox = typeof InstallTrigger !== 'undefined';
    // At least Safari 3+: "[object HTMLElementConstructor]"
    BrowserDetectRes.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // Internet Explorer 6-11
    BrowserDetectRes.isIE = /*@cc_on!@*/ false || !!document.documentMode;
    // Edge 20+
    BrowserDetectRes.isEdge = !BrowserDetectRes.isIE && !!window.StyleMedia;
    // Chrome 1+
    BrowserDetectRes.isChrome = !!window.chrome && !!window.chrome.webstore;
    // Blink engine detection
    BrowserDetectRes.isBlink = (BrowserDetectRes.isChrome || BrowserDetectRes.isOpera) && !!window.CSS;

    return BrowserDetectRes;
  };

  commonUtils.TypeCheck = function(s, spc) {
    var i;
    var check = 0;
    var ls = 0;

    for (i = 0; i < s.length; i++) {
      if (ls = spc.indexOf(s.substring(i, i + 1)) >= 0) {

        check = 1;
      } else {
        check = 0;
        break;
      }
    }

    if (check === 1) return true;
    else return false;
  };

  commonUtils.CheckAddrKorean = function(str) {
    var korean = false;
    for (var i = 0; i < str.length; i++) {
      if (((str.charCodeAt(i) > 0x3130 && str.charCodeAt(i) < 0x318F) || (str.charCodeAt(i) >= 0xAC00 && str.charCodeAt(i) <= 0xD7A3))) {
        korean = true;
        break;
      }

    }

    return korean;
  };

  commonUtils.CheckSpace = function(str) {
    if (str.search(/\s/) != -1) {
      return true;
    } else {
      return false;
    }
  };


  commonUtils.getIntegerValue = function(data) {
    var ret = data;

    if (typeof data === 'string') {
      ret = parseInt(data, 10);
    }

    return ret;
  };

  commonUtils.onLogout = function() {
    EventStatusService.stopMonotoringEvents();
    SessionOfUserManager.unSetLogin();
    Attributes.reset();
    var isIE = /*@cc_on!@*/ false || !!document.documentMode;
    if (isIE === true) {
      window.open('about:blank', '_self').close();
      window.location.reload(true);
    } else {
      window.open("about:blank", "_self");
      window.close();
    }
  };

  commonUtils.ApplyConfirmation = function(Callback, ModalSize, errorCallback) {
    var modalSize = 'sm';

    if (ModalSize === 'md' || ModalSize === 'lg') {
      modalSize = ModalSize;
    }

    var modalInstance = $uibModal.open({
      templateUrl: 'views/setup/common/confirmMessage.html',
      controller: 'confirmMessageCtrl',
      windowClass: 'modal-position-middle',
      size: modalSize,
      resolve: {
        Message: function() {
          return 'lang_apply_question';
        }
      }
    });

    modalInstance.result.then(Callback, function(){
      if(typeof errorCallback !== "undefined"){
        errorCallback();
      }
    });
  };

  commonUtils.confirmChangeingChannel = function() {
    var msgMoveToAnother = $translate.instant('lang_msg_save_and_move_to_another');
    var msg = msgMoveToAnother.replace("%1", "CH");

    var modalInstance = $uibModal.open({
      templateUrl: 'views/setup/common/confirmMessage.html',
      controller: 'confirmMessageCtrl',
      windowClass: 'modal-position-middle',
      size: 'sm',
      resolve: {
        Message: function() {
          return msg;
        }
      }
    });

    return modalInstance.result;
  };

  commonUtils.ShowError = function(ErrorMessage, ModalSize, callback) {
    var modalSize = 'sm';

    if (ModalSize === 'md' || ModalSize === 'lg') {
      modalSize = ModalSize;
    }

    var modalInstance = $uibModal.open({
      templateUrl: 'views/setup/common/errorMessage.html',
      controller: 'errorMessageCtrl',
      windowClass: 'modal-position-middle',
      size: modalSize,
      resolve: {
        Message: function() {
          return ErrorMessage;
        },
        Header: function() {
          return 'lang_error';
        }
      }
    });

    if (callback !== undefined) {
      modalInstance.result.then(callback, function() {});
    }
  };

  commonUtils.ShowInfo = function(Msg, callback) {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/setup/common/errorMessage.html',
      controller: 'errorMessageCtrl',
      windowClass: 'modal-position-middle',
      size: 'sm',
      resolve: {
        Message: function() {

          return Msg;
        },
        Header: function() {
          return 'lang_info';
        }
      }
    });

    if (callback !== undefined) {
      modalInstance.result.then(callback, function() {});
    }
  };

  commonUtils.ShowDeatilInfo = function(Msg, callback, ModalSize) {
    var modalSize = 'sm';

    if (ModalSize === 'md' || ModalSize === 'lg') {
      modalSize = ModalSize;
    }
    var modalInstance = $uibModal.open({
      templateUrl: 'views/setup/common/detailInfoMessage.html',
      controller: 'detailMessageCtrl',
      windowClass: 'modal-position-middle',
      size: modalSize,
      resolve: {
        Message: function() {

          return Msg;
        },
        Header: function() {
          return 'lang_information';
        }
      }
    });

    if (callback !== undefined) {
      modalInstance.result.then(callback, function() {});
    }
  };

  commonUtils.ShowConfirmation = function(callback, Msg, size, errorCallback) {
    var actualSize = 'sm';
    if (size !== undefined) {
      actualSize = size;
    }

    var modalInstance = $uibModal.open({
      templateUrl: 'views/setup/common/confirmMessage.html',
      controller: 'confirmMessageCtrl',
      windowClass: 'modal-position-middle',
      size: actualSize,
      resolve: {
        Message: function() {
          return Msg;
        }
      }
    });
    if (callback !== undefined) {
      modalInstance.result.then(callback, errorCallback);
    }
  };

  commonUtils.isValidSchedule = function(cDay, cHour, fromToString) {
    var str = fromToString.split('-');

    var fTime = parseInt(str[0].split(' ')[1].split(':')[0]);
    var tTime = parseInt(str[1].split(' ')[1].split(':')[0]);

    var WeekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    var cDayIndex = WeekDays.indexOf(cDay);
    var fDayIndex = WeekDays.indexOf(str[0].split(' ')[0]);
    var tDayIndex = WeekDays.indexOf(str[1].split(' ')[0]);

    if (fDayIndex === tDayIndex) {
      if (cDayIndex === fDayIndex) {
        if (cHour >= fTime && cHour < tTime) {
          return true;
        }
      }
    } else if (fDayIndex < tDayIndex) {
      if (cDayIndex === fDayIndex || cDayIndex < tDayIndex) {
        if (cHour < 24) {
          return true;
        }
      } else if (cDayIndex === tDayIndex) {
        if (cHour < tTime) {
          return true;
        }
      }
    } else if (fDayIndex > tDayIndex) {
      if (cDayIndex === tDayIndex || cDayIndex < fDayIndex) {
        if (cHour < 24) {
          return true;
        }
      } else if (cDayIndex === fDayIndex) {
        if (cHour < tTime) {
          return true;
        }
      }
    }

    return false;
  };

  //Returns device language
  commonUtils.getCurrentLanguage = function() {
    var lang = '';
    SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view', '',
      function(response) {
        lang = response.data.Language;
      },
      function(errorData) {
        console.log(errorData);
      });
    return lang;
  };

  //Returns Datetime in YYYYMMDDHHMMSS
  commonUtils.getCurrentDatetime = function() {
    var date = new Date();

    var year = this.getFormatedInteger(date.getFullYear(), 4).toString();
    var month = this.getFormatedInteger(date.getMonth() + 1, 2).toString();
    var day = this.getFormatedInteger(date.getDate(), 2).toString();
    var hour = this.getFormatedInteger(date.getHours(), 2).toString();
    var minute = this.getFormatedInteger(date.getMinutes(), 2).toString();
    var second = this.getFormatedInteger(date.getSeconds(), 2).toString();

    return year + month + day + hour + minute + second;
  };

  commonUtils.filterArrayByObject = function(data, filter) {
    var filteredArray = [];

    $.each(data, function(i, value) {
      if (data[i].Type === filter) {
        filteredArray.push(data[i]);
      }
    });

    return filteredArray;
  };

  //Usage : Array.sort(COMMONUtils.sortArray('ObjectNameInArray', true, function(a){return a.toUpperCase();}));
  commonUtils.sortArray = function(field, ascendingOrder, primer) {
    var key = primer ? function(x) {
      return primer(x[field]);
    } : function(x) {
      return x[field];
    };

    ascendingOrder = !ascendingOrder ? 1 : -1;

    return function(a, b) {
      return a = key(a), b = key(b), ascendingOrder * ((a > b) - (b > a));
    };
  };

  commonUtils.chunkArray = function(iArray, chunkSize) {
    var chunkedArr = [];

    for (var i = 0; i < iArray.length; i += chunkSize) {
      chunkedArr.push(iArray.slice(i, i + chunkSize));
    }

    return chunkedArr;
  };

  /*
   This function adds 0 padding to integer and return a string
   Ex: leftpad(1, 4)  -> 0001
   */
  commonUtils.getFormatedInteger = function(num, length) {
    var intNum = parseInt(num, 10);

    return (intNum / Math.pow(10, length)).toFixed(length).substr(2);
  };

  commonUtils.getDrawDots = function(option, num) {
    var json = {};
    json.drawDots = 'lang_msg_make_draw_dots';
    if (json[option] !== undefined) {
      return $translate.instant(json[option]).replace('%1', num);
    }
  };

  commonUtils.getTranslatedOption = function(Option) {
    var json = {};

    json.On = 'lang_on';
    json.Off = 'lang_off';
    json.Enable = 'lang_enable';
    json.Disable = 'lang_disable';
    json.NormallyOpen = 'lang_normal_open';
    json.NormallyClose = 'lang_normal_close';
    json.Always = 'lang_always';
    json.Scheduled = 'lang_only_schedule';
    json.NetworkEvent = 'lang_netdiscon';
    json.FaceDetection = 'lang_fd';
    json.TamperingDetection = 'lang_tampering';
    json.AudioDetection = 'lang_ad';
    json.Timer = 'lang_menu_timeschedule';
    json.OpenSDK = 'lang_appevent';
    json.VeryLow = 'lang_very_low';
    json.Low = 'lang_low';
    json.MediumOrig = 'lang_medium';
    json.Medium = 'lang_medium';
    json.Middle = 'lang_middle';
    json.High = 'lang_high';
    json.Small = 'lang_small';
    json.Large = 'lang_large';
    json.VeryHigh = 'lang_very_high';
    json.MotionDetection = 'lang_md';
    json.IntelligentVideo = 'lang_videoAnalytics';
    json.FogDetection = 'lang_menu_fogdetection';
    json.AudioAnalysis = 'lang_menu_soundclassification';
    json.VideoAnalysis = 'lang_menu_iva';
    if (mAttr.MotionDetectModes !== undefined) {
      json.MDAndIV = (mAttr.VideoAnalyticsSupport === true) ? 'lang_md_va' : 'lang_md';
      json.MD_VA_short = (mAttr.VideoAnalyticsSupport === true) ? 'lang_menu_videoanalytics' : 'lang_md';
    }
    json.Seconds = 'lang_seconds';
    json.Minutes = 'lang_min';
    json.Passing = 'lang_passing';
    json.EnterExit = 'lang_entering_exiting';
    json.AppearDisapper = 'lang_appearing_disappearing';
    json.Sensitivity = 'lang_sensitivity';
    json.Size = 'lang_size';
    json.Area = 'lang_area';
    json.IncludeArea = 'lang_include_area'
    json.ExcludeArea = 'lang_nondetectionArea';
    json.Analytics = 'lang_analytics';
    json.Network = 'lang_left_network';
    json.Manual = 'lang_manual';
    json.Default = 'lang_default';
    json.Auto = 'lang_auto';
    json.Full = 'lang_memoryFull';
    json.FullFrame = 'lang_fullFrame';
    json.Connecting = 'lang_msg_test_connecting';
    json.Fail = 'lang_msg_fail';
    json.Success = 'lang_msg_success';
    json.None = 'lang_none';
    json.Normal = 'lang_normal';
    json.Ready = 'lang_ready';
    json.Error = 'lang_error';
    json.Recording = 'lang_recording';
    json.Formatting = 'lang_formatting';
    json.Lock = 'lang_lock';
    json.Apply = 'lang_apply';
    json.LineIn = 'lang_line';
    json.ExternalMIC = 'lang_exlang_mic';
    json.MIC = 'lang_microphone';
    json.All = 'lang_resetAll';
    json.Default = 'lang_default';
    json.SDFormatMsg = 'lang_msg_start_format';
    json.NASFormatMsg = 'lang_msg_nas_format';
    json.Pulse = 'lang_pulse';
    json.ActiveInactive = 'lang_active_inactive';
    json.Gray = 'lang_gray';
    json.Green = 'lang_green';
    json.Red = 'lang_red';
    json.Blue = 'lang_blue';
    json.Black = 'lang_black';
    json.White = 'lang_white';
    json.Cyan = 'lang_cyan';
    json.Magenta = 'lang_magenta';
    json.NotAvailable = 'lang_nolang_available';
    json.Mode = 'lang_mode';
    json.Preset = 'lang_preset';
    json.Global = 'lang_global';
    json.Time = 'lang_time';
    json.Close = 'lang_close';
    json.Day = 'lang_dayDisplay';
    json.IPAddress = 'lang_IPAddress';
    json.Port = 'lang_menu_port';
    json.DefocusDetection = 'lang_defocus_detection';
    json.TransparencyOff = 'lang_solid';
    json.Solid = 'lang_solid';

    //PTZ Setup
    json.AutoRun = 'lang_autoRun';
    json.Tracking = 'lang_tracking';
    json.VideoAnalytics = 'lang_videoAnalytics';
    json.Swing = 'lang_swing';
    json.Group = 'lang_group';
    json.Tour = 'lang_tour';
    json.Trace = 'lang_trace';
    json.Pan = 'lang_pan';
    json.Tilt = 'lang_tilt';
    json.PanTilt = 'lang_pantilt';
    json.Home = 'lang_home';
    json.AutoPan = 'lang_autoPan';
    json.SwingMode = 'lang_swingMode';
    json.Number = 'lang_number';
    json.Speed = 'lang_speed';
    json.TiltAngle = 'lang_tiltAngle';
    json.PanLimit = 'lang_panLimit';
    json.TiltLimit = 'lang_tiltLimit';
    json.Unlimited = 'lang_unlimited';
    json.LostEnd = 'lang_lostend';
    json.Camera = 'lang_Camera';

    //Camera Setup
    json.UserPreset = 'lang_userPreset';
    json.DefinitionFocus = 'lang_defineFocus';
    json.MotionFocus = 'lang_motionFocus';
    json.ReducedNoise = 'lang_reduceNoise';
    json.BrightVideo = 'lang_brightVideo';
    json.VividVideo = 'lang_vivid_video';
    json.Sensor = 'lang_sensor';
    json.WhiteBalance = 'lang_whitebalance';
    json.BackLight = 'lang_backlight';
    json.Exposure = 'lang_exposure';
    json.DayNight = 'lang_daynight';
    json.Special = 'lang_special';
    json.Overlay = 'lang_osd';
    json.wiseNR = 'lang_wiseNR';
    json.NightOnly = 'lang_night_only';
    json.AllDay = 'lang_all_day';
    json.Heater = 'lang_heater';
    json['Heater/Fan'] = 'lang_heater_fan';
    json['Fan'] = 'lang_fan';

    //SSDR
    json.Narrow = 'lang_narrow';
    json.Wide = 'lang_wide';

    //White Balance
    json.ATW = 'lang_atw';
    json.Outdoor = 'lang_outdoor';
    json.Indoor = 'lang_indoor';
    json.AWC = 'lang_awc';
    json.Mercury = 'MERCURY';
    json.Sodium = 'SODIUM';

    //Exposure
    json['P-Iris'] = 'lang_piris';
    json['P-Iris-SLAM3180PN'] = 'lang_pirisM3180PN';
    json['P-Iris-M13VP288IR'] = 'lang_pirisM13VP288IR';
    json['P-Iris-SLAM2890PN'] = 'lang_pirisM2890PN';

    //DayNight
    json.Color = 'lang_color';
    json.BW = 'lang_bw';
    json.Schedule = 'lang_schedule';
    json.Timed = 'lang_timed';
    json.ExternalBW = 'lang_extern';
    json.VeryFast = 'lang_veryfast';
    json.Fast = 'lang_fast';
    json.Slow = 'lang_slow';
    json.VerySlow = 'lang_veryslow';
    json.SwitchToBWIfOpens = 'lang_openbwclosecolor';
    json.SwitchToBWIfCloses = 'lang_opencolorclosebw';
    json.EveryDay = 'lang_everyday';
    json.SUN = 'lang_sun';
    json.MON = 'lang_mon';
    json.TUE = 'lang_tue';
    json.WED = 'lang_wed';
    json.THU = 'lang_thu';
    json.FRI = 'lang_fri';
    json.SAT = 'lang_sat';

    //Focus
    json.Focus = 'lang_focus';
    json.OneShotAutoFocus = 'lang_oneShotAf';
    json.AutoTracking = 'lang_autoTracking';
    json.Tracking = 'lang_tracking';

    //Open SDK
    json.Uninstalling = 'lang_uninstalling';
    json.Installing = 'lang_installing';
    json.Running = 'lang_running';
    json.Stopped = 'lang_stopped';
    json.StartedNotRunning = 'lang_startedNotRunning';
    json.Installed = 'lang_installed';

    json.ExcludeNetwork = 'lang_resetExceptNetwork';
    json.ExcludeNetworkOpenSDK = 'lang_resetExceptNetwork_SDK';
    json.ExcludeNetworkOpenPlatform = 'lang_resetExceptNetwork_OpenPlatform';

    json.Ceiling = 'lang_ceiling';
    json.Wall = 'lang_wall';
    json.QuadView = 'lang_quadView';
    json.DoublePanorama = 'lang_doublePanorama';
    json.Panorama = 'lang_singlePanorama';

    if (json[Option] !== undefined) {
      return $translate.instant(json[Option]);
    } else if (Option === true) {
      return $translate.instant('lang_on');
    } else if (Option === false) {
      return $translate.instant('lang_off');
    } else if (Option === "Network1") {
      return $translate.instant("lang_left_network") + 1;
    } else if (Option === "Network2") {
      return $translate.instant("lang_left_network") + 2;
    } else if (Option === "Network3") {
      return $translate.instant("lang_left_network") + 3;
    } else if (Option === "Network4") {
      return $translate.instant("lang_left_network") + 4;
    } else if (Option === 'AccessLog') {
      return $translate.instant("lang_access_log");
    } else if (Option === 'SystemLog') {
      return $translate.instant("lang_left_system") + " " + $translate.instant("lang_menu_small_log");
    } else if (Option === 'EventLog') {
      return $translate.instant("lang_left_event") + " " + $translate.instant("lang_menu_small_log");
    } else if (Option === 'I-Frame') {
      return $translate.instant("lang_iFrame");
    } else if (Option === 'MotionFocus+ReducedNoise') {
      return $translate.instant("lang_motionFocus") + " " + $translate.instant("lang_ampersand") + " " + $translate.instant("lang_reduceNoise");
    } else if (Option === 'MotionFocus+BrightVideo') {
      return $translate.instant("lang_motionFocus") + " " + $translate.instant("lang_ampersand") + " " + $translate.instant("lang_brightVideo");
    } else if (Option === "Auto1") {
      return $translate.instant("lang_auto") + " " + 1;
    } else if (Option === "Auto2") {
      return $translate.instant("lang_auto") + " " + 2;
    } else if (Option === "TransparencyLow") {
      return $translate.instant("lang_low");
    } else if (Option === "TransparencyMedium") {
      return $translate.instant("lang_middle");
    } else if (Option === "TransparencyHigh") {
      return $translate.instant("lang_high");
    } else if (Option === "360Panorama") {
      //return "360 Panorama";
      return $translate.instant('lang_singlePanorama');
    } else if (Option === "Mosaic1") {
      return $translate.instant("lang_mosaic") + " " + 1;
    } else if (Option === "Mosaic2") {
      return $translate.instant("lang_mosaic") + " " + 2;
    } else if (Option === "Mosaic3") {
      return $translate.instant("lang_mosaic") + " " + 3;
    } else if (Option === "Mosaic4") {
      return $translate.instant("lang_mosaic") + " " + 4;
    } else {
      if (typeof(Option) === 'string') {
        if (Option.indexOf(':') !== -1) {
          return $translate.instant(Option);
        } else if (Option.indexOf('AlarmInput') !== -1) {
          return $translate.instant('lang_alarm');
        } else if (Option.indexOf('-Lowest') !== -1) {
          var str = Option.split('-');

          if (str.length === 2) {
            return str[0] + '(' + $translate.instant('lang_very_low') + ')';
          }
        } else if (Option.indexOf('-Highest') !== -1) {
          var str = Option.split('-');

          if (str.length === 2) {
            return str[0] + '(' + $translate.instant('lang_very_high') + ')';
          }
        } else //Alarm Durations [5s,10s..]
        {
          var str = Option.split('s');

          if (str.length === 2) {
            if (str[1] === 'full') {
              return str[0] + ' ' + $translate.instant('lang_seconds');
            } else {
              return str[0] + ' ' + $translate.instant('lang_sec');
            }
          }

          var str = Option.split('m');

          if (str.length === 2) {
            return str[0] + ' ' + $translate.instant('lang_min');
          }
        }
      }
    }

    return $translate.instant(Option); // Integer values
  };

  commonUtils.getHourIds = function(dayIndex, hrArray) {
    var ids = [];

    for (var h = 0; h < mAttr.MaxHours; h++) {
      if (hrArray[h] !== '0') {
        var str = hrArray[h].split('-');
        if (str.length === 1) {
          ids.push(mAttr.WeekDays[dayIndex] + '.' + h);
        } else if (str.length === 2) {
          if (str[0].indexOf('(') !== -1) {
            str[0] = str[0].substring(1, 3);
          }
          if (str[1].indexOf(')') !== -1) {
            str[1] = str[1].substring(0, 2);
          }
          //ids.push(mAttr.WeekDays[dayIndex] + '.' + h);
          ids.push(mAttr.WeekDays[dayIndex] + '.' + h + '.' + Math.round(str[0]) + '.' + Math.round(str[1]));
        }
      }
    }

    return ids;
  };

  commonUtils.getSchedulerIds = function(schedule) {
    var ids = [];

    ids.push.apply(ids, this.getHourIds(0, schedule.SUN));
    ids.push.apply(ids, this.getHourIds(1, schedule.MON));
    ids.push.apply(ids, this.getHourIds(2, schedule.TUE));
    ids.push.apply(ids, this.getHourIds(3, schedule.WED));
    ids.push.apply(ids, this.getHourIds(4, schedule.THU));
    ids.push.apply(ids, this.getHourIds(5, schedule.FRI));
    ids.push.apply(ids, this.getHourIds(6, schedule.SAT));

    return ids;
  };

  commonUtils.getSupportedEventActions = function(sourceName) {
    var eventActions = [];

    for (var i = 0; i < mAttr.EventSourceOptions.length; i++) {
      if (sourceName === mAttr.EventSourceOptions[i].EventSource) {
        eventActions = mAttr.EventSourceOptions[i].EventAction;
        break;
      }
    }

    return eventActions;
  };

  commonUtils.getArray = function(num, startFrom1) {
    var arr = [];

    for (var i = 0; i < num; i++) {
      if (startFrom1 === true) {
        arr.push(i + 1);
      } else {
        arr.push(i);
      }

    }

    return arr;
  };

  commonUtils.getDescendingArray = function(num) {
    var arr = [],
      i = 0;

    for (i = num; i > 0; i--) {
      arr.push(i);
    }

    return arr;
  };


  commonUtils.isValidSetData = function(setData) {
    var k;
    var changed = false;

    $.each(setData, function(k, value) {
      changed = true;
    });

    return changed;
  };

  commonUtils.fillSetData = function(setData, newVal, oldVal, ignoredKeys, copyAll) {
    var k;
    var changed = false;


    $.each(newVal, function(k, value) {

      if (ignoredKeys !== undefined && ignoredKeys !== '') {

        if (ignoredKeys.indexOf(k) !== -1) {
          return;
        }
      }

      if (newVal[k] !== '' && newVal[k] !== undefined) {

        if (oldVal[k] !== newVal[k] || copyAll === true) {

          changed = true;
          if (newVal[k] === 'true') {
            setData[k] = newVal[k] = true;
          } else if (newVal[k] === 'false') {
            setData[k] = newVal[k] = false;
          } else {
            setData[k] = newVal[k];
          }
        }
      }
    });

    return changed;
  };

  commonUtils.updatePageData = function(newVal, oldVal, ignoredKeys) {
    var k;

    for (k in newVal) {
      if (newVal.hasOwnProperty(k)) {

        if (ignoredKeys !== undefined && ignoredKeys !== '') {
          if (ignoredKeys.indexOf(k) !== -1) {
            continue;
          }
        }

        if (newVal[k] !== '' && newVal[k] !== undefined) {
          oldVal[k] = newVal[k];
        }
      }
    }
  };

  commonUtils.getArrayWithMinMax = function(min, max) {
    var arr = [];

    for (var i = min; i <= max; i++) {
      arr.push(i);
    }

    return arr;
  };

  commonUtils.CheckNumCharSym = function(value) {
    for (var i = 0; i < value.length; i++) {
      var ch = value.charAt(i);
      var check = 0;
      if (ch >= 'a' && ch <= 'z') {
        check++;
      } else if (ch >= 'A' && ch <= 'Z') {
        check++;
      } else if (ch >= '0' && ch <= '9') {
        check++;
      } else if (ch === '~' || ch === '`' || ch === '!' || ch === '@' || ch === '#' || ch === '$' || ch === '%' || ch === '^' || ch === '*' ||
        ch === '(' || ch === ')' || ch === '_' || ch === '-' || ch === '+' || ch === '=' || ch === '|' ||
        ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === '.' || ch === '?' || ch === '/') {
        check++;
      }
      if (check === 0)
        return false;
    }

    return true;
  };

  commonUtils.CheckSpace = function(str) {
    if (str.search(/\s/) != -1) {
      return true;
    } else {
      return false;
    }
  };

  commonUtils.CheckValidHostName = function(address) {
    return /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/.test(address);
  };

  commonUtils.CheckValidIPv6Address = function(ip) {
    var digits = "0123456789abcdef";
    var check_digit = false;
    var val = 0;
    var colonp = -1;
    var i = 0;
    var j = 0;
    var len;
    var letter1;
    var curtok;
    var ch;
    var V6_INADDRSZ = 16;

    if ((letter1 = ip.charAt(i)) == ':') {
      if ((letter1 = ip.charAt(i++)) != ':') return false;
    }

    curtok = i;

    while (i < ip.length) {
      ch = ip.charAt(i).toLowerCase();
      i++;
      if ((len = digits.indexOf(ch)) != -1) {
        val <<= 4;
        val |= len;
        if (val > 0xffff) return false;
        check_digit = true;
        continue;
      }

      if (ch == '%') break;

      if (ch == ':') {
        curtok = i;
        if (!check_digit) {
          if (colonp != -1) return false;
          colonp = j;
          continue;
        } else if (i == ip.length) return false;

        if ((j + 2) > V6_INADDRSZ) return false;
        j += 2;
        val = 0;
        check_digit = false;
        continue;
      }

      if (ch == '.' && ((j + 4) <= V6_INADDRSZ)) {
        // TODO: IPv4 mapped IPv6 address is not supported
        if (!commonUtils.CheckValidIPv4Address(ip.substring(curtok))) return false;
        j += 4;
        check_digit = false;
        break;
      }
      return false;
    }

    if (check_digit) {
      if ((j + 2) > V6_INADDRSZ) return false;
      j += 2;
    }

    if (colonp != -1) {
      if (j == V6_INADDRSZ) return false;
      j = V6_INADDRSZ;
    }

    if (j != V6_INADDRSZ) return false;

    return true;
  };

  commonUtils.CheckValidIPv4Address = function(addr) {
    if (addr == '') return false;

    var ipArray;

    if (addr.search(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) != -1) {
      ipArray = addr.split(/\./);
    }

    if (ipArray == null) return false;

    var ip_num = ((ipArray[0] & 0xFF) << 24) + ((ipArray[1] & 0xFF) << 16) + ((ipArray[2] & 0xFF) << 8) + ((ipArray[3] & 0xFF) << 0);
    var thisSegment = ipArray[0];

    if (thisSegment < 1 || thisSegment > 223) return false;
    for (var i = 1; i < 4; i++) {
      thisSegment = ipArray[i];
      if (thisSegment > 255) return false;
    }

    for (var i = 0; i < 4; i++) {
      if (ipArray[i].length > 1) {
        if (ipArray[i].charAt(0) == '0')
          return false;
      }
    }
    return true;
  }

  commonUtils.CheckValidIPv4Subnet = function(addr) {
    if (addr == '') return false;

    var smArray;
    if (addr.search(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) != -1) {
      smArray = addr.split(/\./);
    }

    if (smArray == null) return false;

    var sm_num = ((smArray[0] & 0xFF) << 24) + ((smArray[1] & 0xFF) << 16) + ((smArray[2] & 0xFF) << 8) + ((smArray[3] & 0xFF) << 0);
    var thisSegment;
    for (var i = 0; i < 4; i++) {
      thisSegment = smArray[i];
      if (thisSegment > 255) return false;
      if (i === 3 && thisSegment > 253) return false;
    }

    for (i = 0; i < 32; i++) {
      var token = 1 << i;
      if ((sm_num & token) > 0) break;
    }

    for (i++; i < 32; i++) {
      var token = 1 << i;
      if ((sm_num & token) == 0) {
        return false;
      }
    }
    return true;
  }

  commonUtils.IPv4ToNum = function(addr) {
    var smArray;
    if (addr.search(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) != -1) {
      smArray = addr.split(/\./);
    }

    if (smArray == null) return 0;
    var sm_num = ((smArray[0] & 0xFF) << 24) + ((smArray[1] & 0xFF) << 16) + ((smArray[2] & 0xFF) << 8) + ((smArray[3] & 0xFF) << 0);
    return sm_num;
  }

  commonUtils.IPv4ToNumNot = function(addr) {
    var smArray;
    if (addr.search(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) != -1) {
      smArray = addr.split(/\./);
    }

    if (smArray == null) return 0;
    var sm_num = (((~smArray[0]) & 0xFF) << 24) + (((~smArray[1]) & 0xFF) << 16) + (((~smArray[2]) & 0xFF) << 8) + (((~smArray[3]) & 0xFF) << 0);
    return sm_num;
  }
  commonUtils.SafePassword = function(password, id) {
    var pattern_num = 0;
    var pattern_upper_alpha = 0;
    var pattern_lower_alpha = 0;
    var pattern_simbol = 0;
    var check = 0;

    var passwordlength = password.length;
    if (passwordlength < 8)
      return 1;
    if (password == id) {
      return 2;
    }

    for (var index = 0; index < passwordlength; index = index + 1) {
      var ch = password[index];

      if (ch >= 'a' && ch <= 'z') {
        pattern_lower_alpha++;
      } else if (ch >= 'A' && ch <= 'Z') {
        pattern_upper_alpha++;
      } else if (ch >= '0' && ch <= '9') {
        pattern_num++;
      } else if (ch == '~' || ch == '`' || ch == '!' || ch == '@' || ch == '#' || ch == '$' || ch == '%' || ch == '^' || ch == '*' ||
        ch == '(' || ch == ')' || ch == '_' || ch == '-' || ch == '+' || ch == '=' || ch == '|' ||
        ch == '{' || ch == '}' || ch == '[' || ch == ']' || ch == '.' || ch == '?' || ch == '/') {
        pattern_simbol++;
      }
    }

    if (pattern_lower_alpha != 0) check++;
    if (pattern_upper_alpha != 0) check++;
    if (pattern_num != 0) check++;
    if (pattern_simbol != 0) check++;

    if (passwordlength < 10) {
      if (check < 3) return 3;
    } else {
      if (check < 2) return 4;
    }

    return 0;
  }

  commonUtils.isSafePassword = function(passwd, id) {
    if (passwd.length < minLen) {
      return 1;
    }

    if (passwd === id) {
      return 2;
    }

    function strncmp(str1, str2, lgth) {

      var s1 = (str1 + '')
        .substr(0, lgth);
      var s2 = (str2 + '')
        .substr(0, lgth);

      return ((s1 === s2) ? 0 : ((s1 > s2) ? 1 : -1));
    }


    function isValidRule1(passwd) {

      var acceptCount = 0;

      if (passwd.match(mAttr.OnlyNumber))
        acceptCount++;
      if (passwd.match(mAttr.UpperAlpha))
        acceptCount++;
      if (passwd.match(mAttr.LowerAlpha))
        acceptCount++;
      if (passwd.match(mAttr.AlphaNumericWithSpace))
        acceptCount++;

      if (passwd.length < 10) {
        if (acceptCount < 3)
          return 3;
      } else {
        if (acceptCount < 2)
          return 4;
      }
      return 0;
    }

    function isValidRule2(value, cnt) {
      var result = 0;
      var checkStr = "";
      var checkAsc = "";
      var checkDesc = "";

      for (var z = 1; z < cnt; z++) {
        checkStr += "value.charAt(i) == value.charAt(i + " + z + ")";
        checkAsc += "(value.charCodeAt(i) + " + z + ") == value.charCodeAt(i + " + z + ")";
        checkDesc += "(value.charCodeAt(i) - " + z + ") == value.charCodeAt(i + " + z + ")";

        if (z < cnt - 1) {
          checkStr += " && ";
          checkAsc += " && ";
          checkDesc += " && ";
        }
      }
      for (var i = 0; i < value.length - 2; i++) {
        if (eval(checkStr) || eval(checkAsc) || eval(checkDesc)) {
          result = 5;
        }
      }

      return result;
    }

    var ret = isValidRule1(passwd);

    if (0 === ret) {
      return isValidRule2(passwd, 4);
    }

    return ret;
  };

  function isSafePassword_S1(passwd, id) {
    if (passwd.length < minLen) {
      return 1;
    }

    if (passwd == id) {
      return 2;
    }

    function isValidRule1(passwd) {

      var acceptCount = 0;

      if (passwd.match(mAttr.OnlyNumber)) acceptCount++;
      if (passwd.match(mAttr.UpperAlpha)) acceptCount++;
      if (passwd.match(mAttr.LowerAlpha)) acceptCount++;
      if (passwd.match(mAttr.AlphaNumeric)) acceptCount++;

      if (passwd.length < 10) {
        if (acceptCount < 3) return 3;
      } else {
        if (acceptCount < 2) return 4;
      }
      return 0;
    }

    //연속적인 문자, 숫자체크
    function isValidRule2(value, cnt) {
      var result = 0;
      var checkStr = "";
      var checkAsc = "";
      var checkDesc = "";
      var acceptCount1 = 0;

      //같은문자,숫자
      if (value.match(mAttr.ConstantSymbol1)) acceptCount1++;
      if (value.match(mAttr.ConstantSymbol2)) acceptCount1++;
      if (acceptCount1 > 0) result = 5;

      for (var z = 1; z < cnt; z++) {
        checkStr += "value.charAt(i) == value.charAt(i + " + z + ")";
        checkAsc += "(value.charCodeAt(i) + " + z + ") == value.charCodeAt(i + " + z + ")";
        checkDesc += "(value.charCodeAt(i) - " + z + ") == value.charCodeAt(i + " + z + ")";

        if (z < cnt - 1) {
          checkStr += " && ";
          checkAsc += " && ";
          checkDesc += " && ";
        }
      }
      for (var i = 0; i < value.length - 2; i++) {
        if (eval(checkStr) || eval(checkAsc) || eval(checkDesc)) {
          result = 5;
        }
      }

      return result;
    }

    var ret = isValidRule1(passwd);

    if (0 == ret) {
      //연속적인 문자, 숫자체크
      return isValidRule2(passwd, 3);
      //return isValidRule2(passwd);
    }

    return ret;
  }



  var Dig2Dec = function(s) {
    var retV = 0;
    if (s.length == 4) {
      for (var i = 0; i < 4; i++) {
        retV += eval(s.charAt(i)) * Math.pow(2, 3 - i);
      }
      return retV;
    }
    return -1;
  }

  var Hex2Utf8 = function(s) {
    var retS = "";
    var tempS = "";
    var ss = "";
    if (s.length == 16) {
      tempS = "1110" + s.substring(0, 4);
      tempS += "10" + s.substring(4, 10);
      tempS += "10" + s.substring(10, 16);
      var sss = "0123456789ABCDEF";
      for (var i = 0; i < 3; i++) {
        retS += "%";
        ss = tempS.substring(i * 8, (eval(i) + 1) * 8);
        retS += sss.charAt(this.Dig2Dec(ss.substring(0, 4)));
        retS += sss.charAt(this.Dig2Dec(ss.substring(4, 8)));
      }
      return retS;
    }
    return "";
  }

  var Dec2Dig = function(n1) {
    var s = "";
    var n2 = 0;
    for (var i = 0; i < 4; i++) {
      n2 = Math.pow(2, 3 - i);
      if (n1 >= n2) {
        s += '1';
        n1 = n1 - n2;
      } else
        s += '0';
    }
    return s;
  }

  var Str2Hex = function(s) {
    var c = "";
    var n;
    var ss = "0123456789ABCDEF";
    var digS = "";
    for (var i = 0; i < s.length; i++) {
      c = s.charAt(i);
      n = ss.indexOf(c);
      digS += this.Dec2Dig(eval(n));
    }
    return digS;
  }

  commonUtils.GB2312ToUTF8 = function(s1) {
    var s = escape(s1);
    var sa = s.split("%");
    var retV = "";
    if (sa[0] != "") {
      retV = sa[0];
    }
    for (var i = 1; i < sa.length; i++) {
      if (sa[i].substring(0, 1) == "u") {
        //alert(this.Str2Hex(sa[i].substring(1,5)));
        retV += this.Hex2Utf8(this.Str2Hex(sa[i].substring(1, 5)));
        if (sa[i].length) {
          retV += sa[i].substring(5);
        }
      } else {
        retV += unescape("%" + sa[i]);
        if (sa[i].length) {
          retV += sa[i].substring(5);
        }
      }
    }
    return retV;
  }

  commonUtils.UTF8ToGB2312 = function(str1) {
    var substr = "";
    var a = "";
    var b = "";
    var c = "";
    var i = -1;
    i = str1.indexOf("%");
    if (i == -1) {
      return str1;
    }
    while (i != -1) {
      if (i < 3) {
        substr = substr + str1.substr(0, i - 1);
        str1 = str1.substr(i + 1, str1.length - i);
        a = str1.substr(0, 2);
        str1 = str1.substr(2, str1.length - 2);
        if (parseInt("0x" + a) & 0x80 == 0) {
          substr = substr + String.fromCharCode(parseInt("0x" + a));
        } else if (parseInt("0x" + a) & 0xE0 == 0xC0) { //two byte
          b = str1.substr(1, 2);
          str1 = str1.substr(3, str1.length - 3);
          var widechar = (parseInt("0x" + a) & 0x1F) << 6;
          widechar = widechar | (parseInt("0x" + b) & 0x3F);
          substr = substr + String.fromCharCode(widechar);
        } else {
          b = str1.substr(1, 2);
          str1 = str1.substr(3, str1.length - 3);
          c = str1.substr(1, 2);
          str1 = str1.substr(3, str1.length - 3);
          var widechar = (parseInt("0x" + a) & 0x0F) << 12;
          widechar = widechar | ((parseInt("0x" + b) & 0x3F) << 6);
          widechar = widechar | (parseInt("0x" + c) & 0x3F);
          substr = substr + String.fromCharCode(widechar);
        }
      } else {
        substr = substr + str1.substring(0, i);
        str1 = str1.substring(i);
      }
      i = str1.indexOf("%");
    }

    return substr + str1;
  }

  return commonUtils;

});