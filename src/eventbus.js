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

        var eventbus = this;
        /**
         * emits the event to every register listener, waiting for it to finish before invoking the next one. 
         * In case an error is returned the invokation of the rest of the handlers is stopped and the error is returned to the callback.
         * In case there are no registered listners the callback is invoked with null, [] to indicate that the operation is complete and no errors or data were returned.
         */
        this.emitWait = function (event, callback) {
            var eventType = getEventType(event);
            var listeners = eventTypeMap.get(eventType) || [];
            currentEvent = event;
            propagate = true;
            var i = -1;
            var res = [];
            function next(err, data) {
                //handle error
                if (err) {
                    callback(err, null);
                    return;
                }
                //handle data
                if(typeof data !== 'undefined') {
                    res[i] = data;

                }
                //new iteration
                i += 1;
                if(i < listeners.length)
                    listeners[i].call(eventbus, event, next);
                else
                    callback(null, res);
            }
            next();
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