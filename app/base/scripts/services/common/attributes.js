/* global isPhone */
kindFramework.service('Attributes', 
function($timeout, $location, $q, SunapiClient, XMLParser, SessionOfUserManager, 
  RESTCLIENT_CONFIG, CAMERA_STATUS) {
  "use strict";
  var TIMEOUT = 500;
  var RETRY_COUNT = 999;
  var mAttributes = {};
  var loginInfo = {};

  mAttributes.Ready = false;
  mAttributes.GetFail = false;
  mAttributes.CgiSectionReady = false;
  mAttributes.AttributeSectionReady = false;
  mAttributes.DeviceInfoReady = false;
  mAttributes.EventSourceOptionsReady = false;
  mAttributes.CurrentLanguage = "English";

  mAttributes.DefaultAlarmIndex = 0;
  mAttributes.DefaultPresetNumber = 0;
  mAttributes.DefaultPresetSpeed = 64;
  mAttributes.DefaultDwellTime = 3;

  mAttributes.MaxIPV4Len = 15;
  mAttributes.MaxIPV6Len = 45;
  mAttributes.MaxSequences = 5;
  mAttributes.MaxHours = 24;
  mAttributes.MaxMinutes = 60;

  mAttributes.EnableOptions = [true, false];
  mAttributes.EnableDropdownOptions = [{
    text: "lang_on",
    value: true
  }, {
    text: "lang_off",
    value: false
  }];
  mAttributes.UseOptions = ['On', 'Off'];
  mAttributes.PTLimitModes = ["PanLimit", "TiltLimit"];
  mAttributes.BwOptions = ['Mbps', 'Kbps'];
  mAttributes.VideoAnalyticTypes = ['Passing', 'EnterExit', 'AppearDisapper'];
  mAttributes.AlarmoutModes = ['Pulse', 'ActiveInactive'];
  mAttributes.AutoManualOptions = ['Auto', 'Manual'];
  mAttributes.WeekDays = ['lang_sun', 'lang_mon', 'lang_tue', 'lang_wed', 'lang_thu', 'lang_fri', 'lang_sat'];
  mAttributes.PTZModeOptions = ['ExternalPTZ', 'DigitalPTZ'];

  mAttributes.sliderEnableColor = 'orange';
  mAttributes.sliderDisableColor = 'grey';

  mAttributes.MAX_RESOL_ONE_MEGA = 1;
  mAttributes.MAX_RESOL_TWO_MEGA = 2;
  mAttributes.MAX_RESOL_THREE_MEGA = 3;
  mAttributes.MAX_RESOL_8_MEGA = 4;
  mAttributes.MAX_RESOL_12_MEGA = 5;

  /************* Regular Expressions *****************/
  mAttributes.FriendlyNameCharSet = new RegExp(/^[a-zA-Z0-9-\s~!@$_-|{},./?\[\]]*$/);
  mAttributes.FriendlyNameCharSetExpanded = new RegExp(/^[a-zA-Z0-9-\s~`!@()$^_-|{};,./?\[\]]*$/);
  mAttributes.AlphaNumeric = new RegExp(/^[a-zA-Z0-9]*$/);
  mAttributes.AlphaNumericWithHiphen = new RegExp(/^[a-zA-Z0-9-]*$/);
  mAttributes.AlphaNumericWithHiphenSpace = new RegExp(/^[a-zA-Z0-9-\s]*$/);
  mAttributes.AlphaNumericWithSpace = new RegExp(/[^\s:\\,a-zA-Z0-9]/);
  mAttributes.IPv4 = new RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
  mAttributes.IPv6 = new RegExp(/([A-Fa-f0-9]{1,4}::?){1,7}[A-Fa-f0-9]{1,4}/);
  mAttributes.UpperAlpha = new RegExp(/[A-Z]/);
  mAttributes.LowerAlpha = new RegExp(/[a-z]/);
  mAttributes.OnlyNumber = new RegExp(/\d+/);
  mAttributes.AlphaNumericWithFirstAlpha = new RegExp(/^[a-zA-Z][a-zA-Z0-9]*$/);
  mAttributes.SpecialSymbol = new RegExp(/[`~!@#$%^&*()_|+\-=?;:\'",.<>\{\}\[\]\\\/]/);
  mAttributes.ConstantSymbol1 = new RegExp(/(\w)\1\1/);
  mAttributes.ConstantSymbol2 = new RegExp(/(\d)\1\1/);
  mAttributes.CannotNumberDashFirst = new RegExp(/^[0-9-]{1}$/);
  mAttributes.OSDCharSet = "^[a-zA-Z0-9-.]*$";
  mAttributes.OnlyNumStr = "^[0-9]*$";
  mAttributes.AlphaNumericStr = "^[a-zA-Z0-9]*$";
  mAttributes.AlphaNumericDashStr = "^[a-zA-Z0-9-]*$";
  mAttributes.IPv4PatternStr = "^[0-9.]*$";
  mAttributes.IPv6PatternStr = "^[a-fA-F0-9:]*$";
  mAttributes.ServerNameCharSet = "^[a-zA-Z0-9\\-./_]*?$";
  mAttributes.HostNameCharSet = "^[a-zA-Z0-9~`!@$^()_\\-|{}\\[\\];,./?]*?$";
  mAttributes.SSL802XIDPWSet = "^[a-zA-Z0-9`~!@#$%^*()_|+\\-=?.{}\\[\\]/:;&\"<>,]*$";
  mAttributes.FriendlyNameCharSetStr = "^[a-zA-Z0-9- ~!@$_\\-|{},./?\\[\\]]*$";
  mAttributes.FriendlyNameCharSetNoSpaceStr = "^[a-zA-Z0-9-~!@$_\\-|{},./?\\[\\]]*$";
  mAttributes.FriendlyNameCharSetExpandedStr = "^[a-zA-Z0-9~`!@$()^ _\\-|\\[\\]{};,./?]*$";
  mAttributes.FriendlyNameCharSetExpandedStr2 = "^[a-zA-Z0-9~*#!%&@$()^_\\-|\\[\\]{};,./?]*$";
  mAttributes.FriendlyNameCharSetNoNewLineStr = "^[a-zA-Z0-9~`!@%&*#<>+=:'$()^ _\\-|\\[\\]{};,./?\"]*$";
  mAttributes.FriendlyNameCharSetSupportedStr = "^[\\r\\na-zA-Z0-9~`!@%&*#<>+=:'$()^ _\\-|\\[\\]{};,./?\"]*$";
  mAttributes.URLSet = "^[a-zA-Z0-9\\-.:\\[\\]{}/]*$";
  mAttributes.PasswordCharSet = "^[a-zA-Z0-9~*`!@#$%()^_\\-\\+=|{}\\[\\].?/]*$";

  /**********************************************************/

  this.setDefaultAlarmIndex = function(newAlarmIndex) {
    mAttributes.DefaultAlarmIndex = newAlarmIndex;
  };

  this.setDefaultPresetNumber = function(newPreset) {
    mAttributes.DefaultPresetNumber = newPreset;
  };

  this.parseSystemCgiAttributes = function() {
    if (!mAttributes.systemCgiAttrReady) {
      mAttributes.Languages = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                              'system/deviceinfo/Language/enum');
      mAttributes.DeviceName = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                              'system/deviceinfo/DeviceName/string');
      mAttributes.DeviceLoc = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                              'system/deviceinfo/DeviceLocation/string');
      mAttributes.DeviceDesc = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                              'system/deviceinfo/DeviceDescription/string');
      mAttributes.Memo = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                        'system/deviceinfo/Memo/string');
      mAttributes.YearOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                'system/date/Year/int');
      mAttributes.MonthOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                'system/date/Month/int');
      mAttributes.DayOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                              'system/date/Day/int');
      mAttributes.HourOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                'system/date/Hour/int');
      mAttributes.MinuteOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/date/Minute/int');
      mAttributes.SecondOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/date/Second/int');
      mAttributes.ExcludeSettings = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                    'system/factoryreset/ExcludeSettings/csv');
      mAttributes.RestoreExclusions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                    'system/configrestore/ExcludeSettings/csv');
      mAttributes.StorageEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/storageinfo/Enable/bool');
      mAttributes.FileSystemTypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'system/storageinfo/Storage.#.FileSystem/enum');
      mAttributes.DefaultFolderMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                        'system/storageinfo/DefaultFolder/string');
      mAttributes.NASIPMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                'system/storageinfo/NASIP/string');
      mAttributes.NASUserIDMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                    'system/storageinfo/NASUserID/string');
      mAttributes.NASPasswordMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                      'system/storageinfo/NASPassword/string');
      mAttributes.SystemLogTypes = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/systemlog/Type/enum');
      mAttributes.AccessLogTypes = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/accesslog/Type/enum');
      mAttributes.EventLogTypes = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/eventlog/Type/enum');
      mAttributes.BaudRateOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                    'system/serial/BaudRate/enum');
      mAttributes.ParityBitOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                    'system/serial/ParityBit/enum');
      mAttributes.StopBitOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/serial/StopBits/enum');
      mAttributes.DataBitOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'system/serial/DataBits/enum');

      mAttributes.systemCgiAttrReady = true;
    }
  };


  this.parseMediaCgiAttributes = function() {
    if (!mAttributes.mediaCgiAttrReady) {
      mAttributes.EncodingTypes = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'media/videoprofile/EncodingType/enum');
      mAttributes.ProfileName = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'media/videoprofile/Name/string');
      mAttributes.ATCModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                      'media/videoprofile/ATCMode/enum');
      mAttributes.ATCSensitivityOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                    'media/videoprofile/ATCSensitivity/enum');
      mAttributes.ATCLimit = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                      'media/videoprofile/ATCLimit/enum');
      mAttributes.ATCTrigger = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                        'media/videoprofile/ATCTrigger/enum');
      mAttributes.ATCEventType = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'media/videoprofile/ATCEventType/enum');
      mAttributes.FrameRateLimit = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'media/videoprofile/FrameRate/int');
      mAttributes.CompressionLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'media/videoprofile/CompressionLevel/int');
      mAttributes.Bitrate = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                      'media/videoprofile/Bitrate/int');
      mAttributes.SVNPMulticastPort = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/videoprofile/SVNPMulticastPort/int');
      mAttributes.SVNPMulticastTTL = XMLParser.parseCgiSection(mAttributes.cgiSection,
                                              'media/videoprofile/SVNPMulticastTTL/int');
      mAttributes.RTPMulticastPort = XMLParser.parseCgiSection(mAttributes.cgiSection,
                                              'media/videoprofile/RTPMulticastPort/int');
      mAttributes.RTPMulticastTTL = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'media/videoprofile/RTPMulticastTTL/int');
      mAttributes.SensorCaptureSize = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/videosource/SensorCaptureSize/enum');
      mAttributes.AudioInSourceOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'media/audioinput/Source/enum');
      mAttributes.AudioInEncodingOptions = XMLParser.parseCgiSection(mAttributes.cgiSection,
                                                    'media/audioinput/EncodingType/enum');
      mAttributes.AudioInBitrateOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                    'media/audioinput/Bitrate/enum');
      mAttributes.AudioInGainOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/audioinput/Gain/int');
      mAttributes.AudioOutGainOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'media/audiooutput/Gain/int');
      mAttributes.VideoTypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'media/videooutput/Type/enum');
      mAttributes.SensorModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/videosource/SensorCaptureFrameRate/enum');

      mAttributes.BitrateControlType = {};
      mAttributes.BitrateControlType.H264 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'media/videoprofile/H264.BitrateControlType/enum');

      mAttributes.PriorityType = {};
      mAttributes.PriorityType.H264 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/videoprofile/H264.PriorityType/enum');
      mAttributes.PriorityType.MJPEG = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/videoprofile/MJPEG.PriorityType/enum');

      mAttributes.EnocoderProfile = {};
      mAttributes.EnocoderProfile.H264 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'media/videoprofile/H264.Profile/enum');

      mAttributes.EntropyCoding = {};
      mAttributes.EntropyCoding.H264 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/videoprofile/H264.EntropyCoding/enum');

      mAttributes.SmartCodecEnable = {};
      mAttributes.SmartCodecEnable.H264 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'media/videoprofile/H264.SmartCodecEnable/enum');

      mAttributes.GOVLength = {};
      mAttributes.GOVLength.H264 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'media/videoprofile/H264.GOVLength/int');

      mAttributes.WiseStreamOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'media/wisestream/Mode/enum');

      mAttributes.DynamicGOV = {};
      mAttributes.DynamicGOV.H264 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'media/videoprofile/H264.DynamicGOVLength/int');

      mAttributes.Resolution = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                        'media/videoprofile/Resolution/enum');

      if (typeof mAttributes.EncodingTypes !== 'undefined') {
        if (mAttributes.EncodingTypes.indexOf('H265') !== -1) {
          mAttributes.BitrateControlType.H265 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'media/videoprofile/H265.BitrateControlType/enum');
          mAttributes.PriorityType.H265 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'media/videoprofile/H265.PriorityType/enum');
          mAttributes.EnocoderProfile.H265 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'media/videoprofile/H265.Profile/enum');
          mAttributes.EntropyCoding.H265 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                           'media/videoprofile/H265.EntropyCoding/enum');
          mAttributes.SmartCodecEnable.H265 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'media/videoprofile/H265.SmartCodecEnable/enum');
          mAttributes.GOVLength.H265 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                      'media/videoprofile/H265.GOVLength/int');
          mAttributes.DynamicGOV.H265 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                        'media/videoprofile/H265.DynamicGOVLength/int');
        }
      }

      mAttributes.viewModeIndex = XMLParser.parseCgiSection(mAttributes.cgiSection,
                                  'media/videoprofile/ViewModeIndex/int');
      mAttributes.profileViewModeType = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                        'media/videoprofile/ViewModeType/enum');
      mAttributes.profileBasedDPTZ = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                    'media/videoprofile/IsDigitalPTZProfile/bool');

      mAttributes.mediaCgiAttrReady = true;
    }
  };


  this.parseNetworkCgiAttributes = function() {
    if (!mAttributes.networkCgiAttrReady) {
      mAttributes.InterfaceOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'network/interface/InterfaceName/csv');
      mAttributes.IPv4TypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'network/interface/IPv4Type/enum');
      mAttributes.IPv6TypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection,
                                              'network/interface/IPv6Type/enum');
      mAttributes.PrefixLength = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'network/interface/IPv6PrefixLength/int');
      mAttributes.HostNameOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                              'network/interface/HostName/int');
      mAttributes.DnsTypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection,
                                              'network/dns/Type/enum');
      mAttributes.RtspTimeoutOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'network/rtsp/Timeout/enum');
      mAttributes.Http = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'network/http/Port/int');
      mAttributes.Https = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                    'network/https/Port/int');
      mAttributes.Rtsp = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'network/rtsp/Port/int');
      mAttributes.Svnp = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'network/svnp/Port/int');
      mAttributes.PPPoEUserName = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/interface/PPPoEUserName/string');
      mAttributes.PPPoEPassword = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/interface/PPPoEPassword/string');
      mAttributes.Upnp = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                  'network/upnpdiscovery/FriendlyName/string');
      mAttributes.Bonjour = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                      'network/bonjour/FriendlyName/string');
      mAttributes.QoSIndexRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'network/qos/Index/int');
      mAttributes.DSCPRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                      'network/qos/DSCP/int');
      mAttributes.QOSIPType = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                        'network/qos/IPType/enum');
      mAttributes.SNMPVersion1 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'network/snmp/Version1/bool');
      mAttributes.SNMPVersion2 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'network/snmp/Version2/bool');
      mAttributes.SNMPVersion3 = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'network/snmp/Version3/bool');
      mAttributes.ReadCommunity = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/snmp/ReadCommunity/string');
      mAttributes.WriteCommunity = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/snmp/WriteCommunity/string');
      mAttributes.UserPassword = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'network/snmp/UserPassword/string');
      mAttributes.SNMPTrapEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/snmptrap/Enable/bool');
      mAttributes.TrapCommunity = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/snmptrap/Trap.#.Community/string');
      mAttributes.TrapAuthentificationFailure = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                        'network/snmptrap/Trap.#.AuthenticationFailure/bool');
      mAttributes.TrapLinkUp = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                        'network/snmptrap/Trap.#.LinkUp/bool');
      mAttributes.TrapLinkDown = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                          'network/snmptrap/Trap.#.LinkDown/bool');
      mAttributes.TrapWarmStart = XMLParser.parseCgiSection(mAttributes.cgiSection,
                                            'network/snmptrap/Trap.#.WarmStart/bool');
      mAttributes.TrapColdStart = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/snmptrap/Trap.#.ColdStart/bool');
      mAttributes.TrapAlarmInput = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/snmptrap/Trap.#.AlarmInput.#/bool');
      mAttributes.TrapAlarmOutput = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'network/snmptrap/Trap.#.AlarmOutput.#/bool');
      mAttributes.TrapTamperingDetection = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                    'network/snmptrap/Trap.#.TamperingDetection/bool');
      mAttributes.SamsungServerNameRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                    'network/dynamicdns/SamsungServerName/string');
      mAttributes.SamsungProductIDRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'network/dynamicdns/SamsungProductID/string');
      mAttributes.PublicServiceEntryOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                      'network/dynamicdns/PublicServiceEntry/enum');
      mAttributes.PublicHostNameRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'network/dynamicdns/PublicHostName/string');
      mAttributes.PublicUserNameRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'network/dynamicdns/PublicUserName/string');
      mAttributes.PublicPasswordRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                  'network/dynamicdns/PublicPassword/string');
      mAttributes.IPv6DefaultAddress = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                                'network/interface/IPv6DefaultAddress/string');

      mAttributes.networkCgiAttrReady = true;
    }
  };


  this.parseTransferCgiAttributes = function() {
    if (!mAttributes.transferCgiAttrReady) {
      mAttributes.FTPPortRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/ftp/Port/int');
      mAttributes.FTPHostStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/ftp/Host/string');
      mAttributes.FTPUsernameStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/ftp/Username/string');
      mAttributes.FTPPasswordStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/ftp/Password/string');
      mAttributes.FTPPathStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/ftp/Path/string');
      mAttributes.SMTPPortRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Port/int');
      mAttributes.SMTPHostStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Host/string');
      mAttributes.SMTPUsernameStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Username/string');
      mAttributes.SMTPPasswordStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Password/string');
      mAttributes.SMTPSenderStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Sender/string');
      mAttributes.SMTPRecipientStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Recipient/string');
      mAttributes.SMTPSubjectStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Subject/string');
      mAttributes.SMTPMessageStringLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'transfer/smtp/Message/string');

      mAttributes.transferCgiAttrReady = true;
    }
  };


  this.parseSecurityCgiAttributes = function() {
    if (!mAttributes.secuirityCgiAttrReady) {
      mAttributes.IpFilterAccessType = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/ipfilter/AccessType/enum');
      mAttributes.IpFilterIndexRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/ipfilter/IPIndex/int');
      mAttributes.IpFilterIPType = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/ipfilter/IPType/enum');
      mAttributes.SSLPolicyOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/ssl/Policy/enum');
      mAttributes.PublicCertificateNameRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/ssl/PublicCertificateName/string');
      mAttributes.EAPOLTypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/802Dot1x/EAPOLType/enum');
      mAttributes.EAPOLVersionOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/802Dot1x/EAPOLVersion/enum');
      mAttributes.CertificateTypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/802Dot1x/CertificateType/enum');
      mAttributes.EAPOLIDRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/802Dot1x/EAPOLId/string');
      mAttributes.EAPOLPasswordRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/802Dot1x/EAPOLPassword/string');
      mAttributes.IEEE802Dot1xInterfaceOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/802Dot1x/InterfaceName/csv');
      mAttributes.UserIDLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/users/UserID/string');
      mAttributes.PasswordLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'security/users/Password/string');

      mAttributes.secuirityCgiAttrReady = true;
    }
  };


  this.parseEventStatusCgiAttributes = function() {
    if (!mAttributes.eventstatusCgiAttrReady) {
      mAttributes.SystemEvents = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventstatus/eventstatus/SystemEvent/csv');
      mAttributes.ChannelEvents = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventstatus/eventstatus/Channel.#.EventType/csv');

      mAttributes.eventstatusCgiAttrReady = true;
    }
  };


  this.parseIOCgiAttributes = function() {
    if (!mAttributes.ioCgiAttrReady) {
      mAttributes.AlarmOutputIdleStateOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'io/alarmoutput/AlarmOutput.#.IdleState/enum');
      mAttributes.AlarmoutManualDurations = XMLParser.parseCgiSection(mAttributes.cgiSection, 'io/alarmoutput/AlarmOutput.#.ManualDuration/enum');

      mAttributes.ioCgiAttrReady = true;
    }
  };


  this.parseEventSourceCgiAttributes = function() {
    if (!mAttributes.eventsourceCgiAttrReady) {
      var va2support = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/videoanalysis2/DetectionType/enum');
      var vaCmd = '';
      if (typeof va2support !== "undefined") {
        mAttributes.VideoAnalysis2Support = true;
        vaCmd = 'videoanalysis2';
      } else {
        mAttributes.VideoAnalysis2Support = false;
        vaCmd = 'videoanalysis';
      }
      mAttributes.AlarmInputStateOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/alarminput/AlarmInput.#.State/enum');
      mAttributes.ScheduleIntervalOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/timer/ScheduleInterval/enum');
      mAttributes.TamperDetectSensitivityTypes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/tamperingdetection/Sensitivity/enum');
      mAttributes.TamperDetectSensitivityLevelRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/tamperingdetection/SensitivityLevel/int');
      mAttributes.DefocusDetectSensitivityLevelRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/defocusdetection/Sensitivity/int');
      mAttributes.MotionDetectSensitivityTypes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/' + vaCmd + '/Sensitivity/enum');
      mAttributes.FaceDetectSensitivityTypes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/facedetection/Sensitivity/int');
      mAttributes.ScheduleIntervalUnits = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/timer/ScheduleIntervalUnit/enum');
      mAttributes.MotionDetectModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/' + vaCmd + '/DetectionType/enum');
      mAttributes.InputThresholdLevelRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/audiodetection/InputThresholdLevel/int');
      mAttributes.CameraHeights = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/autotracking/CameraHeight/enum');
      mAttributes.AutoTrackObjectSize = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/autotracking/ObjectSize/enum');
      mAttributes.DetectionAreaModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/facedetection/DetectionAreaMode/enum');
      mAttributes.OverlayColorOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/facedetection/OverlayColor/enum');
      mAttributes.DisplayRules = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/' + vaCmd + '/DisplayRules/bool');
      mAttributes.DetectionResultOverlay = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/' + vaCmd + '/DetectionResultOverlay/bool');
      mAttributes.CameraHeight = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/peoplecount/CameraHeight/int');
      mAttributes.CalibrationMode = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/peoplecount/CalibrationMode/enum');

      mAttributes.PeopleCount = typeof XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/peoplecount/Enable/bool') !== "undefined";
      mAttributes.HeatMap = typeof XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/heatmap/Enable/bool') !== "undefined";

      mAttributes.LoiteringDuration = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/' + vaCmd + '/DefinedArea.#.LoiteringDuration/int');
      mAttributes.AppearanceDuration = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/' + vaCmd + '/DefinedArea.#.AppearanceDuration/int');

      mAttributes.TamperDetectThreshold = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/tamperingdetection/ThresholdLevel/int');
      mAttributes.TamperDetectDuration = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/tamperingdetection/Duration/int');
      mAttributes.TamperDetectSensitivityLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/tamperingdetection/SensitivityLevel/int');

      mAttributes.AudioDetectInputThresholdLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/audiodetection/InputThresholdLevel/int');

      mAttributes.DefocusDetectThreshold = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/defocusdetection/Threshold/int');
      mAttributes.DefocusDetectDuration = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/defocusdetection/Duration/int');

      mAttributes.FogDetectThreshold = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/fogdetection/Threshold/int');
      mAttributes.FogDetectDuration = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/fogdetection/Duration/int');
      mAttributes.FogDetectSensitivityLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventsources/fogdetection/SensitivityLevel/int');

      mAttributes.eventsourceCgiAttrReady = true;
    }
  };


  this.parseRecordingCgiAttributes = function() {
    if (!mAttributes.recordingCgiAttrReady) {
      mAttributes.RecVideoFileTypeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'recording/general/RecordedVideoFileType/enum');
      mAttributes.RecNormalModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'recording/general/NormalMode/enum');
      mAttributes.RecEventModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'recording/general/EventMode/enum');
      mAttributes.RecPreEventDurationOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'recording/general/PreEventDuration/enum');
      mAttributes.RecPostEventDurationOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'recording/general/PostEventDuration/enum');
      mAttributes.AutoDeleteDayOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'recording/storage/AutoDeleteDays/int');

      mAttributes.recordingCgiAttrReady = true;
    }
  };

  this.parseEventActionsCgiAttributes = function() {
    if (!mAttributes.eventactionsCgiAttrReady) {
      mAttributes.EventActionSupport = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventactions/complexaction/EventType/enum');
      if (typeof mAttributes.EventActionSupport !== "undefined" && mAttributes.EventActionSupport !== null) {
        mAttributes.EventActionSupport = true;
      } else {
        mAttributes.EventActionSupport = false;
      }
      mAttributes.eventactionsCgiAttrReady = true;
    }
  };

  this.parseEventRulesCgiAttributes = function() {
    if (!mAttributes.eventrulesCgiAttrReady) {
      mAttributes.EventSources = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/rules/EventSource/enum');
      mAttributes.EventActions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/rules/EventAction/enum');
      mAttributes.ActivateOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/rules/ScheduleType/enum');
      mAttributes.HandoverRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/handover/ROIIndex/int');
      mAttributes.AlarmoutDurationOptions = ["Off"];
      mAttributes.AlarmoutDurationOptions.push.apply(mAttributes.AlarmoutDurationOptions, XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/rules/AlarmOutput.#.Duration/enum'));

      if (mAttributes.HandoverRange !== 'undefined') {
        mAttributes.HandoverUserRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/handover/HandoverIndex/int');
        mAttributes.HandoverUserMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/handover/Username/string');
        mAttributes.HandoverPwdMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/handover/Password/string');
        mAttributes.HandoverPresetRange = XMLParser.parseCgiSection(mAttributes.cgiSection, 'eventrules/handover/PresetNumber/int');
      }

      mAttributes.eventrulesCgiAttrReady = true;
    }
  };


  this.parseImageCgiAttributes = function() {
    if (!mAttributes.imageCgiAttrReady) {
      mAttributes.RotateOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/flip/Rotate/enum');
      mAttributes.SmartCodecOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/smartcodec/Mode/enum');
      mAttributes.SmartCodecQualityOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/smartcodec/QualityLevel/enum');
      mAttributes.ImagePresetModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imagepreset/Mode/enum');
      mAttributes.ImagePresetSchedModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imagepreset/Schedule.#.Mode/enum');
      mAttributes.ImagePresetOptionsSupport = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imagepresetoptions/ImagePresetMode/enum');
      mAttributes.SSDRLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/ssdr/Level/int');
      mAttributes.SSDRDynamicRangeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/ssdr/DynamicRange/enum');
      mAttributes.WhiteBalanceModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/whitebalance/WhiteBalanceMode/enum');
      mAttributes.WhiteBalanceManualRedLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/whitebalance/WhiteBalanceManualRedLevel/int');
      mAttributes.WhiteBalanceManualBlueLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/whitebalance/WhiteBalanceManualBlueLevel/int');
      mAttributes.CompensationModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/CompensationMode/enum');
      mAttributes.WDRLevelOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/WDRLevel/enum');
      mAttributes.BLCLevelOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/BLCLevel/enum');
      mAttributes.HLCModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCMode/enum');
      mAttributes.HLCLevelOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCLevel/enum');
      mAttributes.HLCMaskTone = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCMaskTone/int');
      mAttributes.HLCMaskColorOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCMaskColor/enum');
      mAttributes.HLCDimmingOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCDimming/enum');
      mAttributes.HLCAreaTop = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCAreaTop/int');
      mAttributes.HLCAreaBottom = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCAreaBottom/int');
      mAttributes.HLCAreaLeft = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCAreaLeft/int');
      mAttributes.HLCAreaRight = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/HLCAreaRight/int');
      mAttributes.BLCAreaTop = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/BLCAreaTop/int');
      mAttributes.BLCAreaBottom = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/BLCAreaBottom/int');
      mAttributes.BLCAreaLeft = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/BLCAreaLeft/int');
      mAttributes.BLCAreaRight = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/BLCAreaRight/int');
      mAttributes.WDRSeamlessTransitionOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/WDRSeamlessTransition/enum');
      mAttributes.WDRLowLightOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/WDRLowLight/enum');
      mAttributes.WDRIRLEDEnableOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/WDRIRLEDEnable/enum');

      mAttributes.MinShutterOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/AutoShortShutterSpeed/enum');
      mAttributes.MaxShutterOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/AutoLongShutterSpeed/enum');
      mAttributes.PreferShutterOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/PreferShutterSpeed/enum');
      mAttributes.AFLKModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/AFLKMode/enum');
      mAttributes.SSNRModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/SSNRMode/enum');
      mAttributes.SSNRLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/SSNRLevel/int');
      mAttributes.IrisModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/IrisMode/enum');
      mAttributes.IrisFnoOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/IrisFno/enum');
      mAttributes.PIrisModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/PIrisMode/enum');
      mAttributes.PIrisPosition = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/PIrisPosition/int');
      mAttributes.AGCModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/AGCMode/enum');
      mAttributes.AGCLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/AGCLevel/int');
      mAttributes.DayNightModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/DayNightMode/enum');
      mAttributes.DayNightSwitchingTimeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/DayNightSwitchingTime/enum');
      mAttributes.DayNightSwitchingModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/DayNightSwitchingMode/enum');
      mAttributes.DayNightAlarmInOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/DayNightAlarmIn/enum');
      mAttributes.SimpleFocusAfterDayNight = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/SimpleFocus/enum');

      mAttributes.Brightness = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/Brightness/int');
      mAttributes.SharpnessLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/SharpnessLevel/int');
      mAttributes.Gamma = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/Gamma/int');
      mAttributes.Saturation = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/Saturation/int');
      mAttributes.DefogModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/DefogMode/enum');
      mAttributes.DefogLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/DefogLevel/int');
      mAttributes.LDCModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/LDCMode/enum');
      mAttributes.LDCLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/LDCLevel/int');
      mAttributes.Contrast = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/Contrast/int');
      mAttributes.CAROptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/imageenhancements/CAR/enum');
      /** OSD Start  */
      mAttributes.PositionX = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/PositionX/int');
      mAttributes.PositionY = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/PositionY/int');
      mAttributes.TimeFormatOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/DateFormat/enum');
      mAttributes.FontSizeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/FontSize/enum');
      mAttributes.OSDColorOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/OSDColor/enum');
      mAttributes.OSDTransparencyOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/Transparency/enum');
      mAttributes.OSDBlinkOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/OSDBlink/enum');
      mAttributes.MultilineOSDTitle = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multilineosd/OSD/string');
      mAttributes.MultiImageIndex = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multiimageosd/Index/int');
      mAttributes.ImageOverlayMaxResolution = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/multiimageosd/MaxResolution/string');
      /** OSD End  */

      mAttributes.SimpleFocusOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/Focus/enum');
      mAttributes.FastAutoFocusEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/FastAutoFocus/bool');
      mAttributes.SimpleZoomOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/Zoom/enum');
      mAttributes.FocusModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/Mode/enum');
      mAttributes.ZoomTrackingModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/ZoomTrackingMode/enum');
      mAttributes.ZoomTrackingSpeedOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/ZoomTrackingSpeed/enum');
      mAttributes.IRShiftOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/IRShift/enum');

      /** Overlay Start */
      mAttributes.PTZPositionEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/overlay/PTZPositionEnable/bool');
      mAttributes.PresetNameEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/overlay/PresetNameEnable/bool');
      mAttributes.CameraIDEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/overlay/CameraIDEnable/bool');
      mAttributes.AzimuthEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/overlay/AzimuthEnable/bool');
      /** Overlay End */

      mAttributes.LensResetScheduleOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/focus/LensResetSchedule/enum');
      mAttributes.IRledModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/irled/Mode/enum');
      mAttributes.IRledLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/irled/Level/enum');
      mAttributes.LEDOnLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/irled/LEDOnLevel/int');
      mAttributes.LEDOffLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/irled/LEDOffLevel/int');
      mAttributes.LEDPowerControlModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/irled/LEDPowerControlMode/enum');
      mAttributes.LEDMaxPowerOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/irled/LEDMaxPower/enum');
      mAttributes.ScheduleEveryDay = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/irled/Schedule.EveryDay.FromTo/string');
      mAttributes.ColorOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/privacy/MaskColor/enum');
      mAttributes.PrivacyMaskMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/privacy/MaskName/string');
      mAttributes.PrivacyMaskPattern = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/privacy/MaskPattern/enum');

      mAttributes.LensModel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/fisheyesetup/LensModel/enum');
      mAttributes.CameraPosition = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/fisheyesetup/CameraPosition/enum');
      mAttributes.ViewModeIndex = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/fisheyesetup/ViewModeIndex/int');
      mAttributes.ViewModeType = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/fisheyesetup/ViewModeType/enum');

      mAttributes.PtrPanOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/ptr/Pan/int');
      mAttributes.PtrTiltOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/ptr/Tilt/int');
      mAttributes.PtrRotateOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/ptr/Rotate/int');

      mAttributes.LensModelOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'image/camera/LensModel/enum');

      if(mAttributes.PtrRotateOptions && mAttributes.PtrTiltOptions && mAttributes.PtrPanOptions)
      {
          mAttributes.PTRZModel = true;
      }

      mAttributes.imageCgiAttrReady = true;
    }
  };


  this.parsePTZCgiAttributes = function() {
    if (!mAttributes.ptzCgiAttrReady) {

      if (mAttributes.PTZModel || mAttributes.ExternalPTZModel || mAttributes.ZoomOnlyModel) {
        mAttributes.MaxZoom = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzcontrol/absolute/Zoom/float');

        mAttributes.DigitalZoomEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzsettings/DigitalZoomEnable/bool');
        mAttributes.AutoFlipEnable = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzsettings/AutoFlipEnable/bool');
        mAttributes.MaxDigitalZoomOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzsettings/MaxDigitalZoom/enum');
        mAttributes.RememberLastPosition = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzsettings/RememberLastPosition/bool');
        mAttributes.RememberLastPositionDuration = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzsettings/RememberLastPositionDuration/int');
        mAttributes.PresetSSDRLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/SSDRLevel/int');
        mAttributes.PresetDynamicRangeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/DynamicRange/enum');
        mAttributes.PresetWhiteBalanceModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/WhiteBalanceMode/enum');
        mAttributes.PresetWhiteBalanceManualRedLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/WhiteBalanceManualRedLevel/int');
        mAttributes.PresetWhiteBalanceManualBlueLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/WhiteBalanceManualBlueLevel/int');
        mAttributes.PresetBrightness = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/Brightness/int');
        mAttributes.PresetAFLKModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/AFLKMode/enum');
        mAttributes.PresetSSNRLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/SSNRLevel/int');
        mAttributes.PresetIrisModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/IrisMode/enum');
        mAttributes.PresetIrisFnoOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/IrisFno/enum');
        mAttributes.PresetAGCModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/AGCMode/enum');
        mAttributes.PresetAGCLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/AGCLevel/int');
        mAttributes.PresetDefogModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/DefogMode/enum');
        mAttributes.PresetDefogLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/DefogLevel/int');
        mAttributes.PresetDayNightModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/DayNightMode/enum');
        mAttributes.PresetDayNightSwitchingTimeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/DayNightSwitchingTime/enum');
        mAttributes.PresetDayNightSwitchingModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/DayNightSwitchingMode/enum');
        mAttributes.PresetSharpnessLevel = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/SharpnessLevel/int');
        mAttributes.PresetSaturation = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/Saturation/int');
        mAttributes.PresetFocusModeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/FocusMode/enum');
        mAttributes.PresetMaxDigitalZoomOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/MaxDigitalZoom/enum');
        mAttributes.PresetContrast = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/contrast/enum');
        mAttributes.PTZPresetOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/preset/Preset/int');
        mAttributes.PresetNameMaxLen = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/preset/Name/string');
        mAttributes.PresetActions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/AfterAction/enum');
        mAttributes.PresetTrackingTime = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/presetimageconfig/AfterActionTrackingTime/enum');
        mAttributes.PresetSpeedLimits = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/group/Speed/int');
        mAttributes.PresetDwellTimeLimits = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/group/DwellTime/int');
        mAttributes.SwingModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/swing/Mode/enum');
        mAttributes.AutoRunModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/autorun/Mode/enum');
        mAttributes.AutoRunActiveTimeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/autorun/ActivationTime/enum');
        mAttributes.AutoRunScheduleModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/autorun/ScheduleMode/enum');
        mAttributes.AutoPanSpeed = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/autorun/AutoPanSpeed/int');
        mAttributes.AutoPanTiltAngle = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/autorun/AutoPanTiltAngle/int');
        mAttributes.ProportionalPTSpeedModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzsettings/ProportionalPTSpeedMode/enum');
        mAttributes.PTLimitControlModes = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptlimits/Mode/enum');
        mAttributes.TiltRangeOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptlimits/TiltRange/enum');
        mAttributes.PTZProtocolOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzprotocol/Protocol/enum');
        mAttributes.CameraIDOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzconfig/ptzprotocol/CameraID/int');
      }

      if (mAttributes.isDigitalPTZ) {
        mAttributes.DigitalAutoTrackingOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 'ptzcontrol/digitalautotracking/Mode/enum');
      }

      mAttributes.ptzCgiAttrReady = true;
    }
  };


  this.parseOpenSDKCgiAttributes = function() {
    if (!mAttributes.openSDKCgiAttrReady) {
      mAttributes.OpenSDKPriorityOptions = XMLParser.parseCgiSection(mAttributes.cgiSection, 
                                            'opensdk/apps/<AppID>.Priority/enum');

      mAttributes.openSDKCgiAttrReady = true;
    }
  };

  var getCgiSection = this.getCgiSection = function(){
    mAttributes.systemCgiAttrReady = false;
    mAttributes.mediaCgiAttrReady = false;
    mAttributes.networkCgiAttrReady = false;
    mAttributes.transferCgiAttrReady = false;
    mAttributes.secuirityCgiAttrReady = false;
    mAttributes.eventstatusCgiAttrReady = false;
    mAttributes.ioCgiAttrReady = false;
    mAttributes.eventsourceCgiAttrReady = false;
    mAttributes.recordingCgiAttrReady = false;
    mAttributes.eventrulesCgiAttrReady = false;
    mAttributes.eventactionsCgiAttrReady = false;
    mAttributes.imageCgiAttrReady = false;
    mAttributes.ptzCgiAttrReady = false;
    mAttributes.openSDKCgiAttrReady = false;

    var getData = {};

    return SunapiClient.get('/stw-cgi/attributes.cgi/cgis', getData,
      function(response) {
        mAttributes.cgiSection = angular.copy(response.data);
        mAttributes.CgiSectionReady = true;
        console.log("Cgi Section Ready");
      },
      function(errorData) {
        mAttributes.GetFail = true;
        console.log("Cgi Section : ", errorData);
      }, '', true);
  };


  var getAttributeSection = this.getAttributeSection = function (){
    var getData = {};

    return SunapiClient.get('/stw-cgi/attributes.cgi/attributes', getData,
      function(response) {
        mAttributes.MicomSupport = XMLParser.parseAttributeSection(response.data, 'System/Property/MicomVersion');
        mAttributes.LogServerSupport = XMLParser.parseAttributeSection(response.data, 'System/Support/LogServer');
        mAttributes.ModelType = XMLParser.parseAttributeSection(response.data, 'System/Property/ModelType');
        mAttributes.IsAdminUse = mAttributes.FWUpdateSupport = XMLParser.parseAttributeSection(response.data, 'System/Support/FWUpdate');
        mAttributes.MaxChannel = XMLParser.parseAttributeSection(response.data, 'System/Limit/MaxChannel');
        mAttributes.MaxHDMIOut = XMLParser.parseAttributeSection(response.data, 'System/Limit/Max/MaxHDMIOut');

        mAttributes.TamperingDetection = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/TamperingDetection');
        mAttributes.FaceDetectionSupport = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/FaceDetection');
        mAttributes.AudioDetection = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/AudioDetection');
        mAttributes.NetworkDisconnect = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/NetworkDisconnect');
        mAttributes.OpenSDKSupport = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/OpenSDK');
        mAttributes.OpenSDKMaxApps = XMLParser.parseAttributeSection(response.data, 'System/Limit/OpenSDK.MaxApps');
        mAttributes.DefocusDetectionSupport = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/DefocusDetection');
        mAttributes.MaxROI = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxROI');
        mAttributes.MaxROICoordinateX = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/ROICoordinate.MaxX');
        mAttributes.MaxROICoordinateY = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/ROICoordinate.MaxY');
        mAttributes.MaxROI = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxROI');
        mAttributes.MaxIVRule = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxIVRule');
        mAttributes.MaxIVRuleLine = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxIVRule.Line');
        mAttributes.MaxIVRuleArea = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxIVRule.Area');
        mAttributes.MaxFaceDetectionArea = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxFaceDetectionArea');
        mAttributes.VAPassing = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/VA.Passing');
        mAttributes.VAEnter = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/VA.Enter');
        mAttributes.VAExit = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/VA.Exit');
        mAttributes.VAAppear = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/VA.Appear');
        mAttributes.VADisappear = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/VA.Disappear');
        if ((mAttributes.VAPassing === true) || (mAttributes.VAEnter === true) || 
            (mAttributes.VAExit === true) || (mAttributes.VAAppear === true) || 
            (mAttributes.VADisappear === true)) {
          mAttributes.VideoAnalyticsSupport = true;
        } else {
          mAttributes.VideoAnalyticsSupport = false;
        }
        mAttributes.MotionDetectionOverlay = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/VA.MotionDetection.Overlay');
        mAttributes.AdjustMDIVRuleOnFlipMirror = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/AdjustMDIVRuleOnFlipMirror');
        mAttributes.ROIType = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/ROIType');
        mAttributes.MaxAlarmInput = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxAlarmInput');
        mAttributes.MaxAlarmInputOriginal = angular.copy(mAttributes.MaxAlarmInput);
        mAttributes.MaxTrackingArea = XMLParser.parseAttributeSection(response.data, 'Eventsource/Limit/MaxTrackingArea');

        mAttributes.MaxAlarmOutput = XMLParser.parseAttributeSection(response.data, 'IO/Limit/MaxAlarmOutput');
        mAttributes.RS485Support = XMLParser.parseAttributeSection(response.data, 'IO/Support/RS485');
        mAttributes.RS422Support = XMLParser.parseAttributeSection(response.data, 'IO/Support/RS422');

        mAttributes.MaxUser = XMLParser.parseAttributeSection(response.data, 'Security/Limit/MaxUser');

        mAttributes.MaxAudioInput = XMLParser.parseAttributeSection(response.data, 'Media/Limit/MaxAudioInput');
        mAttributes.MaxAudioOutput = XMLParser.parseAttributeSection(response.data, 'Media/Limit/MaxAudioOutput');
        mAttributes.MaxProfile = XMLParser.parseAttributeSection(response.data, 'Media/Limit/MaxProfile');
        mAttributes.CropSupport = XMLParser.parseAttributeSection(response.data, 'Media/Support/Crop');
        mAttributes.MaxResolution = XMLParser.parseAttributeSection(response.data, 'Media/Limit/MaxResolution');
        if (typeof mAttributes.MaxResolution !== "undefined") {
          mAttributes.MaxResolution = mAttributes.MaxResolution[0];
        }

        mAttributes.WiseStreamSupport = XMLParser.parseAttributeSection(response.data, 'Media/Support/WiseStream');
        mAttributes.DynamicGOVSupport = XMLParser.parseAttributeSection(response.data, 'Media/Support/DynamicGOV');

        mAttributes.MaxIPv4Filter = XMLParser.parseAttributeSection(response.data, 'Network/Limit/MaxIPv4Filter');
        mAttributes.MaxIPv6Filter = XMLParser.parseAttributeSection(response.data, 'Network/Limit/MaxIPv6Filter');
        mAttributes.MaxIPv4QoS = XMLParser.parseAttributeSection(response.data, 'Network/Limit/MaxIPv4QoS');
        mAttributes.MaxIPv6QoS = XMLParser.parseAttributeSection(response.data, 'Network/Limit/MaxIPv6QoS');
        mAttributes.CamSpecialModel = false; //Need for S1 model kept for future reference.

        mAttributes.SMTPSupport = XMLParser.parseAttributeSection(response.data, "Transfer/Support/SMTP");
        mAttributes.FTPSupport = XMLParser.parseAttributeSection(response.data, "Transfer/Support/FTP");

        mAttributes.PrivacyMasGlobalColor = XMLParser.parseAttributeSection(response.data, 'Image/Support/Privacy.MaskColor.Global');
        mAttributes.SimpleFocus = XMLParser.parseAttributeSection(response.data, 'Image/Support/SimpleFocus');
        mAttributes.IRLedSupport = XMLParser.parseAttributeSection(response.data, 'Image/Support/IRLED');
        mAttributes.FisheyeLens = XMLParser.parseAttributeSection(response.data, 'Image/Support/FisheyeLens');
        mAttributes.MultiImager = XMLParser.parseAttributeSection(response.data, 'Image/Support/MultiImager');
        mAttributes.NormalizedOSDRange = XMLParser.parseAttributeSection(response.data, 'Image/Support/NormalizedOSDRange');
        mAttributes.PIris = XMLParser.parseAttributeSection(response.data, 'Image/Support/P-Iris');
        mAttributes.ZoomAdjust = XMLParser.parseAttributeSection(response.data, 'Image/Support/ZoomAdjust');
        mAttributes.DIS = XMLParser.parseAttributeSection(response.data, 'Image/Support/DIS');

        mAttributes.MaxSmartCodecArea = XMLParser.parseAttributeSection(response.data, 'Image/Limit/MaxSmartCodecArea');
        mAttributes.MaxPrivacyMask = XMLParser.parseAttributeSection(response.data, 'Image/Limit/MaxPrivacyMask');
        mAttributes.PrivacyMaskRectangle = XMLParser.parseAttributeSection(response.data, 'Image/Limit/MaxPrivacyMask.Rectangle');
        mAttributes.PrivacyMaskPolygon = XMLParser.parseAttributeSection(response.data, 'Image/Limit/MaxPrivacyMask.Polygon');
        mAttributes.MaxOSDTitles = XMLParser.parseAttributeSection(response.data, 'Image/Limit/MaxOSDTitles');

        mAttributes.AbsolutePan = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Absolute.Pan');
        mAttributes.AbsoluteTilt = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Absolute.Tilt');
        mAttributes.AbsoluteZoom = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Absolute.Zoom');

        mAttributes.HomeSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Home');

        mAttributes.MaxPreset = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Limit/MaxPreset');

        mAttributes.RecordStreamLimitation = XMLParser.parseAttributeSection(response.data, 'Recording/Support/RecordStreamLimitation');
        mAttributes.QueueManagement = XMLParser.parseAttributeSection(response.data, 'Recording/Support/QueueManagement');
        mAttributes.isDigitalPTZ = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/DigitalPTZ');
        mAttributes.MaxGroupCount = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Limit/MaxGroupCount');
        mAttributes.MaxPresetsPerGroup = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Limit/MaxPresetCountPerGroup');

        mAttributes.AuxCommands = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/AuxCommands');

        if (mAttributes.AbsolutePan === true && mAttributes.AbsoluteTilt === true && 
            mAttributes.AbsoluteZoom === true && mAttributes.FisheyeLens === false && 
            mAttributes.isDigitalPTZ === false) {
          mAttributes.PTZModel = true;
        } else if (mAttributes.AbsoluteZoom === true && mAttributes.AbsolutePan === false && 
            mAttributes.AbsoluteTilt === false) {
          mAttributes.ZoomOnlyModel = true;
        } else if (mAttributes.AbsoluteZoom === false && mAttributes.AbsolutePan === false && 
            mAttributes.AbsoluteTilt === false && mAttributes.RS485Support === true && 
            mAttributes.MaxGroupCount === 0) {
          mAttributes.ExternalPTZModel = true;
        } else {
          mAttributes.PresetTypes = ['Global'];
          mAttributes.PTZModel = mAttributes.ZoomOnlyModel = mAttributes.ExternalPTZModel = false;
        }

        if (mAttributes.PTZModel || mAttributes.FisheyeLens || mAttributes.ExternalPTZModel || 
            mAttributes.ZoomOnlyModel) {
          mAttributes.PresetTypes = ['Global', 'Preset'];
          mAttributes.ContinousZoom = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Continuous.Zoom');
          mAttributes.PresetSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Preset');
          mAttributes.SwingSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Swing');
          mAttributes.GroupSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Group');
          mAttributes.TourSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Tour');
          mAttributes.TraceSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/Trace');
          mAttributes.AutorunSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/AutoRun');
          mAttributes.DigitalZoomSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/DigitalZoom');
          mAttributes.TrackingSupport = XMLParser.parseAttributeSection(response.data, 'Eventsource/Support/Tracking');
          mAttributes.AreaZoomSupport = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Support/AreaZoom');
          mAttributes.MaxTourCount = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Limit/MaxTourCount');
          mAttributes.MaxTraceCount = XMLParser.parseAttributeSection(response.data, 'PTZSupport/Limit/MaxTraceCount');

          setPresetOption();
        }

        console.log("Attributes Section Ready");
        mAttributes.AttributeSectionReady = true;


      },
      function(errorData) {
        mAttributes.GetFail = true;
        console.log("Attributes Section : ", errorData);
      }, '', true);
  };

  function setPresetOption() {
    mAttributes.PresetOptions = ["Off"];
    for (var preset = 1; preset <= mAttributes.MaxPreset; preset++) {
      mAttributes.PresetOptions.push(preset);
    }
  }


  var LoginRedirect = function() {
    if (RESTCLIENT_CONFIG.serverType === 'grunt') {
      $location.path('/login');
    }
  };

  //workaround till arribute is updated after daynight mode change
  function cameraView() {
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=view', '',
      function(response) {
        if (response.data.Camera[0].DayNightMode === 'ExternalBW') {
          mAttributes.MaxAlarmInput = 0;
          mAttributes.cameraCommandResponse = response.data.Camera[0];
        }
      },
      function() {
        // alert(errorData);
      }, '', true);
  }

  var getDeviceInfo = this.getDeviceInfo = function () {
    var getData = {};

    return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view', getData,
      function(response) {
        mAttributes.ModelName = response.data.Model;
        mAttributes.DeviceType = response.data.DeviceType;
        mAttributes.FirmwareVersion = response.data.FirmwareVersion;
        mAttributes.CurrentLanguage = response.data.Language;
        if (typeof response.data.ISPVersion !== 'undefined') {
          mAttributes.ISPVersion = response.data.ISPVersion;
        }

        if (typeof response.data.CGIVersion !== 'undefined') {
          mAttributes.CGIVersion = response.data.CGIVersion;
        }

        if (typeof response.data.TrackingVersion !== 'undefined') {
          mAttributes.TrackingVersion = response.data.TrackingVersion;
        }

        console.log("Device Info Ready");
        mAttributes.DeviceInfoReady = true;
      },
      function(errorData) {
        mAttributes.GetFail = true;
        console.log("Device Info : ", errorData);
      }, '', true);
  };


  var getEventSourceOptions = this.getEventSourceOptions = function () {
    var getData = {};

    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=sourceoptions&action=view', getData,
      function(response) {
        mAttributes.EventSourceOptions = response.data.EventSources;

        console.log("EventSourceOptions Ready");
        mAttributes.EventSourceOptionsReady = true;
      },
      function(errorData) {
        if (mAttributes.DeviceType === 'NWC') {
          if (errorData !== 'Not Authorized') {
            mAttributes.GetFail = true;
            console.log("EventSourceOptions : ", errorData);
          }
        } else {
          mAttributes.EventSourceOptionsReady = true;
        }
      }, '', true);
  };


  var initialize = this.initialize = function(timeOutValue) {
    if (!isPhone) {
      var functionList = [];
      mAttributes.GetFail = false;

      if (!mAttributes.DeviceInfoReady) {
        functionList.push(getDeviceInfo);
      }

      if (!mAttributes.EventSourceOptionsReady) {
        functionList.push(getEventSourceOptions);
      }

      if (!mAttributes.AttributeSectionReady) {
        functionList.push(getAttributeSection);
      }

      if (!mAttributes.CgiSectionReady) {
        functionList.push(getCgiSection);
      }

      if (isAdmin()) {
        functionList.push(cameraView);
      }

      $q.seqAll(functionList).then(
        function() {
          mAttributes.retryCount = 0;
          (function wait() {
            if (!mAttributes.Ready && !mAttributes.GetFail) {
              $timeout(function() {
                if (mAttributes.DeviceInfoReady && mAttributes.CgiSectionReady && 
                    mAttributes.AttributeSectionReady) {
                  if (isAdmin() && mAttributes.EventSourceOptionsReady === false) {
                    console.log("event sources Waiting ..", mAttributes.retryCount);
                    mAttributes.retryCount++;

                    if (mAttributes.retryCount >= RETRY_COUNT) {
                      mAttributes.GetFail = true;
                    }
                  } else {
                    mAttributes.Ready = true;
                  }
                } else {
                  console.log("Waiting ..", mAttributes.retryCount);
                  mAttributes.retryCount++;

                  if (mAttributes.retryCount >= RETRY_COUNT) {
                    mAttributes.GetFail = true;
                  }
                }
                wait();
              }, timeOutValue);
            } else {
              var changedUrl = $location.absUrl();
              if (changedUrl.indexOf('login') === -1 && mAttributes.GetFail) {
                if (RESTCLIENT_CONFIG.serverType === 'grunt') {
                  console.log("Logging out");
                  SessionOfUserManager.unSetLogin();
                  LoginRedirect(); // jshint ignore:line
                } else {
                  console.log("Retry Call attributes");
                  initialize(TIMEOUT);
                }
              }
            }
          })();
        },
        function() {
          if (RESTCLIENT_CONFIG.serverType === 'grunt') {
            console.log("Logging out");
            SessionOfUserManager.unSetLogin();
            LoginRedirect(); // jshint ignore:line
          } else {
            console.log("Retry Call attributes");
            initialize(TIMEOUT);
          }
        }
      );
    }
  };

  this.get = function(cgiName) {
    var heightWithoutNavbar = $("body").height() - (17 + 71);
    $('#page-wrapper').css("min-height", heightWithoutNavbar + "px");

    if (mAttributes.CgiSectionReady === true) {
      if (typeof cgiName === 'undefined') {
        this.parseSystemCgiAttributes();
        this.parseMediaCgiAttributes();
        this.parseNetworkCgiAttributes();
        this.parseTransferCgiAttributes();
        this.parseSecurityCgiAttributes();
        this.parseEventStatusCgiAttributes();
        this.parseIOCgiAttributes();
        this.parseEventSourceCgiAttributes();
        this.parseRecordingCgiAttributes();
        this.parseEventRulesCgiAttributes();
        this.parseEventActionsCgiAttributes();
        this.parseImageCgiAttributes();
        this.parsePTZCgiAttributes();
        this.parseOpenSDKCgiAttributes();
      } else {
        switch (cgiName) {
          case "system":
            this.parseSystemCgiAttributes();
            break;
          case "media":
            this.parseMediaCgiAttributes();
            break;
          case "network":
            this.parseNetworkCgiAttributes();
            break;
          case "transfer":
            this.parseTransferCgiAttributes();
            break;
          case "security":
            this.parseSecurityCgiAttributes();
            break;
          case "eventstatus":
            this.parseEventStatusCgiAttributes();
            break;
          case "io":
            this.parseIOCgiAttributes();
            break;
          case "eventsources":
            this.parseEventSourceCgiAttributes();
            break;
          case "recording":
            this.parseRecordingCgiAttributes();
            break;
          case "eventrules":
            this.parseEventRulesCgiAttributes();
            break;
          case "eventactions":
            this.parseEventActionsCgiAttributes();
            break;
          case "image":
            this.parseImageCgiAttributes();
            break;
          case "ptz":
            this.parsePTZCgiAttributes();
            break;
          case "opensdk":
            this.parseOpenSDKCgiAttributes();
            break;
          default:

        }
      }

    }
    return mAttributes;
  };

  this.reset = function() {
    mAttributes = {};
  };

  this.isSupportGoToPreset = function() {
    return typeof mAttributes.EventLogTypes !== "undefined";
  };

  this.getPresetOptions = function() {
    var returnVal = false;
    try {
      if (this.isSupportGoToPreset()) {
        if (mAttributes.EventActions.indexOf("GoToPreset") >= 0) {
          setPresetOption();
          returnVal = mAttributes.PresetOptions;
        }
      } else {
        console.error("mAttributes.EventLogTypes is undefined");
      }
    } catch (err) {
      returnVal = mAttributes.PresetOptions;
      console.error(err);
    }

    return returnVal;
  };


  var isAdmin = function() {
    if (RESTCLIENT_CONFIG.serverType === 'grunt') {
      if (SessionOfUserManager.getUsername() === 'admin') {
        return true;
      } else {
        return false;
      }
    } else {
      if (SessionOfUserManager.getUsername() === 'admin') {
        return true;
      } else {
        return false;
      }
    }
  };


  var loginIPOLISWebNoDigest = function() {
    if (RESTCLIENT_CONFIG.serverType === 'camera') {
      SunapiClient.get(
        '/stw-cgi/security.cgi?msubmenu=users&action=view', {},
        function(response) {
          setAccountData(response);
          SessionOfUserManager.addSession(loginInfo.id, '', CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB);
          SessionOfUserManager.setLogin();
          initialize(TIMEOUT);
        },
        function(errorData) {
          loginIPOLISWebNoDigest();
          console.error(errorData);
        }, '', true);
    }
  };



  var setAccountData = function(response) {
    var accountInfo = {};
    var data = response.data.Users;

    if (data.length > 0) { //admin, user
      accountInfo = data[0];
    } else { //guest
      accountInfo.UserID = 'guest';
    }
    loginInfo.id = accountInfo.UserID;
  };


  if (!isPhone) {
    loginIPOLISWebNoDigest();
    /** Dont't initialize attributes during service initilization. It is causing password popup
     messages, it should be initilaized after login */
    if (RESTCLIENT_CONFIG.serverType === 'grunt') {
      console.log('Attributes is Logged in ', SessionOfUserManager.isLoggedin());
      if (SessionOfUserManager.isLoggedin() === true) {
        this.initialize(TIMEOUT);
      } else {
        console.log("Not LoggedIn");
        SessionOfUserManager.unSetLogin();
        LoginRedirect(); // jshint ignore:line
      }
    }

  }

});