import * as testFn from './app';
export default function sellerCenterCtrl($scope,$http){
	$scope.inputText="this is sellerCenter Page";
	$scope.data=[1,2,3,4];
	$scope.getData=function(){
		$http({
		    method: 'GET',
		    url: '/testGet.json'
		}).then(
			function successCallback(response){
		        // 请求成功执行代码
		        console.log(response.data)
			}, 
			function errorCallback(response) {
		     	// 请求失败执行代码
			}
		);
	}
	testFn.testFn1();
} 