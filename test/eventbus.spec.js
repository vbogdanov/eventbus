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

    // it('has an emitAll function', function () {
    //   expect(eventbus.emit).toEqual(jasmine.any(Function));
    // });

    it('has an "off" function', function () {
      expect(eventbus.off).toEqual(jasmine.any(Function));
    });

    it('has a "stop" function', function () {
      expect(eventbus.cancel).toEqual(jasmine.any(Function));
    });

    itBehavesAsExpected(FOO_EVENT_TYPE);

    describe('on FOO_EVENT_TYPE ', function () {
      
      beforeEach(function () {
        stopFooEvents = eventbus.on(FOO_EVENT_TYPE, fooEventHandler);
        expectedState = {
          'FOO':[fooEventHandler]
        };
      });

      itBehavesAsExpected(BAR_EVENT_TYPE);

      describe('on BAR_EVENT_TYPE', function () {
        
        beforeEach(function () {
          stopBarEvents = eventbus.on(BAR_EVENT_TYPE, barEventHandler);
          expectedState = {
            'FOO':[fooEventHandler],
            'BAR':[barEventHandler]
          };
        });

        itBehavesAsExpected('BAZ');

        describe('off all BAR events', function () {
          beforeEach(function () {
            eventbus.off(BAR_EVENT_TYPE);
            expectedState = {
              'FOO':[fooEventHandler]
            };
          });

          itBehavesAsExpected(BAR_EVENT_TYPE);
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

        itBehavesAsExpected(BAR_EVENT_TYPE);

        describe('with first listener on FOO_EVENT_TYPE stopped', function () {
          beforeEach(function () {
            stopFooEvents();
            expectedState = {
              'FOO':[foo2EventHandler]
            };
          });

          itBehavesAsExpected(BAR_EVENT_TYPE);
        });

        describe('with second listener on FOO_EVENT_TYPE stopped', function () {
          beforeEach(function () {
            stopFoo2Events();
            expectedState = {
              'FOO':[fooEventHandler]
            };
          });

          itBehavesAsExpected(BAR_EVENT_TYPE, true);
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

      itBehavesAsExpected(BAR_EVENT_TYPE, true);
    });

    describe('cancel-ing first event', function () {
      var notInvoked;
      beforeEach(function () {
        eventbus.on(FOO_EVENT_TYPE, function (event, callback) {
          eventbus.cancel(event);
        });
        notInvoked = jasmine.createSpy('Handler after cancel');
        eventbus.on(FOO_EVENT_TYPE, notInvoked);
      });

      it('does not invoke the second listener', function () {
        eventbus.emit(FOO_EVENT);
        expect(notInvoked).not.toHaveBeenCalled();  
      });
    });


    function itBehavesAsExpected(notRegisteredEventType, once) {
      var registeredEvents = expectedState;
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

      it('removes not existing listeners', function () {
        expect(function () {
          eventbus.off(notRegisteredEventType);
        }).not.toThrow();
      });

      it('cancel-ing an event before being handled has no effect', function () {
        expect(function () {
          eventbus.cancel(NOT_REGISTERED_EVENT);
        }).not.toThrow();
      });

      for (var registeredEventType in registeredEvents) {
        var REGISTERED_EVENT = {
          type: registeredEventType,
          data: 8,
          source: 'somewhere'
        };

        it('cancel-ing an event before being handled has no effect', function () {
          expect(function () {
            eventbus.cancel(NOT_REGISTERED_EVENT);
          }).not.toThrow();
        });

        it('registers additional listener on event type registered before', function () {
          expect(function () {
            var handler = jasmine.createSpy();
            var stopFn = eventbus.on(registeredEventType, handler);
            expect(handler).not.toHaveBeenCalled();
            expect(stopFn).toEqual(jasmine.any(Function));
          }).not.toThrow();
        });

        it('registers new listener with "once" of type registered before', function () {
          expect(function () {
            var handler = jasmine.createSpy();
            var stopFn = eventbus.once(registeredEventType, handler);
            expect(handler).not.toHaveBeenCalled();
            expect(stopFn).toEqual(jasmine.any(Function));
          }).not.toThrow();
        });

        it('emits an event of registered type', function () {
          expect(function () {
            var callback = jasmine.createSpy();
            eventbus.emit(REGISTERED_EVENT, callback);
            var handlers = registeredEvents[registeredEventType];
            for (var i = 0; i < handlers.length; i ++) {
              expect(handlers[i]).toHaveBeenCalledWith(REGISTERED_EVENT, callback);
              expect(handlers[i].calls.length).toBe(1);
            }
          }).not.toThrow();
        });

        it('emits a couple of events of registered type', function () {
          expect(function () {
            var callback = jasmine.createSpy();
            eventbus.emit(REGISTERED_EVENT, callback);
            eventbus.emit(REGISTERED_EVENT, callback);
            var handlers = registeredEvents[registeredEventType];
            for (var i = 0; i < handlers.length; i ++) {
              expect(handlers[i]).toHaveBeenCalledWith(REGISTERED_EVENT, callback);
              expect(handlers[i].calls.length).toBe(once? 1: 2);
            }
          }).not.toThrow();
        });

        it('removes existing listeners for a given type', function () {
          expect(function () {
            eventbus.off(registeredEventType);
          }).not.toThrow();
        });

      }
    }

    
  });
});