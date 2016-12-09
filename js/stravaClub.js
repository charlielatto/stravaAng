var app = angular.module('stravaClub',['amChartsDirective']);

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
'stravaService',
'$q',
'$timeout',
function($scope,$location,$http,stravaService,$q,$timeout){
	
	var searchObject = $location.search().code;
	var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
	$scope.months = [];
	$scope.years = [];
	$scope.weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat", "Sun"];
	var countDeferred = $q.defer();	
	$scope.contentHidden = true;
	$scope.clubDay = "";
	$scope.clubTime = "";
	$scope.clubText= "";
	

	
	$http({
		method: 'POST',
		url: "php/form.php?code="+searchObject
	}).then(function successCallback(response) {
		//console.log(response);
		$scope.auth_code = response.data.access_token;
		$scope.loadProfile($scope.auth_code);
		$scope.get12monthData($scope.auth_code);
		//console.log($scope.commuteCountChartOptions);
	}, function errorCallback(response) {
		console.log("error");
	});
	
	$scope.loadProfile = function(code){
		$http({
			method: 'jsonp',
			url: "https://www.strava.com/api/v3/athlete?callback=JSON_CALLBACK&access_token="+code
		}).then(function successCallback(response) {
			//console.log(response);	
			$scope.userdata = response.data;
			//console.log(response.data);
		}, function errorCallback(response) {
			console.log("error");
			console.log(response);
		});
	}
	
	$scope.get12monthData = function(code){
		$scope.monthsData = [];
		$scope.get12Months();
		//console.log($scope.years);
		//console.log($scope.months);
		var promises = [];
		for(var index=0; index < 12; index++){
			var month = $scope.getMonthIndex(index);
			var startOfMonth = new Date($scope.years[index],month,1)/1000;
			var endOfMonth = new Date($scope.years[index],month+1,1)/1000;
			promises.push($http({
				method: 'jsonp',
				url: "https://www.strava.com/api/v3/athlete/activities?callback=JSON_CALLBACK&after="+startOfMonth+"&before="+endOfMonth+"&per_page=60&access_token="+code
			}));
		}
		
		$q.all(promises).then(function(response){
			for (var i = 0; i < response.length; i++) {
				$scope.monthsData.push(response[i].data);
			}
			//$scope.monthCommutes = stravaService.lastMonth($scope.monthsData[11]);
			//$scope.monthCount = stravaService.allMonths($scope.monthsData,$scope.months);
			//countDeferred.resolve($scope.monthCount);
			//console.log($scope.commuteCountChartOptions);
		});
		//console.log($scope.monthsData);
	}
	
	$scope.getMonthIndex = function(index) {
		var month = $scope.months[index];
		return monthNames.indexOf(month);
	}
	
	$scope.get12Months = function(){
		var now = new Date();
		var year = now.getFullYear();
		var currentMonth = now.getMonth();
		var index = 11;
		$scope.months[index] = monthNames[currentMonth];
		$scope.years[index] = year; 
		while(index > 0) {
			currentMonth--;
			if(currentMonth == -1){
				currentMonth = 11;
				year = year - 1;
			}
			index--;
			$scope.months[index] = monthNames[currentMonth];
			$scope.years[index] = year; 
		}
	}
	
	$scope.getClubRides = function(){
		console.log($scope.clubDay + " " + $scope.clubTime + " " + $scope.clubText);
		$scope.contentHidden = false;
	}
	
	$scope.resetClub = function(){
		$scope.clubDay = "";
		$scope.clubTime = "";
		$scope.clubText= "";
		$scope.contentHidden = true;
	}
	
	$scope.miles = function(metres){
		return stravaService.miles(metres);
	}
	
	$scope.mph = function(metres){
		return stravaService.mph(metres);
	}
	
	$scope.backButton = function(){
		location.href = 'home.html?code='+searchObject;
	}
	
	$scope.foundation = function(){
		$(document).foundation();

	}
	
	$scope.foundation();
	
	
	
}]);

app.service('stravaService',function($http){
	
	this.miles = function(metres){
		return (metres*0.000621371192).toFixed(2);
	}
	
	this.mph = function(metres){
		var milesPerSecond = metres*0.000621371192;
		return ((milesPerSecond*60)*60).toFixed(2);
	}
	
});