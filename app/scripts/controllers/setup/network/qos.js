kindFramework.controller('qosCtrl', function ($scope, $timeout, COMMONUtils, SunapiClient, XMLParser, Attributes, $q) {
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();
    $scope.selected4 = 1;
    $scope.selected6 = 1;
    $scope.originalIPv4Length = 0;
    $scope.originalIPv6Length = 0;
    var pageData = {};
    //var SunapiClient =  RestClientGeneric().setServer('digest');

    function featureDetection()
    {
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

        var IPv4DSCP = {};
        IPv4DSCP.min = mAttr.DSCPRange.minValue;
        IPv4DSCP.max = mAttr.DSCPRange.maxValue;

        var IPv6DSCP = {};
        IPv6DSCP.min = mAttr.DSCPRange.minValue;
        IPv6DSCP.max = mAttr.DSCPRange.maxValue;

        $scope.MaskRangeIPv4 = MaskRangeIPv4;
        $scope.MaskRangeIPv6 = MaskRangeIPv6;

        $scope.MaskRangeIPv4Strlen = MaskRangeIPv4.max.toString().length;
        $scope.MaskRangeIPv6Strlen = MaskRangeIPv6.max.toString().length;

        $scope.IPv4Pattern = mAttr.IPv4;
        $scope.IPv6Pattern = mAttr.IPv6;

        $scope.IPv4DSCP = IPv4DSCP;
        $scope.IPv6DSCP = IPv6DSCP;
        $scope.IPv4DSCPStrlen = IPv4DSCP.max.toString().length;
        $scope.IPv6DSCPStrlen = IPv6DSCP.max.toString().length;
    }

    function view(updateType) {

        if(typeof updateType === 'undefined')
        {
              updateType = "all";
        }

        var jData = {};

        if(updateType === "all" || updateType==="IPv4")
        {
            $scope.IPListV4 = [];
            $scope.selected4 = 1;
             $scope.originalIPv4Length = 0;
        }

         if(updateType === "IPv6" || updateType === "all")
         {
             $scope.IPListV6 = [];
             $scope.selected6 = 1;
             $scope.originalIPv6Length = 0;
         }
        
        SunapiClient.get('/stw-cgi/network.cgi?msubmenu=qos&action=view', jData,
                function (response) {
                    pageData = angular.copy(response.data);

                    for (var i = 0; i < response.data.QOS.length; i++)
                    {
                        if (response.data.QOS[i].IPType === 'IPv4')
                        {
                            if(updateType === "IPv6")
                            {
                                continue;
                            }

                            $scope.IPListV4 = response.data.QOS[i].IPList;
                            $scope.originalIPv4Length = response.data.QOS[i].IPList.length;
                            for (var j = 0; j < $scope.IPListV4.length; j++)
                            {
                                $scope.IPListV4[j].ind = j+1;
                                $scope.IPListV4[j].isNew = false;
                            }
                        }
                        else
                        {
                            if(updateType === "IPv4")
                            {
                                continue;
                            }

                            $scope.IPListV6 = response.data.QOS[i].IPList;
                            $scope.originalIPv6Length = response.data.QOS[i].IPList.length;
                            for (j = 0; j < $scope.IPListV6.length; j++)
                            {
                                $scope.IPListV6[j].ind = j+1;
                                $scope.IPListV6[j].isNew = false;
                            }
                        }
                    }

                },
                function (errorData) {
                    console.log(errorData);
                }, '', true).then(function(){
                    featureDetection();

                    $scope.pageLoaded = true;
                    $("#qospage").show();
                }, function(errorData){
                    console.log(errorData);
                });
    }




    function addCheck4()
    {
        if(typeof $scope.IPListV4 !== 'undefined')
        {
        if ($scope.IPListV4.length >= mAttr.MaxIPv4QoS)
        {
            return true;
        }
        if ($scope.originalIPv4Length !== $scope.IPListV4.length) {
            return true;
        }
        }
        return false;
    }

    function addCheck6()
    {
        if(typeof $scope.IPListV6 !== 'undefined')
        {
            if ($scope.IPListV6.length >= mAttr.MaxIPv6QoS)
            {
                return true;
            }
            if ($scope.originalIPv6Length !== $scope.IPListV6.length) {
                return true;
            }
        }
        return false;
    }

    function addQOS4() {
      if(typeof $scope.IPListV4 !== 'undefined')
      {
        if ($scope.IPListV4.length >= mAttr.MaxIPv4QoS)
        {
            return;
        }
        if ($scope.originalIPv4Length === $scope.IPListV4.length) {
            var jData = {};
            jData.IPAddress = "";
            jData.PrefixLength = 32;
            jData.Enable = true;
            jData.isNew = true;
            jData.Index = findIP4Index();
            jData.DSCP = mAttr.DSCPRange.maxValue;
            console.log(mAttr.DSCPRange);
            jData.ind = $scope.IPListV4.length + 1;
            $scope.selected4 = $scope.IPListV4.length + 1;
            $scope.IPListV4[$scope.IPListV4.length] = jData;
        }
      }
    }


    function findIP4Index()
    {
        var ret = -1;
        for(var j =1;j<=mAttr.MaxIPv4QoS;j++)
        {
            var found = false;
            for (var i = 0; i < $scope.IPListV4.length; i++)
            {
                if($scope.IPListV4[i].Index === j)
                {
                    found = true;
                    break;
                }
            }

            if(found === false)
            {
                ret = j;
                return ret;
            }
        }
        return ret;
    }

     function findIP6Index()
    {
        var ret = -1;
        for(var j =1;j<=mAttr.MaxIPv6QoS;j++)
        {
            var found = false;
            for (var i = 0; i < $scope.IPListV6.length; i++)
            {
                if($scope.IPListV6[i].Index === j)
                {
                    found = true;
                    break;
                }
            }

            if(found === false)
            {
                ret = j;
                return ret;
            }
        }
        return ret;
    }

    function addQOS6() {
         if(typeof $scope.IPListV6 !== 'undefined')
        {
        if ($scope.IPListV6.length >= mAttr.MaxIPv6QoS)
        {
            return;
        }
        if ($scope.originalIPv6Length === $scope.IPListV6.length) {
            var jData = {};
            jData.IPAddress = "";
            jData.PrefixLength = 128;
            jData.Enable = true;
            jData.isNew = true;
            jData.Index = findIP6Index();
            jData.ind = $scope.IPListV6.length + 1;
            jData.DSCP = mAttr.DSCPRange.maxValue;
            $scope.selected6 = $scope.IPListV6.length + 1;
            $scope.IPListV6[$scope.IPListV6.length] = jData;
        }
      }
    }

    function del_QOS4() {
        var jData = {};
        jData.IPType = "IPv4";

        if($scope.selected4<=$scope.originalIPv4Length)
        {
            jData.Index =  $scope.IPListV4[$scope.selected4-1].Index;
            $scope.selected4 = $scope.IPListV4.length -1;
            SunapiClient.get('/stw-cgi/network.cgi?msubmenu=qos&action=remove', jData,
                     function () {
                        view("IPv4");   
                    }, function (errorData) {
                    console.log(errorData);
             }, '', true);
        }else{
            view("IPv4");   
        }
    }

    function del_QOS6()
    {
        var jData = {};
        jData.IPType = "IPv6";
        

        if($scope.selected6<=$scope.originalIPv6Length)
        {
            jData.Index =  $scope.IPListV6[$scope.selected6-1].Index;
            $scope.selected6 = $scope.IPListV6.length -1;
            SunapiClient.get('/stw-cgi/network.cgi?msubmenu=qos&action=remove', jData,
                    function () {
                        view("IPv6");
                  }, function (errorData) {
                console.log(errorData);
            }, '', true);
        }else{
            view("IPv6");   
        }
    }



    function deleteQOS4()
    {
        COMMONUtils.ShowConfirmation(del_QOS4,'lang_msg_confirm_remove_profile');
    }

    function deleteQOS6()
    {
        COMMONUtils.ShowConfirmation(del_QOS6,'lang_msg_confirm_remove_profile');
    }

    function validate() {
        var retVal = true;
        var qosIdx;
        var ErrorMessage;
        for (qosIdx = 0; qosIdx < $scope.IPListV4.length; qosIdx = qosIdx + 1)
        {
            if (typeof $scope.IPListV4[qosIdx].IPAddress === 'undefined' ||
                $scope.IPListV4[qosIdx].IPAddress === "")
            {
                ErrorMessage = 'lang_msg_chkIPAddress';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if(COMMONUtils.CheckValidIPv4Address($scope.IPListV4[qosIdx].IPAddress) === false)
            {
                ErrorMessage = 'lang_msg_chkIPAddress';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if(typeof $scope.IPListV4[qosIdx].PrefixLength === 'undefined')
            {
                ErrorMessage = 'lang_msg_IPv4Prefix1to32';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if ($scope.IPListV4[qosIdx].PrefixLength < $scope.MaskRangeIPv4.min || $scope.IPListV4[qosIdx].PrefixLength > $scope.MaskRangeIPv4.max)
            {
                ErrorMessage = 'lang_msg_IPv4Prefix1to32';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if(typeof $scope.IPListV4[qosIdx].DSCP === 'undefined')
            {
                ErrorMessage = 'lang_msg_invalidDSCP';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if ($scope.IPListV4[qosIdx].DSCP < $scope.IPv4DSCP.min || $scope.IPListV4[qosIdx].DSCP > $scope.IPv4DSCP.max)
            {
                ErrorMessage = 'lang_msg_invalidDSCP';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }
        }


        var isUniqueIpv4 = true;
        for (var i = 0; i < $scope.IPListV4.length; i++)
        {
            for (var j = 0; j < $scope.IPListV4.length; j++)
            {
                if (i != j)
                {
                    if ($scope.IPListV4[i].IPAddress === $scope.IPListV4[j].IPAddress)
                    {
                        isUniqueIpv4=false;
                    }
                }
            }
        }

        if(isUniqueIpv4 === false)
        {
            ErrorMessage = 'lang_msg_IPv4AddressDuplicate';
            COMMONUtils.ShowError(ErrorMessage);
            return false;
        }

        for (qosIdx = 0; qosIdx < $scope.IPListV6.length; qosIdx = qosIdx + 1)
        {
            if (typeof $scope.IPListV6[qosIdx].IPAddress === 'undefined' ||
                $scope.IPListV6[qosIdx].IPAddress === "")
            {
                ErrorMessage = 'lang_msg_chkIPv6Address';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if(COMMONUtils.CheckValidIPv6Address($scope.IPListV6[qosIdx].IPAddress) === false)
            {
                ErrorMessage = 'lang_msg_chkIPv6Address';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if(typeof $scope.IPListV6[qosIdx].PrefixLength === 'undefined')
            {
                ErrorMessage = 'lang_msg_IPv6Prefix1to128';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if ($scope.IPListV6[qosIdx].PrefixLength < $scope.MaskRangeIPv6.min || $scope.IPListV6[qosIdx].PrefixLength > $scope.MaskRangeIPv6.max)
            {
                ErrorMessage = 'lang_msg_IPv6Prefix1to128';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if(typeof $scope.IPListV6[qosIdx].DSCP === 'undefined')
            {
                ErrorMessage = 'lang_msg_invalidDSCP';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }

            if ($scope.IPListV6[qosIdx].DSCP < $scope.IPv6DSCP.min || $scope.IPListV6[qosIdx].DSCP > $scope.IPv6DSCP.max)
            {
                ErrorMessage = 'lang_msg_invalidDSCP';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }
        }


        var isUniqueIpv6 = true;
        for (var i = 0; i < $scope.IPListV6.length; i++)
        {
            for (var j = 0; j < $scope.IPListV6.length; j++)
            {
                if (i != j)
                {
                    if ($scope.IPListV6[i].IPAddress === $scope.IPListV6[j].IPAddress)
                    {
                        isUniqueIpv6=false;
                    }
                }
            }
        }

        if(isUniqueIpv6 === false)
        {
            ErrorMessage = 'lang_msg_IPv4AddressDuplicate';
            COMMONUtils.ShowError(ErrorMessage);
            return false;
        }


        return retVal;
    }

    function set() {

        if (validate() === false)
        {
            return;
        }
        COMMONUtils.ApplyConfirmation(saveSettings);
    }

    function saveSettings() {
        var promises = [];
        var promise = null;
        var updateRequired = false;
        if (typeof pageData.QOS !== 'undefined')
        {

            for (var i = 0; i < pageData.QOS.length; i++)
            {
                if (pageData.QOS[i].IPType === 'IPv4')
                {
                    for (var j = 0; j < pageData.QOS[i].IPList.length; j++)
                    {
                        updateRequired = false;
                        if (pageData.QOS[i].IPList[j].IPAddress !== $scope.IPListV4[j].IPAddress)
                        {
                            updateRequired = true;
                        }

                        if (pageData.QOS[i].IPList[j].PrefixLength !== $scope.IPListV4[j].PrefixLength)
                        {
                            updateRequired = true;
                        }

                        if (pageData.QOS[i].IPList[j].DSCP !== $scope.IPListV4[j].DSCP)
                        {
                            updateRequired = true;
                        }

                        if (pageData.QOS[i].IPList[j].Enable !== $scope.IPListV4[j].Enable)
                        {
                            updateRequired = true;
                        }

                        if (updateRequired === true)
                        {
                            !function () {
                                var IPV4Element = angular.copy($scope.IPListV4[j]);
                                promises.push(function(){
                                    var jData = {};
                                    jData.IPType = "IPv4";
                                    jData.IPAddress = IPV4Element.IPAddress;
                                    jData.Index = IPV4Element.Index;
                                    jData.PrefixLength = IPV4Element.PrefixLength;
                                    jData.DSCP = IPV4Element.DSCP;
                                    jData.Enable = IPV4Element.Enable;
                                    return SunapiClient.get("/stw-cgi/network.cgi?msubmenu=qos&action=update", jData,
                                        function (response) {
                                        }, function (errorData) {
                                            console.log(errorData);
                                        }, "", true);
                                });
                            }();
                        }

                    }
                }
                else
                {

                    for (var j = 0; j < pageData.QOS[i].IPList.length; j++)
                    {
                        updateRequired = false;
                        if (pageData.QOS[i].IPList[j].IPAddress !== $scope.IPListV6[j].IPAddress)
                        {
                            updateRequired = true;
                        }

                        if (pageData.QOS[i].IPList[j].PrefixLength !== $scope.IPListV6[j].PrefixLength)
                        {
                            updateRequired = true;
                        }

                        if (pageData.QOS[i].IPList[j].DSCP !== $scope.IPListV6[j].DSCP)
                        {
                            updateRequired = true;
                        }

                        if (pageData.QOS[i].IPList[j].Enable !== $scope.IPListV6[j].Enable)
                        {
                            updateRequired = true;
                        }

                        if (updateRequired === true)
                        {
                            !function () {
                                var IPV6Element = angular.copy($scope.IPListV6[j]);
                                promises.push(function(){
                                    var jData = {};
                                    jData.IPType = "IPv6";
                                    jData.IPAddress = IPV6Element.IPAddress;
                                    jData.Index = IPV6Element.Index;
                                    jData.PrefixLength = IPV6Element.PrefixLength;
                                    jData.DSCP = IPV6Element.DSCP;
                                    jData.Enable = IPV6Element.Enable;
                                    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=qos&action=update', jData,
                                        function (response) {
                                        }, function (errorData) {
                                            console.log(errorData);
                                        }, '', true);
                                });
                            }();
                        }
                    }
                }

            }

        }

        $scope.IPListV6.forEach(function(IPV6Element){
           if(IPV6Element.isNew === true)
           {
               promises.push(function(){
                   var jData = {};
                   jData.IPType = "IPv6";
                   jData.IPAddress = IPV6Element.IPAddress;
                   jData.PrefixLength = IPV6Element.PrefixLength;
                   jData.DSCP = IPV6Element.DSCP;
                   jData.Enable = IPV6Element.Enable;
                   return SunapiClient.get("/stw-cgi/network.cgi?msubmenu=qos&action=add", jData,
                       function (response) {
                       }, function (errorData) {
                           console.log(errorData);
                       }, "", true);
               });
           }
        });

        $scope.IPListV4.forEach(function(IPV4Element){
           if(IPV4Element.isNew === true)
           {
               promises.push(function(){
                   var jData = {};
                   jData.IPType = "IPv4";
                   jData.IPAddress = IPV4Element.IPAddress;
                   jData.PrefixLength = IPV4Element.PrefixLength;
                   jData.DSCP = IPV4Element.DSCP;
                   jData.Enable = IPV4Element.Enable;
                   return SunapiClient.get("/stw-cgi/network.cgi?msubmenu=qos&action=add", jData,
                       function (response) {
                       }, function (errorData) {
                           console.log(errorData);
                       }, "", true);
               });
           }
        });

        if(promises.length > 0){
            $q.seqAll(promises).then(function(){
                view();
            });
        }else{
            view();
        }
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            view();
        }
    })();

    $scope.submit = set;
    $scope.view = view;
    $scope.addQOS4 = addQOS4;
    $scope.addQOS6 = addQOS6;
    $scope.addCheck4 = addCheck4;
    $scope.addCheck6 = addCheck6;
    $scope.deleteQOS4 = deleteQOS4;
    $scope.deleteQOS6 = deleteQOS6;
});