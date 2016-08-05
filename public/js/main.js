(function() {

    angular.module('itrack', [])
        .controller('Ctrl', Ctrl)
        // .factory('engine', engine)
        .factory('session', session)
        .factory('event', event)
        .directive('player', player);

    Ctrl.$inject = [];

    function Ctrl() {
        console.log('in ctrl');
    }


    session.$inject = ['$http'];

    function session($http) {
        var api = {
            get: getSession
        };

        function getSession(id) {
            return $http.get('/sessions/' + id)
        }

        return api;
    }


    event.$inject = ['$http'];

    function event($http) {
        var api = {
            get: getEvent,
            list: listEvents
        };

        function getEvent(id) {
            return $http.get('/events/' + id)
        }

        function listEvents() {
            return $http.get('/events');
        }

        return api;
    }

    player.$inject = ['event', 'session'];

    function player(event, session) {
        return {
            restrict: 'E',
            link: function(scope, element) {
                activate();

                //================
                function activate() {
                    event.list().then(function(data) {
                        var length = data.data.length;
                        session.get(data.data[length - 1].i)
                            .then(function(sdata) {
                                var session = sdata.data;
                                engine.init(session, element);
                            })
                    })
                }
            }
        }
    }



    // engine.$inject = ['session', 'event'];
    // function engine(session, event) {
    //     var api = {
    //         init: init
    //     };

    //     function init() {
    //     	event.list().then(function(data) {
    //     		var length = data.data.length;
    //     		session.get(data.data[length -1].i)
    //     			.then(function(data1) {
    //     				var sessionData = data1.data;
    //     				engine.init(ses)
    //     			})
    //     	})
    //         // engine.init();
    //     }


    //     return api;
    // }
})()
