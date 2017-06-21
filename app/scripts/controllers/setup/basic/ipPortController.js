kindFramework.controller('ipPortCtrl', function($scope, $timeout, $uibModal, $translate, SunapiClient, 
Attributes, COMMONUtils, $q) {
  "use strict";

  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();

  var pageData = {};


  $scope.tabs = ["IPAddress", "Port"];
  $scope.activeTab = $scope.tabs[0];
  $scope.Port = {
    RTSPTimeoutEnable: false
  };

  $scope.changeTab = function(tab) {
    $scope.activeTab = tab;
  };

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  $scope.OnIPv6TypeChange = function(ipType) {
    if (pageData.NetworkInterfaces[$scope.SelectedInterface].IPv6Type !== 'Auto') {
      if (ipType === 'Auto') {
        $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6Address = "";
        $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6PrefixLength = "";
      } else {
        $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6Address = pageData.NetworkInterfaces[$scope.SelectedInterface].IPv6Address;
        $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6PrefixLength = pageData.NetworkInterfaces[$scope.SelectedInterface].IPv6PrefixLength;
      }
    }
  };

  function getAttributes() {
    var deferred = $q.defer();

    $scope.DefaultPrefixLength = 64;
    $scope.MaxIPV4Len = mAttr.MaxIPV4Len;
    $scope.MaxIPV6Len = mAttr.MaxIPV6Len;
    $scope.SelectedInterface = 0;
    $scope.SelectedBandwidth = 0;
    $scope.IPv4Pattern = mAttr.IPv4;
    $scope.IPv6Pattern = mAttr.IPv6;
    $scope.DeviceType = mAttr.DeviceType;
    $scope.OnlyNumStr = mAttr.OnlyNumStr;
    $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
    $scope.IPv6PatternStr = mAttr.IPv6PatternStr;
    $scope.FriendlyNameCharSetNoSpaceStr = mAttr.FriendlyNameCharSetNoSpaceStr;
    $scope.IPv6DefaultAddress = mAttr.IPv6DefaultAddress;
    $scope.AlphaNumericDashStr = mAttr.AlphaNumericDashStr;
    $scope.CannotNumberDashFirst = mAttr.CannotNumberDashFirst;


    if (typeof mAttr.BwOptions !== "undefined") {
      $scope.BwOptions = mAttr.BwOptions;
    }

    if (typeof mAttr.InterfaceOptions !== "undefined") {
      $scope.InterfaceOptions = mAttr.InterfaceOptions;
    }

    if (typeof mAttr.IPv4TypeOptions !== "undefined") {
      $scope.IPv4TypeOptions = mAttr.IPv4TypeOptions;
    }

    if (typeof mAttr.IPv6TypeOptions !== 'undefined') {
      $scope.IPv6TypeOptions = mAttr.IPv6TypeOptions;
    }

    if (typeof mAttr.PrefixLength !== 'undefined') {
      $scope.PrefixMinLength = mAttr.PrefixLength.minValue;
      $scope.PrefixMaxLength = mAttr.PrefixLength.maxValue;
    }

    if (typeof mAttr.DnsTypeOptions !== 'undefined') {
      $scope.DnsTypeOptions = mAttr.DnsTypeOptions;
    }

    if (typeof mAttr.RtspTimeoutOptions !== 'undefined') {
      $scope.RtspTimeoutOptions = mAttr.RtspTimeoutOptions;
    }

    if (typeof mAttr.Http !== 'undefined') {
      $scope.HttpMinPort = mAttr.Http.minValue;
      $scope.HttpMaxPort = mAttr.Http.maxValue;
    }

    if (typeof mAttr.Https !== 'undefined') {
      $scope.HttpsMinPort = mAttr.Https.minValue;
      $scope.HttpsMaxPort = mAttr.Https.maxValue;
    }

    if (typeof mAttr.Rtsp !== 'undefined') {
      $scope.RtspMinPort = mAttr.Rtsp.minValue;
      $scope.RtspMaxPort = mAttr.Rtsp.maxValue;
    }

    // if (typeof mAttr.Svnp !== 'undefined')
    // {
    //     $scope.SvnpMinPort = mAttr.Svnp.minValue;
    //     $scope.SvnpMaxPort = mAttr.Svnp.maxValue;
    // }

    if (typeof mAttr.PPPoEUserName !== 'undefined') {
      $scope.IdMinLength = 1;
      $scope.IdMaxLength = mAttr.PPPoEUserName.maxLength;
    }

    if (typeof mAttr.PPPoEPassword !== 'undefined') {
      $scope.PwdMinLength = 1;
      $scope.PwdMaxLength = mAttr.PPPoEPassword.maxLength;
    }

    deferred.resolve('success');

    return deferred.promise;
  }

  function getInterfaces() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view', getData,
      function(response) {
        $scope.NetworkInterfaces = response.data.NetworkInterfaces;
        pageData.NetworkInterfaces = angular.copy($scope.NetworkInterfaces);

        for (var i = 0; i < $scope.NetworkInterfaces.length; i++) {
          if ($scope.NetworkInterfaces[i].IsDefaultGateway) {
            $scope.DefaultGateway = $scope.InterfaceOptions[i];
            pageData.DefaultGateway = angular.copy($scope.DefaultGateway);
            break;
          }
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getDNS() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=dns&action=view', getData,
      function(response) {
        $scope.DNS = response.data.DNS;
        pageData.DNS = angular.copy($scope.DNS);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getBandwidth() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=bandwidth&action=view', getData,
      function(response) {
        $scope.NetworkBandwidths = [];
        $scope.NetworkBandwidths[0] = response.data.NetworkBandwidths[0].Bandwidth; //In Mbps
        $scope.NetworkBandwidths[1] = response.data.NetworkBandwidths[0].Bandwidth * 1024; //In Kbps

        pageData.NetworkBandwidths = angular.copy($scope.NetworkBandwidths);

      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }
/*
  function getHttpPort() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=http&action=view', getData,
      function(response) {
        $scope.Http = response.data;
        pageData.Http = angular.copy($scope.Http);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getHttpsPort() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=https&action=view', getData,
      function(response) {
        $scope.Https = response.data;
        pageData.Https = angular.copy($scope.Https);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getRtspPort() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=rtsp&action=view', getData,
      function(response) {
        $scope.Rtsp = response.data;
        pageData.Rtsp = angular.copy($scope.Rtsp);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getSvnpPort() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=svnp&action=view', getData,
      function(response) {
        $scope.Svnp = response.data;
        pageData.Svnp = angular.copy($scope.Svnp);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }
*/
  function setInterfaces() {
    var setData = {};

    var index = $scope.SelectedInterface;

    if ($scope.DeviceType === 'NVR') {
      setData.InterfaceName = $scope.NetworkInterfaces[index].InterfaceName;
    }

    var ipv4ChangeCheck = false;
    var ipv6ChangeCheck = false;

    if ($scope.NetworkInterfaces[index].IPv4Type === 'Manual') {

      if ((pageData.NetworkInterfaces[index].IPv4Address !== $scope.NetworkInterfaces[index].IPv4Address) ||
        (pageData.NetworkInterfaces[index].IPv4Gateway !== $scope.NetworkInterfaces[index].IPv4Gateway) ||
        (pageData.NetworkInterfaces[index].IPv4SubnetMask !== $scope.NetworkInterfaces[index].IPv4SubnetMask) ||
        (pageData.NetworkInterfaces[index].HostName !== $scope.NetworkInterfaces[index].HostName)) {
        ipv4ChangeCheck = true;
      }
      setData.IPv4Address = pageData.NetworkInterfaces[index].IPv4Address = $scope.NetworkInterfaces[index].IPv4Address;
      setData.IPv4Gateway = pageData.NetworkInterfaces[index].IPv4Gateway = $scope.NetworkInterfaces[index].IPv4Gateway;
      setData.IPv4SubnetMask = pageData.NetworkInterfaces[index].IPv4SubnetMask = $scope.NetworkInterfaces[index].IPv4SubnetMask;
      if ($scope.NetworkInterfaces[index].HostName.length === 0) {
        setData.HostName = pageData.NetworkInterfaces[index].HostName;
      } else {
        setData.HostName = pageData.NetworkInterfaces[index].HostName = $scope.NetworkInterfaces[index].HostName;
      }
    } else if ($scope.NetworkInterfaces[index].IPv4Type === 'PPPoE') {

      if ((pageData.NetworkInterfaces[index].PPPoEUserName !== $scope.NetworkInterfaces[index].PPPoEUserName) ||
        (pageData.NetworkInterfaces[index].PPPoEPassword !== $scope.NetworkInterfaces[index].PPPoEPassword)) {
        ipv4ChangeCheck = true;
      }
      setData.PPPoEUserName = pageData.NetworkInterfaces[index].PPPoEUserName = $scope.NetworkInterfaces[index].PPPoEUserName;
      setData.PPPoEPassword = pageData.NetworkInterfaces[index].PPPoEPassword = $scope.NetworkInterfaces[index].PPPoEPassword;
    }


    if ($scope.NetworkInterfaces[index].IPv6Enable && $scope.NetworkInterfaces[index].IPv6Type === 'Manual') {

      if (pageData.NetworkInterfaces[index].IPv6Address !== $scope.NetworkInterfaces[index].IPv6Address ||
        pageData.NetworkInterfaces[index].IPv6PrefixLength !== $scope.NetworkInterfaces[index].IPv6PrefixLength ||
        pageData.NetworkInterfaces[index].IPv6DefaultGateway !== $scope.NetworkInterfaces[index].IPv6DefaultGateway
      ) {
        ipv6ChangeCheck = true;
      }
      setData.IPv6Address = pageData.NetworkInterfaces[index].IPv6Address = $scope.NetworkInterfaces[index].IPv6Address;
      setData.IPv6PrefixLength = pageData.NetworkInterfaces[index].IPv6PrefixLength = $scope.NetworkInterfaces[index].IPv6PrefixLength;
      setData.IPv6DefaultGateway = pageData.NetworkInterfaces[index].IPv6DefaultGateway = $scope.NetworkInterfaces[index].IPv6DefaultGateway;
    }


    if (pageData.NetworkInterfaces[index].IPv4Type !== $scope.NetworkInterfaces[index].IPv4Type ||
      ipv4ChangeCheck === true) {
      setData.IPv4Type = pageData.NetworkInterfaces[index].IPv4Type = $scope.NetworkInterfaces[index].IPv4Type;
    }

    if (pageData.NetworkInterfaces[index].IPv6Enable !== $scope.NetworkInterfaces[index].IPv6Enable ||
      ipv6ChangeCheck === true) {
      setData.IPv6Enable = pageData.NetworkInterfaces[index].IPv6Enable = $scope.NetworkInterfaces[index].IPv6Enable;
    }


    if ($scope.NetworkInterfaces[index].IPv6Enable) {
      if (pageData.NetworkInterfaces[index].IPv6Type !== $scope.NetworkInterfaces[index].IPv6Type ||
        ipv6ChangeCheck === true) {
        setData.IPv6Type = pageData.NetworkInterfaces[index].IPv6Type = $scope.NetworkInterfaces[index].IPv6Type;
      }
    }


    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=set', setData,
      function(response) {
        COMMONUtils.onLogout();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setDefaultGateway() {
    var setData = {};

    setData.InterfaceName = pageData.DefaultGateway = $scope.DefaultGateway;
    setData.IsDefaultGateway = "True";

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=set', setData,
      function(response) {

      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setBandwidth() {
    var setData = {};

    setData.InterfaceName = $scope.NetworkInterfaces[0].InterfaceName;

    if (pageData.NetworkBandwidths[0] !== $scope.NetworkBandwidths[0]) //Mbps
    {
      setData.Bandwidth = pageData.NetworkBandwidths[0] = $scope.NetworkBandwidths[0];
    } else if (pageData.NetworkBandwidths[1] !== $scope.NetworkBandwidths[1]) //Kbps
    {
      pageData.NetworkBandwidths[1] = $scope.NetworkBandwidths[1];
      setData.Bandwidth = $scope.NetworkBandwidths[1] / 1024;
    }

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=bandwidth&action=set', setData,
      function(response) {

      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setDNS() {
    var setData = {};
    if ($scope.DeviceType === 'NWC') {

      setData.PrimaryDNS = $scope.DNS[$scope.SelectedInterface].PrimaryDNS;
      setData.SecondaryDNS = $scope.DNS[$scope.SelectedInterface].SecondaryDNS;

      return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=dns&action=set', setData,
        function(response) {
          //  if(angular.equals(pageData.NetworkInterfaces, $scope.NetworkInterfaces))
          //  {
          //  var modalInstance = $uibModal.open({
          //      templateUrl: 'views/setup/common/errorMessage.html',
          //      controller: 'errorMessageCtrl',
          //      resolve: {
          //          Message: function () {
          //              return 'lang_msg_windowClose';
          //          },
          //          Header: function () {
          //              return 'lang_Confirm';
          //          }
          //      }
          //  }, '', true);

          //  modalInstance.result.then(COMMONUtils.onLogout, COMMONUtils.onLogout);
          // }
        },
        function(errorData) {
          console.log(errorData);
        });
    } else if ($scope.DeviceType === 'NVR') {
      var index = $scope.SelectedInterface;

      if (!angular.equals(pageData.DNS[index].DNSByIPType[0], $scope.DNS[index].DNSByIPType[0])) { //IPv4
     
        setData.InterfaceName = $scope.NetworkInterfaces[index].InterfaceName;
        setData.IPType = $scope.DNS[index].DNSByIPType[0].IPType;

        if (pageData.DNS[index].DNSByIPType[0].Type !== $scope.DNS[index].DNSByIPType[0].Type) {
          setData.Type = pageData.DNS[index].DNSByIPType[0].Type = $scope.DNS[index].DNSByIPType[0].Type;
        }

        if (pageData.DNS[index].DNSByIPType[0].PrimaryDNS !== $scope.DNS[index].DNSByIPType[0].PrimaryDNS) {
          setData.Type = pageData.DNS[index].DNSByIPType[0].Type = $scope.DNS[index].DNSByIPType[0].Type;
          setData.PrimaryDNS = pageData.DNS[index].DNSByIPType[0].PrimaryDNS = $scope.DNS[index].DNSByIPType[0].PrimaryDNS;
        }

        return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=dns&action=set', setData,
          function(response) {
            COMMONUtils.onLogout();
          },
          function(errorData) {
            console.log(errorData);
          }, '', true);
      }

      setData = {};

      if (!angular.equals(pageData.DNS[index].DNSByIPType[1], $scope.DNS[index].DNSByIPType[1])) { //IPv6
      
        setData.InterfaceName = $scope.NetworkInterfaces[index].InterfaceName;
        setData.IPType = $scope.DNS[index].DNSByIPType[1].IPType;

        if (pageData.DNS[index].DNSByIPType[1].Type !== $scope.DNS[index].DNSByIPType[1].Type) {
          setData.Type = pageData.DNS[index].DNSByIPType[1].Type = $scope.DNS[index].DNSByIPType[1].Type;
        }

        if (pageData.DNS[index].DNSByIPType[1].PrimaryDNS !== $scope.DNS[index].DNSByIPType[1].PrimaryDNS) {
          setData.Type = pageData.DNS[index].DNSByIPType[1].Type = $scope.DNS[index].DNSByIPType[1].Type;
          setData.PrimaryDNS = pageData.DNS[index].DNSByIPType[1].PrimaryDNS = $scope.DNS[index].DNSByIPType[1].PrimaryDNS;
        }

        return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=dns&action=set', setData,
          function(response) {
            COMMONUtils.onLogout();
          },
          function(errorData) {
            console.log(errorData);
          }, '', true);
      }
    }
  }

  function validatePortPage() {
    var errorMessage = '';
    if ($scope.DeviceType === 'NWC') {
      //  var DevicePort = parseInt($scope.PortConf.DevicePort);
      // if (isNaN(DevicePort) || DevicePort === 3702 || DevicePort === 49152 || DevicePort < $scope.SvnpMinPort || DevicePort > $scope.SvnpMaxPort)
      // {
      //     var ErrorMessage = 'lang_msg_errDeviceport';
      //     COMMONUtils.ShowError(ErrorMessage,'lg');
      //     return false;
      // }
    }

    var RTSPPort = parseInt($scope.PortConf.RTSPPort);
    if (isNaN(RTSPPort)) {
      errorMessage = 'lang_msg_errRTSPport';
      COMMONUtils.ShowError(errorMessage, 'lg');
      return false;
    }

    var HTTPSPort = parseInt($scope.PortConf.HTTPSPort);
    if (isNaN(HTTPSPort)) {
      errorMessage = 'lang_msg_errHTTPSport';
      COMMONUtils.ShowError(errorMessage, 'lg');
      return false;
    }

    var HTTPPort = parseInt($scope.PortConf.HTTPPort);
    if (isNaN(HTTPPort)) {
      errorMessage = 'lang_msg_errHTTPport';
      COMMONUtils.ShowError(errorMessage, 'lg');
      return false;
    }

    if (HTTPPort === HTTPSPort || HTTPPort === RTSPPort || RTSPPort === HTTPSPort) {
      errorMessage = 'lang_msg_portOverlap';
      COMMONUtils.ShowError(errorMessage, 'lg');
      return false;
    }

    if (RTSPPort === 3702 || RTSPPort === 49152 || RTSPPort === 4520 || RTSPPort < $scope.RtspMinPort || RTSPPort > $scope.RtspMaxPort) {
      if (RTSPPort !== 554) {
        console.log("Wrong Rtsp");
        errorMessage = 'lang_msg_errRTSPport';
        COMMONUtils.ShowError(errorMessage, 'lg');
        return false;
      }
    }

    if (HTTPPort === 3702 || HTTPPort === 49152 || HTTPPort === 4520 || HTTPPort < $scope.HttpMinPort || HTTPPort > $scope.HttpMaxPort) {
      if (HTTPPort !== 80) {
        errorMessage = 'lang_msg_errHTTPport';
        COMMONUtils.ShowError(errorMessage, 'lg');
        return false;
      }
    }

    if (HTTPSPort === 3702 || HTTPSPort === 49152 || HTTPSPort === 4520 || HTTPSPort < $scope.HttpsMinPort || HTTPSPort > $scope.HttpsMaxPort) {
      if (HTTPSPort !== 443) {
        errorMessage = 'lang_msg_errHTTPSport';
        COMMONUtils.ShowError(errorMessage, 'lg');
        return false;
      }
    }

    return true;
  }


  function checkIPv4DNS(addr) {
    if (addr === '') {
      return false;
    }

    var dnsArray1=[], thisSegment=0;
    if (addr.search(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) !== -1) {
      dnsArray1 = addr.split(/\./);
    }

    thisSegment = dnsArray1[0];
    if (thisSegment < 1 || thisSegment > 223) {
      return false;
    }

    for (var i = 1; i < 3; i++) {
      thisSegment = dnsArray1[i];
      if (thisSegment > 255) {
        return false;
      }
    }

    thisSegment = dnsArray1[3];
    if (thisSegment > 254) {
      return false;
    }

    return true;
  }

  function validateIPPage() {
    var errorMessage = '';
    if ($scope.$$childHead.ipPortForm.Ipv4Address.$invalid) {
      errorMessage = 'lang_msg_chkIPAddress';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }
    var index = $scope.SelectedInterface;

    if (COMMONUtils.CheckValidIPv4Address($scope.NetworkInterfaces[index].IPv4Address) === false) {
      errorMessage= 'lang_msg_chkIPAddress';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if ($scope.$$childHead.ipPortForm.Ipv4Subnet.$invalid) {
      errorMessage = 'lang_msg_chkSubnetMask';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if (COMMONUtils.CheckValidIPv4Subnet($scope.NetworkInterfaces[index].IPv4SubnetMask) === false) {
      errorMessage = 'lang_msg_chkSubnetMask';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if ($scope.$$childHead.ipPortForm.Ipv4Gateway.$invalid) {
      errorMessage = 'lang_msg_chkGateway';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if (COMMONUtils.CheckValidIPv4Address($scope.NetworkInterfaces[index].IPv4Gateway) === false) {
      errorMessage = 'lang_msg_chkGateway';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if (validateHostName($scope.NetworkInterfaces[$scope.SelectedInterface].HostName) === 'fisrtCharAlphabet') {
      errorMessage = 'lang_msg_first_character_alphabet';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if (validateHostName($scope.NetworkInterfaces[$scope.SelectedInterface].HostName) === 'upto16Char') {
      errorMessage = 'lang_msg_allowed_upto_16_chars';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if ($scope.DeviceType === 'NWC') {
      if ($scope.$$childHead.ipPortForm.Dns1.$invalid) {
        errorMessage= 'lang_msg_chkDNSserver1';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if (COMMONUtils.CheckValidIPv4Address($scope.DNS[index].PrimaryDNS) === false) {
        errorMessage = 'lang_msg_chkDNSserver1';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if ($scope.$$childHead.ipPortForm.Dns2.$invalid) {
        errorMessage = 'lang_msg_chkDNSserver2';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if (COMMONUtils.CheckValidIPv4Address($scope.DNS[index].SecondaryDNS) === false) {
        errorMessage = 'lang_msg_chkDNSserver2';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }


      if (checkIPv4DNS($scope.DNS[index].PrimaryDNS) === false) {
        COMMONUtils.ShowError('lang_msg_chkDNSserver1');
        return false;
      }

      if (checkIPv4DNS($scope.DNS[index].SecondaryDNS) === false) {
        COMMONUtils.ShowError('lang_msg_chkDNSserver2');
        return false;
      }
    }

    var ip_num = COMMONUtils.IPv4ToNum($scope.NetworkInterfaces[index].IPv4Address);
    var gw_num = COMMONUtils.IPv4ToNum($scope.NetworkInterfaces[index].IPv4Gateway);
    var sm_num = COMMONUtils.IPv4ToNum($scope.NetworkInterfaces[index].IPv4SubnetMask);
    var not_sm_num = COMMONUtils.IPv4ToNumNot($scope.NetworkInterfaces[index].IPv4SubnetMask);

    if (ip_num == gw_num) {
      errorMessage = 'lang_msg_chkIPAddress';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if (((ip_num & not_sm_num) == not_sm_num) || ((ip_num & not_sm_num) == 0) || ((ip_num & sm_num) == 0)) {
      errorMessage = 'lang_msg_chkIPAddress';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if (((gw_num & not_sm_num) == not_sm_num) || ((gw_num & not_sm_num) == 0) || ((gw_num & sm_num) == 0)) {
      errorMessage = 'lang_msg_chkGateway';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if ((ip_num & sm_num) != (gw_num & sm_num)) {
      errorMessage = 'lang_msg_chkIPAddress';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if ($scope.NetworkInterfaces[$scope.SelectedInterface].IPv6Enable && $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6Type === 'Manual') {
      if ($scope.$$childHead.ipPortForm.Ipv6Address.$invalid) {
        errorMessage = 'lang_msg_chkIPv6Address';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if (COMMONUtils.CheckValidIPv6Address($scope.NetworkInterfaces[$scope.SelectedInterface].IPv6Address) === false) {
        errorMessage = 'lang_msg_chkIPv6Address';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if ($scope.$$childHead.ipPortForm.PrefixLength.$invalid || $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6PrefixLength > $scope.PrefixMaxLength ||
        $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6PrefixLength < $scope.PrefixMinLength) {
        errorMessage = 'lang_msg_IPv6Prefix0to127';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if ($scope.$$childHead.ipPortForm.Ipv6Gateway.$invalid) {
        errorMessage = 'lang_msg_chkGateway';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if (COMMONUtils.CheckValidIPv6Address($scope.NetworkInterfaces[$scope.SelectedInterface].IPv6DefaultGateway) === false) {
        errorMessage = 'lang_msg_chkGateway';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if ($scope.NetworkInterfaces[$scope.SelectedInterface].IPv6Address === $scope.NetworkInterfaces[$scope.SelectedInterface].IPv6DefaultGateway) {
        errorMessage = 'lang_msg_chkGateway';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }
    }

    if ($scope.NetworkInterfaces[$scope.SelectedInterface].IPv4Type === 'PPPoE') {
      if (typeof $scope.NetworkInterfaces[$scope.SelectedInterface].PPPoEUserName !== 'undefined' && !$scope.NetworkInterfaces[$scope.SelectedInterface].PPPoEUserName.length) {
        errorMessage = 'lang_msg_inputxDSLid';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if (typeof $scope.NetworkInterfaces[$scope.SelectedInterface].PPPoEPassword !== 'undefined' && !$scope.NetworkInterfaces[$scope.SelectedInterface].PPPoEPassword.length) {
        errorMessage = 'lang_msg_inputxDSLPass';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      if (($scope.$$childHead.ipPortForm.PPPoEId.$invalid) || ($scope.$$childHead.ipPortForm.PPPoEPwd.$invalid)) {
        errorMessage = 'lang_msg_invalid_idpw';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }
    }

    return true;
  }

  function validateHostName(hostNamechk) {
    if (typeof hostNamechk !== 'undefined') {
      if (hostNamechk.length > 16) {
        return 'upto16Char';
      }
      if ($scope.CannotNumberDashFirst.test(hostNamechk.slice(0, 1))) {
        return 'fisrtCharAlphabet';
      }
    }
    return true;
  }

  function viewIP() {
    getAttributes();
    var promises = [];
    promises.push(getInterfaces);
    promises.push(getDNS);

    if ($scope.DeviceType === "NVR") {
      promises.push(getBandwidth);
    }

    if (promises.length > 0) {
      $q.seqAll(promises).then(function() {
        $scope.pageLoaded = true;

      }, function(errorData) {});
    }

  }

  function viewPortConf() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=portconf&action=view', getData,
      function(response) {
        $timeout(function() {
          $scope.PortConf = response.data;
          if ($scope.PortConf.RTSPTimeout === '0s') {
            $scope.Port.RTSPTimeoutEnable = false;
          } else {
            $scope.Port.RTSPTimeoutEnable = true;
          }
          pageData.PortConf = angular.copy($scope.PortConf);
        }, 100);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setRTSPTimeout() {
    if ($scope.Port.RTSPTimeoutEnable) {
      $scope.PortConf.RTSPTimeout = angular.copy('60s');
    } else {
      $scope.PortConf.RTSPTimeout = angular.copy('0s');
    }
  }

  function setPortConf() {
    var setData = {},
      ignoredKeys= ['FixedPorts', 'UsedPorts'];

    COMMONUtils.fillSetData(setData, $scope.PortConf, pageData.PortConf, ignoredKeys, false);

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=portconf&action=set', setData,
      function(response) {
        if ($scope.PortConf.HTTPPort !== pageData.PortConf.HTTPPort || $scope.PortConf.HTTPSPort !== pageData.PortConf.HTTPSPort ||
          $scope.PortConf.RTSPPort !== pageData.PortConf.RTSPPort) {
          COMMONUtils.onLogout();
        } else {
          COMMONUtils.updatePageData($scope.PortConf, pageData.PortConf, ignoredKeys);
        }

      },
      function(errorData) {
        console.log(errorData);
        $scope.PortConf = angular.copy(pageData.PortConf);
      }, '', true);

  }

  function viewPort() {
    /*getHttpPort();
    getHttpsPort();
    getRtspPort();

    if ($scope.DeviceType === "NWC")
    {
        getSvnpPort();
    }*/
    viewPortConf();
    $scope.pageLoaded = true;
  }

  function setPort() {
    if (validatePortPage()) {
      setRTSPTimeout();
      if (!angular.equals(pageData.PortConf, $scope.PortConf)) {
        COMMONUtils.ShowConfirmation(function() {
          setPortConf();
        }, 
        'lang_msg_confirmInterface',
        'sm',
        function() {
        });
      }
    }
    return true;
  }

  function setIP() {
    var promises = [];
    if (validateIPPage()) {
      if (!angular.equals(pageData.DefaultGateway, $scope.DefaultGateway) || !angular.equals(pageData.NetworkBandwidths, $scope.NetworkBandwidths) || !angular.equals(pageData.DNS, $scope.DNS) || !angular.equals(pageData.NetworkInterfaces, $scope.NetworkInterfaces)) {
        COMMONUtils.ShowConfirmation(function() {
          if ($scope.DeviceType === 'NVR') {
            if (!angular.equals(pageData.DefaultGateway, $scope.DefaultGateway) || !angular.equals(pageData.NetworkBandwidths, $scope.NetworkBandwidths)) {
              if (!angular.equals(pageData.DefaultGateway, $scope.DefaultGateway)) {
                setDefaultGateway();
              }

              if (!angular.equals(pageData.NetworkBandwidths, $scope.NetworkBandwidths)) {
                setBandwidth();
              }
            }
          }

          if (!angular.equals(pageData.DNS, $scope.DNS)) {
            promises.push(setDNS);
            promises.push(getDNS);
          }

          if (!angular.equals(pageData.NetworkInterfaces, $scope.NetworkInterfaces)) {
            promises.push(setInterfaces);
          }

          if (promises.length > 0) {
            $q.seqAll(promises).then(function() {

            }, function(errorData) {});
          }
        }, 
        'lang_msg_confirmInterface',
        'sm',
        function() {

        });
      }
    }
  }

  $scope.submitIP = setIP;
  $scope.submitPort = setPort;
  $scope.viewIP = viewIP;
  $scope.viewPort = viewPort;

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      $q.seqAll([getAttributes, getInterfaces, getDNS]).then(
        function(result) {
          $scope.pageLoaded = true;
          if ($scope.DeviceType === "NVR") {
            getBandwidth().then(
              function(result) {
                viewPortConf.then(
                  function(result) {
                    $scope.pageLoaded = true;
                  },
                  function(error) {
                    console.log(error);
                  });
              },
              function(error) {
                console.log(error);
              });
          } else {
            viewPortConf().then(
              function(result) {
                $scope.pageLoaded = true;
              },
              function(error) {
                console.log(error);
              });
          }
        },
        function(error) {
          console.log(error);
        });

      // viewIP();
      // viewPort();
    }
  })();
});