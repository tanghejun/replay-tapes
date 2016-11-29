(function() {
    angular.module('tapeStore', ['ngMaterial', 'angularUtils.directives.dirPagination'])
        .controller('Ctrl', Ctrl)
        .factory('session', session)
        .factory('feedback', feedback)
        .filter('duration', durationFilter)

    Ctrl.$inject = ['session', '$scope', '$mdDialog', 'feedback']

    function Ctrl(session, $scope, $mdDialog, feedback) {
        var ctrl = this
        ctrl.minDate = new Date(2016, 10, 10)
        ctrl.maxDate = new Date(2017, 10, 10)
        ctrl.date = new Date()
        ctrl.tags = []
        ctrl.userId = ''
        ctrl.pageSize = 10
        ctrl.pageSizes = [10, 20, 30, 50, 100]
        ctrl.keyword = ''
        ctrl.orderBy = []
        ctrl.longest = false
        ctrl.newest = true

        ctrl.search = searchTapes
        ctrl.giveFeedback = giveFeedback

        activate()

        function activate() {
            $scope.$watchGroup(['Main.newest', 'Main.longest'], function(newV, oldV) {
                if(oldV !== newV) {
                    if(newV[0] && !newV[1]) {
                        ctrl.orderBy = ['-time']
                    } else if(newV[1] && !newV[0]) {
                        ctrl.orderBy = ['-duration']
                    } else if(newV[0] && newV[1]) {
                        ctrl.orderBy = ['-time', '-duration']
                    } else {
                        ctrl.orderBy = ['-time']
                    }
                }
            })
        }

        function searchTapes() {
            var queryObj = {}
            queryObj.tags = ctrl.tags.join(',')
            queryObj.userId = ctrl.userId.trim()
            queryObj.time = ctrl.date ? ctrl.date.getTime() : ''
            queryObj.urlRegex = ctrl.urlRegex ? encodeURIComponent(ctrl.urlRegex.trim()): ''

            ctrl.loading = true
            session.query(queryObj).then(function(data) {
                ctrl.tapes = data.data
                if(ctrl.tapes.length === 0) {
                    ctrl.message = 'Sorry, records not found.'
                }
                ctrl.tapes = ctrl.tapes.map(function(tape) {
                    tape.duration = getDuration(tape)
                    tape.summary = getEventsSummary(tape)
                    tape.meta.replayUrl = getReplayUrl(tape)
                    return tape
                })
            }).catch(function(err) {
                ctrl.message = err.message
            }).finally(function() {
                ctrl.loading = false
            })
        }


        function getReplayUrl(tape) {
            var url = tape.meta.url
            var id = tape._id
            var a = document.createElement('a')
            a.href = url
            if(/^\?/g.test(a.search)) {
                return url + '&replay_session_id=' + id
            } else {
                return url + '?replay_session_id=' + id
            }
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

        function giveFeedback(ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.prompt()
              .title('So you like it! tell us a little more')
              .textContent('say something about function, UI, chrome extension')
              .placeholder('your feedback')
              .ariaLabel('feedback')
              .targetEvent(ev)
              .ok('Okay!')
              .cancel('Cancel')

            $mdDialog.show(confirm).then(function(result) {
                feedback.send({ action: 'feedback', content: result && result.trim() })
            }, function() {
                feedback.send({ action: 'like'})
            })
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

    feedback.$inject = ['$http']

    function feedback($http) {
        var api = {
            send: sendFeedback
        }

        function sendFeedback(fb) {
            return $http.post('/feedback/', fb)
        }

        return api
    }


})()
