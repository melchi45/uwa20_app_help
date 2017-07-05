kindFramework.controller('ipfilteringCtrl', function($scope, $timeout, COMMONUtils, 
SunapiClient, XMLParser, Attributes, $q) {
  "use strict";

  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();
  $scope.data = {};
  $scope.data.selected4 = 1;
  $scope.data.selected6 = 1;
  $scope.originalIPv4Length = 0;
  $scope.originalIPv6Length = 0;

  $scope.ClientIPAddr = {};
  var pageData = {};

  function featureDetection() {
    $scope.MaxIPV4Len = mAttr.MaxIPV4Len;
    $scope.MaxIPV6Len = mAttr.MaxIPV6Len;

    $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
    $scope.IPv6PatternStr = mAttr.IPv6PatternStr;

    $scope.OnlyNumStr = mAttr.OnlyNumStr;

    var MaskRangeIPv4 = {};
    MaskRangeIPv4.min = 1;
    MaskRangeIPv4.max = 32;
    var MaskRangeIPv6 = {};
    MaskRangeIPv6.min = 1;
    MaskRangeIPv6.max = 128;

    $scope.MaskRangeIPv4 = MaskRangeIPv4;
    $scope.MaskRangeIPv6 = MaskRangeIPv6;

    $scope.MaskRangeIPv4Strlen = MaskRangeIPv4.max.toString().length;
    $scope.MaskRangeIPv6Strlen = MaskRangeIPv6.max.toString().length;

    $scope.IPv4Pattern = mAttr.IPv4;
    $scope.IPv6Pattern = mAttr.IPv6;
  }


  function CalculateFilterRangeIPV4(IPAddrV4, PrefixxV4) {
    var maskData = parseInt(PrefixxV4, 10);
    var inval = "";
    if (isNaN(maskData) || maskData < 1) {
      return inval;
    }

    if (maskData >= 32) {
      return IPAddrV4;
    } else {
      var minMask = 0;
      var maxMask = 0;
      var minIP = IPAddrV4.split(".");
      var maxIP = IPAddrV4.split(".");

      if (minIP.length < 4) {
        return inval;
      }

      var div = parseInt(maskData / 8);
      var mod = parseInt(maskData % 8);
      var i = 0;
      var temp = null;

      if (mod !== 0) {

        for (i = (8 - mod); i < 8; i++) {
          temp = 1 << i;
          minMask |= temp;
        }
      }

      var tempIP = parseInt(minIP[div]);
      minIP[div] = tempIP & minMask;

      for (i = div + 1; i < 4; i++) {
        minIP[i] = 0;
      }

      if (mod !== 0) {
        for (i = 0; i < (8 - mod); i++) {
          temp = 1 << i;
          maxMask |= temp;
        }
      } else {
        maxMask = 0xff;
      }

      tempIP = parseInt(maxIP[div]);
      maxIP[div] = tempIP | maxMask;
      for (i = div + 1; i < 4; i++) {
        maxIP[i] = 255;
      }

      var filterMsg = minIP[0] + "." + minIP[1] + "." + minIP[2] + "." + minIP[3] + 
                    " ~ " + maxIP[0] + "." + maxIP[1] + "." + maxIP[2] + "." + maxIP[3];
      return filterMsg;
    }
  }

  function SplitIPv6Address(addrVal) {
    var ipVal = addrVal.split(":");
    var frontValCnt = 0;
    var backValCnt = 0;
    var backAddr = new Array();
    var index = 0;

    for (index = 0; index < ipVal.length; ++index) {
      if (ipVal[index].length === 0) {
        for (var index2 = index; index2 < ipVal.length; ++index2) {
          if (ipVal[index2].length !== 0) {
            backAddr[backValCnt] = ipVal[index2];
            backValCnt++;
          }
        }
        break;
      }
      frontValCnt++;
    }

    for (index = 0; index < backValCnt; ++index) {
      ipVal[8 - (backValCnt - index)] = backAddr[index];
    }

    var offset = 8 - (frontValCnt + backValCnt);
    for (index = frontValCnt; index < (frontValCnt + offset); ++index) {
      ipVal[index] = 0;
    }

    return ipVal;
  }

  function GetAddrBinary(addrVal, valLength) {
    var ipBinaryVal = 0;
    for (var i = 0; i < valLength; ++i) {
      var binVal = 0;
      if (addrVal.charAt(i) === 'f' || addrVal.charAt(i) === 'F') {
        binVal = 15;
      } else if (addrVal.charAt(i) === 'e' || addrVal.charAt(i) === 'E') {
        binVal = 14;
      } else if (addrVal.charAt(i) === 'd' || addrVal.charAt(i) === 'D') {
        binVal = 13;
      } else if (addrVal.charAt(i) === 'c' || addrVal.charAt(i) === 'C') {
        binVal = 12;
      } else if (addrVal.charAt(i) === 'b' || addrVal.charAt(i) === 'B') {
        binVal = 11;
      } else if (addrVal.charAt(i) === 'a' || addrVal.charAt(0) === 'A') {
        binVal = 10;
      } else {
        binVal = addrVal.charAt(i);
        ipBinaryVal = ipBinaryVal << 4;
        ipBinaryVal |= binVal;
      }
      
    }
    return ipBinaryVal;
  }

  function CalculateFilterRangeIPV6(IPAddrV6, PrefixxV6) {
    var inval = "";
    var maskData = parseInt(PrefixxV6, 10);

    if (isNaN(maskData) || maskData < 1) {
      return inval;
    }

    if (maskData >= 128) {
      if (typeof IPAddrV6 === 'undefined') {
        return inval;
      }
      return IPAddrV6.toLowerCase();
    } else {
      var minMask = 0;
      var maxMask = 0;
      var minIP = SplitIPv6Address(IPAddrV6.toLowerCase());
      var maxIP = SplitIPv6Address(IPAddrV6.toLowerCase());
      var div = parseInt(maskData / 16);
      var mod = parseInt(maskData % 16);
      var i = 0;
      var temp = null;

      if (mod !== 0) {
        for (i = (16 - mod); i < 16; i++) {
          temp = 1 << i;
          minMask |= temp;
        }
      }

      minIP[div] = (GetAddrBinary(minIP[div], minIP[div].length) & minMask).toString(16);


      for (i = div + 1; i < 8; i++) {
        minIP[i] = 0;
      }

      if (mod !== 0) {
        for (i = 0; i < (16 - mod); i++) {
          temp = 1 << i;
          maxMask |= temp;
        }
      } else {
        maxMask = 65535;
      }

      maxIP[div] = (GetAddrBinary(maxIP[div], maxIP[div].length) | maxMask).toString(16);
      for (i = div + 1; i < 8; i++) {
        maxIP[i] = "ffff";
      }

      var filterMsg = minIP[0] + ":" + minIP[1] + ":" + minIP[2] + ":" + minIP[3] + ":" + 
                      minIP[4] + ":" + minIP[5] + ":" + minIP[6] + ":" + minIP[7] + " ~ " +
                      maxIP[0] + ":" + maxIP[1] + ":" + maxIP[2] + ":" + maxIP[3] + ":" + 
                      maxIP[4] + ":" + maxIP[5] + ":" + maxIP[6] + ":" + maxIP[7];

      return filterMsg;
    }
  }


  function CalSubnetMask(PrefixxV4) {
    var prefix = parseInt(PrefixxV4, 10);
    var dataVal = new Array("255", "254", "252", "248", "240", "224", "192", "128", "0");
    var prefixVal = "";

    if (prefix >= 24) {
      prefixVal = "255.255.255.";
      prefixVal += dataVal[32 - prefix];
    } else if (prefix >= 16) {
      prefixVal = "255.255.";
      prefixVal += dataVal[24 - prefix] + ".0";
    } else if (prefix >= 8) {
      prefixVal = "255.";
      prefixVal += dataVal[16 - prefix] + ".0.0";
    } else {
      prefixVal += dataVal[8 - prefix] + ".0.0.0";
    }

    return prefixVal;
  }


  function CurrentIPInRangeIPv4(curIP, myIP, prefix4) {
    var ipv4Addr = curIP.split(".");
    var myip = myIP.split(".");
    var ip32 = (ipv4Addr[0] << 24) | (ipv4Addr[1] << 16) | (ipv4Addr[2] << 8) | ipv4Addr[3];
    var subnetaddr = CalSubnetMask(prefix4).split(".");
    var nm32 = (subnetaddr[0] << 24) | (subnetaddr[1] << 16) | (subnetaddr[2] << 8) | subnetaddr[3];
    var myIp32 = (myip[0] << 24) | (myip[1] << 16) | (myip[2] << 8) | myip[3];
    if ((ip32 & nm32) === (myIp32 & nm32)) {
      return true;
    }
    return false;
  }


  function CurrentIPInRangeIPv6(curIP, MyIP, prefix) {
    var inputIP = SplitIPv6Address(curIP.toLowerCase());
    var myIP = SplitIPv6Address(MyIP.toLowerCase());

    if (prefix === 128) {
      if (inputIP[0] === myIP[0] && inputIP[1] === myIP[1] && 
          inputIP[2] === myIP[2] && inputIP[3] === myIP[3] &&
          inputIP[4] === myIP[4] && inputIP[5] === myIP[5] && 
          inputIP[6] === myIP[6] && inputIP[7] === myIP[7]) {
        return true;
      }

      return false;
    } else {
      var minMask = 0;
      var maxMask = 0;
      var minIP = SplitIPv6Address(curIP.toLowerCase());
      var maxIP = SplitIPv6Address(curIP.toLowerCase());
      var div = parseInt(prefix / 16);
      var mod = parseInt(prefix % 16);
      var i = 0;
      var temp = null;

      if (mod !== 0) {
        for (i = (16 - mod); i < 16; i++) {
          temp = 1 << i;
          minMask |= temp;
        }
      }
      minIP[div] = (GetAddrBinary(minIP[div], minIP[div].length) & minMask).toString(16);

      for (i = div + 1; i < 8; i++) {
        minIP[i] = 0;
      }

      if (mod !== 0) {
        for (i = 0; i < (16 - mod); i++) {
          temp = 1 << i;
          maxMask |= temp;
        }
      } else {
        maxMask = 65535;
      }

      maxIP[div] = (GetAddrBinary(maxIP[div], maxIP[div].length) | maxMask).toString(16);

      for (i = div + 1; i < 8; i++) {
        maxIP[i] = "ffff";
      }

      var isMatch = false;

      for (var ix = 0; ix < 8; ++ix) {
        if (minIP[ix].toString(10) < myIP[ix].toString(10) && 
            myIP[ix].toString(10) < maxIP[ix].toString(10)) {
          isMatch = true;
          break;
        } else if (minIP[ix] === myIP[ix] || myIP[ix] === maxIP[ix]) {
          if (ix === 7) {
            if (minIP[ix] === myIP[ix] || myIP[ix] === maxIP[ix]) {
              isMatch = true;
              break;
            }
          }
          continue;
        } else {
          break;
        }
      }
      if (isMatch === true) {
        return true;
      }
    }
    return false;
  }

  // function GetMyIPv6Address(addrVal) {
  //   var retVal = addrVal.indexOf(".");
  //   if (retVal != -1) {
  //     var splitIP = addrVal.split(":");
  //     var ipv4Addr = (splitIP[splitIP.length - 1]).split(".");
  //     var tempAddr1 = (ipv4Addr[0] << 8) | ipv4Addr[1];
  //     var tempAddr2 = (ipv4Addr[2] << 8) | ipv4Addr[3];
  //     tempAddr1 = tempAddr1.toString(16);
  //     tempAddr2 = tempAddr2.toString(16);
  //     addrVal = "";
  //     for (var index = 0; index < (splitIP.length - 1); ++index) {
  //       addrVal += splitIP[index] + ":";
  //     }
  //     addrVal += tempAddr1 + ":" + tempAddr2;
  //   }

  //   return addrVal;
  // }



  function getClientIP() {
    var jData = null;
    return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=getclientip&action=view', jData,
      function(response) {
        $scope.ClientIPAddr = response.data.ClientIP;
      },
      function(errorData) {
        console.log(errorData);
      }, '', true).finally(function() {
        $scope.pageLoaded = true;
      });
  }


  function view(updateTypeData) {
    var updateType = updateTypeData;
    var jData = null;

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=view', jData,
        function(response) {
          pageData = angular.copy(response.data);

          if (typeof updateType === 'undefined') {
            updateType = "all";
          }


          if (updateType === "IPv4" || updateType === "all") {
            $scope.originalIPv4Length = 0;
            $scope.data.selected4 = 1;
            $scope.data.selected6 = 1;
            $scope.FilterIPv4 = [];
          }

          if (updateType === "IPv6" || updateType === "all") {
            $scope.originalIPv6Length = 0;
            $scope.data.selected4 = 1;
            $scope.data.selected6 = 1;
            $scope.FilterIPv6 = [];
          }

          $scope.data.DeviceType = mAttr.DeviceType;
          $scope.IPFilters = response.data.IPFilters;

          if ($scope.data.DeviceType === 'NWC') {
            $scope.data.AccessType = response.data.AccessType;

          } else {
            $scope.data.AccessTypeIPv4 = "Deny";
            $scope.data.AccessTypeIPv6 = "Deny";
          }

          var idx = 0;
          for (idx = 0; idx < response.data.IPFilters.length; idx = idx + 1) {
            var filterIdx = 0;

            if (response.data.IPFilters[idx].IPType === "IPv4") {
              if (updateType === "IPv6") {
                continue;
              }

              if ($scope.data.DeviceType !== 'NWC') {
                $scope.data.AccessTypeIPv4 = response.data.IPFilters[idx].AccessType;
              }
              $scope.FilterIPv4 = response.data.IPFilters[idx].Filters;

              $scope.originalIPv4Length = $scope.FilterIPv4.length;
              for (filterIdx = 0; filterIdx < $scope.FilterIPv4.length; filterIdx = filterIdx + 1) {
                $scope.FilterIPv4[filterIdx].Range = 
                  CalculateFilterRangeIPV4($scope.FilterIPv4[filterIdx].Address, 
                                          $scope.FilterIPv4[filterIdx].Mask);
                $scope.FilterIPv4[filterIdx].isNew = false;
                $scope.FilterIPv4[filterIdx].isUpdated = false;
                $scope.FilterIPv4[filterIdx].ind = filterIdx + 1;
              }

            } else {

              if (updateType === "IPv4") {
                continue;
              }

              if ($scope.data.DeviceType !== 'NWC') {
                $scope.data.AccessTypeIPv6 = response.data.IPFilters[idx].AccessType;
              }
              $scope.FilterIPv6 = response.data.IPFilters[idx].Filters;
              
              $scope.originalIPv6Length = $scope.FilterIPv6.length;
              for (filterIdx = 0; filterIdx < $scope.FilterIPv6.length; filterIdx += 1) {
                $scope.FilterIPv6[filterIdx].Range = 
                  CalculateFilterRangeIPV6($scope.FilterIPv6[filterIdx].Address, 
                                          $scope.FilterIPv6[filterIdx].Mask);
                $scope.FilterIPv6[filterIdx].isNew = false;
                $scope.FilterIPv6[filterIdx].isUpdated = false;
                $scope.FilterIPv6[filterIdx].ind = filterIdx + 1;
              }
            }
          }
        },
        function(errorData) {
          console.log(errorData);
        }, '', true).finally(function() {
          featureDetection();
        });
  }

  function IPRangeCheck4 (pcIp, range) {
    var selfIp = null;
    var rangeIp = null;

    var splitRangeIp1 = null;
    var splitRangeIp2 = null;

    var IPCondition = true;

    selfIp = pcIp.split(".");

    if( range.indexOf("~") !== -1 ) {
      rangeIp = range.split(" ~ ");

      splitRangeIp1 = rangeIp[0].split(".");
      splitRangeIp2 = rangeIp[1].split(".");

      $.each(selfIp, function(index, data) {
        selfIp[index] = parseInt(data);
      })

      $.each(splitRangeIp1, function(index, data) {
        splitRangeIp1[index] = parseInt(data);
      })

      $.each(splitRangeIp2, function(index, data) {
        splitRangeIp2[index] = parseInt(data);
      })

      if ( selfIp[0] >= splitRangeIp1[0] && selfIp[0] <= splitRangeIp2[0] ) {

        if ( selfIp[1] >= splitRangeIp1[1] && selfIp[1] <= splitRangeIp2[1] ) {

          if ( selfIp[2] >= splitRangeIp1[2] && selfIp[2] <= splitRangeIp2[2] ) {

            if ( selfIp[3] >= splitRangeIp1[3] && selfIp[3] <= splitRangeIp2[3] ) {
              IPCondition = false;
            }
          }
        }
      }


    } else {

      if ( pcIp === range ) {
        IPCondition = false;
      }
    
    }

    return IPCondition;
  }


  function updateIPv4(selected4) {
    var filterIdx = 0;
    for (filterIdx = 0; filterIdx < $scope.FilterIPv4.length; filterIdx += 1) {
      if ($scope.FilterIPv4[filterIdx].ind === selected4) {
        $scope.FilterIPv4[filterIdx].Range = 
          CalculateFilterRangeIPV4($scope.FilterIPv4[filterIdx].Address,
                                  $scope.FilterIPv4[filterIdx].Mask);
        $scope.FilterIPv4[filterIdx].isUpdated = true;
      }
    }
  }

  function updateIPv6(selected6) {
    var filterIdx = 0;
    for (filterIdx = 0; filterIdx < $scope.FilterIPv6.length; filterIdx += 1) {
      if ($scope.FilterIPv6[filterIdx].ind === selected6) {
        $scope.FilterIPv6[filterIdx].Range = 
          CalculateFilterRangeIPV6($scope.FilterIPv6[filterIdx].Address, 
                                  $scope.FilterIPv6[filterIdx].Mask);
        $scope.FilterIPv6[filterIdx].isUpdated = true;
      }
    }
  }

  function addCheck4() {
    if (typeof $scope.FilterIPv4 !== 'undefined') {
      if ($scope.FilterIPv4.length >= mAttr.MaxIPv4Filter) {
        return true;
      }
      if ($scope.originalIPv4Length !== $scope.FilterIPv4.length) {
        return true;
      }
    }
    return false;
  }

  function addCheck6() {
    if (typeof $scope.FilterIPv6 !== 'undefined') {
      if ($scope.FilterIPv6.length >= mAttr.MaxIPv6Filter) {
        return true;
      }
      if ($scope.originalIPv6Length !== $scope.FilterIPv6.length) {
        return true;
      }
    }
    return false;
  }

  function addFilter4() {
    if (typeof $scope.FilterIPv4 !== 'undefined') {
      if ($scope.FilterIPv4.length >= mAttr.MaxIPv4Filter) {
        return;
      }
      if ($scope.originalIPv4Length === $scope.FilterIPv4.length) {
        var jData = {};
        jData.Address = "";
        jData.Mask = 32;
        jData.Enable = true;
        jData.isNew = true;
        jData.isUpdated = false;
        jData.IPIndex = findIP4Index();
        jData.Range = "";
        jData.ind = $scope.FilterIPv4.length + 1;
        $scope.data.selected4 = $scope.FilterIPv4.length + 1;
        $scope.FilterIPv4[$scope.FilterIPv4.length] = jData;
      }
    }
  }

  function findIP4Index() {
    var ret = -1;
    for (var j = 1; j <= mAttr.MaxIPv4Filter; j++) {
      var found = false;
      for (var i = 0; i < $scope.FilterIPv4.length; i++) {
        if ($scope.FilterIPv4[i].IPIndex === j) {
          found = true;
          break;
        }
      }

      if (found === false) {
        ret = j;
        return ret;
      }
    }
    return ret;
  }

  function findIP6Index() {
    var ret = -1;
    for (var j = 1; j <= mAttr.MaxIPv6Filter; j++) {
      var found = false;
      for (var i = 0; i < $scope.FilterIPv6.length; i++) {
        if ($scope.FilterIPv6[i].IPIndex === j) {
          found = true;
          break;
        }
      }

      if (found === false) {
        ret = j;
        return ret;
      }
    }
    return ret;
  }

  function addFilter6() {
    if (typeof $scope.FilterIPv6 !== 'undefined') {
      if ($scope.FilterIPv6.length >= mAttr.MaxIPv6Filter) {
        return;
      }
      if ($scope.originalIPv6Length === $scope.FilterIPv6.length) {
        var jData = {};
        jData.Address = "";
        jData.Mask = 128;
        jData.Enable = true;
        jData.isNew = true;
        jData.isUpdated = false;
        jData.IPIndex = findIP6Index();
        jData.Range = "";
        jData.ind = $scope.FilterIPv6.length + 1;
        $scope.data.selected6 = $scope.FilterIPv6.length + 1;
        $scope.FilterIPv6[$scope.FilterIPv6.length] = jData;
      }
    }
  }






  function editCheck6() {
    var retval = true;
    if ($scope.data.DeviceType === 'NWC' && pageData.AccessType === "Allow") {
      if ($scope.data.selected6 <= $scope.originalIPv6Length) {
        if ($scope.FilterIPv6[$scope.data.selected6 - 1].Address === $scope.ClientIPAddr) {
          retval = false;
        }
      }

    }
    return retval;
  }



  function editCheck4() {
    var retval = true;
    if ($scope.data.DeviceType === 'NWC' && pageData.AccessType === "Allow") {
      if ($scope.data.selected4 <= $scope.originalIPv4Length) {
        retval = IPRangeCheck4($scope.ClientIPAddr, $scope.FilterIPv4[$scope.data.selected4 - 1].Range);
      }

    }
    return retval;
  }

  function DeleteCheck6() {
    var retval = true;
    if ($scope.data.DeviceType === 'NWC' && pageData.AccessType === "Allow") {
      if ($scope.data.selected6 <= $scope.originalIPv6Length) {
        if ($scope.FilterIPv6[$scope.data.selected6 - 1].Address === $scope.ClientIPAddr) {
          retval = false;
        }
      }

    }
    return retval;
  }

  


  function DeleteCheck4() {
    var retVal = true;
      if ($scope.data.DeviceType === 'NWC' && pageData.AccessType === "Allow")
      {
        if ($scope.data.selected4 <= $scope.originalIPv4Length)
        {
          retVal = IPRangeCheck4($scope.ClientIPAddr, $scope.FilterIPv4[$scope.data.selected4 - 1].Range);

            // if ($scope.FilterIPv4[$scope.data.selected4 - 1].Address === $scope.ClientIPAddr)
            // {
            //   retVal = false;
            // } else {
            //   if (CurrentIPInRangeIPv4($scope.FilterIPv4[$scope.data.selected4 - 1].Address, $scope.ClientIPAddr, $scope.FilterIPv4[$scope.data.selected4 - 1].Mask) === true)
            //   {
            //     retVal = false;
            //   }
            // }

            // if(retVal === false) {
            //   for (var i = 0; i < $scope.FilterIPv4.length; i++)
            //   {
            //     if(i !== $scope.data.selected4 - 1) {
            //       if (CurrentIPInRangeIPv4($scope.FilterIPv4[i].Address, $scope.ClientIPAddr, $scope.FilterIPv4[i].Mask) === true)
            //       {
            //           retVal = true;
            //       }
            //     }
            //   }
            // }
        }
        
      }

      return retVal;
    }

  function delFilter4() {
    var jData = {};
    jData.IPType = "IPv4";
    if ($scope.data.selected4 <= $scope.originalIPv4Length) {
      jData.IPIndex = $scope.FilterIPv4[$scope.data.selected4 - 1].IPIndex;
      $scope.data.selected4 = $scope.FilterIPv4.length - 1;
      SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=remove', jData,
        function(response) {
          $timeout(view, 500, true, "IPv4");
        },
        function(errorData) {
          console.log(errorData);
        }, '', true);
    } else {
      view("IPv4");
    }
  }

  function delFilter6() {
    var jData = {};
    jData.IPType = "IPv6";
    if ($scope.data.selected6 <= $scope.originalIPv6Length) {
      jData.IPIndex = $scope.FilterIPv6[$scope.data.selected6 - 1].IPIndex;
      $scope.data.selected4 = $scope.FilterIPv6.length - 1;
      SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=remove', jData,
        function(response) {
          $timeout(view, 500, true, "IPv6");
        },
        function(errorData) {
          console.log(errorData);
        }, '', true);
    } else {
      view("IPv6");
    }
  }




  function deleteFilter4(ind) {
    if (DeleteCheck4() === false) {
      COMMONUtils.ShowError('lang_msg_chkAllowedClientIP');
    } else {
      if ($scope.FilterIPv4.length > 0) {
        COMMONUtils.ShowConfirmation(delFilter4, 'lang_msg_confirm_remove_profile');
      }
    }
  }

  function deleteFilter6(ind) {
    if (DeleteCheck6() === false) {
      COMMONUtils.ShowError('lang_msg_chkIPAddress');
    } else {
      if ($scope.FilterIPv6.length > 0) {
        COMMONUtils.ShowConfirmation(delFilter6, 'lang_msg_confirm_remove_profile');
      }
    }
  }

  function validate() {
    var retVal = true;
    var ErrorMessage = null;
    var filterIdx = 0;

    for (filterIdx = 0; filterIdx < $scope.FilterIPv4.length; filterIdx += 1) {

      if (typeof $scope.FilterIPv4[filterIdx].Address === 'undefined' ||
        $scope.FilterIPv4[filterIdx].Address === "") {

        ErrorMessage = 'lang_msg_chkIPAddress';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }

      if (COMMONUtils.CheckValidIPv4Address($scope.FilterIPv4[filterIdx].Address) === false) {
        ErrorMessage = 'lang_msg_chkIPAddress';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }


      if (typeof $scope.FilterIPv4[filterIdx].Mask === 'undefined') {
        ErrorMessage = 'lang_msg_IPv4Prefix1to32';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }

      if ($scope.FilterIPv4[filterIdx].Mask < $scope.MaskRangeIPv4.min || 
          $scope.FilterIPv4[filterIdx].Mask > $scope.MaskRangeIPv4.max) {
        ErrorMessage = 'lang_msg_IPv4Prefix1to32';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }
    }

    var clientIpFoundIpv4 = false;
    var isUniqueIpv4 = true;
    var accessIpv4 = COMMONUtils.CheckValidIPv4Address($scope.ClientIPAddr);
    var i = 0;
    var j = 0;

    if (accessIpv4 === true) {
      for (i = 0; i < $scope.FilterIPv4.length; i++) {
        if (CurrentIPInRangeIPv4($scope.FilterIPv4[i].Address, $scope.ClientIPAddr,
                                  $scope.FilterIPv4[i].Mask) === true) {
          clientIpFoundIpv4 = true;
          break;
        }

      }
    }
    for (i = 0; i < $scope.FilterIPv4.length; i++) {
      for (j = 0; j < $scope.FilterIPv4.length; j++) {
        if (i !== j) {
          if ($scope.FilterIPv4[i].Address === $scope.FilterIPv4[j].Address) {
            isUniqueIpv4 = false;
            break;
          }
        }
      }
    }

    for (filterIdx = 0; filterIdx < $scope.FilterIPv6.length; filterIdx += 1) {
      if (typeof $scope.FilterIPv6[filterIdx].Address === 'undefined' ||
        $scope.FilterIPv6[filterIdx].Address === "") {
        ErrorMessage = 'lang_msg_chkIPv6Address';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }

      if (COMMONUtils.CheckValidIPv6Address($scope.FilterIPv6[filterIdx].Address) === false) {
        ErrorMessage = 'lang_msg_chkIPv6Address';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }

      if (typeof $scope.FilterIPv6[filterIdx].Mask === 'undefined') {
        ErrorMessage = 'lang_msg_IPv6Prefix1to128';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }

      if ($scope.FilterIPv6[filterIdx].Mask < $scope.MaskRangeIPv6.min || 
          $scope.FilterIPv6[filterIdx].Mask > $scope.MaskRangeIPv6.max) {
        ErrorMessage = 'lang_msg_IPv6Prefix1to128';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }

    }

    var clientIpFoundIpv6 = false;
    var isUniqueIpv6 = true;
    var accessIpv6 = COMMONUtils.CheckValidIPv6Address($scope.ClientIPAddr);
    if (accessIpv6 === true) {
      for (i = 0; i < $scope.FilterIPv6.length; i++) {
        if (CurrentIPInRangeIPv6($scope.FilterIPv6[i].Address, $scope.ClientIPAddr, 
                                $scope.FilterIPv6[i].Mask) === true) {
          clientIpFoundIpv6 = true;
          break;
        }
      }
    }
    for (i = 0; i < $scope.FilterIPv6.length; i++) {
      for (j = 0; j < $scope.FilterIPv6.length; j++) {
        if (i !== j) {
          if ($scope.FilterIPv6[i].Address === $scope.FilterIPv6[j].Address) {
            isUniqueIpv6 = false;
            break;
          }
        }
      }
    }


    if (accessIpv4 && $scope.data.DeviceType === 'NWC' && (pageData.AccessType === "Deny" &&
        $scope.data.AccessType === "Deny")) {
      if (clientIpFoundIpv4 === true) {
        COMMONUtils.ShowError('lang_msg_chkIPAddress');
        return false;
      }
    }

    if (accessIpv4 && $scope.data.DeviceType === 'NWC' && ($scope.data.AccessType === "Allow") )
    {
      if (accessIpv4 === true && clientIpFoundIpv4 === false) // client ip is excluded
      {
        COMMONUtils.ShowError('lang_msg_chkAllowedClientIP');
        return false;
      } else if(accessIpv4 === true && clientIpFoundIpv4 === true)
      {
        var enable = false;
        for (var i = 0; i < $scope.FilterIPv4.length; i++)
        {
            if (CurrentIPInRangeIPv4($scope.FilterIPv4[i].Address, $scope.ClientIPAddr, $scope.FilterIPv4[i].Mask) === true)
            {
                if($scope.FilterIPv4[i].Enable === true)
                {
                  enable = true;
                }
            }
        }
        if(!enable)
        {
          COMMONUtils.ShowError('lang_msg_chkAllowedClientIP');
          return false;
        }
      }
    }

    if (isUniqueIpv4 === false) {
      ErrorMessage = 'lang_msg_IPv4AddressDuplicate';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    if (accessIpv6 && $scope.data.DeviceType === 'NWC' && (pageData.AccessType === "Deny" && 
        $scope.data.AccessType === "Deny")) {
      if (clientIpFoundIpv6 === true) {
        COMMONUtils.ShowError('lang_msg_chkIPAddress');
        return false;
      }
    }

    if (accessIpv6 && $scope.data.DeviceType === 'NWC' && ($scope.data.AccessType === "Allow")) {
      if (accessIpv6 && clientIpFoundIpv6 === false) {
        console.log("F");
        COMMONUtils.ShowError('lang_msg_chkIPAddress');
        return false;
      }
    }

    if (isUniqueIpv6 === false) {
      ErrorMessage = 'lang_msg_IPv4AddressDuplicate';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    return retVal;
  }


  function set(isValid) {
    if (validate()) {
      COMMONUtils.ApplyConfirmation(saveSetting);
    }
  }


  function saveSetting(isValid) {
    var functionList = [];
    var accessTypeUpdated = false;
    var saveIPCondition = true;

    $scope.FilterIPv4.forEach(function(FilterIPv4Element) {
      if (FilterIPv4Element.isNew === false) {
        if (FilterIPv4Element.isUpdated === true) {
          functionList.push(function() {

            var jData = {};
            jData.IPType = "IPv4";
            jData.Address = FilterIPv4Element.Address;
            jData.Mask = FilterIPv4Element.Mask;
            jData.IPIndex = FilterIPv4Element.IPIndex;
            jData.Enable = FilterIPv4Element.Enable;
            jData.AccessType = $scope.data.AccessType;

            console.log(saveIPCondition + " - " + jData.Enable);



            return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=update', jData,
              function(response) {},
              function(errorData) {
                console.log(errorData);
              }, '', true);
          });
          accessTypeUpdated = true;
        }
      } else {
        functionList.push(function() {
          var jData = {};
          jData.IPType = "IPv4";
          jData.Address = FilterIPv4Element.Address;
          jData.Mask = parseInt(FilterIPv4Element.Mask);
          jData.Enable = FilterIPv4Element.Enable;
          jData.AccessType = $scope.data.AccessType;

          
          saveIPCondition = CurrentIPInRangeIPv4(jData.Address, $scope.ClientIPAddr, jData.Mask);


          console.log(saveIPCondition);

          return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=add', jData,
            function(response) {},
            function(errorData) {
              console.log(errorData);
            }, '', true);
        });
        accessTypeUpdated = true;
      }
    });

    $scope.FilterIPv6.forEach(function(FilterIPv6Element) {
      if (FilterIPv6Element.isNew === false) {
        if (FilterIPv6Element.isUpdated === true) {
          functionList.push(function() {
            var jData = {};
            jData.IPType = "IPv6";
            jData.Address = FilterIPv6Element.Address;
            jData.Mask = FilterIPv6Element.Mask;
            jData.IPIndex = FilterIPv6Element.IPIndex;
            jData.Enable = FilterIPv6Element.Enable;
            jData.AccessType = $scope.data.AccessType;

            return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=update', jData,
              function(response) {},
              function(errorData) {
                console.log(errorData);
              }, '', true);
          });

          accessTypeUpdated = true;
        }
      } else {
        functionList.push(function() {
          var jData = {};
          jData.IPType = "IPv6";
          jData.Address = FilterIPv6Element.Address;
          jData.Mask = FilterIPv6Element.Mask;
          jData.Enable = FilterIPv6Element.Enable;
          jData.AccessType = $scope.data.AccessType;

          return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=add', jData,
            function(response) {},
            function(errorData) {
              console.log(errorData);
            }, '', true);
        });

        accessTypeUpdated = true;
      }
    });

    if (pageData.AccessType !== $scope.data.AccessType) {
      if (!accessTypeUpdated) {
        functionList.push(function() {
          var jData = {};
          jData.AccessType = $scope.data.AccessType;
          return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ipfilter&action=set', jData,
            function(response) {},
            function(errorData) {
              console.log(errorData);
            }, '', true);
        });
      }
    }


    if (functionList.length > 0) {
      $q.seqAll(functionList).then(function() {
        view();
      }, function(errorData) {
        console.log(errorData);
      });
    }
  }

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      view().finally(function() {
        getClientIP();
      });
    }
  })();

  $scope.submit = set;
  $scope.view = view;
  $scope.addFilter4 = addFilter4;
  $scope.addFilter6 = addFilter6;
  $scope.deleteFilter4 = deleteFilter4;
  $scope.deleteFilter6 = deleteFilter6;
  $scope.updateIPv4 = updateIPv4;
  $scope.updateIPv6 = updateIPv6;
  $scope.addCheck4 = addCheck4;
  $scope.addCheck6 = addCheck6;
  $scope.editCheck6 = editCheck6;
  $scope.editCheck4 = editCheck4;
});