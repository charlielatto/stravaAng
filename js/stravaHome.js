var app = angular.module('stravaHome',[]);

app.controller('MainCtrl',[
'$scope',
'$location',
'$http',
function($scope,$location,$http){
	
	var searchObject = $location.search();
	
	$http({
		method: 'GET',
		url: "php/form.php?code="+searchObject.code
	}).then(function successCallback(response) {
		console.log(response);
		$scope.auth_code = response.access_token;
	}, function errorCallback(response) {
		console.log("error");
	});
	
	
}]);