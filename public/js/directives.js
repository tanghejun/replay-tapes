(function() {
    angular.module('tapeStore')
        .directive('echart', echart)

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
