(function() {
    angular.module('tapeStore', ['ngMaterial'])
        .controller('Ctrl', Ctrl)
        .factory('session', session)

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
            }).catch(function(err) {
                ctrl.message = err.message
            }).finally(function() {
                ctrl.loading = false
            })
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
            console.log(result);
            return $http.get('/sessions?' + result)
        }

        return api
    }




})()
