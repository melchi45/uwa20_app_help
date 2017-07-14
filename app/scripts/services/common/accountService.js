kindFramework.service('AccountService', ['LoggingService', function (LoggingService) {
  'use strict';
  var currentAccount = null;
  var audioInAccess = false;
  var audioOutAccess = false;
  var alarmOutputAccess = false;
  var ptzAccess = false;
  var profileAccess = false; //DEFAULT PROFILE
  var isProfileAble = false;

  this.setAccount = function (obj) {
    currentAccount = obj;
    if (currentAccount.UserID === "guest") {
      audioInAccess = false;
      audioOutAccess = false;
      alarmOutputAccess = false;
      ptzAccess = false;
      profileAccess = false;
    } else {
      audioInAccess = currentAccount.AudioInAccess;
      audioOutAccess = currentAccount.AudioOutAccess;
      alarmOutputAccess = currentAccount.AlarmOutputAccess;
      ptzAccess = currentAccount.PTZAccess;
      profileAccess = currentAccount.VideoProfileAccess;
    }

  };

  this.accountReady = function () {
    if (currentAccount !== null) {
      return true;
    } else {
      return false;
    }
  }

  this.isAudioInAble = function () {
    if (typeof audioInAccess === 'string') {
      audioInAccess = (audioInAccess === 'True');
    }

    return audioInAccess;
  };

  this.isAudioOutAble = function () {
    if (typeof audioOutAccess === 'string') {
      audioOutAccess = (audioOutAccess === 'True');
    }
    return audioOutAccess;
  };

  this.isAlarmOutputAble = function () {
    if (typeof alarmOutputAccess === 'string') {
      alarmOutputAccess = (alarmOutputAccess === 'True');
    }
    return alarmOutputAccess;
  };

  this.isPTZAble = function () {
    if (typeof ptzAccess === 'string') {
      ptzAccess = (ptzAccess === 'True');
    }

    return ptzAccess;
  };

  this.isProfileAble = function () {
    if (typeof isProfileAble === 'string') {
      isProfileAble = (isProfileAble === 'True');
    }
    return profileAccess;
  };
}]);