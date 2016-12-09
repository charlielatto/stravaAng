var app = angular.module('stravaCommutes',['amChartsDirective']);

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
function($scope,$location,$http,stravaService,$q){
	
	var searchObject = $location.search().code;
	var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
	$scope.months = [];
	$scope.years = [];
	$scope.weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat", "Sun"];
	var countDeferred = $q.defer();
		
	$http({
		method: 'POST',
		url: "php/form.php?code="+searchObject
	}).then(function successCallback(response) {
		//console.log(response);
		$scope.auth_code = response.data.access_token;
		$scope.loadProfile($scope.auth_code);
		$scope.get12monthData($scope.auth_code);
		$scope.commuteCountChartOptions = $scope.renderChart().then(function(data){
			return data;
		});
		console.log($scope.commuteCountChartOptions);
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
			$scope.monthCommutes = stravaService.lastMonth($scope.monthsData[11]);
			$scope.monthCount = stravaService.allMonths($scope.monthsData,$scope.months);
			countDeferred.resolve($scope.monthCount);
			//console.log($scope.commuteCountChartOptions);
		});
		//console.log($scope.monthsData);
	}
	
	$scope.renderChart = function(){
		return countDeferred.promise.then(function(promData){
			var commuteCountChartOptions = {
				data:promData,
				type: "serial",

				categoryField: "month",
				chartScrollbar: {
					enabled: true
				},
				categoryAxis: {
					gridPosition: "start",
					parseDates: false
				},
				valueAxes: [{
					title: "Month"
				}],
				graphs: [{
					type: "line",
					title: "Commutes",
					valueField: "count",
					fillAlphas: 1
				}]
			};
			return commuteCountChartOptions
			//console.log($scope.commuteCountChartOptions);
		});
	};
	

	
	$scope.getMonthIndex = function(index) {
		var month = $scope.months[index];
		return monthNames.indexOf(month);
	}
	
	
	$scope.foundation = function(){
		$(document).foundation();
	}
	
	$scope.foundation();
	
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
	
	$scope.miles = function(metres){
		return (metres*0.000621371192).toFixed(2);
	}
	
	$scope.mph = function(metres){
		var milesPerSecond = metres*0.000621371192;
		return ((milesPerSecond*60)*60).toFixed(2);
	}
	
	$scope.backButton = function(){
		location.href = 'home.html?code='+searchObject;
	}
}]);

app.service('stravaService',function($http){
	this.lastMonth = function(data){
		var commutes = [];
		for(var i = 0; i < data.length; i++){
			if(data[i].commute){
				commutes.push(data[i]);
			}
		}
		return commutes;
	}
	
	this.allMonths = function(data,monthNames){
		var months = [];
		
		for(var j = 0; j < 12; j++){
			var commutes = {};
			commutes.count=0;
			commutes.month=monthNames[j];
			var rides = data[j];
			for(var i = 0; i < rides.length; i++){
				if(rides[i].commute){
					//commutes.push(rides[i]);
					commutes.count++;
				}
			}
			months.push(commutes);
		}
		//console.log(months);
		return months;
	}
	
});