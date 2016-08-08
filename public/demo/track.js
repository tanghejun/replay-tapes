var itrack = (function(w, $) {

    var itrack = {},
        _events = [],
        eventsToTrack = ['click', 'scroll', 'mousemove'],
        server = 'http://localhost:9000',
        metaApi = server + '/metas',
        eventsApi = server + '/events',
        guid,
        sendInterval = 5000, // try to send to server every 5s.
        throttleInterval = 100;

    /**
     * get browser meta including:
     * userAgent, current url, window content size.
     * 
     * @return {Object}
     */
    function getMeta() {
        var width = Math.max(document.documentElement.clientWidth,
            w.innerWidth || 0);
        var height = Math.max(document.documentElement.clientHeight,
            w.innerHeight || 0);
        var meta = {
            ua: w.navigator.userAgent,
            url: w.location.href,
            size: width + ',' + height
        };
        return meta;
    }

    /**
     * get browser meta data and send to server.
     *
     * format: 
     * {
     *     i: guid,
     *     m: meta
     * }
     */
    function storeMeta() {
        $.ajax({
            url: metaApi,
            type: 'POST',
            data: JSON.stringify({ i: guid, m: getMeta() }),
            contentType: "application/json",
            success: function(d) {
                console.log('meta sent');
            }
        })
    }

    /**
     * generate unique id for every session. refer to http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     * @return {String}
     */
    function generateUUID() {
        var d = new Date().getTime();
        if (w.performance && typeof w.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    /* simple implementation of get element's selector path,
    http://stackoverflow.com/questions/2068272/getting-a-jquery-selector-for-an-element
    consider using a lib like: 
    https://github.com/autarc/optimal-select */
    jQuery.fn.getPath = function () {
        if (this.length != 1) throw 'Requires one element.';

        var path, node = this;
        while (node.length) {
            var realNode = node[0];
            var name = (

                // IE9 and non-IE
                realNode.localName ||

                // IE <= 8
                realNode.tagName ||
                realNode.nodeName

            );

            // on IE8, nodeName is '#document' at the top level, but we don't need that
            if (!name || name == '#document') break;

            name = name.toLowerCase();
            if (realNode.id) {
                // As soon as an id is found, there's no need to specify more.
                return name + '#' + realNode.id + (path ? '>' + path : '');
            } else if (realNode.className) {
                name += '.' + realNode.className.split(/\s+/).join('.');
            }

            var parent = node.parent(), siblings = parent.children(name);
            if (siblings.length > 1) name += ':eq(' + siblings.index(node) + ')';
            path = name + (path ? '>' + path : '');

            node = parent;
        }

        return path;
    };

    /**
     * extract event specific data and construct it into a minimal string to save bandwidth;
     * 
     * format:
     * click    c, pageX, pageY, element selector, timeStamp
     * keypress k, keyCode, timeStamp
     * scroll   s, scrollX, scollY, timeStamp
     * 
     * @param  {Event} original event
     * @return {Object} obj contains event specific data
     */
    function extractEventInfo(e) {
        console.log(e);
        var arr = [];

        if (e.type === eventsToTrack[0]) {
            var encodedCssSelector = btoa($(e.target).getPath());

            // timeStamp could be very precise, we only need it to be milisecond.
            arr.push('c', e.pageX, e.pageY, encodedCssSelector, parseInt(e.timeStamp));

            // listen to input change event
            if(e.target.nodeName === "INPUT" && e.target.type !== "password") {
                e.target.addEventListener('input', function(inputEvent) {
                    var arr1 = [];
                    arr1.push('i', e.target.value, parseInt(inputEvent.timeStamp))
                    _events.push(arr1.join(','));
                })
            }

        } 
        // else if (e.type === eventsToTrack[1]) {
        //     // only track keypress when focus in input
        //     if(e.target.nodeName === "INPUT") {
        //         arr.push('k', e.key, e.keyCode, e.target.value);
        //     }

        // }
         else if (e.type === eventsToTrack[1]) {
            arr.push('s', w.scrollX, w.scrollY, parseInt(e.timeStamp));
        } else if (e.type === eventsToTrack[2]) {
            arr.push('m', e.pageX, e.pageY, parseInt(e.timeStamp));
        }

        return arr.join(',');
    }

    /**
     * setup event listener for tracking.
     */
    function track() {
        // setup listeners
        var spacedEvents = eventsToTrack.join(' ');
        $(document).on(spacedEvents, throttle(eventListener, throttleInterval));

        function eventListener(e) {
            _events.push(extractEventInfo(e.originalEvent));
        }
    }

    /**
     * send data every other time to server if any
     * object format:
     * { 
     *   i: guid,
     *   d: event data
     * }    
     */
    function store() {

        setInterval(function() {

            //save length before sending, splice it after async operation succeeds.
            var sendLength = _events.length;
            var prepareData = {
                i: guid,
                d: _events
            }
            if (sendLength) {
                console.log(JSON.stringify(prepareData));
                $.ajax({
                    type: 'POST',
                    url: eventsApi,
                    data: JSON.stringify(prepareData),
                    contentType: "application/json",
                    success: function() {
                        console.log('data sent');
                        _events.splice(0, sendLength);
                    }
                })
            }
        }, sendInterval)
    }

    function init() {
        //note: if no parent window, w.parent equal to itself.
        if((w.parent !== w)  && !w.parent.ITRACK_ENABLED) {
            console.info('iTrack not enabled');
        } else {
            console.info('iTrack enabled');
            guid = generateUUID(); // only generate once for one session.
            storeMeta();
            track();
            store();
        }
    }

    function print() {
        _events.map(function(each) {
            console.log(each);
        })
    }

    function throttle(fn, threshhold, scope) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;
        return function() {
            var context = scope || this;

            var now = +new Date,
                args = arguments;
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function() {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    }






    $(document).ready(function() {
        init();
    })


    //debug
    itrack.print = print;

    return itrack;

})(window, jQuery)