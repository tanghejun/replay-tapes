var engine = (function() {
    var API = {},
        _session = {},
        _mouseSvg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAQAAAAm93DmAAADJUlEQVRIx63Ve0hTURwH8LO7h7vbdU7nnNt8pDPcsKb9UWbPpSlLxF5UihkmA9GoKAsi8I/6o4xeGhFFL6xA6EHpH2XPP6wIgzCz3BopNIPeSIQFZX37LZUeRGx39xwunPM7Ox9+59xzzxiYtPXfQRalVKtYSCVEMHfCyWWSgiYrtjTmSQim6wLbsa86VTJwivJK4xygdnq8RKBTObCRYXM/ymMFaUDF07VJ1Dx9b9jNFBKAkxW+GivSqfO47X6eFKDc57EgE2YogBNHcyJfMuerMmMiHBAIxc416ZGBssmcrzIRNmTATgHXB9TPMkYIeleaaA9t9EykUF0AHpMQAegk0IgJSKMnBakUbO7GUhUfUYbxRAW5JFhhpHDnrcHiSMCKOCRTTYKFXosZ0TQQaL8+QzTYV6GnzIJcIhIoQyOUNITjexxiQM7J9a3Q/cwsyMXDgDjE0JD1K3asShZzDvm+GgEmqqNcLJ1HFWQ0WDiEzTlx4X8pem+zhigjYQbooaEvZny4vh9VanW4YLTvFE/LHF2qGvKxIe5nq/X+UAmThQVOEnwn1JRZHL1dFTHBsIwwJXjqMzzr6JwdHqj1HVZBBy0RsrHcZH/8aOTM/qxwlsx7mzjKZXzngtjUriPHdnVVv1jysfhbAp1QtJRlhA7K+jb9CkzrNb1jeOB+zs6ar+XeLL3j8W/tuOA/h0aXPTRQ4WS9C8e7y+9CebyO4erOlrHrgWOp6iKtK6XaVeIIDZRnK7oXjXaqPqGwVHiSFTti+/DOyetFfnrZ8p7yYLPsLRrmJTJ2W9vUyvBwfQMv9vqSPypjKO5FRYE1OG211l/NsOGa38A04jLk2tblvYbdPT5d99I+N6DEK/fMaFGXg0U/vBiukt/u6EtR5w4yXGw+z4v6k7JYMXdpwu8T803DRQIWvHhj5/QiwBQhP+2v3de9mlR/g2Ggdq1GBPivcsDR3cSwu73HwHhJQIv57abcLw68L8jWSwIy1rXwiJfh5t4WjURgXebgZYb5/d+ztXpJQIUqsO/64MA2zLEZJQEZO7Tic6VHJY+RaMlU5HTV/Pdg/wDEX1fdN0jfnwAAAABJRU5ErkJggg==",
        _mouseSize = "20px",
        _mouse = {},
        _clickPointSize = '10px',
        _context = {
            time: 0,
            index: 0,
            timer: null
        };

    function init(session) {
        prepareSession(session);
        drawMouse();

    }

    function prepareSession(session) {
        checkSession(session);

        var result = session.d.map(function(action) {
            var arr = action.split(',');
            arr[arr.length - 1] = parseInt(arr.last());
            if (arr[0] === 'c' || (arr[0] === 's' && arr.length === 5)) {
                arr[3] = decodeURIComponent(window.escape(atob(arr[3])));
            }
            return arr;
        });
        session.d = result;

        session.d.sort(function(a, b) {
            return a.last() - b.last();
        });

        console.debug(session.d);

        _session = session;
    }

    function checkSession(s) {
        if (window.toString.call(s) !== '[object Object]') {
            throw 'session should be an object';
        }

        if (!s.i || !s.m || !s.d) {
            throw "corrupted session data";
        }

    }


    function drawMouse() {
        _mouse = document.createElement('div');

        var pointer = document.createElement('div');
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
        _mouse.style.zIndex = 99999999;
        _mouse.style.left = "10px";
        _mouse.style.top = "10px";

        _mouse.appendChild(clickHinter);
        _mouse.appendChild(pointer);

        document.body.appendChild(_mouse);
    }

    function pause() {
        if(_context.timer) {
            clearInterval(_context.timer);
        }

    }

    function stop() {
        if(_context.timer) {
            clearInterval(_context.timer);
        }
        resetContext();
        cleanDots();

    }
    function cleanDots() {
        var clickPointWrapper = window.document.getElementsByClassName('click-point-wrapper');
        if(clickPointWrapper.length) {
            window.document.body.removeChild(clickPointWrapper[0]);
        }
    }

    function play(speed) {
        var clickPointWrapper = document.getElementsByClassName('click-point-wrapper');
        if(clickPointWrapper.length) {
            document.body.removeChild(clickPointWrapper[0]);
        }

        var mySession = Object.assign({}, _session);
        console.log('_session', _session.d);
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
            });
            mySession.d = data;
        }

        var length = mySession.d.length;

        _context.timer = setInterval(function() {
            if (_context.index === length) {
                stop();
                return;
            }
            var eachEvent = mySession.d[_context.index];
            if (around(_context.time, eachEvent.last())) {
                if (eachEvent[0] === 'm') {
                    move(eachEvent);

                } else if (eachEvent[0] === 's') {
                    scroll(eachEvent, _context.index);

                } else if (eachEvent[0] === 'c') {
                    click(eachEvent);

                } else if(eachEvent[0] === 'i') {
                    input(eachEvent, _context.index);
                }
                _context.index++;
            }
            _context.time += 10;
        }, 10);


    }

    function resetContext() {
        _context.index = 0;
        _context.time = 0;
        _context.timer = null;
    }

    function around(now, t) {
        console.log('now', now);
        return Math.abs(now - t) <= 11;
    }

    function move(event) {
        _mouse.style.left = event[1] + 'px';
        _mouse.style.top = event[2] + 'px';
        console.log('move to ', event);
    }

    function scroll(event, index) {
        var lastScrollSelector = findLastScrollSelector(index);
        if (!lastScrollSelector) {
            console.error('scroll target not found');
        } else {
            if (lastScrollSelector === 'document') {
                window.scroll(event[1], event[2]);
                console.log('scroll document to', event);
            } else {
                var target = document.querySelector(lastScrollSelector);
                target.scrollLeft = event[1];
                target.scrollTop = event[2];
            }
            console.log('scroll to', lastScrollSelector, event);
        }
    }

    function findLastScrollSelector(index) {
        var selector = null;
        for (var i = index; i >= 0; i--) {
            if (_session.d[i][0] === 's' && _session.d[i].length === 5) {
                selector = _session.d[i][3];
                break;
            }
        }
        return selector;
    }

    function input(event, index) {
        var inputElement = null;
        for (var i = index; i >= 0; i--) {
            if(_session.d[i][0] === 'c') {
                inputElement = document.querySelector(_session.d[i][3]);
                break;
            }
        }
        if(inputElement) {
            inputElement.value = event[1]; 
        }
    }


    function click(event) {
        var wrapper = document.getElementsByClassName('click-point-wrapper');
        if(wrapper.length === 0) {
            wrapper = document.createElement('div');
            wrapper.className = "click-point-wrapper";
        } else {
            wrapper = wrapper[0];
        }
        var clickPoint = document.createElement('div');
        clickPoint.style.position = "absolute";
        clickPoint.style.zIndex = 99999999;
        clickPoint.style.width = _clickPointSize;
        clickPoint.style.height = _clickPointSize;
        clickPoint.style.backgroundColor = "red";
        clickPoint.style.borderRadius = "50%";
        clickPoint.style.left = event[1] + 'px';
        clickPoint.style.top = event[2] + 'px';
        clickPoint.className = "click-point";

        wrapper.appendChild(clickPoint);
        document.body.appendChild(wrapper);

        var clickTarget = document.querySelector(event[3]);
        if(clickTarget) {
            clickTarget.focus();

            clickTarget.click();
            if(clickTarget.nodeName === "LABEL" && clickTarget.attributes['for']) {
                document.getElementById(clickTarget.attributes['for'].nodeValue).focus();

            }
        } else {
            console.warn('clickTarget not found: ', clickTarget);
        }
        console.log('click at', event);

    }

    if (!Array.prototype.last) {
        Array.prototype.last = function() {
            return this[this.length - 1];
        };
    }

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
    API.pause = pause;
    API.stop = stop;

    return API;



})();

