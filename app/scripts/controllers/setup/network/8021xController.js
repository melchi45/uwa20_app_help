/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('8021xCtrl', function ($scope, SunapiClient, COMMONUtils, Attributes, $timeout, $translate) {
    "use strict";

    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);

    $scope.idPasswordPattern = mAttr.SSL802XIDPWSet;
    $scope.SelectedInterface = 0;
    var pageData = {};
    var PWInit = false;

    function getAttributes() {

        if (mAttr.EAPOLTypeOptions !== undefined) {
            $scope.EAPOLTypeOptions = mAttr.EAPOLTypeOptions;
        }

        if (mAttr.EAPOLVersionOptions !== undefined) {
            $scope.EAPOLVersionOptions = mAttr.EAPOLVersionOptions;
        }

        if (mAttr.CertificateTypeOptions !== undefined) {
            $scope.CertificateTypeOptions = mAttr.CertificateTypeOptions;
        }

        if (mAttr.IEEE802Dot1xInterfaceOptions !== undefined) {
            $scope.IEEE802Dot1xInterfaceOptions = mAttr.IEEE802Dot1xInterfaceOptions;
        }
        if (mAttr.DeviceType !== undefined) {
            $scope.DeviceType = mAttr.DeviceType;
        }
        if (mAttr.EAPOLIDRange !== undefined) {
            $scope.EAPOLIDRange = mAttr.EAPOLIDRange.maxLength;
        }
        if (mAttr.EAPOLPasswordRange !== undefined) {
            $scope.EAPOLPasswordRange = mAttr.EAPOLPasswordRange.maxLength;
        }
        $scope.EAPOLPattern = mAttr.FriendlyNameCharSet;
    }

    function IEEE8021xView() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=802Dot1x&action=view', getData,
            function (response) {
                $scope.IEEE802Dot1x = response.data.IEEE802Dot1x;

                if ($scope.IEEE802Dot1x[$scope.SelectedInterface].IsPasswordSet === true)
                {
                    $("#8021x_eapolpw").val("{::::::::}"); // key for maintain password

                    PWInit = true;
                    $scope.IEEE802Dot1x[0].EAPOLPassword = "{::::::::}";
                }
                pageData.IEEE802Dot1x = angular.copy($scope.IEEE802Dot1x);
            },
            function (errorData) {
                COMMONUtils.ShowError(errorData);
            }, '', true);
    }

    function validate() {

        var retVal = true;
        if ($scope.IEEE8021xForm.EAPOLId.$valid === false) {
            var ErrorMessage = 'lang_msg_invalid_id';
            COMMONUtils.ShowError(ErrorMessage);
            retVal = false;
        }

        if ($scope.IEEE8021xForm.EAPOLPassword.$valid === false) {
            var ErrorMessage = 'lang_msg_invalid_pw';
            COMMONUtils.ShowError(ErrorMessage);
            retVal = false;
        }

        return retVal;
    }

    function view() {
        var certfileelm = document.getElementById("certfileid");
        var clientertfileelm = document.getElementById("clientcertfileid");
        var keyfileelm = document.getElementById("keyfileid");

        certfileelm.value = "";
        clientertfileelm.value = "";
        keyfileelm.value = "";

        $scope.CACertificateFile = '';
        $scope.ClientCertificateFile = '';
        $scope.ClietKeyFile = '';
        getAttributes();
        IEEE8021xView().then(function(){
            $scope.pageLoaded = true;
            $("#wn5-setup-8021x").show();
        }, function(errorData){
            console.log(errorData);
        });
    }

    function saveSettings() {
        var setData = {},
            reqSaveData;
        var modified = false;
        if (mAttr.DeviceType === 'NVR') {
            setData.InterfaceName = $scope.IEEE802Dot1x[$scope.SelectedInterface].InterfaceName;
        }
        if (pageData.IEEE802Dot1x[$scope.SelectedInterface].Enable !== $scope.IEEE802Dot1x[$scope.SelectedInterface].Enable) {
            setData.Enable = $scope.IEEE802Dot1x[$scope.SelectedInterface].Enable;
            pageData.IEEE802Dot1x[$scope.SelectedInterface].Enable = setData.Enable;
            modified = true;
        }

        if (pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLType !== $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLType) {
            setData.EAPOLType = $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLType;
            pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLType = setData.EAPOLType;
            modified = true;
        }

        if (pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLVersion !== $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLVersion) {
            setData.EAPOLVersion = $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLVersion;
            pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLVersion = setData.EAPOLVersion;
            modified = true;
        }

        if (pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLId !== $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLId) {
            setData.EAPOLId = encodeURIComponent($scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLId);
            pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLId = $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLId;
            modified = true;
        }

        if (pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLPassword !== $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLPassword) {
            setData.EAPOLPassword = encodeURIComponent($scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLPassword);
            pageData.IEEE802Dot1x[$scope.SelectedInterface].EAPOLPassword = $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLPassword;
            modified = true;
        }

        if (modified === true) {
            SunapiClient.get('/stw-cgi/security.cgi?msubmenu=802Dot1x&action=set', setData,
                function (response) {
                    view();
                },
                function (errorData) {
                    console.log(errorData);
                },'', true);
        }
    }

    function IEEE8021xSet() {
        if (validate() === false) {
            return;
        }

        COMMONUtils.ApplyConfirmation(saveSettings);
    }

    function set() {
        IEEE8021xSet();
    }

    $scope.setCACertificateFile = function (element) {
        $scope.$apply(function ($scope) {
            $scope.CACertificateFile = element.files[0].name;
            $scope.cacerfilesize = element.files[0].size;
            $scope.cacerfile = element.files[0];
            console.log("Certificate File:", $scope.CACertificateFile, $scope.cacerfilesize);
        });
    };

    $scope.setClientCertificateFile = function (element) {
        $scope.$apply(function ($scope) {
            $scope.ClientCertificateFile = element.files[0].name;
            $scope.clientfilesize = element.files[0].size;
            $scope.clientcerfile = element.files[0];
            console.log("Certificate File:", $scope.ClientCertificateFile, $scope.clientfilesize);
        });
    };

    $scope.setClientKeyFile = function (element) {
        $scope.$apply(function ($scope) {
            $scope.ClietKeyFile = element.files[0].name;
            $scope.clientkeyfilesize = element.files[0].size;
            $scope.clientkeyfile = element.files[0];
            console.log("Certificate File:", $scope.ClientKeyFile, $scope.clientkeyfilesize);
        });
    };


    $scope.OnCertInstall = function ($type) {
        var certfileelm = document.getElementById("certfileid");
        var clientertfileelm = document.getElementById("clientcertfileid");
        var keyfileelm = document.getElementById("keyfileid");
        var fileName, ext;

        var setData = {},
            postData;
        var cerfiletype, cerfile, cerfilesize;
        var requiredextn = "crt";

        if ($type === 0) {
            if (!$scope.cacerfile) {
                var ErrorMessage = 'lang_msg_cert_file_error';
                COMMONUtils.ShowError(ErrorMessage);
                return;
            }
            fileName = certfileelm.value.split('/').pop().split('\\').pop();
            ext = fileName.split('.').pop();
            if (requiredextn != ext) {
                var ErrorMessage = 'lang_msg_cert_file_error';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }
            cerfiletype = 'CACertificate';
            cerfile = $scope.cacerfile;
            cerfilesize = $scope.cacerfilesize;
        } else if ($type === 1) {
            if (!$scope.clientcerfile) {
                var ErrorMessage = 'lang_msg_cert_file_error';
                COMMONUtils.ShowError(ErrorMessage);
                return;
            }
            fileName = clientertfileelm.value.split('/').pop().split('\\').pop();
            ext = fileName.split('.').pop();
            if (requiredextn != ext) {
                var ErrorMessage = 'lang_msg_cert_file_error';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }
            cerfiletype = 'ClientCertificate';
            cerfile = $scope.clientcerfile;
            cerfilesize = $scope.clientfilesize;
        } else if ($type === 2) {
            if (!$scope.clientkeyfile) {
                var ErrorMessage = 'lang_msg_key_file_error';
                COMMONUtils.ShowError(ErrorMessage);
                return;
            }
            requiredextn = "pem";
            fileName = keyfileelm.value.split('/').pop().split('\\').pop();
            ext = fileName.split('.').pop();
            if (requiredextn != ext) {
                var ErrorMessage = 'lang_msg_key_file_error';
                COMMONUtils.ShowError(ErrorMessage);
                return false;
            }
            cerfiletype = 'ClientPrivateKey';
            cerfile = $scope.clientkeyfile;
            cerfilesize = $scope.clientkeyfilesize;
        }

        if (mAttr.DeviceType === 'NVR') {
            setData.InterfaceName = $scope.IEEE802Dot1x[$scope.SelectedInterface].InterfaceName;
        }


        var r = new FileReader();
        r.readAsArrayBuffer(cerfile);
        r.onload = function (e) {
            $scope.certcontents = e.target.result;

            var certbytes = new Uint8Array($scope.certcontents);

            var cerfileToPost = '';
            for (var index = 0; index < certbytes.byteLength; index++)
            {
                cerfileToPost += String.fromCharCode(certbytes[index]);
            }

            var specialHeaders = [];
            specialHeaders[0] = {};
            specialHeaders[0].Type = 'Content-Type';
            specialHeaders[0].Header = 'application/x-www-form-urlencoded';

            postData = '<SetData802Dot1x><PublicCertType>' + cerfiletype + '</PublicCertType><CertLength>' + cerfilesize + '</CertLength>' +
                '<CertData>' + cerfileToPost + '</CertData></SetData802Dot1x>';

            var encodedata = encodeURI(postData);
            //console.log("Read File:", postData);
            SunapiClient.post('/stw-cgi/security.cgi?msubmenu=802Dot1x&action=install', setData,
                function (response) {
                    if ($type === 0) {
                        certfileelm.value = "";
                        $scope.cacerfile = "";

                    } else if ($type === 1) {
                        clientertfileelm.value = "";
                        $scope.clientcerfile = "";

                    } else if ($type === 2) {
                        keyfileelm.value = "";
                        $scope.clientkeyfile = "";
                    }
                    $timeout(view, 300);
                },
                function (errorData) {
                    var ErrorMessage = 'lang_msg_installError_cert';
                    COMMONUtils.ShowError(ErrorMessage);
                }, $scope, encodedata, specialHeaders);
        };
    };

    $scope.OnCertDelete = function ($type) {

        var setData = {};

        if ($type === 0) {
            if (!$scope.IEEE802Dot1x[$scope.SelectedInterface].CACertificateInstalled) {
                var ErrorMessage = 'CACertificate not installed';
                COMMONUtils.ShowError(ErrorMessage);
                return;
            }
            setData.CertificateType = 'CACertificate';
        } else if ($type === 1) {
            if (!$scope.IEEE802Dot1x[$scope.SelectedInterface].ClientCertificateInstalled) {
                var ErrorMessage = 'ClientCertificate not installed';
                COMMONUtils.ShowError(ErrorMessage);
                return;
            }
            setData.CertificateType = 'ClientCertificate';
        } else if ($type === 2) {
            if (!$scope.IEEE802Dot1x[$scope.SelectedInterface].ClientPrivateKeyInstalled) {
                var ErrorMessage = 'ClientPrivateKey not installed';
                COMMONUtils.ShowError(ErrorMessage);
                return;
            }
            setData.CertificateType = 'ClientPrivateKey';
        }

        if ($scope.DeviceType === 'NVR') {
            setData.InterfaceName = $scope.IEEE802Dot1x[$scope.SelectedInterface].InterfaceName;
        }

        SunapiClient.get('/stw-cgi/security.cgi?msubmenu=802Dot1x&action=remove', setData,
            function (response) {
                view();
            },
            function (errorData) {
                var ErrorMessage = 'lang_msg_deleteError_cert';
                COMMONUtils.ShowError(ErrorMessage);
            }, '', true);

    };

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

    $scope.DoPWInit = function() {
        if(PWInit === true) {
            $("#8021x_eapolpw").val("");
            $scope.IEEE802Dot1x[$scope.SelectedInterface].EAPOLPassword = "";
            PWInit = false;
        }
        return true;
    };

    $scope.submit = set;
    $scope.view = view;
});
