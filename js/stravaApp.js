var app = angular.module('strava',[]);

app.controller('MainCtrl',[
'$scope',
function($scope){
	
	var clientid = 14160;
	var redirect = "http://213.1.14.56/stravastats2/home.html";
	var url = "https://www.strava.com/oauth/authorize?client_id="+clientid+"&response_type=code&redirect_uri="+redirect;
	
	$scope.callStrava = function(){
		location.href = url;
	}
}]);
