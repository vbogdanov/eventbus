(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['yacollections'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('yacollections'));
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root.yacollections);
    }
})(this, 
function (collections) {
    'use strict';
    var idCounter = -1;

    function EventBus(options) {
        options = options || {};
        // getEventType(:Event):EventType
        var getEventType = options.getEventType || function (event) {
            if (typeof event === undefined || event === null) 
                throw new Error('Event must be defined not null value');
            return event.type || event.constructor || typeof event || 'UNKNOWN';
        };
        var eventTypeMap = new collections.Map(options);

        /**
         * EventBus# on(EventType, Handler):StopFn
         */
        this.on = function (eventType, handler) {
            var listeners = getListenersList(eventType);
            var length = listeners.push(handler);
            var index = length - 1;
            return function () {
                listeners.remove(handler);
                cleanUpEventType(eventType, listeners);
            };
        }

        this.once = function (eventType, handler) {
            var stopFn = null;
            var eb = this;
            var newHandler = function (event, callback) {
                handler.apply(eb, arguments);
                stopFn && stopFn();
            };
            stopFn = this.on(eventType, newHandler);
            return stopFn;
        }

        var propagate, currentEvent;
        this.emit = function (event, callback) {
            var eventType = getEventType(event);
            var listeners = eventTypeMap.get(eventType) || [];
            currentEvent = event;
            propagate = true;
            for (var i = 0; i < listeners.length && propagate; i++) {
                listeners[i].apply(this, arguments);
            }
            
        }

        this.off = function (eventType) {
            eventTypeMap.remove(eventType);
        }

        this.cancel = function (event) {
            if (currentEvent === event) {
                propagate = false;
            }
        }

        function getListenersList(eventType) {
            var listeners = eventTypeMap.get(eventType);
            if (typeof listeners === 'undefined') {
                listeners = new collections.List();
                eventTypeMap.set(eventType, listeners);
            }
            return listeners;
        }

        function cleanUpEventType(eventType, listeners) {
            if (listeners.length === 0 && getListenersList(eventType) === listeners) {
                eventTypeMap.remove(eventType);
            }
        }
    }

    return EventBus;
});