var engine = (function() {
    var API = {},
        _session = {},
        _iframe,
        _iframeClass = 'itrack',
        _mouseSvg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAQAAAAm93DmAAADJUlEQVRIx63Ve0hTURwH8LO7h7vbdU7nnNt8pDPcsKb9UWbPpSlLxF5UihkmA9GoKAsi8I/6o4xeGhFFL6xA6EHpH2XPP6wIgzCz3BopNIPeSIQFZX37LZUeRGx39xwunPM7Ox9+59xzzxiYtPXfQRalVKtYSCVEMHfCyWWSgiYrtjTmSQim6wLbsa86VTJwivJK4xygdnq8RKBTObCRYXM/ymMFaUDF07VJ1Dx9b9jNFBKAkxW+GivSqfO47X6eFKDc57EgE2YogBNHcyJfMuerMmMiHBAIxc416ZGBssmcrzIRNmTATgHXB9TPMkYIeleaaA9t9EykUF0AHpMQAegk0IgJSKMnBakUbO7GUhUfUYbxRAW5JFhhpHDnrcHiSMCKOCRTTYKFXosZ0TQQaL8+QzTYV6GnzIJcIhIoQyOUNITjexxiQM7J9a3Q/cwsyMXDgDjE0JD1K3asShZzDvm+GgEmqqNcLJ1HFWQ0WDiEzTlx4X8pem+zhigjYQbooaEvZny4vh9VanW4YLTvFE/LHF2qGvKxIe5nq/X+UAmThQVOEnwn1JRZHL1dFTHBsIwwJXjqMzzr6JwdHqj1HVZBBy0RsrHcZH/8aOTM/qxwlsx7mzjKZXzngtjUriPHdnVVv1jysfhbAp1QtJRlhA7K+jb9CkzrNb1jeOB+zs6ar+XeLL3j8W/tuOA/h0aXPTRQ4WS9C8e7y+9CebyO4erOlrHrgWOp6iKtK6XaVeIIDZRnK7oXjXaqPqGwVHiSFTti+/DOyetFfnrZ8p7yYLPsLRrmJTJ2W9vUyvBwfQMv9vqSPypjKO5FRYE1OG211l/NsOGa38A04jLk2tblvYbdPT5d99I+N6DEK/fMaFGXg0U/vBiukt/u6EtR5w4yXGw+z4v6k7JYMXdpwu8T803DRQIWvHhj5/QiwBQhP+2v3de9mlR/g2Ggdq1GBPivcsDR3cSwu73HwHhJQIv57abcLw68L8jWSwIy1rXwiJfh5t4WjURgXebgZYb5/d+ztXpJQIUqsO/64MA2zLEZJQEZO7Tic6VHJY+RaMlU5HTV/Pdg/wDEX1fdN0jfnwAAAABJRU5ErkJggg==",
        _mouseSize = "20px",
        _mouse = {},
        _clickPointSize = '10px';

    function init(session, wrapper) {
        prepareSession(session);
        createFrame(wrapper);
        drawMouse();

    }

    function prepareSession(session) {
        checkSession(session);

        // resolve comma separated data into array
        var result = session.d.map(function(action) {
            var arr = action.split(',');
            arr[arr.length - 1] = parseFloat(arr.last())
            return arr;
        })
        session.d = result;

        // for unknown reason, when scroll with mousemove, there's some chance the latter event captured before the previous one. so order them by timeStamp before storing them.
        session.d.sort(function(a, b) {
            return a.last() - b.last();
        });
        console.debug(session.d)

        _session = session;
    }

    function checkSession(s) {
        if (toString.call(s) !== '[object Object]') {
            throw 'session should be an object'
        }

        /* check meta/data/id */
        if (!s.i || !s.m || !s.d) {
            throw "corrupted session data"
        }
        /* maybe more check later, like time sequence, data format */

    }




    function createFrame(wrapper) {
        var src = _session.m.url;
        var w = _session.m.size.split(',')[0]
        var h = _session.m.size.split(',')[1]

        var iframe = document.createElement('iframe');
        iframe.src = _session.m.url;
        iframe.width = w;
        iframe.height = h;
        iframe.className = _iframeClass;

        document.body.appendChild(iframe);
        _iframe = iframe;
        return iframe;
    }


    function drawMouse() {
        _mouse = document.createElement('div')

        var pointer = document.createElement('div')
        pointer.style.position = "absolute";
        pointer.style.width = _mouseSize;
        pointer.style.height = _mouseSize;
        var image = new Image();
        image.src = _mouseSvg;
        pointer.style.backgroundImage = "url('" + image.src + "')";
        pointer.style.backgroundSize = _mouseSize;
        pointer.style.backgroundRepeat = 'no-repeat';
        pointer.style.backgroundPosition = '-1px 3px';

        var clickHinter = document.createElement('div');
        clickHinter.style.position = "absolute";
        clickHinter.style.left = "-5px";
        clickHinter.style.top = "-6px";
        clickHinter.style.width = _mouseSize;
        clickHinter.style.height = _mouseSize;
        clickHinter.style.borderRadius = '50%';
        clickHinter.style.backgroundColor = 'yellow';

        _mouse.style.position = "absolute";
        _mouse.style.left = "10px";
        _mouse.style.top = "10px";

        _mouse.appendChild(clickHinter);
        _mouse.appendChild(pointer);

        _iframe.contentWindow.addEventListener('DOMContentLoaded', function() {
            // emit events to outside world.
            console.info('iTrackFrameContentLoaded');
            window.dispatchEvent(new Event('iTrackFrameContentLoaded'));
            _iframe.contentDocument.body.appendChild(_mouse);
        }, false)
        _iframe.contentWindow.addEventListener('load', function() {
            // emit events to outside world.
            console.info('iTrackFrameLoaded');
            window.dispatchEvent(new Event('iTrackFrameLoaded'));
        }, false)
    }

    function play(speed) {
        // clean up
        var clickPointWrapper = _iframe.contentDocument.getElementsByClassName('click-point-wrapper')
        if(clickPointWrapper.length) {
            _iframe.contentDocument.body.removeChild(clickPointWrapper[0])
        }

        var mySession = Object.assign({}, _session);
        console.log('_session', _session.d);
        // console.log('before',mySession.d[0]);
        speed = speed || 1;
        if (typeof speed !== 'number' || speed !== speed) {
            throw 'speed should be a number';
        }
        if (speed > 5 || speed < 0) {
            throw 'invalid speed number, (0,5)';
        }

        if (speed !== 1) {
            var data = mySession.d.map(function(eachEvent) {
                eachEvent[eachEvent.length - 1] /= speed;
                return eachEvent;
            })
            mySession.d = data;
        }

        // play logic
        var i = 0;
        var length = mySession.d.length;
        var time = 0;

        var timer = setInterval(function() {
            if (i === length) {
                clearInterval(timer);
                return;
            }
            var eachEvent = mySession.d[i];
            if (around(time, eachEvent.last())) {
                if (eachEvent[0] === 'm') {
                    move(eachEvent);

                } else if (eachEvent[0] === 's') {
                    scroll(eachEvent);

                } else if (eachEvent[0] === 'k') {
                    keypress(eachEvent);

                } else if (eachEvent[0] === 'c') {
                    click(eachEvent);
                }
                i++;
            }
            time += 10;
        }, 10)


    }

    function around(now, t) {
        console.log('around', now);
        return Math.abs(now - t) <= 11;
    }

    function move(event) {
        _mouse.style.left = event[1] + 'px';
        _mouse.style.top = event[2] + 'px';
        console.log('move to ', event);
    }

    function scroll(event) {
        _iframe.contentWindow.scroll(event[1], event[2]);
        console.log('scroll to', event);
    }

    function keypress(event) {

    }

    function click(event) {
        var wrapper = _iframe.contentDocument.getElementsByClassName('click-point-wrapper');
        if(wrapper.length === 0) {
            var wrapper = document.createElement('div');
            wrapper.className = "click-point-wrapper"
        } else {
            wrapper = wrapper[0];
        }
        var clickPoint = document.createElement('div');
        clickPoint.style.position = "absolute";
        clickPoint.style.width = _clickPointSize;
        clickPoint.style.height = _clickPointSize;
        clickPoint.style.backgroundColor = "red";
        clickPoint.style.borderRadius = "50%";
        clickPoint.style.left = event[1] + 'px';
        clickPoint.style.top = event[2] + 'px';
        clickPoint.className = "click-point";

        wrapper.appendChild(clickPoint);
        _iframe.contentDocument.body.appendChild(wrapper);
        console.log('click at', event);

    }

    /* util */
    if (!Array.prototype.last) {
        Array.prototype.last = function() {
            return this[this.length - 1];
        };
    };

    if (!Object.assign) {
        Object.defineProperty(Object, 'assign', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function(target) {
                'use strict';
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert first argument to object');
                }

                var to = Object(target);
                for (var i = 1; i < arguments.length; i++) {
                    var nextSource = arguments[i];
                    if (nextSource === undefined || nextSource === null) {
                        continue;
                    }
                    nextSource = Object(nextSource);

                    var keysArray = Object.keys(nextSource);
                    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                        var nextKey = keysArray[nextIndex];
                        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc !== undefined && desc.enumerable) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
                return to;
            }
        });
    }

    API.init = init;
    API.play = play;

    //debug
    API.iframe = function() {
        return _iframe;
    };
    return API;



})();
