"use strict";
kindFramework.controller('hmReportModalCtrl', function($scope, $uibModalInstance, CameraName, FromDate, ToDate, pcSetupService) {
  $scope.confirmTitle = 'lang_download';

  $scope.extension = 'png';
  $scope.fileName = '';
  $scope.fileNameRegExp = pcSetupService.regExp.getAlphaNum();

  FromDate = FromDate.slice(0, 10).replace(/-/g, "");
  ToDate = ToDate.slice(0, 10).replace(/-/g, "");

  function saveImageFile() {
    var fileName = $scope.fileName + '_' + CameraName + '_' + FromDate + "_" + ToDate + '.png';
    var img = document.getElementById("hm-results-image-1");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0, img.width, img.height);
    var imageData = canvas.toDataURL("image/png");
    imageData = imageData.replace(/^data:image\/[^;]*/, '').replace(';base64,', '');

    var success = false;
    var contentType = 'image/png';
    var imageDataBuffer;
    if (typeof atob !== 'undefined') {
      var dataAtob = atob(imageData);
      var asArray = new Uint8Array(dataAtob.length);

      for (var i = 0, len = dataAtob.length; i < len; ++i) {
        asArray[i] = dataAtob.charCodeAt(i);
      }
      imageDataBuffer = asArray.buffer;
    } else {
      imageDataBuffer = imageData;
    }
    try {
      //console.log("Trying SaveBlob method ...");
      var blob = new Blob([imageDataBuffer], {
        type: contentType
      });
      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
      } else {
        var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
        if (saveBlob === undefined) {
          throw "Not supported";
        }
        saveBlob(blob, fileName);
      }
      //console.log("SaveBlob succeded");
      success = true;
    } catch (ex) {
      //console.log("SaveBlob method failed with the exception: ", ex);
    }

    if (!success) {
      var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
      if (urlCreator) {
        var link = document.createElement('a');
        if ('download' in link) {
          try {
            //console.log("Trying DownloadLink method ...");
            var blob = new Blob([imageDataBuffer], {
              type: contentType
            });
            var url = urlCreator.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute("download", fileName);

            var event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            link.dispatchEvent(event);

            //console.log("DownloadLink succeeded");
            success = true;
          } catch (ex) {
            //console.log("DownloadLink method failed with exception: ", ex);
          }
        }
      }
    }

    if (!success) {
      //console.log("No methods worked for saving the arraybuffer, Using imagedownload");
      var form = document.createElement('form');
      form.action = '/home/setup/imagedownload.cgi';
      form.method = 'POST';
      form.id = 'captureForm';
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'imageData';
      input.id = 'imageData';
      input.value = imageData;
      var input2 = document.createElement('input');
      input2.type = 'hidden';
      input2.name = 'fileName';
      input2.id = 'fileName';
      input2.value = fileName;
      form.appendChild(input);
      form.appendChild(input2);
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = 'captureFrame';
      iframe.id = 'captureFrame';
      iframe.width = '0px';
      iframe.height = '0px';
      form.target = 'captureFrame';
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();

      var interval;
      var captureFrame = $('#' + iframe.id);
      var captureForm = $('#' + form.id);
      captureFrame.unbind();
      interval = setTimeout(function() {

        captureFrame.unbind();
        captureForm.remove();
        captureFrame.remove();
      }, 1000);
    }
  }

  $scope.ok = function() {
    var arr = [
      'fileName'
    ];
    var errClass = 'has-error';

    //trim
    for (var i = 0; i < arr.length; i++) {
      var key = arr[i];
      var tmpVal = $scope[key].trim();
      var elem = $("#pc-confirm-report-" + key);
      var parent = elem.parent();
      parent.removeClass(errClass);

      $scope[key] = tmpVal;
      elem.val(tmpVal);
    }

    var isOk = true;
    for (var i = 0; i < arr.length; i++) {
      var key = arr[i];
      if ($scope[key] === '') {
        var elem = $("#pc-confirm-report-" + key);
        var parent = elem.parent();
        parent.addClass(errClass);
        isOk = false;
      }
    }

    if (isOk === false) {
      return;
    }

    saveImageFile();

    $uibModalInstance.close({
      fileName: $scope.fileName,
      extension: $scope.extension
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss();
  };
});