import angular from 'angular';
import '../../css/sellerCenter.css';
import sellerCenterCtrl from '../../common/sellerCenterCtrl';
import sellerCenterDir from '../../common/sellerCenterDir';
angular.module('sellerCenter',[])
.controller('SellerCenterCtrl',['$scope','$http',($scope,$http)=>sellerCenterCtrl($scope,$http)])
.directive('listRepeat',sellerCenterDir);