var app = angular.module('stravaOverall',['amChartsDirective','leaflet-directive']);

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
	
	
	requirejs.config({
		baseUrl: 'js',
		paths: {
			polyline: 'polyline'
		}
	});

	//var polyline = require('polyline');
	var searchObject = $location.search().code;
	var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
	$scope.months = [];
	$scope.years = [];
	$scope.monthYear = [];
	$scope.monthArray = [];
	$scope.currentMonth = [];
	$scope.weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",];
	var countDeferred = $q.defer();

	$scope.weekdayChartOptions = $timeout(function(){ 
			return {
				data: countDeferred.promise,
				type: "serial",
				marginTop:5,
				categoryField: "day",
				valueAxes: [{
					title: "Rides (%)"
				}],
				balloon: {
					borderThickness: 1,
					shadowAlpha: 0
				},
				graphs: [{
					type: "line",
					balloon:{
						drop:true,
						maxWidth:65,
						pointerOrientation: "right",
						adjustBorderColor:false,
						color:"#ffffff"
					},
					bullet: "round",
					bulletSize: 8,
					title: "Commutes",
					type: "smoothedLine",
					balloonText: "<span style='font-size:14px;'>[[day]] <b>[[rides]]%</b></span>",
					valueField: "rides"
				}]
			}
		},0);	
	
	$http({
		method: 'POST',
		url: "php/form.php?code="+searchObject
	}).then(function successCallback(response) {
		//console.log(response);
		$scope.auth_code = response.data.access_token;
		$scope.loadProfile($scope.auth_code);
		$scope.get12monthData($scope.auth_code);
		$scope.setUpMonths();
		$timeout(function(){
			$scope.weekRides();
		},1000);
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
			
		});
		
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
	
	$scope.setUpMonths = function(){
		for(var i =0; i < 12; i++){
			$scope.monthYear.push($scope.months[i] + " " + $scope.years[i]);
			
		}
		$scope.activeMonth = $scope.monthYear[11];
		$scope.activeCompareMonth = $scope.monthYear[10];
		$scope.selectedMonth = $scope.activeMonth;
		$scope.selectedCompareMonth = $scope.activeCompareMonth;
		$timeout(function(){
			$scope.changeActiveMonthArray();
			$scope.currentMonth = $scope.monthSummary;
			$scope.changeActiveCompareMonthArray();
		},1000);
	}
	
	$scope.changeActiveMonth = function(){
		$scope.activeMonth = $scope.selectedMonth;
		$scope.changeActiveMonthArray();
	}
	
	$scope.changeActiveMonthArray = function(){
		$scope.monthArray = $scope.monthsData[$scope.monthYear.indexOf($scope.activeMonth)];
		$scope.monthSummary = {};
		$scope.monthSummary.count = 0;
		$scope.monthSummary.distance = 0;
		$scope.monthSummary.elevation = 0;
		$scope.monthSummary.time = 0;
		var totalSpeed = 0;
		
		for(var i = 0; i < $scope.monthArray.length; i++){
			$scope.monthSummary.count++;
			$scope.monthSummary.distance += $scope.monthArray[i].distance;
			$scope.monthSummary.elevation += $scope.monthArray[i].total_elevation_gain;
			$scope.monthSummary.time += $scope.monthArray[i].moving_time;
			totalSpeed += $scope.monthArray[i].average_speed;
		}
		$scope.monthSummary.average_speed = totalSpeed/$scope.monthSummary.count;
		//console.log($scope.monthSummary);
	}
	
	$scope.changeActiveCompareMonth = function(){
		$scope.activeCompareMonth = $scope.selectedCompareMonth;
		$scope.changeActiveCompareMonthArray();
	}
	
	$scope.changeActiveCompareMonthArray = function(){
		$scope.monthCompareArray = $scope.monthsData[$scope.monthYear.indexOf($scope.activeCompareMonth)];
		$scope.monthCompareSummary = {};
		$scope.monthCompareSummary.count = 0;
		$scope.monthCompareSummary.distance = 0;
		$scope.monthCompareSummary.elevation = 0;
		$scope.monthCompareSummary.time = 0;
		var totalSpeed = 0;
		
		var today = new Date().getDate();
		
		for(var i = 0; i < $scope.monthCompareArray.length; i++){
			var rideDay = new Date($scope.monthCompareArray[i].start_date).getDate();
			if(rideDay <= today){
				$scope.monthCompareSummary.count++;
				$scope.monthCompareSummary.distance += $scope.monthCompareArray[i].distance;
				$scope.monthCompareSummary.elevation += $scope.monthCompareArray[i].total_elevation_gain;
				$scope.monthCompareSummary.time += $scope.monthCompareArray[i].moving_time;
				totalSpeed += $scope.monthCompareArray[i].average_speed;
			}
		}
		$scope.monthCompareSummary.average_speed = totalSpeed/$scope.monthCompareSummary.count;
		console.log($scope.monthCompareSummary);
	}
	
	$scope.secondsToHms = function(time){
		return stravaService.secondsToHms(time);
	}
	
	$scope.weekRides = function(){
		var dayRides = [0,0,0,0,0,0,0];
		var noncommutes = 0;
		$scope.weekData = [];
		for (var i =0;i<$scope.monthsData.length;i++){			
			for (var j =0; j < $scope.monthsData[i].length; j++){			
				if(!$scope.monthsData[i][j].commute){
					var starttime = new Date($scope.monthsData[i][j].start_date);
					var weekday;
					if(starttime.getDay() == 0){
						weekday = 6
					} else {
						weekday = starttime.getDay() - 1;
					}
					dayRides[weekday]++;
					noncommutes++;
				}
			}
		}
		
		for(var j=0;j<dayRides.length;j++){
			var rideper = ((dayRides[j]/noncommutes)*100).toFixed(1);
			$scope.weekData.push({day:$scope.weekdays[j],rides:rideper});
		}
		countDeferred.resolve($scope.weekData);
	}
}]);


app.service('stravaService',function($http){
	
	this.miles = function(metres){
		return (metres*0.000621371192).toFixed(2);
	}
	
	this.mph = function(metres){
		var milesPerSecond = metres*0.000621371192;
		return ((milesPerSecond*60)*60).toFixed(2);
	}
	
	this.secondsToHms = function(d) {
		d = Number(d);
		var h = Math.floor(d / 3600);
		var m = Math.floor(d % 3600 / 60);
		var s = Math.floor(d % 3600 % 60);
		return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s); 
	}
	
});