(function() {
    angular.module('tapeStore', ['ngMaterial', 'angularUtils.directives.dirPagination', 'ui-rangeSlider'])
        .controller('Ctrl', Ctrl)

    Ctrl.$inject = ['session', '$scope', '$mdDialog', 'feedback', 'plotHelper', 'tapeHelper']

    function Ctrl(session, $scope, $mdDialog, feedback, plotHelper, tapeHelper) {
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
                    tape.duration = tapeHelper.getDuration(tape)
                    tape.summary = tapeHelper.getEventsSummary(tape)
                    tape.meta.replayUrl = tapeHelper.getReplayUrl(tape)
                    return tape
                })
                drawScatter()
                drawDuration()
                drawReadRatio()
            }).catch(function(err) {
                ctrl.message = err.message
            }).finally(function() {
                ctrl.loading = false
            })
        }

        function giveFeedback(ev) {
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
            if(!ctrl.tapes || !ctrl.tapes.length) return
            ctrl.scatterOption = plotHelper.getScatterOption(ctrl.tapes)
        }

        function drawReadRatio() {
            if(!ctrl.tapes || !ctrl.tapes.length) return
            ctrl.readRatioOption = plotHelper.getReadRatioOption(ctrl.tapes)
        }

        function drawDuration() {
            if(!ctrl.tapes || !ctrl.tapes.length) return
            ctrl.durationOption = plotHelper.getDurationOption(ctrl.tapes)
        }


    } // end of ctrl

})()
