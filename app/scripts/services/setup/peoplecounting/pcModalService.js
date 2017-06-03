kindFramework.service('pcModalService', function($uibModal) {
  "use strict";

  var modalInstance = null;

  this.close = function() {
    if (modalInstance !== null) {
      modalInstance.close();
      modalInstance = null;
    }
  };

  /**
   * @param options {Object} view, controller, iconClass, title, message
   * @return Promise {Promise}
   */
  this.openAlert = function(options) {
    var view = options.view || 'views/setup/peoplecounting/modals/alert.html';
    var controller = options.controller || 'alertModalCtrl';
    var iconClass = options.iconClass || '';
    var title = options.title || '';
    var message = options.message || '';
    var size = options.size || 'sm';

    modalInstance = $uibModal.open({
      templateUrl: view,
      controller: controller,
      size: size,
      resolve: {
        iconClass: function() {
          return iconClass;
        },
        title: function() {
          return title;
        },
        message: function() {
          return message;
        }
      }
    });

    return modalInstance.result;
  };

  /**
   * @param options {Object} 
   * @param options.title {String} The title of Confirm.
   * @param options.message {String|Element}  The message of Confirm.
   * @return Promise {Promise}
   * @example
   *	 $scope.openConfig({
   *		title: 'Confirm Title',
   *		message: 'Confirm Message'
   *	 }).then(function(){
   *		console.log("Ok  callback");
   *	 }, function(){
   *		console.log("Cancel callback");
   *	 })
   */
  this.openConfirm = function(options) {
    var view = options.view || 'views/setup/peoplecounting/modals/confirm.html';
    var controller = options.controller || 'confirmModalCtrl';
    var title = options.title || '';
    var message = options.message || '';
    var size = options.size || 'sm';

    modalInstance = $uibModal.open({
      templateUrl: view,
      controller: controller,
      size: size,
      resolve: {
        title: function() {
          return title;
        },
        message: function() {
          return message;
        }
      }
    });

    return modalInstance.result;
  };

  this.openReportForm = function() {
    modalInstance = $uibModal.open({
      templateUrl: 'views/setup/peoplecounting/modals/report.html',
      controller: 'reportModalCtrl'
    });

    return modalInstance.result;
  };

  this.openAddSlaveConfirm = function() {
    modalInstance = $uibModal.open({
      templateUrl: 'views/setup/peoplecounting/modals/add_slave.html',
      controller: 'addSlaveModalCtrl'
    });

    return modalInstance.result;
  };
});