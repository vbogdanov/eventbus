/* global describe: false */
/* global it: false */
/* global expect: false */
/* global beforeEach: false */
/* global jasmine: false */
/* jshint maxstatements: 30 */
var EventBus = require('../src/eventbus');

describe('EventBus', function () {
  'use strict';

  it('is a function', function () {
    expect(typeof EventBus).toBe('function');
  });

  it('creates an instance using "new"', function () {
    var instance;
    expect(function () {
      instance = new EventBus();
    }).not.toThrow();
    expect(instance).toBeTruthy();
  });

  describe('instance', function () {
    var eventbus;
    var expectedState;
    var FOO_EVENT_TYPE = 'FOO';
    var FOO_EVENT = {
      type: FOO_EVENT_TYPE,
      data: 5,
      source: 'nowhere'
    };
    var fooEventHandler;
    var stopFooEvents;

    var BAR_EVENT_TYPE = 'BAR';
    var BAR_EVENT ={
      type: BAR_EVENT_TYPE,
      data: 123
    };
    var barEventHandler;
    var stopBarEvents;

    beforeEach(function () {
      fooEventHandler = jasmine.createSpy('fooEventHandler');
      barEventHandler = jasmine.createSpy('barEventHandler');

      eventbus = new EventBus();
      expectedState = {};
    });

    it('has a "on" function', function () {
      expect(eventbus.on).toEqual(jasmine.any(Function));
    });

    it('has a "once" function', function () {
      expect(eventbus.once).toEqual(jasmine.any(Function));
    });

    it('has an "emit" function', function () {
      expect(eventbus.emit).toEqual(jasmine.any(Function));
    });

    it('has an emitWait function', function () {
      expect(eventbus.emitWait).toEqual(jasmine.any(Function));
    });

    it('has an "off" function', function () {
      expect(eventbus.off).toEqual(jasmine.any(Function));
    });

    itBehavesAsNotRegistered(FOO_EVENT_TYPE);

    describe('on FOO_EVENT_TYPE ', function () {
      
      beforeEach(function () {
        stopFooEvents = eventbus.on(FOO_EVENT_TYPE, fooEventHandler);
        expectedState = {
          'FOO':[fooEventHandler]
        };
      });

      itBehavesAsNotRegistered(BAR_EVENT_TYPE);
      itBehavesAsRegistered(FOO_EVENT_TYPE);

      describe('on BAR_EVENT_TYPE', function () {
        
        beforeEach(function () {
          stopBarEvents = eventbus.on(BAR_EVENT_TYPE, barEventHandler);
          expectedState = {
            'FOO':[fooEventHandler],
            'BAR':[barEventHandler]
          };
        });

        itBehavesAsNotRegistered('BAZ');
        itBehavesAsRegistered(FOO_EVENT_TYPE);
        itBehavesAsRegistered(BAR_EVENT_TYPE);

        describe('off all BAR events', function () {
          beforeEach(function () {
            eventbus.off(BAR_EVENT_TYPE);
            expectedState = {
              'FOO':[fooEventHandler]
            };
          });

          itBehavesAsNotRegistered(BAR_EVENT_TYPE);
          itBehavesAsRegistered(FOO_EVENT_TYPE);
        });
      });

      describe('second on FOO_EVENT_TYPE', function () {
        var foo2EventHandler;
        var stopFoo2Events;
        
        beforeEach(function () {
          foo2EventHandler = jasmine.createSpy('foo2EventHandler');
          stopFoo2Events = eventbus.on(FOO_EVENT_TYPE, foo2EventHandler);
          expectedState = {
            'FOO':[fooEventHandler, foo2EventHandler]
          };
        });

        itBehavesAsNotRegistered(BAR_EVENT_TYPE);
        itBehavesAsRegistered(FOO_EVENT_TYPE);

        describe('with first listener on FOO_EVENT_TYPE stopped', function () {
          beforeEach(function () {
            stopFooEvents();
            expectedState = {
              'FOO':[foo2EventHandler]
            };
          });

          itBehavesAsNotRegistered(BAR_EVENT_TYPE);
          itBehavesAsRegistered(FOO_EVENT_TYPE);
        });

        describe('with second listener on FOO_EVENT_TYPE stopped', function () {
          beforeEach(function () {
            stopFoo2Events();
            expectedState = {
              'FOO':[fooEventHandler]
            };
          });

          itBehavesAsNotRegistered(BAR_EVENT_TYPE, true);
          itBehavesAsRegistered(FOO_EVENT_TYPE);
        });
      });
    });

    describe('once on FOO_EVENT_TYPE', function () {
      beforeEach(function () {
        stopFooEvents = eventbus.once(FOO_EVENT_TYPE, fooEventHandler);
        expectedState = {
          'FOO':[fooEventHandler]
        };
      });

      itBehavesAsNotRegistered(BAR_EVENT_TYPE, true);
      itBehavesAsRegistered(FOO_EVENT_TYPE, true);
    });

    describe('handles invoking callback', function () {
      var notInvoked;
      beforeEach(function () {
        notInvoked = jasmine.createSpy('Handler after Error');

        eventbus.on(FOO_EVENT_TYPE, function (event, callback) {
          callback(null, 1);
        });
        eventbus.on(FOO_EVENT_TYPE, function (event, callback) {
          callback(null, 2);
        });
        eventbus.on(FOO_EVENT_TYPE, function (event, callback) {
          callback(null, 3);
        });

        eventbus.on(BAR_EVENT_TYPE, function (event, callback) {
          callback(new Error('test'), null);
        });
        eventbus.on(BAR_EVENT_TYPE, notInvoked);
      });

      it('emitWait calls them in order, building the result', function (next) {
        eventbus.emitWait(FOO_EVENT, function (error, data) {
          expect(error).toBeFalsy();
          expect(data).toEqual(jasmine.any(Array));
          next();
        });
      });

      it('emitsWait that results in a error, stoping the execution and invoking the general callback', function (next) {
        eventbus.emitWait(BAR_EVENT, function (error, data) {
          expect(error).toEqual(jasmine.any(Error));
          expect(data).toBeFalsy();
          next();
        });
      });
    });


    function itBehavesAsNotRegistered(notRegisteredEventType) {
      var NOT_REGISTERED_EVENT = {
        type: notRegisteredEventType,
        data: 5,
        source: 'nowhere'
      };

      it('registers new listener on event type not registered before', function () {
        expect(function () {
          var handler = jasmine.createSpy();
          var stopFn = eventbus.on(notRegisteredEventType, handler);
          expect(handler).not.toHaveBeenCalled();
          expect(stopFn).toEqual(jasmine.any(Function));
        }).not.toThrow();
      });

      it('registers new listener with "once" returning stopFn', function () {
        expect(function () {
          var handler = jasmine.createSpy();
          var stopFn = eventbus.once(notRegisteredEventType, handler);
          expect(handler).not.toHaveBeenCalled();
          expect(stopFn).toEqual(jasmine.any(Function));
        }).not.toThrow();
      });

      it('emits an event of not registered type', function () {
        expect(function () {
          var callback = jasmine.createSpy();
          eventbus.emit(NOT_REGISTERED_EVENT, callback);
          expect(callback).not.toHaveBeenCalled();
        }).not.toThrow();
      });

      it('emitWaits an event of not registered type invokes the callback with data = []', function () {
        expect(function () {
          var callback = jasmine.createSpy();
          eventbus.emitWait(NOT_REGISTERED_EVENT, callback);
          expect(callback).toHaveBeenCalled();
        }).not.toThrow();
      });

      it('returns empty array when asked for listeners of an unregistered event', function () {
        var listeners = eventbus.listeners(NOT_REGISTERED_EVENT);
        expect(listeners).toEqual([]);
      });

      it('parallel emits the event to no listeners and invokes the success callback with the event', function (next) {
        eventbus.parallel(NOT_REGISTERED_EVENT, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toBe(NOT_REGISTERED_EVENT);
          next();
        });
      });

      it('series emits the event to no listeners and invokes the callback with the event', function (next) {
        eventbus.series(NOT_REGISTERED_EVENT, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toBe(NOT_REGISTERED_EVENT);
          next();
        });
      });

      it('waterfall emits the event to no listeners', function (next) {
        eventbus.waterfall(NOT_REGISTERED_EVENT, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toBe(NOT_REGISTERED_EVENT);
          next();
        });
      });

      it('removes not existing listeners', function () {
        expect(function () {
          eventbus.off(notRegisteredEventType);
        }).not.toThrow();
      });
      
    }

    function itBehavesAsRegistered(registeredEventType, once) {
      var REGISTERED_EVENT = {
        type: registeredEventType,
        data: 8,
        source: 'somewhere'
      };

      it('registers additional listener on ' + registeredEventType, function () {
        expect(function () {
          var handler = jasmine.createSpy();
          var stopFn = eventbus.on(registeredEventType, handler);
          expect(handler).not.toHaveBeenCalled();
          expect(stopFn).toEqual(jasmine.any(Function));
        }).not.toThrow();
      });

      it('registers new listener with "once" of ' + registeredEventType, function () {
        expect(function () {
          var handler = jasmine.createSpy();
          var stopFn = eventbus.once(registeredEventType, handler);
          expect(handler).not.toHaveBeenCalled();
          expect(stopFn).toEqual(jasmine.any(Function));
        }).not.toThrow();
      });

      it('emits ' + registeredEventType, function () {
        var callback = jasmine.createSpy();
        eventbus.emit(REGISTERED_EVENT, callback);
        var handlers = expectedState[registeredEventType];
        for (var i = 0; i < handlers.length; i ++) {
          expect(handlers[i]).toHaveBeenCalledWith(REGISTERED_EVENT, callback);
          expect(handlers[i].calls.length).toBe(1);
        }
      });

      it('emits a couple of ' + registeredEventType, function () {
        var callback = jasmine.createSpy();
        eventbus.emit(REGISTERED_EVENT, callback);
        eventbus.emit(REGISTERED_EVENT, callback);
        var handlers = expectedState[registeredEventType];
        for (var i = 0; i < handlers.length; i ++) {
          expect(handlers[i]).toHaveBeenCalledWith(REGISTERED_EVENT, callback);
          expect(handlers[i].calls.length).toBe(once? 1: 2);
        }
      });

      it('emitWaits '+ registeredEventType , function () {
        //Only the first listener receives it unless callback is invoked
        var callback = jasmine.createSpy();
        eventbus.emitWait(REGISTERED_EVENT, callback);
        var handlers = expectedState[registeredEventType];

        expect(handlers[0]).toHaveBeenCalledWith(REGISTERED_EVENT, jasmine.any(Function));
        expect(handlers[0].calls.length).toBe(1);

        for (var i = 1; i < handlers.length; i ++) {
          expect(handlers[i]).not.toHaveBeenCalled();
        }
      });

      it('returns array when asked for listeners on ' + registeredEventType, function () {
        var handlers = expectedState[registeredEventType];
        var listeners = eventbus.listeners(REGISTERED_EVENT);

        expect(listeners.length).toEqual(handlers.length);

        listeners.forEach(function (cb) {
          cb(FOO_EVENT, function () {});
        });

        handlers.forEach(function (handler) {
          expect(handler).toHaveBeenCalled();
        });
      });


      it('removes existing listeners for a given type', function () {
        expect(function () {
          eventbus.off(registeredEventType);
        }).not.toThrow();
      });

    }

    
  });
});