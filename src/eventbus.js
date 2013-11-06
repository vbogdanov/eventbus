(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['yacollections','reactions'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('yacollections'), require('reactions'));
    } else {
        // Browser globals (root is window)
        root.EventBus = factory(root.yacollections, root.Reactions);
    }
})(this, 
function (collections, Reactions) {
    'use strict';

    function EventBus(options) {
        var eventbus = this;
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
        eventbus.on = function (eventType, handler) {
            var listeners = getListenersList(eventType);
            var length = listeners.push(handler);
            var index = length - 1;
            return function () {
                listeners.remove(handler);
                cleanUpEventType(eventType, listeners);
            };
        };

        eventbus.once = function (eventType, handler) {
            var stopFn = this.on(eventType, function (event, callback) {
                if(stopFn) stopFn();
                handler.apply(eventbus, arguments);
            });
            return stopFn;
        };

        eventbus.off = function (eventType) {
            eventTypeMap.remove(eventType);
        };

        eventbus.listeners = function (event) {
            var eventType = getEventType(event);
            return eventTypeMap.get(eventType) || [];
        }

        eventbus.emit = function (event, callback) {
            var listeners = eventbus.listeners(event).forEach(function (item) {
                item.call(null, event, callback);
            });
        };

        //provide all reaction.fn functions:
        var PROTECTED_NAMES = 'emit, emitWait, on, once, off, listeners, __proto__, hasOwnProperty'
        for (var methodName in Reactions.fn) {
            if (PROTECTED_NAMES.indexOf(methodName) === -1 
                    && Reactions.fn[methodName].length === 3) {
                eventbus[methodName] = createHandler(methodName, Reactions.fn);
            }
        }

        function createHandler(name, utilObject) {
            return function (event, callback) {
                var listeners = eventbus.listeners(event);
                utilObject[name](listeners, event, callback);
            }
        }

        /**
         * emits the event to every register listener, waiting for it to finish before invoking the next one. 
         * In case an error is returned the invokation of the rest of the handlers is stopped and the error is returned to the callback.
         * In case there are no registered listners the callback is invoked with null, [] to indicate that the operation is complete and no errors or data were returned.
         */
        eventbus.emitWait = function (event, callback) {
            eventbus.collectSeries(event, callback);
        };



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