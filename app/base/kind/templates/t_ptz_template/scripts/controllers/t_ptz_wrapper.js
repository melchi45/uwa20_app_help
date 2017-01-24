/**
* root controller of template
* @memberof kindFramework
* @ngdoc controller
* @name WrapperCtrl
* @param $scope {service} scope of streamingCtrl
* @param $rootScope {service} root of scope
* @fires when angularjs bootstrap
* @example ng-controller="WrapperCtrl"
*/
kindFramework
    .controller('WrapperCtrl', function($scope, $rootScope){
    
/**
 * set menu list in template
 * @var menuList
 * @memberof WrapperCtrl
 */
        $scope.menuList = [
            {
                'title': 'Home',
                'active': 'active',
                'link': '#/home'
            }
        ];
    });