import angular from 'angular';
import '../../css/sellerCenter.css';
import sellerCenterCtrl from '../../common/sellerCenterCtrl';
import sellerCenterDir from '../../common/sellerCenterDir';
angular.module('sellerCenter',[])
.controller('SellerCenterCtrl',['$scope',($scope)=>sellerCenterCtrl($scope)])
.directive('listRepeat',sellerCenterDir);