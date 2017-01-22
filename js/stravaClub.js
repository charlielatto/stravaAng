var app = angular.module('stravaClub',['amChartsDirective','leaflet-directive']);

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
	$scope.weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var countDeferred = $q.defer();	
	$scope.contentHidden = true;
	$scope.clubDay = "";
	$scope.clubTime = "";
	$scope.clubText= "";
	$scope.mappaths = {};
	$scope.center = {};
	var countDeferred = $q.defer();	
	
	$scope.clubSpeedChartOptions = $timeout(function(){ 
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

	
	$http({
		method: 'POST',
		url: "php/form.php?code="+searchObject
	}).then(function successCallback(response) {
		//console.log(response);
		$scope.auth_code = response.data.access_token;
		$scope.loadProfile($scope.auth_code);
		$scope.get12monthData($scope.auth_code);
		console.log($scope.clubSpeedChartOptions);
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
	
	$scope.getClubRides = function(){
		//console.log($scope.clubDay + " " + $scope.clubTime + " " + $scope.clubText);
		$scope.clubrides = stravaService.getClubRides($scope.monthsData,$scope.clubDay,$scope.clubTime,$scope.clubText,$scope.weekdays);
		if ($scope.clubrides.length > 0){
			$scope.contentHidden = false;
			$scope.errorText = "";
		} else {
			$scope.errorText = "No Rides found!";
		}
		console.log($scope.clubrides);	
		$scope.maps = [];
		$scope.clubdistance =0;
		$scope.clubelevation = 0;
		var avg_speed = 0;
		for(var i = 0; i < $scope.clubrides.length; i++){
			if ($scope.clubrides[i].map.summary_polyline != null){
				$scope.maps.push(stravaService.convertToObject(polyline.decode($scope.clubrides[i].map.summary_polyline)));
				$scope.mappaths["p"+i] = {
					color: 'blue',
					weight: 3,
					opacity:0.3,
					latlngs:$scope.maps[i]
				};
			}
			$scope.clubdistance += $scope.clubrides[i].distance;
			$scope.clubelevation += $scope.clubrides[i].total_elevation_gain;
			avg_speed += $scope.clubrides[i].average_speed;
		}
		$scope.clubaverage = avg_speed/$scope.clubrides.length;
		$scope.clubAvgDistance = $scope.clubdistance/$scope.clubrides.length;
		$scope.clubAvgClimb = ($scope.clubelevation/$scope.clubrides.length).toFixed(0);
		//console.log($scope.maps[0][0]);
		$scope.center = {
				lat: $scope.maps[0][0].lat,
				lng: $scope.maps[0][0].lng,
				zoom: 11
			};
			
		$scope.monthCount = stravaService.allMonths($scope.monthsData,$scope.months,$scope.clubDay,$scope.clubTime,$scope.clubText,$scope.weekdays);
		countDeferred.resolve($scope.monthCount);
			//console.log($scope.commuteCountChartOptions);
		//console.log($scope.monthCount);
		//console.log($scope.maps[0]);
		//console.log($scope.mappaths);
	}
	
	$scope.resetClub = function(){
		$scope.clubDay = "";
		$scope.clubTime = "";
		$scope.clubText= "";
		$scope.errorText = "";
		$scope.contentHidden = true;
	}
	
	$scope.miles = function(metres){
		return stravaService.miles(metres);
	}
	
	$scope.mph = function(metres){
		return stravaService.mph(metres);
	}
	
	$scope.weekdaySelected = function(){
		if($scope.clubDay === "" || $scope.clubDay === "Saturday" || $scope.clubDay === "Sunday"){
			return false;
		} else {
			return true;
		}
	}
	
	$scope.backButton = function(){
		location.href = 'home.html?code='+searchObject;
	}
	
	$scope.foundation = function(){
		$(document).foundation();
	}
	
	
	
	$scope.foundation();

	angular.extend($scope, {
			defaults: {
				scrollWheelZoom: false
			}
		});
	
}]);

app.service('stravaService',function($http){
	
	this.getClubRides = function(data,clubDay,clubTime,clubText,weekdays){
		var clubrides = [];
		
		for(var j = 0; j < 12; j++){
			var clubride = {};
			var rides = data[j];
			for(var i = 0; i < rides.length; i++){
				if(this.rightWeekday(rides[i].start_date,clubDay,weekdays)
					&& this.rightTime(rides[i].start_date,clubTime)
					&& this.containsText(rides[i].name,clubText)){
					//commutes.push(rides[i]);
					clubrides.push(rides[i]);
					
				}
			}
		}
		//console.log(months);
		return clubrides;
	}
	
	this.rightWeekday = function(start_date,clubDay,weekdays) {
		return (new Date(start_date).getDay() == weekdays.indexOf(clubDay));
	}
	
	this.rightTime = function(start_date,clubTime){
		var start = new Date(start_date);
		var hour = start.getHours();
		var endTimeWindow = parseInt(clubTime) + 2;
		if (clubTime == "" || (hour >= parseInt(clubTime) && hour < endTimeWindow)){
			//console.log("time true" + hour + " " + parseInt(clubTime) + " "+endTimeWindow);
			return true;
		} else {
			//console.log("time false" + hour + " " + parseInt(clubTime) + " "+endTimeWindow);
			return false;
		}
	}
	
	this.containsText = function(title,clubText){
		if (clubText === "" || title.toLowerCase().includes(clubText.toLowerCase())){
			//console.log("text true" + clubText + " " + title);
			return true;
		} else {
			//console.log("text false" + clubText + " " + title);
			return false;
		}
	}
	
	this.miles = function(metres){
		return (metres*0.000621371192).toFixed(2);
	}
	
	this.mph = function(metres){
		var milesPerSecond = metres*0.000621371192;
		return ((milesPerSecond*60)*60).toFixed(2);
	}
	
	this.convertToObject = function(array){
		var returnArray = [];
		for(var i = 0; i < array.length; i++){
			var subArray = array[i];
			returnArray.push({lat:subArray[0],lng:subArray[1]});
		}
		return returnArray;
	}
	
	this.allMonths = function(data,monthNames,clubDay,clubTime,clubText,weekdays){
		var months = [];
		
		for(var j = 0; j < 12; j++){
			var clubs = {};
			clubs.count=0;
			clubs.month=monthNames[j];
			var totalspeed = 0;
			var rides = data[j];
			for(var i = 0; i < rides.length; i++){
				if(this.rightWeekday(rides[i].start_date,clubDay,weekdays)
					&& this.rightTime(rides[i].start_date,clubTime)
					&& this.containsText(rides[i].name,clubText)){
						totalspeed += rides[i].average_speed;
						clubs.count++;
					}
			}
			if(totalspeed > 0){
				clubs.average_speed = this.mph((totalspeed/clubs.count));				
			} else {
				clubs.average_speed = 0;
			}

			months.push(clubs);
		}
		return months;
	}
	
});