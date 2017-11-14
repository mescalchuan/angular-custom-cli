export default function sellerCenterDir(){
	return {
		restrict:'EACM',
		template:`<ul><li ng-repeat='item in data'>{{item}}</li></ul>`
	}
}