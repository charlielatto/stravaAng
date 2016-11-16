var app = angular.module('stravaHome',[]);

app.config(function($locationProvider) {
  $locationProvider.html5Mode({
	enabled: true,
	requireBase: false
	});;
});

app.controller('MainCtrl',[
'$scope',
'$location',
'$http',
function($scope,$location,$http){
	
	var searchObject = $location.search().code;
		
	$http({
		method: 'POST',
		url: "php/form.php?code="+searchObject
	}).then(function successCallback(response) {
		//console.log(response);
		$scope.auth_code = response.data.access_token;
	}, function errorCallback(response) {
		console.log("error");
	});
	
	$http({
		method: 'GET',
		url: "https://www.strava.com/api/v3/athlete?access_token="+$scope.auth_code
	}).then(function successCallback(response) {
		//console.log(response);
		$scope.userdata = response.data;
		console.log(response.data);
	}, function errorCallback(response) {
		console.log("error");
	});
	
	
	
	
}]);