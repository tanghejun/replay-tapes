var engine = (function() {
    var API = {},
        _speed = 1,
        _session = {},
        _iframe,
        _iframeClass ='itrack',
        _mouseSvg = "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+PHN2ZyB3aWR0aD0iMjI1IiBoZWlnaHQ9IjIzOSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gPHRpdGxlPk1vdXNlIFBvaW50ZXI8L3RpdGxlPiA8Zz4gIDx0aXRsZT5MYXllciAxPC90aXRsZT4gIDxtZXRhZGF0YSBpZD0ic3ZnXzM1Ij5pbWFnZS9zdmcreG1sPC9tZXRhZGF0YT4gIDxwYXRoIGZpbGw9IiNmZmZmZmYiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgaWQ9InBhdGg4MjciIGQ9Im0yMDEuNDUzOTk1LDExMi44NzIwMDJsLTE4My4wNjg1ODQsLTEwMC4xNTY5MDJsNzguNjA4NjAxLDE5NS4xOTM4OTdsMzEuMjk4MDEyLC01MC42NzU5OTVsNjEuODgzOTcyLDY3LjY0MTk5OGwyMy40MzcwMTIsLTIyLjgzNzAwNmwtNjMuMjY3OTksLTY2Ljk5Mzk4OGw1MS4xMDg5NzgsLTIyLjE3MjAwNXoiLz4gPC9nPiA8ZGVmcz4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzEiIHkyPSIxIj4gICA8c3RvcCBzdG9wLWNvbG9yPSIjZThlOGU4IiBvZmZzZXQ9IjAiLz4gICA8c3RvcCBzdG9wLWNvbG9yPSIjMTcxNzE3IiBvZmZzZXQ9IjEiLz4gIDwvbGluZWFyR3JhZGllbnQ+ICA8bGluZWFyR3JhZGllbnQgaWQ9InN2Z18yIiB5Mj0iMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgc3ByZWFkTWV0aG9kPSJwYWQiPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNlOGU4ZTgiIG9mZnNldD0iMCIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiMxNzE3MTciIG9mZnNldD0iMSIvPiAgPC9saW5lYXJHcmFkaWVudD4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzMiIHkyPSIxIiB4MT0iMC40ODgyODEiIHkxPSIwLjM2MzI4MSIgeDI9IjEiIHNwcmVhZE1ldGhvZD0icGFkIj4gICA8c3RvcCBzdG9wLWNvbG9yPSIjZThlOGU4IiBvZmZzZXQ9IjAiLz4gICA8c3RvcCBzdG9wLWNvbG9yPSIjMTcxNzE3IiBvZmZzZXQ9IjEiLz4gIDwvbGluZWFyR3JhZGllbnQ+ICA8bGluZWFyR3JhZGllbnQgaWQ9InN2Z180IiB5Mj0iMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgc3ByZWFkTWV0aG9kPSJwYWQiPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNlZmVmZWYiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMCIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiM4MjgyODIiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMSIvPiAgPC9saW5lYXJHcmFkaWVudD4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzUiIHkyPSIxIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiBzcHJlYWRNZXRob2Q9InBhZCI+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjk5MjE4OCIgb2Zmc2V0PSIwIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iIzgyODI4MiIgc3RvcC1vcGFjaXR5PSIwLjk5NjA5NCIgb2Zmc2V0PSIxIi8+ICA8L2xpbmVhckdyYWRpZW50PiAgPGxpbmVhckdyYWRpZW50IGlkPSJzdmdfNiIgeTI9IjEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHNwcmVhZE1ldGhvZD0icGFkIj4gICA8c3RvcCBzdG9wLWNvbG9yPSIjZmZmZmZmIiBzdG9wLW9wYWNpdHk9IjAuOTkyMTg4IiBvZmZzZXQ9IjAiLz4gICA8c3RvcCBzdG9wLWNvbG9yPSIjODI4MjgyIiBzdG9wLW9wYWNpdHk9IjAuOTk2MDk0IiBvZmZzZXQ9IjEiLz4gICA8c3RvcCBzdG9wLWNvbG9yPSIjODI4MjgyIiBzdG9wLW9wYWNpdHk9IjAuOTk2MDk0IiBvZmZzZXQ9IjEiLz4gIDwvbGluZWFyR3JhZGllbnQ+ICA8bGluZWFyR3JhZGllbnQgaWQ9InN2Z183IiB5Mj0iMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgc3ByZWFkTWV0aG9kPSJwYWQiPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmZmZmZmYiIHN0b3Atb3BhY2l0eT0iMC45ODgyODEiIG9mZnNldD0iMCIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNjY2NjY2MiIHN0b3Atb3BhY2l0eT0iMC45OTIxODgiIG9mZnNldD0iMSIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiM4MjgyODIiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMSIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiM4MjgyODIiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMSIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiM4MjgyODIiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMSIvPiAgPC9saW5lYXJHcmFkaWVudD4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzgiIHkyPSIxIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiBzcHJlYWRNZXRob2Q9InBhZCI+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjk4ODI4MSIgb2Zmc2V0PSIwIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2NjY2NjYyIgc3RvcC1vcGFjaXR5PSIwLjk5MjE4OCIgb2Zmc2V0PSIxIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2NjY2NjYyIgc3RvcC1vcGFjaXR5PSIwLjk5MjE4OCIgb2Zmc2V0PSIxIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iIzgyODI4MiIgc3RvcC1vcGFjaXR5PSIwLjk5NjA5NCIgb2Zmc2V0PSIxIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iIzgyODI4MiIgc3RvcC1vcGFjaXR5PSIwLjk5NjA5NCIgb2Zmc2V0PSIxIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iIzgyODI4MiIgc3RvcC1vcGFjaXR5PSIwLjk5NjA5NCIgb2Zmc2V0PSIxIi8+ICA8L2xpbmVhckdyYWRpZW50PiAgPGxpbmVhckdyYWRpZW50IGlkPSJzdmdfOSI+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZmZmZiIgb2Zmc2V0PSIwIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iIzAwMDAwMCIgb2Zmc2V0PSIxIi8+ICA8L2xpbmVhckdyYWRpZW50PiAgPGxpbmVhckdyYWRpZW50IGlkPSJzdmdfMTAiPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmZmZmZmYiIG9mZnNldD0iMCIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNkZGRkZGQiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMSIvPiAgPC9saW5lYXJHcmFkaWVudD4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzExIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZmZmZiIgb2Zmc2V0PSIwIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2RkZGRkZCIgc3RvcC1vcGFjaXR5PSIwLjk5NjA5NCIgb2Zmc2V0PSIxIi8+ICA8L2xpbmVhckdyYWRpZW50PiAgPGxpbmVhckdyYWRpZW50IGlkPSJzdmdfMTIiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4gICA8c3RvcCBzdG9wLWNvbG9yPSIjZmZmZmZmIiBvZmZzZXQ9IjAiLz4gICA8c3RvcCBzdG9wLWNvbG9yPSIjZjJmMmYyIiBzdG9wLW9wYWNpdHk9IjAuOTkyMTg4IiBvZmZzZXQ9IjEiLz4gIDwvbGluZWFyR3JhZGllbnQ+ICA8bGluZWFyR3JhZGllbnQgaWQ9InN2Z18xMyIgeDI9IjEiIHkyPSIxIj4gICA8c3RvcCBzdG9wLWNvbG9yPSIjZmZmZmZmIiBzdG9wLW9wYWNpdHk9IjAuOTk2MDk0IiBvZmZzZXQ9IjAiLz4gICA8c3RvcCBzdG9wLWNvbG9yPSIjYzFjMWMxIiBzdG9wLW9wYWNpdHk9IjAuOTk2MDk0IiBvZmZzZXQ9IjEiLz4gIDwvbGluZWFyR3JhZGllbnQ+ICA8bGluZWFyR3JhZGllbnQgaWQ9InN2Z18xNCIgeDI9IjEiIHkyPSIxIiB4MT0iMCIgeTE9IjAiPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmZmZmZmYiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMCIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNjMWMxYzEiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMSIvPiAgPC9saW5lYXJHcmFkaWVudD4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzE1IiB5Mj0iMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgc3ByZWFkTWV0aG9kPSJwYWQiPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNlZmVmZWYiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMCIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiM4MjgyODIiIHN0b3Atb3BhY2l0eT0iMC45OTYwOTQiIG9mZnNldD0iMSIvPiAgPC9saW5lYXJHcmFkaWVudD4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzE2IiB4Mj0iMSIgeTI9IjEiPiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmZmZmZmYiIG9mZnNldD0iMCIvPiAgIDxzdG9wIHN0b3AtY29sb3I9IiMwMDAwMDAiIG9mZnNldD0iMSIvPiAgPC9saW5lYXJHcmFkaWVudD4gIDxsaW5lYXJHcmFkaWVudCBpZD0ic3ZnXzE3IiB4Mj0iMSIgeTI9IjEiIHgxPSIwIiB5MT0iMCI+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZmZmZiIgb2Zmc2V0PSIwIi8+ICAgPHN0b3Agc3RvcC1jb2xvcj0iI2UwZTBlMCIgc3RvcC1vcGFjaXR5PSIwLjk5NjA5NCIgb2Zmc2V0PSIxIi8+ICA8L2xpbmVhckdyYWRpZW50PiAgPGxpbmVhckdyYWRpZW50IGlkPSJzdmdfMTgiIHgyPSIxIiB5Mj0iMSIgeDE9IjAiIHkxPSIwIj4gICA8c3RvcCBzdG9wLWNvbG9yPSIjZmZmZmZmIiBvZmZzZXQ9IjAiLz4gICA8c3RvcCBzdG9wLWNvbG9yPSIjY2VjZWNlIiBzdG9wLW9wYWNpdHk9IjAuOTkyMTg4IiBvZmZzZXQ9IjEiLz4gIDwvbGluZWFyR3JhZGllbnQ+IDwvZGVmcz48L3N2Zz4=);"
;

    function init(session, wrapper) {
        checkSession(session);
        createIframe(wrapper);
        drawMouse();

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

        _session = s;
    }


    function createIframe(wrapper) {
    	var src = _session.m.url;
    	var w = _session.m.size.split(',')[0]
    	var h = _session.m.size.split(',')[1]

        var iframe = document.createElement('iframe');
        iframe.src = _session.m.url;
        iframe.width = w;
        iframe.height = h; 
        iframe.class = _iframeClass;
        
        document.body.appendChild(iframe);
        _iframe = iframe;
        return iframe;
    }

    function drawMouse() {
    	var mouse = document.createElement('div')
    	mouse.style.width = 20;
    	mouse.style.height = 20;
    	mouse.style.backgroundImage = _mouseSvg;
    	mouse.style.backgroundSize = '20px, 20px';
    	mouse.style.backgroundRepeat = 'no-repeat';

    	_iframe.
    }

    function play(speed) {
        speed = speed || _speed;
        if (speed > 5 || speed < 0) {
            throw 'invalid speed'
        }

        _session.d.map(function(action) {
            action.t /= speed;
        })
    }

    API.init = init;
    API.play = play;
    return API;



})();
