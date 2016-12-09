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
'$timeout',
function($scope,$location,$http,stravaService,$q,$timeout){
	
	var searchObject = $location.search().code;
	var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
	$scope.months = [];
	$scope.years = [];
	$scope.weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat", "Sun"];
	var countDeferred = $q.defer();	
		
	$scope.commuteCountChartOptions = $timeout(function(){ 
			return {
				data: countDeferred.promise,
				type: "serial",
				marginTop:5,
				categoryField: "month",
				valueAxes: [{
					title: "Count"
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
			balloonText: "<span style='font-size:14px;'>[[month]] <b>[[count]] [[distance]]mi</b></span>",
					valueField: "count"
				}]
			}
		},0);

	$scope.commuteSpeedChartOptions = $timeout(function(){ 
			return {
				data: countDeferred.promise,
				type: "serial",
				marginTop:5,
				categoryField: "month",
				valueAxes: [{
					title: "Speed (MPH)"
				}],
				balloon: {
					borderThickness: 1,
					shadowAlpha: 0
				},
				graphs: [{
					type: "line",
					balloon:{
						drop:true,
						maxWidth:45,
						pointerOrientation: "right",
						adjustBorderColor:false,
						color:"#ffffff"
					},
					bullet: "round",
					bulletSize: 8,
					title: "Commutes",
					type: "smoothedLine",
					balloonText: "<span style='font-size:14px;'>[[month]] <b>[[average_speed]]</b> mph</span>",
					valueField: "average_speed"
				}]
			}
		},0);
		
	$scope.commuteTimeChartOptions = $timeout(function(){ 
			return {
				data: countDeferred.promise,
				type: "serial",
				marginTop:5,
				categoryField: "month",
				valueAxes: [{
					id: "v1",
					title: "Avg Morning Start",
					position:"left",
					axisColor: "#d9534f",
					duration: "mm",
					durationUnits: {
						hh: ":",
						mm: ""
					}
				},{
					id: "v2",
					title: "Avg Evening Start",
					position:"right",
					axisColor: "#f0ad4e",
					duration: "mm",
					durationUnits: {
						hh: ":",
						mm: ""
					}
				}],
				balloon: {
					borderThickness: 1,
					shadowAlpha: 0
				},
				graphs: [{
					valueAxis: "v1",
					type: "line",
					balloon:{
						drop:true,
						maxWidth:60,
						pointerOrientation: "right",
						adjustBorderColor:false,
						color:"#ffffff"
					},
					bullet: "round",
					lineColor: "#d9534f",
					bulletSize: 8,
					title: "Time",
					type: "smoothedLine",
					balloonText: "<span style='font-size:14px;'>[[month]] <b>[[morningStartString]]</b></span>",
					valueField: "morningStart"
				},{
					valueAxis: "v2",
					type: "line",
					balloon:{
						drop:true,
						maxWidth:60,
						pointerOrientation: "left",
						adjustBorderColor:false,
						color:"#ffffff"
					},
					bullet: "round",
					lineColor: "#f0ad4e",
					bulletSize: 8,
					title: "Time",
					type: "smoothedLine",
					balloonText: "<span style='font-size:14px;'>[[month]] <b>[[eveningStartString]]</b></span>",
					valueField: "eveningStart"
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
		console.log($scope.commuteCountChartOptions);
	}, function errorCallback(response) {
		console.log("error");
	});
	//console.log(countDeferred.promise);
	
	

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
		return stravaService.miles(metres);
	}
	
	$scope.mph = function(metres){
		return stravaService.mph(metres);
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
			var totalspeed = 0;
			var totaldistance = 0;
			var totalMorningStartTime = 0;
			var morningCount = 0;
			var eveningCount = 0;
			var totalEveningStartTime = 0;
			var rides = data[j];
			for(var i = 0; i < rides.length; i++){
				if(rides[i].commute){
					//commutes.push(rides[i]);
					totalspeed += rides[i].average_speed;
					totaldistance += rides[i].distance;
					var start = new Date(rides[i].start_date);
					if(start.getHours() < 12){
						totalMorningStartTime += this.getTotalSeconds(start);
						morningCount++;
					} else {
						eveningCount++;
						totalEveningStartTime += this.getTotalSeconds(start);
					}
					commutes.count++;
				}
			}
			commutes.morningStart = ((totalMorningStartTime/morningCount)/60).toFixed(0);
			commutes.eveningStart = ((totalEveningStartTime/eveningCount)/60).toFixed(0);
			commutes.morningStartString = this.secondsToHms(totalMorningStartTime/morningCount);
			commutes.eveningStartString = this.secondsToHms(totalEveningStartTime/eveningCount);
			commutes.average_speed = this.mph((totalspeed/commutes.count));
			commutes.distance = this.miles(totaldistance);
			months.push(commutes);
		}
		//console.log(months);
		return months;
	}
	
	this.getTotalSeconds = function(date){
		var hours = date.getHours();
		var mins = date.getMinutes();
		var seconds = ((hours * 60)*60) + (mins * 60);
		return seconds;
	}
	
	this.secondsToHms = function(d) {
		d = Number(d);
		var h = Math.floor(d / 3600);
		var m = Math.floor(d % 3600 / 60);
		var s = Math.floor(d % 3600 % 60);
		return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s); 
	}
	
	this.miles = function(metres){
		return (metres*0.000621371192).toFixed(2);
	}
	
	this.mph = function(metres){
		var milesPerSecond = metres*0.000621371192;
		return ((milesPerSecond*60)*60).toFixed(2);
	}
	
});
