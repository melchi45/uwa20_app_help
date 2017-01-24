/**
 * ptz template controller
 * @memberof ptzModule
 * @ngdoc controller
 * @name setPtzCtrl
 * @param $scope {service} scope of setPtzCtrl
 * @fires if when of $routeProvider is ptz 
 * @example ng-controller="setPtzCtrl"
 * @example 
 *    Module.config(function ($routeProvider) {
 *        $routeProvider
 *            .when('/ptz', {
 *                controller: 'setPtzCtrl'
 *            })
*/

ptzModule.controller('setPtzCtrl', function($scope){
    
/**
 * ptz control data
    'on' is ptz button on or off
    'ip' is ptz camera ip
    'sunapiServer' is sunapi server ip
    'user' camera user id
    'password' camera user password
 * @var ptzdata
 * @memberof setPtzCtrl
 */
    $scope.ptzdata = [
        {
            on:'on',
            ip:'192.168.123.233',
            sunapiServer:'55.101.78.176:5000',
            user:'admin',
            password:'init123~'
        },
        {
            on:'off',
            ip:'192.168.123.233',
            sunapiServer:'55.101.78.176:5000',
            user:'admin',
            password:'init123~'
        },
        {
            on:'on',
            ip:'192.168.123.208',
            sunapiServer:'55.101.78.176:5000',
            user:'admin',
            password:'init123~'
        },
        {
            on:'off',
            ip:'192.168.123.208',
            sunapiServer:'55.101.78.176:5000',
            user:'admin',
            password:'init123~'
        }
    ];
    
});