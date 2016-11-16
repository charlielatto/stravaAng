var app = angular.module('stravaHome',[]);

app.controller('MainCtrl',[
'$scope',
'$location',
'$http',
'$locationProvider',
function($scope,$location,$http,$locationProvider){
	
	$locationProvider.html5Mode(true);
	
	var searchObject = $location.search().code;
	console.log(searchObject);
	
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