(function() {
    angular.module('tapeStore', ['ngMaterial', 'angularUtils.directives.dirPagination', 'ui-rangeSlider'])
        .controller('Ctrl', Ctrl)
        .factory('session', session)
        .factory('feedback', feedback)
        .filter('duration', durationFilter)
        .filter('range', rangeFilter)
        .directive('echart', echart)

    Ctrl.$inject = ['session', '$scope', '$mdDialog', 'feedback']

    function Ctrl(session, $scope, $mdDialog, feedback) {
        var ctrl = this
        ctrl.minDate = new Date(2016, 10, 10)
        ctrl.maxDate = new Date(2017, 10, 10)
        ctrl.date = new Date(2016, 10, 27)
        ctrl.tags = []
        ctrl.userId = ''
        ctrl.pageSize = 10
        ctrl.pageSizes = [10, 20, 30, 50, 100]
        ctrl.keyword = ''
        ctrl.orderBy = []
        ctrl.longest = false
        ctrl.newest = true
        ctrl.durationRange = {
            min: 0,
            max: 300,
            userMin: 0,
            userMax: 20,
            disable: false
        }

        ctrl.search = searchTapes
        ctrl.giveFeedback = giveFeedback
        ctrl.drawScatter = drawScatter
        ctrl.drawReadRatio = drawReadRatio
        ctrl.drawDuration = drawDuration

        activate()

        function activate() {
            $scope.$watchGroup(['Main.newest', 'Main.longest'], function(newV, oldV) {
                if (oldV !== newV) {
                    if (newV[0] && !newV[1]) {
                        ctrl.orderBy = ['-time']
                    } else if (newV[1] && !newV[0]) {
                        ctrl.orderBy = ['-duration']
                    } else if (newV[0] && newV[1]) {
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
            queryObj.urlRegex = ctrl.urlRegex ? encodeURIComponent(ctrl.urlRegex.trim()) : ''

            ctrl.loading = true
            session.query(queryObj).then(function(data) {
                ctrl.tapes = data.data
                if (ctrl.tapes.length === 0) {
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
            if (/^\?/g.test(a.search)) {
                return url + '&replay_session_id=' + id
            } else {
                return url + '?replay_session_id=' + id
            }
        }

        function getEventsSummary(tape) {
            return tape.events.reduce(function(a, b) {
                if (!a[b[0]]) {
                    a[b[0]] = 1
                } else {
                    a[b[0]]++;
                }
                return a;
            }, {})
        }

        function getDuration(tape) {
            var lastIndex = tape.events.length - 1;
            return Math.ceil((getTime(tape.events[lastIndex]) - getTime(tape.events[0])) / 1000)

            function getTime(event) {
                var arr = event.split(',')
                var num = Number(arr[arr.length - 1])
                if (num < 0) {
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
                feedback.send({ action: 'like' })
            })
        }

        function drawScatter() {
            ctrl.scatterOption = {
                title: {
                    text: 'Scatter',
                    left: 50
                },
                xAxis: [{
                    name: 'x',
                    type: 'value',
                    scale: false,
                    position: 'top',
                    min: -50
                }],
                yAxis: [{
                    name: 'y',
                    type: 'value',
                    scale: false,
                    inverse: true,
                    min: 0
                }],
                legend: {
                    data: ['click', 'touch', 'scroll'],
                    selected: {
                        click: true,
                        touch: false,
                        scroll: false
                    }
                },
                series: [{
                    name: 'click',
                    type: 'scatter',
                    symbolSize: 3,
                    large: true,
                    data: getPoints(ctrl.tapes, 'c')
                }, {
                    name: 'touch',
                    type: 'scatter',
                    symbolSize: 2,
                    large: true,
                    data: getPoints(ctrl.tapes, 'ts')
                }, {
                    name: 'scroll',
                    type: 'scatter',
                    symbolSize: 4,
                    large: true,
                    data: getPoints(ctrl.tapes, 's')
                }],
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataZoom: { show: true },
                        dataView: { show: true, readOnly: true },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
            }
        }

        function getPoints(tapes, interaction) {
            return ctrl.tapes.map(function(tape) {
                return tape.events.filter(function(event) {
                    if (interaction === 'te') return false
                    return event.startsWith(interaction)
                }).map(function(event) {
                    var arr = event.split(',')
                    return [Number(arr[1]), Number(arr[2])]
                })
            }).filter(function(tape) {
                return tape.length
            }).reduce(function(a, b) {
                return a.concat(b)
            }, [])
        }

        function drawReadRatio() {
            ctrl.readRatioOption = {
                title: {
                    text: 'Read Ratio',
                    left: 50
                },
                xAxis: {
                    name: 'read ratio',
                    type: 'category',
                    data: ['>10%', '>20%', '>30%', '>40%', '>50%', '>60%', '>70%', '>80%', '>90%'],
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                yAxis: {
                    name: 'total ' + ctrl.tapes.length,
                    type: 'value',
                    max: ctrl.tapes.length
                },
                tooltip: {
                    formatter: function(params) {
                        return params.value + ' => ' + Math.floor(params.value / ctrl.tapes.length * 1000) / 10 + '%'
                    }
                },
                series: [{
                    type: 'bar',
                    label: {
                        normal: {
                            show: true,
                            formatter: '{c}',
                            position: ['35%', -15],
                        }
                    },
                    data: (function() {
                        return generateBins1(ctrl.tapes.map(getReadRatio), [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
                            .map(function(bin) {
                                return bin.length
                            })

                    })()
                }],
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataZoom: { show: true },
                        dataView: { show: true, readOnly: true },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
            }
        }

        function getReadRatio(tape) {
            var lastScroll = 0;
            var scrolls = tape.events.filter(function(event) {
                var arr = event.split(',')
                return arr[0] === 's'
            })
            if (scrolls.length) {
                lastScroll = scrolls[scrolls.length - 1].split(',')[2]
            }
            var dheight = tape.meta.dsize && tape.meta.dsize.split(',')[1]
            if (!dheight) {
                return 0
            }
            return lastScroll / Number(dheight)
        }

        // data: array
        // binRange: [0.1, 0.3, 0.5] will return 4 bins
        function generateBins(data, binRange) {
            var sorted = data.sort(function(a, b) {
                return a - b
            })
            var result = []
            var bin = []
            for (var i = 0; i < binRange.length; i++) {
                while (sorted[0] < binRange[i]) {
                    bin.push(sorted[0])
                    sorted.shift()
                }
                result.push(bin.splice(0, bin.length))
                console.log(result)
                if (i === binRange.length - 1) {
                    bin = sorted
                    result.push(bin.splice(0, bin.length))
                }
            }
            return result
        }

        function generateBins1(data, binRange) {
            var result = []
            binRange.map(function(bin) {
                result.push(data.filter(function(d) {
                    return d >= bin
                }))
            })
            return result
        }

        function generateBins2(data, mapFn, binRange) {
            var result = []
            binRange.map(function(bin) {
                result.push(data.filter(function(d, i) {
                    return mapFn(d, i) >= bin
                }))
            })
            return result
        }

        function drawDuration() {
            var bins = generateBins2(
                ctrl.tapes,
                function(d, i) {
                    return d.duration }, [5, 10, 20, 30, 40, 50, 60, 120, 300]
            )
            var avgClicks = getAvgInBins(bins, 'c')
            var avgTouches = getAvgInBins(bins, 't')
            var avgScrolls = getAvgInBins(bins, 's')
            ctrl.durationOption = {
                title: {
                    text: 'Stay Duration',
                    left: 5
                },
                xAxis: {
                    name: 'stay duration',
                    type: 'category',
                    data: ['>5s', '>10s', '>20s', '>30s', '>40s', '>50s', '>1m', '>2m', '>5m'],
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                yAxis: {
                    name: 'total ' + ctrl.tapes.length,
                    type: 'value',
                    max: ctrl.tapes.length
                },
                tooltip: {
                    formatter: function(params) {
                        return params.value + ' => ' + Math.floor(params.value / ctrl.tapes.length * 1000) / 10 + '%'
                    }
                },
                legend: {
                    data: ['click', 'touch', 'scroll']
                },
                series: [{
                    type: 'bar',
                    label: {
                        normal: {
                            show: true,
                            formatter: '{c}',
                            position: ['35%', -15],
                        }
                    },
                    data: (function() {
                        return bins.map(function(bin) {
                            return bin.length
                        })
                    })()
                }, {
                    name: 'click',
                    type: 'bar',
                    stack: 'events',
                    barWidth: 10,
                    data: avgClicks
                }, {
                    name: 'touch',
                    type: 'bar',
                    stack: 'events',
                    barWidth: 10,
                    data: avgTouches
                }, {
                    name: 'scroll',
                    type: 'bar',
                    stack: 'events',
                    barWidth: 10,
                    data: avgScrolls
                }],
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataZoom: { show: true },
                        dataView: { show: true, readOnly: true },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                }
            }
        }

        function getAvgInBins(bins, interaction) {
            return bins.map(function(bin) {
                if (!bin.length) {
                    return 0
                }
                return bin.reduce(function(a, b) {
                    return a + (b.summary[interaction] || 0)
                }, 0) / bin.length
            })
        }

    }

    function durationFilter() {
        return function(value) {
            if (isNaN(value)) {
                return value
            }
            var m = Math.floor(value / 60)
            var s = value % 60
            var str = ''
            if (m >= 1) {
                str += m + 'm'
            }
            if (s >= 0) {
                str += s + 's'
            }
            return str;
        }
    }

    function rangeFilter() {
        return function(items, property, rangeInfo) {
            if (!items) {
                return null;
            }
            if (rangeInfo.disable) {
                return items;
            }
            var min = parseInt(rangeInfo.userMin);
            var max = parseInt(rangeInfo.userMax);
            return items.filter(function(item) {
                return item[property] >= min && item[property] <= max
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

    function echart() {
        return {
            restrict: 'E',
            scope: {
                option: '='
            },
            template: '<div flex></div>',
            link: function(scope, ele) {
                scope.$watch('option', function(newV, oldV) {
                    if (newV && newV !== oldV) {
                        ele.children()[0].style.height = "400px"
                        echarts.init(ele.children()[0]).setOption(scope.option)
                    }
                })
            }
        }
    }


})()
