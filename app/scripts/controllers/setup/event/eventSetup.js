kindFramework.controller('eventSetupCtrl', function($scope, $location, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, ModalManagerService, UniversialManagerService) {
  "use strict";
  var mAttr = Attributes.get();
  var pageData = {};
  var BrowserDetect = COMMONUtils.getBrowserDetect();

  $scope.targetChannel = UniversialManagerService.getChannelId();;

  function getInfoTableData() {
    $scope.infoTableData = [];
    var getData = {};
    var dataArray;
    var resultArray = [];

    return SunapiClient.get('/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view', getData,
      function(response) {

        var eventActionList = response.data.ComplexActions;

        var data = {};

        console.log(eventActionList);

        for (var i = 0, len = eventActionList.length; i < len; i++) {

          var result = {};

          result.eventType = eventActionList[i].EventType;

          result.data = [];

          var actions = eventActionList[i].Actions;

          if (actions[0].Channel === undefined) {
            continue;
          }

          dataArray = new Array(actions.length);

          for (var k = 0; k < actions.length; k++) {
            var action = actions[k];
            dataArray[k] = {};
            dataArray[k].channel = action.Channel;
            dataArray[k].enable = action.Enable;
            dataArray[k].eventActions = action.EventActions;
            dataArray[k].alarmOutputDuration = action.AlarmOutputs[0].Duration;
          }

          result.data.push(dataArray);

          resultArray.push(result);
        }

        $scope.infoTableData = resultArray;
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function convertEventTypeToEventSource(eventType) {
    switch (eventType) {
      case 'Timer':
        return 'Timer';
      case 'NetworkDisconnect':
        return 'NetworkEvent';
      case 'AlarmInput.#':
        return 'AlarmInput.1';
      case 'Channel.#.MotionDetection':
        return 'MotionDetection';
      case 'Channel.#.FogDetection':
        return 'FogDetection';
      case 'Channel.#.DefocusDetection':
        return 'DefocusDetection';
      case 'Channel.#.TamperingDetection':
        return 'TamperingDetection';
      case 'Channel.#.FaceDetection':
        return 'FaceDetection';
      case 'Channel.#.VideoAnalysis':
        return 'VideoAnalysis';
    }
    return null
  }

  $scope.changeNaming = function(option) {
    if (option === 'MDAndIV') {
      return 'MD_VA_short';
    } else if (option === 'Tracking') {
      return 'AutoTracking';
    }
    return option;
  };

  $scope.isAutotracking = function(name) {
    if (name === 'Tracking') {
      return true;
    } else {
      return false;
    }
  };

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };
  $scope.isEventActionSupported = false;
  $scope.isMultiChannel = false;

  $scope.sourceSelected = function(source) {
    var path = null;
    switch (source) {
      case 'MotionDetection':
        path = '/setup/analytics_motionDetection/v2';
        break;
      case 'VideoAnalysis':
        path = '/setup/analytics_iva';
        break;
      case 'NetworkEvent':
        path = '/setup/event_nwDisconnection';
        break;
      case 'NetworkDisconnect':
        path = '/setup/event_nwDisconnection';
        break;
      case 'FaceDetection':
        path = '/setup/analytics_faceDetection';
        break;
      case 'TamperingDetection':
        path = '/setup/analytics_tamperDetection';
        break;
      case 'AudioDetection':
        path = '/setup/analytics_audioDetection';
        break;
      case 'Timer':
        path = '/setup/event_timeSchedule';
        break;
      case 'OpenSDK':
        path = '/setup/event_appEvent';
        break;
      case 'Tracking':
        path = '/setup/analytics_autoTrackEvent';
        break;
      case 'DefocusDetection':
        path = '/setup/analytics_defocusDetection';
        break;
      case 'FogDetection':
        path = '/setup/analytics_fogDetection';
        break;
      case 'AudioAnalysis':
        path = '/setup/analytics_soundClassification';
        break;
      default:
        var str = source.split('.');
        Attributes.setDefaultAlarmIndex(str[1] - 1);
        path = '/setup/event_alarminput';
        break;
    }
    $location.path(path);
  };

  function getAttributes() {
    var eventActions = null;
    if (mAttr.MaxChannel > 1) {
      $scope.isMultiChannel = true;
    }
    $scope.MaxAlarmInput = mAttr.MaxAlarmInput;
    $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
    if (mAttr.EventSources !== undefined) {
      $scope.EventSources = mAttr.EventSources;
    }
    if (mAttr.EventActions !== undefined) {
      eventActions = mAttr.EventActions;
    }
    $scope.isEventActionSupported = mAttr.EventActionSupport;
    $scope.ftpActionSupported = (eventActions.indexOf('FTP') !== -1);
    $scope.smtpActionSupported = (eventActions.indexOf('SMTP') !== -1);
    $scope.recordActionSupported = (eventActions.indexOf('Record') !== -1);
    $scope.presetActionSupported = (eventActions.indexOf('GoToPreset') !== -1);
    if (mAttr.AlarmoutDurationOptions !== undefined) {
      $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
    }
    if (Attributes.isSupportGoToPreset() === true) {
      $scope.PresetOptions = Attributes.getPresetOptions();
    }
    $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
    $scope.alarmActionSupported = [];
    for (var i = 0; i < mAttr.MaxAlarmOutput; i++) {
      $scope.alarmActionSupported[i] = eventActions.indexOf('AlarmOutput.' + (i + 1)) !== -1;
    }
  }

  // get Common events by eventrules.cgi
  function prepareEventRules(eventRules) {
    $scope.EventRules = [];
    for (var i = 0, len = eventRules.length; i < len; i++) {
      var mRule = {};
      var eventSource = eventRules[i].EventSource;
      var alarmOutputs = eventRules[i].AlarmOutputs;
      mRule = angular.copy(eventRules[i]);
      if (typeof mRule.AlarmOutputs === 'undefined') {
        mRule.AlarmOutputs = [];
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          mRule.AlarmOutputs[ao] = {
            Duration: 'Off'
          };
        }
      } else {
        mRule.AlarmOutputs = [];
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          mRule.AlarmOutputs[ao] = {};
          var duration = 'Off';
          for (var j = 0, jLen = alarmOutputs.length; j < jLen; j++) {
            var self = alarmOutputs[j];
            if (ao + 1 === self.AlarmOutput) {
              duration = self.Duration;
              break;
            }
          }
          mRule.AlarmOutputs[ao].Duration = duration;
        }
      }
      if (typeof mRule.PresetNumber === 'undefined') {
        mRule.PresetNumber = 'Off';
      }
      mRule.FtpEnable = false;
      mRule.SmtpEnable = false;
      mRule.RecordEnable = false;
      if (typeof mRule.EventAction !== 'undefined') {
        if (mRule.EventAction.indexOf('FTP') !== -1) {
          mRule.FtpEnable = true;
        }
        if (mRule.EventAction.indexOf('SMTP') !== -1) {
          mRule.SmtpEnable = true;
        }
        if (mRule.EventAction.indexOf('Record') !== -1) {
          mRule.RecordEnable = true;
        }
      }
      mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
      mRule.ftpActionSupported = mRule.SupportedActions.indexOf('FTP') !== -1;
      mRule.smtpActionSupported = mRule.SupportedActions.indexOf('SMTP') !== -1;
      mRule.recordActionSupported = mRule.SupportedActions.indexOf('Record') !== -1;
      mRule.alarmActionSupported = mRule.SupportedActions.indexOf('AlarmOutput') !== -1;
      mRule.presetActionSupported = mRule.SupportedActions.indexOf('GoToPreset') !== -1;
      if (eventSource === 'MotionDetection') {
        mRule.EventOrder = 6;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'VideoAnalysis') {
        mRule.EventOrder = 7;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'NetworkEvent') {
        mRule.EventOrder = 11;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'FaceDetection') {
        mRule.EventOrder = 8;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'TamperingDetection') {
        mRule.EventOrder = 4;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'AudioDetection') {
        if (mAttr.MaxAudioOutput > 0 || mAttr.MaxAudioInput > 0) {
          mRule.EventOrder = 9;
          $scope.EventRules.push(mRule);
        }
      } else if (eventSource === 'Timer') {
        mRule.EventOrder = 2;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'OpenSDK') {
        mRule.EventOrder = 13;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'Tracking') {
        mRule.EventOrder = 12;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'DefocusDetection') {
        mRule.EventOrder = 5;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'FogDetection') {
        mRule.EventOrder = 3;
        $scope.EventRules.push(mRule);
      } else if (eventSource === 'AudioAnalysis') {
        if (mAttr.MaxAudioOutput > 0 || mAttr.MaxAudioInput > 0) {
          mRule.EventOrder = 10;
          $scope.EventRules.push(mRule);
        }
      } else if (eventSource === 'UserInput') {} else {
        for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
          var sourceName = 'AlarmInput.' + (ai + 1);
          if (eventSource === sourceName) {
            mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
            mRule.Index = ai + 1;
            mRule.EventOrder = 1;
            $scope.EventRules.push(mRule);
            break;
          }
        }
      }
    }
    pageData.EventRules = angular.copy($scope.EventRules);
  }

  // get Common and Channel events by eventactions.cgi
  function prepareEventActions(eventActionList) {
    $scope.ChannelEventRules = [];
    $scope.CommonEventRules = [];
    for (var i = 0, len = eventActionList.length; i < len; i++) {
      var mRule = {};
      var eventAction = eventActionList[i].Actions;
      var currentChannel = UniversialManagerService.getChannelId();
      if (eventAction[currentChannel] === undefined) {
        currentChannel = 0;
      }
      var eventType = eventActionList[i].EventType;
      var eventSource = convertEventTypeToEventSource(eventType);
      var alarmOutputs = eventAction.AlarmOutputs;
      mRule = angular.copy(eventActionList[i]);
      mRule.EventSource = eventSource;
      mRule.FtpEnable = false;
      mRule.SmtpEnable = false;
      mRule.RecordEnable = false;

      mRule.Enable = eventAction[currentChannel].Enable;

      if (typeof eventAction[currentChannel].EventActions !== 'undefined') {
        if (eventAction[currentChannel].EventActions.indexOf('FTP') !== -1) {
          mRule.FtpEnable = true;
        }
        if (eventAction[currentChannel].EventActions.indexOf('SMTP') !== -1) {
          mRule.SmtpEnable = true;
        }
        if (eventAction[currentChannel].EventActions.indexOf('Record') !== -1) {
          mRule.RecordEnable = true;
        }
      }
      mRule.AlarmOutputs = [];
      if (typeof eventAction[currentChannel].AlarmOutputs[0].Duration === 'undefined' || eventAction[currentChannel].AlarmOutputs[0].Duration === 'None') {
        mRule.AlarmOutputs = [];
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          mRule.AlarmOutputs[ao] = {
            Duration: 'Off'
          };
        }
      } else {
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          mRule.AlarmOutputs[ao] = {};
          var duration = 'Off';
          for (var j = 0; j < eventAction[currentChannel].AlarmOutputs.length; j++) {
            if ((ao + 1) === eventAction[currentChannel].AlarmOutputs[j].AlarmOutput) {
              duration = eventAction[currentChannel].AlarmOutputs[j].Duration;
              break;
            }
          }
          mRule.AlarmOutputs[ao].Duration = duration;
        }
      }
      if (typeof eventAction[currentChannel].PresetNumber === 'undefined') {
        mRule.PresetNumber = 'Off';
      }

      mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
      mRule.ftpActionSupported = mRule.SupportedActions.indexOf('FTP') !== -1;
      mRule.smtpActionSupported = mRule.SupportedActions.indexOf('SMTP') !== -1;
      mRule.recordActionSupported = mRule.SupportedActions.indexOf('Record') !== -1;
      mRule.alarmActionSupported = mRule.SupportedActions.indexOf('AlarmOutput') !== -1;
      mRule.presetActionSupported = mRule.SupportedActions.indexOf('GoToPreset') !== -1;
      if (eventSource === 'MotionDetection') {
        mRule.EventOrder = 4;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'VideoAnalysis') {
        mRule.EventOrder = 5;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'NetworkEvent') {
        mRule.EventOrder = 3;
        $scope.CommonEventRules.push(mRule);
      } else if (eventSource === 'FaceDetection') {
        mRule.EventOrder = 6;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'TamperingDetection') {
        mRule.EventOrder = 2;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'AudioDetection') {
        mRule.EventOrder = 7;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'Timer') {
        mRule.EventOrder = 2;
        $scope.CommonEventRules.push(mRule);
      } else if (eventSource === 'OpenSDK') {
        mRule.EventOrder = 4;
        $scope.CommonEventRules.push(mRule);
      } else if (eventSource === 'Tracking') {
        mRule.EventOrder = 5;
        $scope.CommonEventRules.push(mRule);
      } else if (eventSource === 'DefocusDetection') {
        mRule.EventOrder = 3;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'FogDetection') {
        mRule.EventOrder = 1;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'AudioAnalysis') {
        mRule.EventOrder = 8;
        $scope.ChannelEventRules.push(mRule);
      } else if (eventSource === 'UserInput') {

      } else {
        for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
          var sourceName = 'AlarmInput.' + (ai + 1);
          if (eventSource === sourceName) {
            mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
            mRule.Index = ai + 1;
            mRule.EventOrder = 1;
            $scope.CommonEventRules.push(mRule);
            break;
          }
        }
      }
    }
    pageData.CommonEventRules = angular.copy($scope.CommonEventRules);
    pageData.ChannelEventRules = angular.copy($scope.ChannelEventRules);
  }

  function getEventRules() {
    var getData = {};
    var url = '/stw-cgi/eventrules.cgi?msubmenu=rules&action=view';

    return SunapiClient.get(
      url,
      getData,
      function(response) {
        prepareEventRules(response.data.EventRules);
      },
      function(errorData) {
        //alert(errorData);
      },
      '',
      true
    );
  }

  function getEventActions() {
    var getData = {};
    var url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';

    return SunapiClient.get(
      url,
      getData,
      function(response) {
        prepareEventActions(response.data.ComplexActions);
      },
      function(errorData) {
        //alert(errorData);
      },
      '',
      true
    );
  }

  function cameraView() {
    var getData = {};
    var currentChannel = UniversialManagerService.getChannelId();
    getData.Channel = currentChannel;
    return SunapiClient.get(
      '/stw-cgi/image.cgi?msubmenu=camera&action=view',
      getData,
      function(response) {
        if ($scope.isMultiChannel) {
          $scope.Camera = response.data.Camera[currentChannel];
        } else {
          $scope.Camera = response.data.Camera[0];
        }
      },
      function(errorData) {
        //alert(errorData);
      },
      '',
      true
    );
  }
  $scope.isSupportedEventSource = function(rule) {
    var retVal = true;
    if ($scope.Camera !== undefined) {
      if (rule.RuleName.indexOf('AlarmInput') !== -1) {
        if ($scope.Camera.DayNightMode === 'ExternalBW') {
          retVal = false;
        }
      }
    }
    return retVal;
  };

  $scope.isSupportedEventSourceForMultiChannel = function(rule) {
    var retVal = true;
    if ($scope.Camera !== undefined) {
      if (rule.EventType.indexOf('AlarmInput.#') !== -1) {
        if ($scope.Camera.DayNightMode === 'ExternalBW') {
          retVal = false;
        }
      }
    }
    return retVal;
  };

  function sunapiQueueRequest(queue, callback) {
    function reqCallback() {
      if (queue.length > 0) {
        sunapiQueueRequest(queue, callback);
      } else {
        callback();
      }
    }

    var currentItem = queue.shift();
    SunapiClient.get(
      currentItem.url,
      currentItem.reqData,
      function(response) {

      },
      function(errorData) {
        //alert(errorData);
      },
      '',
      true
    ).then(reqCallback);
  }

  function setEventRules() {
    var queue = [];
    var channel = 0;

    for (var i = 0; i < $scope.EventRules.length; i++) {
      var setData = {};
      var scopeEventRule = $scope.EventRules[i];
      if (!angular.equals(pageData.EventRules[i], scopeEventRule)) {
        setData.RuleIndex = scopeEventRule.RuleIndex;
        if (pageData.EventRules[i].Enable !== scopeEventRule.Enable) {
          setData.Enable = scopeEventRule.Enable;
        }
        setData.EventAction = [];
        if (scopeEventRule.FtpEnable) {
          setData.EventAction.push('FTP');
        }
        if (scopeEventRule.SmtpEnable) {
          setData.EventAction.push('SMTP');
        }
        if (scopeEventRule.RecordEnable) {
          setData.EventAction.push('Record');
        }
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          if (scopeEventRule.AlarmOutputs[ao].Duration !== 'Off') {
            setData.EventAction.push('AlarmOutput.' + (ao + 1));
            setData["AlarmOutput." + (ao + 1) + ".Duration"] = scopeEventRule.AlarmOutputs[ao].Duration;
          }
        }
        if (scopeEventRule.PresetNumber !== 'Off') {
          setData.EventAction.push('GoToPreset');
          setData.PresetNumber = scopeEventRule.PresetNumber;
        }
        if (setData.EventAction.length) {
          setData.EventAction = setData.EventAction.join(',');
        }

        setData.Channel = channel;
        if ($scope.isMultiChannel) {
          channel++;
        }
        queue.push({
          url: '/stw-cgi/eventrules.cgi?msubmenu=rules&action=update',
          reqData: setData
        });

        /*SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData, function(response) {}, function(errorData) {
            //alert(errorData);
        }, '', true);*/
      }
    }

    sunapiQueueRequest(queue, function() {
      pageData.EventRules = angular.copy($scope.EventRules);
      view();
    });
  }

  function setEventActions() {
    var queue = [];

    for (var i = 0; i < $scope.CommonEventRules.length; i++) {
      var tEventRule = $scope.CommonEventRules[i];
      var setData = {};
      if (!angular.equals(pageData.CommonEventRules[i], tEventRule)) {
        if (pageData.CommonEventRules[i].Enable !== tEventRule.Enable) {
          setData.Enable = tEventRule.Enable;
        }
        setData.EventAction = [];
        if (tEventRule.FtpEnable) {
          setData.EventAction.push('FTP');
        }
        if (tEventRule.SmtpEnable) {
          setData.EventAction.push('SMTP');
        }
        if (tEventRule.RecordEnable) {
          setData.EventAction.push('Record');
        }
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          if (tEventRule.AlarmOutputs[ao].Duration !== 'Off') {
            setData.EventAction.push('AlarmOutput.' + (ao + 1));
            setData["AlarmOutput." + (ao + 1) + ".Duration"] = tEventRule.AlarmOutputs[ao].Duration;
          }
        }
        if (tEventRule.PresetNumber !== 'Off') {
          setData.EventAction.push('GoToPreset');
          setData.PresetNumber = tEventRule.PresetNumber;
        }
        if (setData.EventAction.length) {
          setData.EventAction = setData.EventAction.join(',');
        }

        if (setData.EventAction.length === 0) {
          setData.EventAction.push('None');
        }

        if (tEventRule.EventType === 'AlarmInput.#') {
          setData.EventType = tEventRule.EventSource;
        } else {
          setData.EventType = tEventRule.EventType;
        }

        queue.push({
          url: '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set',
          reqData: setData
        });
      }
    }

    for (var i = 0; i < $scope.ChannelEventRules.length; i++) {
      var tEventRule = $scope.ChannelEventRules[i];
      var setData = {};
      if (!angular.equals(pageData.ChannelEventRules[i], tEventRule)) {
        if (pageData.ChannelEventRules[i].Enable !== tEventRule.Enable) {
          setData.Enable = tEventRule.Enable;
        }
        setData.EventAction = [];
        if (tEventRule.FtpEnable) {
          setData.EventAction.push('FTP');
        }
        if (tEventRule.SmtpEnable) {
          setData.EventAction.push('SMTP');
        }
        if (tEventRule.RecordEnable) {
          setData.EventAction.push('Record');
        }
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          if (tEventRule.AlarmOutputs[ao].Duration !== 'Off') {
            setData.EventAction.push('AlarmOutput.' + (ao + 1));
            setData["AlarmOutput." + (ao + 1) + ".Duration"] = tEventRule.AlarmOutputs[ao].Duration;
          }
        }
        if (tEventRule.PresetNumber !== 'Off') {
          setData.EventAction.push('GoToPreset');
          setData.PresetNumber = tEventRule.PresetNumber;
        }
        if (setData.EventAction.length) {
          setData.EventAction = setData.EventAction.join(',');
        }

        if (setData.EventAction.length === 0) {
          setData.EventAction.push('None');
        }

        setData.EventType = 'Channel.' + UniversialManagerService.getChannelId() + '.' + tEventRule.EventSource; // EventType=Channel.0.MotionDetection

        queue.push({
          url: '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set',
          reqData: setData
        });
      }
    }

    sunapiQueueRequest(queue, function() {
      pageData.CommonEventRules = angular.copy($scope.CommonEventRules);
      pageData.ChannelEventRules = angular.copy($scope.ChannelEventRules);
      UniversialManagerService.setChannelId($scope.targetChannel);
      $rootScope.$emit("channelSelector:changeChannel", $scope.targetChannel);
      view();
    });
  }

  $scope.changePresetSelectOptions = function(index, event) {
    //if(BrowserDetect.isIE ||BrowserDetect.isEdge){
    if (BrowserDetect.isIE) {
      var changeOptions = function() {
        if ($scope.presetGotoSelectOptions[index].Options.length !== $scope.PresetOptions.length)
          $scope.presetGotoSelectOptions[index].Options = $scope.PresetOptions;
      };
      if (event != undefined) {
        var code = event.which;
        if (code == 32 || code == 13 || code == 188 || code == 186) {
          event.preventDefault();
          changeOptions();
        }
      } else {
        changeOptions();
      }
    }
  };

  function initPresetSelectOptions() {
    $scope.presetGotoSelectOptions = [];
    if ($scope.isMultiChannel && $scope.isEventActionSupported) {
      for (var i = 0; i < $scope.CommonEventRules.length; i++) {
        if ($scope.CommonEventRules[i].presetActionSupported) {
          var eventSource = $scope.CommonEventRules[i].EventSource;
          $scope.presetGotoSelectOptions[eventSource] = {
            Options: []
          };
          $scope.presetGotoSelectOptions[eventSource].Options.push($scope.EventRules[i].PresetNumber);
        }
      }
      for (var i = 0; i < $scope.ChannelEventRules.length; i++) {
        if ($scope.ChannelEventRules[i].presetActionSupported) {
          var eventSource = $scope.ChannelEventRules[i].EventSource;
          $scope.presetGotoSelectOptions[eventSource] = {
            Options: []
          };
          $scope.presetGotoSelectOptions[eventSource].Options.push($scope.EventRules[i].PresetNumber);
        }
      }
    } else {
      for (var i = 0; i < $scope.EventRules.length; i++) {
        if ($scope.EventRules[i].presetActionSupported) {
          var eventSource = $scope.EventRules[i].EventSource;
          $scope.presetGotoSelectOptions[eventSource] = {
            Options: []
          };
          $scope.presetGotoSelectOptions[eventSource].Options.push($scope.EventRules[i].PresetNumber);
        }
      }
    }
  }

  function resetPresetSelectOptions() {
    //if(!(BrowserDetect.isIE ||BrowserDetect.isEdge)){
    if (!BrowserDetect.isIE) {
      $timeout(function() {
        if ($scope.isMultiChannel && $scope.isEventActionSupported) {
          for (var i = 0; i < $scope.CommonEventRules.length; i++) {
            if ($scope.CommonEventRules[i].presetActionSupported) {
              var eventSource = $scope.CommonEventRules[i].EventSource;
              $scope.presetGotoSelectOptions[eventSource].Options = $scope.PresetOptions;
            }
          }
          for (var i = 0; i < $scope.ChannelEventRules.length; i++) {
            if ($scope.ChannelEventRules[i].presetActionSupported) {
              var eventSource = $scope.ChannelEventRules[i].EventSource;
              $scope.presetGotoSelectOptions[eventSource].Options = $scope.PresetOptions;
            }
          }
        } else {
          for (var i = 0; i < $scope.EventRules.length; i++) {
            if ($scope.EventRules[i].presetActionSupported) {
              var eventSource = $scope.EventRules[i].EventSource;
              $scope.presetGotoSelectOptions[eventSource].Options = $scope.PresetOptions;
            }
          }
        }
      }, 100);
    }
  }

  function view() {
    getAttributes();
    if ($scope.isMultiChannel && $scope.isEventActionSupported) {
      $q.seqAll([getEventActions, cameraView, getInfoTableData]).then(function(result) {
        initPresetSelectOptions();
        $scope.pageLoaded = true;
        $rootScope.$emit('changeLoadingBar', false);
        resetPresetSelectOptions();
      }, function(error) {});
    } else {
      $q.seqAll([getEventRules, cameraView]).then(function(result) {
        initPresetSelectOptions();
        $scope.pageLoaded = true;
        $rootScope.$emit('changeLoadingBar', false);
        resetPresetSelectOptions();
      }, function(error) {});
    }
  }

  function set() {
    if ($scope.isMultiChannel && $scope.isEventActionSupported) {
      if (!angular.equals(pageData.CommonEventRules, $scope.CommonEventRules) ||
        !angular.equals(pageData.ChannelEventRules, $scope.ChannelEventRules)) {
        COMMONUtils.ApplyConfirmation(function() {
          setEventActions();
        }, 'sm', function() {});
      }
    } else {
      if (!angular.equals(pageData.EventRules, $scope.EventRules)) {
        COMMONUtils.ApplyConfirmation(function() {
          setEventRules();
        }, 'sm', function() {});
      }
    }
  }

  $rootScope.$saveOn('channelSelector:showInfo', function(event, response) {
    $uibModal.open({
      size: 'lg',
      templateUrl: 'views/setup/event/modal/ModalEventSetupInfo.html',
      controller: 'ModalInstanceEventSetupInfoCtrl',
      resolve: {
        infoTableData: function() {
          return $scope.infoTableData;
        }
      }
    });
  }, $scope);

  $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
    if (!angular.equals(pageData.CommonEventRules, $scope.CommonEventRules) ||
      !angular.equals(pageData.ChannelEventRules, $scope.ChannelEventRules)) {
      COMMONUtils
        .confirmChangeingChannel().then(function() {
            $rootScope.$emit('changeLoadingBar', true);
            $scope.targetChannel = data;
            setEventActions();
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

  $scope.submit = set;
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