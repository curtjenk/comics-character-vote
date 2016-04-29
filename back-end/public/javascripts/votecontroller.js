var host = "http://localhost:3100";
// var host = "http://www.curtisjenkins.net:3100";
var hostUploadUrl = host + "/upload";
var votingApp = angular.module('votingApp', []);

//to help with file upload
// https://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs
votingApp.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

votingApp.service('fileUpload', ['$http', function ($http) {
    this.uploadFileToUrl = function(file, uploadUrl){
      console.log("url = " + uploadUrl);
        var fd = new FormData();
        fd.append('file', file);
        $http.post("/upload", fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}   //Angular will set type to multipart/form-data
        })
        .success(function(){
        })
        .error(function(){
        });
    };
}]);

votingApp.controller('voteController', function($scope, $http, fileUpload) {

    var URL = host + "/search";
    var voteUrl = host + "/vote";

    $scope.heroOne = {};
    $scope.heroTwo = {};

//uses the above directive and service to post the file to our
//backend api
    $scope.doUpload = function () {
      console.log($scope.myFile);
      var file = $scope.myFile;
      fileUpload.uploadFileToUrl(file, hostUploadUrl);
    };

    $scope.voteOne = function() {
        var postData = {};
        postData.winner = $scope.heroOne;
        postData.loser = $scope.heroTwo;
        $http.post(voteUrl, {
            winner: postData.winner,
            loser: postData.loser
        }).then(
            function(response) {
                console.log(response);
            },
            function(error) {

            });
    };

    $scope.voteTwo = function() {
        var postData = {};
        postData.winner = $scope.heroTwo;
        postData.loser = $scope.heroOne;
        $http.post(voteUrl, {
            winner: postData.winner,
            loser: postData.loser
        }).then(
            function(response) {
                console.log(response);
            },
            function(error) {

            });
    };

    $http.get(URL).then(
        function(response) {
            console.log(response);
            var ndx1 = Math.floor(Math.random() * response.data.length);
            var ndx2 = Math.floor(Math.random() * response.data.length);
            while (Math.abs(ndx1 - ndx2) < 5) {
                ndx2 = Math.floor(Math.random() * response.data.length);
            }

            $scope.heroOne = response.data[ndx1];
            $scope.heroTwo = response.data[ndx2];
        },
        function(error) {

        });



    $scope.message = "Hero ";
});
