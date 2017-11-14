import angular from 'angular';
import * as testFn from '../../common/app';
import '../../css/sellerSetting.css';
angular.module('sellerSetting',[])
.controller('SettingCtrl',['$scope',function($scope){
	testFn.testFn2();
	$scope.inputText='this is sellerSetting page';
}]);