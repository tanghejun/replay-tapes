(function() {
    angular.module('tapeStore', ['ngMaterial', 'angularUtils.directives.dirPagination', 'nvd3'])
        .controller('Ctrl', Ctrl)
        .factory('session', session)
        .filter('duration', durationFilter)

    Ctrl.$inject = ['session', '$scope']

    function Ctrl(session, $scope) {
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
        ctrl.draw = drawDiagram
        activate();

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

        function drawDiagram() {
            //click points
            var points = ctrl.tapes.map(function(tape) {
                return tape.events.filter(function(event) {
                    return event[0] === 'c'
                }).map(function(event) {
                    var arr = event.split(',')
                    return { x: Number(arr[1]), y: Number(arr[2]) }
                })
            }).filter(function(tape) {
                return tape.length
            }).reduce(function(a, b) {
                return a.concat(b)
            }, [])
            console.log(points);
            ctrl.data = [{
                color: '#1f77b4',
                key: 'click',
                values: points
            }]

        }


        ctrl.options = {
            chart: {
                type: 'scatterChart',
                height: 450,
                color: d3.scale.category10().range(),
                scatter: {
                    onlyCircles: false
                },
                showDistX: true,
                showDistY: true,
                tooltipContent: function(key) {
                    return '<h3>' + key + '</h3>';
                },
                duration: 350,
                xAxis: {
                    axisLabel: 'X Axis',
                    tickFormat: function(d){
                        return d3.format('.02f')(d);
                    },
                    orient: 'top',
                    transform: 'translate(400,-400)'
                },
                yAxis: {
                    axisLabel: 'Y Axis',
                    tickFormat: function(d){
                        return d3.format('.02f')(d);
                    },
                    axisLabelDistance: 30,
                    orient: 'left'
                },
                zoom: {
                    //NOTE: All attributes below are optional
                    enabled: true,
                    scaleExtent: [1, 10],
                    useFixedDomain: true,
                    useNiceScale: false,
                    horizontalOff: false,
                    verticalOff: false,
                    unzoomEventType: 'dblclick.zoom'
                }
            }
        };

        // ctrl.data = generateData(4,40);
        console.log(ctrl.data);

        /* Random Data Generator (took from nvd3.org) */
        function generateData(groups, points) { //# groups,# points per group
            var data = [],
                shapes = ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'],
                random = d3.random.normal();

            for (var i = 0; i < groups; i++) {
                data.push({
                    key: 'Group ' + i,
                    values: [],
                    slope: Math.random() - .01,
                    intercept: Math.random() - .5
                });

                for (var j = 0; j < points; j++) {
                    data[i].values.push({
                        x: random(),
                        y: random(),
                        size: Math.random(),
                        shape: shapes[j % 6]
                    });
                }
            }
            return data;
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
        var host = 'http://localhost:3001'
        var api = {
            get: getSession,
            query: querySession
        }

        function getSession(id) {
            return $http.get(host + '/sessions/' + id)
        }
        function querySession(query) {
            var result = $httpParamSerializer(query)
            return $http.get(host + '/sessions?' + result)
        }

        return api
    }




})()
