(function() {
    angular.module('tapeStore')
        .directive('echart', echart)

    function echart() {
        return {
            restrict: 'E',
            scope: {
                option: '=',
                width: '@',
                height: '@'
            },
            template: '<div flex></div>',
            link: function(scope, ele) {
                scope.$watch('option', function(newV, oldV) {
                    if (newV && newV !== oldV) {
                        ele.children()[0].style.height = scope.height || '400px'
                        ele.children()[0].style.width = scope.width || '100%'
                        echarts.init(ele.children()[0]).setOption(scope.option)
                    }
                })
            }
        }
    }
})()
