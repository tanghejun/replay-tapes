var itrack = (function($) {
    var itrack = {},
        _events = [],

        // listen to mouseup instead of click since click has greater chance to be canceled bubbling.
        // still, we can set 'useCapture=true', but not all browsers support that.
        eventsToTrack = ['click', 'scroll', 'mousemove', 'touchstart', 'touchmove', 'touchend'],
        server = "http://d.admx.baixing.c"+"om:8885",
        metaApi = server + '/metas',
        eventsApi = server + '/events',
        guid,
        sendInterval = 2000,
        throttleInterval = 100,
        _storeTimer = null,
        _clearTimer = null;

    /**
     * get browser meta including:
     * userAgent, current url, window content size.
     *
     * @return {Object}
     */
    function getMeta() {
        var meta = {
            ua: window.navigator.userAgent,
            url: window.location.href,
            size: $(window).width() + ',' + $(window).height(),
            dsize: $(window.document).width() + ',' + $(window.document).height()
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
    function storeMeta(tags) {
        var meta = getMeta();
        meta.tags = tags;
        $.ajax({
            url: metaApi,
            type: 'POST',
            data: JSON.stringify({ i: guid, m: meta }),
            contentType: "application/json",
            success: function(d) {
                // console.log('meta sent');
            }
        })
    }

    /**
     * generate unique id for every session. refer to http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     * @return {String}
     */
    function generateUUID() {
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
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
    $.fn.getPath = function () {
        if (this.length != 1) throw 'Requires one element.';

        var path, node = this;
        while (node.length) {
            var realNode = node[0];
            var tagName = (

                // IE9 and non-IE
                realNode.localName ||

                // IE <= 8
                realNode.tagName ||
                realNode.nodeName

            );
            tagName = tagName.toLowerCase();
            var name = tagName;

            // on IE8, nodeName is '#document' at the top level, but we don't need that
            if (!name || name === '#document' || name === 'html') break;

            if (realNode.id) {
                // As soon as an id is found, there's no need to specify more.
                return name + '#' + realNode.id + (path ? '>' + path : '');
            } else if(tagName === 'body') {
                // body need no class, so that it's easier to select when playback
                // eg: body.mobile body.pc -> body
            } else if (realNode.className.trim()) {
                name += '.' + realNode.className.trim().split(/\s+/).join('.');
            }
            var parent = node.parent(),
                siblings = parent.children(tagName),
                classSiblings = parent.children(name);
            var nthChild = siblings.index(node) + 1;
            if (classSiblings.length > 1) {
                name += ':nth-of-type(' + nthChild + ')';
            }
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
    var lastScrollElement = null;
    function extractEventInfo(e) {
        var now = +new Date();
        var arr = [];

        if (e.type === eventsToTrack[0]) {
            var encodedCssSelector = btoa(unescape(encodeURIComponent($(e.target).getPath())));

            // timeStamp could be very precise, we only need it to be milisecond.
            arr.push('c', e.pageX, e.pageY, encodedCssSelector, now);

            // listen to input change event
            var targetNode = e.target.nodeName;
            if(targetNode === "SELECT" || targetNode === "TEXTAREA" || (e.target.nodeName === "INPUT" && e.target.type !== "password")) {
                e.target.addEventListener('input', inputEventHandler);
            }

        } else if (e.type === eventsToTrack[1]) {
            var encodedCssSelector = "";
            if(e.target === window.document) {
                encodedCssSelector = btoa(unescape(encodeURIComponent('document')));
                arr.push('s', window.scrollX, window.scrollY, encodedCssSelector, now);
            } else {
                encodedCssSelector = btoa(unescape(encodeURIComponent($(e.target).getPath())));
                arr.push('s', e.target.scrollLeft, e.target.scrollTop, encodedCssSelector, now);
            }
            // remove the element if it's the same scroll target to save bits.
            if(e.target === lastScrollElement) {
                arr.splice(3, 1);
            }
            lastScrollElement = e.target;
        } else if (e.type === eventsToTrack[2]) {
            arr.push('m', e.pageX, e.pageY, now);
        } else if (e.type === eventsToTrack[3]) {
            if(e.touches && e.touches.length) {
                var firstFinger = e.touches[0]
                if(firstFinger) {
                    arr.push('ts', Math.floor(firstFinger.clientX), Math.floor(firstFinger.clientY), now)
                }
            }
        } else if (e.type === eventsToTrack[4]) {
            if(e.touches && e.touches.length) {
                var firstFinger = e.touches[0]
                if(firstFinger) {
                    arr.push('tm', Math.floor(firstFinger.clientX), Math.floor(firstFinger.clientY), now)
                }
            }
        } else if (e.type === eventsToTrack[5]) {
            arr.push('te', now)
        }

        return arr.join(',');
    }
    function inputEventHandler(inputEvent) {
        var now = +new Date();
        // console.log(inputEvent.target.value);
        var arr = [];
        arr.push('i', inputEvent.target.value, now)
        _events.push(arr.join(','));
    }


    /**
     * setup event listener for tracking.
     */
    function track() {
        // setup listeners
        var spacedEvents = eventsToTrack.join(' ');

        // useCapture = true in case of some clicked element will stop event bubbling.
        eventsToTrack.forEach(function(event) {
            if(event === 'click') {
                window.addEventListener(event, throttle(eventListener, throttleInterval), true)
            } else {
                window.addEventListener(event, throttle(eventListener, throttleInterval), false)
            }
        })

        function eventListener(e) {
            _events.push(extractEventInfo(e));
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

        _storeTimer = setInterval(function() {

            //save length before sending, splice it after async operation succeeds.
            var sendLength = _events.length;
            var prepareData = {
                i: guid,
                d: _events
            }
            if (sendLength) {
                // console.log(JSON.stringify(prepareData));
                $.ajax({
                    type: 'POST',
                    url: eventsApi,
                    data: JSON.stringify(prepareData),
                    contentType: "application/json",
                    success: function() {
                        // console.log('data sent');
                        _events.splice(0, sendLength);
                    }
                })
            }
        }, sendInterval)
    }

    // tags is an array with strings
    function init(tags) {
        if(typeof $ !== 'function' || /replay_session_id/g.test(location.href)) {
            // console.info('iTrack not enabled');
        } else {
            // console.info('iTrack enabled');
            clearInterval(_clearTimer);
            guid = generateUUID(); // only generate once for one session.
            storeMeta(tags);
            track();
            store();
        }
    }

    // stop tracking, actually tracking is still on, but just not storing it. and periodically clear the array
    // to release memory.
    function stop() {
        clearInterval(_storeTimer);
        _clearTimer = setInterval(function() {
            if(_events.length > 500) {
                _events = [];
            }
        }, sendInterval);
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

    // api
    itrack.init = init;
    itrack.stop = stop;

    return itrack;

})($)