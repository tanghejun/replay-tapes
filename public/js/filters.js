(function() {
    angular.module('tapeStore')
        .filter('duration', durationFilter)
        .filter('range', rangeFilter)

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
})()
