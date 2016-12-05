(function() {
    angular.module('tapeStore')
        .factory('session', session)
        .factory('feedback', feedback)
        .factory('plotHelper', plotHelper)
        .factory('tapeHelper', tapeHelper)

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

    plotHelper.$inject = ['tapeHelper']

    function plotHelper(tapeHelper) {
        var api = {
            getScatterOption: getScatterOption,
            getDurationOption: getDurationOption,
            getReadRatioOption: getReadRatioOption
        }

        function getPoints(tapes, interaction) {
            return tapes.map(function(tape) {
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

        function getScatterOption(tapes) {
            return {
                title: {
                    text: 'Screen Actions',
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
                    data: getPoints(tapes, 'c')
                }, {
                    name: 'touch',
                    type: 'scatter',
                    symbolSize: 2,
                    large: true,
                    data: getPoints(tapes, 'ts')
                }, {
                    name: 'scroll',
                    type: 'scatter',
                    symbolSize: 4,
                    large: true,
                    data: getPoints(tapes, 's')
                }],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        crossStyle: {
                            textStyle: {
                                color: 'black',
                                fontWeight: 'bolder',
                                fontSize: 14
                            }
                        }
                    }
                },
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataZoom: { show: true },
                        dataView: { show: false, readOnly: true },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
            }
        }

        function getReadRatioOption(tapes) {
            return {
                title: {
                    text: 'Scroll Depth',
                },
                xAxis: {
                    name: 'scroll/pageHeight',
                    type: 'category',
                    data: ['>10%', '>20%', '>30%', '>40%', '>50%', '>60%', '>70%', '>80%', '>90%'],
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                yAxis: {
                    name: 'total ' + tapes.length,
                    type: 'value',
                    max: tapes.length
                },
                tooltip: {
                    formatter: function(params) {
                        return Math.floor(params.value / tapes.length * 1000) / 10 + '%'
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
                        return generateBins1(tapes.map(tapeHelper.getReadRatio), [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
                            .map(function(bin) {
                                return bin.length
                            })

                    })()
                }],
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataZoom: { show: false },
                        dataView: { show: true, readOnly: true },
                        restore: { show: false },
                        saveAsImage: { show: true }
                    }
                },
            }
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

        function getDurationOption(tapes) {
            var bins = generateBins2(
                tapes,
                function(d, i) {
                    return d.duration
                }, [5, 10, 20, 30, 40, 50, 60, 120, 300]
            )
            var avgClicks = getAvgInBins(bins, 'c')
            var avgTouches = getAvgInBins(bins, 't')
            var avgScrolls = getAvgInBins(bins, 's')
            var avgInputs = getAvgInBins(bins, 'i')

            return {
                title: {
                    text: 'Staying / Actions',
                },
                xAxis: {
                    name: 'staying',
                    type: 'category',
                    data: ['>5s', '>10s', '>20s', '>30s', '>40s', '>50s', '>1m', '>2m', '>5m'],
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                yAxis: [{
                    name: 'total ' + tapes.length,
                    type: 'value',
                    max: tapes.length
                }, {
                    name: '#actions',
                    type: 'value',
                    splitLine: {
                        show: false
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                legend: {
                    data: ['avgClick', 'avgTouch', 'avgScroll', 'avgInput']
                },
                series: [{
                    name: 'tapes',
                    type: 'bar',
                    label: {
                        normal: {
                            show: true,
                            formatter: '{c}',
                            position: [0, -15],
                        }
                    },
                    data: bins.map(function(bin) {
                        return bin.length
                    })
                }, {
                    name: 'avgClick',
                    type: 'bar',
                    stack: 'events',
                    yAxisIndex: 1,
                    barWidth: 5,
                    data: avgClicks
                }, {
                    name: 'avgTouch',
                    type: 'bar',
                    stack: 'events',
                    yAxisIndex: 1,
                    barWidth: 5,
                    data: avgTouches
                }, {
                    name: 'avgScroll',
                    type: 'bar',
                    stack: 'events',
                    yAxisIndex: 1,
                    barWidth: 5,
                    data: avgScrolls
                }, {
                    name: 'avgInput',
                    type: 'bar',
                    stack: 'events',
                    yAxisIndex: 1,
                    barWidth: 5,
                    data: avgInputs
                }],
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataZoom: { show: false },
                        dataView: { show: true, readOnly: true },
                        restore: { show: false },
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
                return Math.floor(bin.reduce(function(a, b) {
                    return a + (b.summary[interaction] || 0)
                }, 0) / bin.length * 10) / 10
            })
        }

        return api
    }

    function tapeHelper() {
        var api = {
            getDuration: getDuration,
            getReadRatio: getReadRatio,
            getEventsSummary: getEventsSummary,
            getReplayUrl: getReplayUrl
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

        function getReadRatio(tape) {
            var defaultHeight = 500
            var lastScroll = 0;
            var scrolls = tape.events.filter(function(event) {
                var arr = event.split(',')
                return arr[0] === 's'
            })
            if (scrolls.length) {
                lastScroll = Number( scrolls[scrolls.length - 1].split(',')[2] ) || 0
            }
            var dheight = Number( tape.meta.dsize && tape.meta.dsize.split(',')[1] )
            if (!dheight) {
                return 0
            }
            var wheight = Number( tape.meta.size && tape.meta.size.split(',')[1] ) || defaultHeight
            return ( lastScroll + wheight ) / dheight
        }


        function getEventsSummary(tape) {
            return tape.events.reduce(function(a, b) {
                if (!a[b[0]]) {
                    a[b[0]] = 1
                } else {
                    a[b[0]]++
                }
                return a
            }, {})
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

        return api
    }

})()
