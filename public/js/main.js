(function() {
document.domain = 'baixing.cn';

    angular.module('itrack', [])
        .controller('Ctrl', Ctrl)
        .factory('session', session)
        .directive('player', player);

    Ctrl.$inject = ['session'];

    function Ctrl(session) {
        var ctrl = this;
        session.query().then(function(d) {
            ctrl.sessions = d.data;
        })

        ctrl.load = function(id) {
            console.log(ctrl.sessions);
            console.log(id);
            ctrl.session = ctrl.sessions[id]
        }
    }


    session.$inject = ['$http'];

    function session($http) {
        var api = {
            get: getSession,
            query: querySession
        };

        function getSession(id) {
            return $http.get('/sessions/' + id)
        }
        function querySession(query) {
            return $http.get('/sessions')
        }

        return api;
    }


    player.$inject = ['session', '$window'];

    function player(session, $window) {
        return {
            restrict: 'E',
            scope: {
                session: '='
            },
            template: '<div>'+
            			'<p ng-hide="meta">select one session</p>'+
            			'<ul ng-show="meta">'+
            				'<li>User Agent: {{meta.ua}}</li>'+
            				'<li>URL: {{meta.url}}</li>'+
            				'<li>Window Size: {{meta.size}}</li>'+
            			'</ul>'+
            			'<button ng-click="play()" ng-disabled="loading || playing">play</button>' +
            			'<button ng-click="pause()" ng-disabled="loading">pause</button>' +
            			'<button ng-click="stop()" ng-disabled="loading">stop</button>' +
            		  '</div>',
            link: function(scope, element) {
                scope.play = play;
                scope.pause = pause;
                scope.stop = stop;
                scope.loading = true;
                scope.playing = false;
                scope.meta = null;
                activate();

                //================

                function activate() {
                    scope.$watch('session', function(newv, oldv) {
                        if(newv) {
                            scope.meta = newv.m;
                            engine.init(newv, element)
                        }
                    })

                	$window.addEventListener('iTrackFrameLoaded', function(e) {
                		scope.loading = false;
                		scope.$apply();
                	}, false)
                }

                function play() {
                	engine.play();
                	scope.playing = true;
                }

                function pause() {
                	engine.pause();
                	scope.playing = false;
                }

				function stop() {
                	engine.stop();
                	scope.playing = false;
                }
            }
        }
    }

})()
