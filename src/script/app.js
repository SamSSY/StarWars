angular.module('app',[])
.controller('appCtrl', ['$scope', function($scope){
    var socket = io();
    
    $scope.userA = 0;
    $scope.userB = 0;       
    $scope.userAScore = 0;
    $scope.userBScore = 0;
    
    socket.on('pairingSuccess', function( users ){
        console.log("users: ", users);
        $scope.$apply(function () {
			$scope.userA = users.masterUID;
            $scope.userB = users.rivalUID;
        });
    });
    // req.body: {'UID': XXXXXX, 'score': 1};
    socket.on('updateScore', function( data ){
        console.log('user UID: ', data.UID, 'plus score: ', score);
        $scope.$apply(function () {
			if( $scope.userA == data.UID ){
                $scope.userAScore = data.score;
            }
            else if ( $scope.userB == data.UID ){
                $scope.userBScore = data.score;
            }
        });
    });
    
    if($scope.userAScore >= 10){
        console.log("userA wins!");
    }
    else if ($scope.userBScore >= 10){
        console.log("userB wins!");     
    } 
}]);