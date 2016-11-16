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
		$scope.loadProfile($scope.auth_code);
	}, function errorCallback(response) {
		console.log("error");
	});
	
	$scope.loadProfile = function(code){
		$http({
			method: 'jsonp',
			url: "https://www.strava.com/api/v3/athlete?callback=JSON_CALLBACK&access_token="+code
		}).then(function successCallback(response) {
			//console.log(response);	
			//$scope.userdata = response.data;
			console.log(response);
		}, function errorCallback(response) {
			console.log("error");
			console.log(response);
		});
	}
	
	
	
	
}]);