(function (engine) {
    var _session = null;

    $.get('http://localhost:9000/events')
        .done(function(data) {
            var id = data[data.length -1].i;
            $.get('http://localhost:9000/sessions/' + id )
                .done(function(sessionData) {
                    _session = sessionData;
                    engine.init(sessionData);
                });
        });


    var wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.zIndex = 9999;

    wrapper.style.backgroundColor = "#eee";


    var playBtn = document.createElement('button');
    playBtn.style.width = "55px";
    playBtn.style.height = "34px";
    playBtn.style.margin = "auto";
    playBtn.textContent = "Play";

    var pauseBtn = document.createElement('button');
    pauseBtn.style.width = "55px";
    pauseBtn.style.height = "34px";
    pauseBtn.style.margin = "auto";
    pauseBtn.textContent = "Pause";

    var stopBtn = document.createElement('button');
    stopBtn.style.width = "55px";
    stopBtn.style.height = "34px";
    stopBtn.style.margin = "auto";
    stopBtn.textContent = "Stop";

    wrapper.appendChild(playBtn);
    wrapper.appendChild(pauseBtn);
    wrapper.appendChild(stopBtn);
    document.body.appendChild(wrapper);

    playBtn.addEventListener('click', function(e) {
        if(_session.m.url !== window.location.href) {
            alert('you should be at ' + _session.m.url);
        } else {
            engine.play();
        }
    });

    pauseBtn.addEventListener('click', function(e) {
        engine.pause();
    });

    stopBtn.addEventListener('click', function(e) {
        engine.stop();
    });







})(engine);