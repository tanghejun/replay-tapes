(function() {
    angular.module('tapeStore', ['ngMaterial'])
        .controller('Ctrl', Ctrl)
        .factory('session', session)
        .filter('duration', durationFilter)

    Ctrl.$inject = ['session']

    function Ctrl(session) {
        var ctrl = this
        ctrl.minDate = new Date(2016, 10, 10)
        ctrl.maxDate = new Date(2017, 10, 10)
        ctrl.date = new Date()
        ctrl.tags = []
        ctrl.userId = ''

        ctrl.search = searchTapes;



        function searchTapes() {
            var queryObj = {}
            queryObj.tags = ctrl.tags.join(',')
            queryObj.userId = ctrl.userId.trim()
            queryObj.time = ctrl.date ? ctrl.date.getTime() : ''

            ctrl.loading = true
            session.query(queryObj).then(function(data) {
                ctrl.tapes = data.data
                if(ctrl.tapes.length === 0) {
                    ctrl.message = 'Sorry, records not found.'
                }
                ctrl.tapes = ctrl.tapes.map(function(tape) {
                    tape.duration = getDuration(tape)
                    tape.summary = getEventsSummary(tape)
                    return tape
                })
            }).catch(function(err) {
                ctrl.message = err.message
            }).finally(function() {
                ctrl.loading = false
            })
        }
        function getEventsSummary(tape) {
            return tape.events.reduce(function(a, b) {
                if( !a[b[0]] ) {
                    a[b[0]] = 1
                } else {
                    a[b[0]]++;
                }
                return a;
            }, {})
        }

        function getDuration(tape) {
            var lastIndex = tape.events.length - 1;
            return Math.ceil( ( getTime(tape.events[lastIndex]) - getTime(tape.events[0]) ) / 1000 )

            function getTime(event) {
                var arr = event.split(',')
                var num = Number( arr[arr.length -1] )
                if(num < 0) {
                    num = 0
                }
                return num
            }
        }
    }

    function durationFilter() {
        return function(value) {
            if(isNaN(value)) {
                return value
            }
            var m = Math.floor( value / 60)
            var s = value % 60
            var str = ''
            if(m) {
                str += m + 'm'
            }
            if(s) {
                str += s + 's'
            }
            return str;
        }
    }

    session.$inject = ['$http', '$httpParamSerializer']

    function session($http, $httpParamSerializer) {
        var api = {
            get: getSession,
            query: querySession
        }

        function getSession(id) {
            return $http.get('/sessions/' + id)
        }
        function querySession(query) {
            var result = $httpParamSerializer(query)
            return $http.get('/sessions?' + result)
        }

        return api
    }




})()
