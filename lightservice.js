//var q = require("q");

var light = (function () {
    var GLOBAL = {};

    GLOBAL.DEFAULT_PIPE_NAME = "$$default";
    GLOBAL._TEST_OBJECTS_;
    GLOBAL.actors = function () { };
    GLOBAL.actorsDef = [];
    GLOBAL.eventSubscribers = {};
    GLOBAL.system = {};
    GLOBAL.utility = {};
    GLOBAL.utility.execSurpressError = function (o, e, context, notificationInfo) {
        _light["event"].notify(e, context, notificationInfo);
        if (typeof o === "function") {
            try { o(e, context, notificationInfo); } catch (ex) {
                console.error("SUPRESSED ERROR : " + ex);
            }
        }
    };
    GLOBAL.utility.tryCatch = function (context, f, success, error) {
        try {
            var result = f();
            GLOBAL.utility.execSurpressError(function () {
                success(result, context);
            }, null, context, "trying-service");
        } catch (e) {
            GLOBAL.utility.execSurpressError(function () {
                error(e, context);
            }, e, context, "service-throws");
        }
    };

    GLOBAL.servicePipes = [];

    var setUpEventSubscriberBase = function (name, id, o) {
        setUpEventSubscriberBase.ref = setUpEventSubscriberBase.ref || 0;
        setUpEventSubscriberBase.ref++;
        GLOBAL.eventSubscribers[id] = GLOBAL.eventSubscribers[id] || {};
        GLOBAL.eventSubscribers[id].sub = GLOBAL.eventSubscribers[id].sub || [];
        GLOBAL.eventSubscribers[id].sub.push({
            service: o,
            ref: setUpEventSubscriberBase.ref
        });
        return setUpEventSubscriberBase.ref;
    };
    var createEventEmitter = function (name, id, f) {
        GLOBAL.eventSubscribers[id] = GLOBAL.eventSubscribers[id] || {};
        GLOBAL.eventSubscribers[id].sub = GLOBAL.eventSubscribers[id].sub || [];
        GLOBAL.eventSubscribers[id].notify = GLOBAL.eventSubscribers[id].notify || function (o, context, notificationType) {
            var _id = id;
            var l = GLOBAL.eventSubscribers[_id].sub.length;
            for (var i = 0; i < l; i++) {
                var item = GLOBAL.eventSubscribers[_id].sub[i];
                var notificationInfo = {
                    index: i,
                    notificationType: notificationType
                };
                f(item, o, context, notificationInfo);
            }
        };
    };
    var setUpNotification = function (name, id) {
        return createEventEmitter(name, id, function (item, o, context, notificationInfo) {
            GLOBAL.utility.tryCatch(context, function () { return item.service(); }, function () { }, function () { GLOBAL.utility.execSurpressError(item.service.error, o, context, notificationInfo); });
        });
    };
    var setUpSystemEventSubscriptionFx = function (name, that, id) {
        that[name] = function (e) {
            setUpEventSubscriberBase(name, id, e);
        };
        createEventEmitter(name, id, function (item, o, context, notificationInfo) {
            if (typeof item === "function") {
                try { item(o, context, notificationInfo) } catch (e) { }
            }
        });
    };
    var setUpSystemEvent = function (that, event, name) {
        setUpSystemEventSubscriptionFx(event, that, name + "." + event);
        that[event].notify = GLOBAL.eventSubscribers[name + "." + event].notify;
    };
    var setUpServiceEvent = function (that, event, name) {
        var id = name + "." + event;
        that[event] = function (o) {
            return setUpEventSubscriberBase(name, id, o);
        };
        that[event].forEachSubscriber = that[event].forEachSubscriber || function (f) {
            var l = GLOBAL.eventSubscribers[id].sub.length;
            for (var i = 0; i < l; i++) {
                var item = GLOBAL.eventSubscribers[id].sub[i];
                f && f(item);
            }
        };
        setUpNotification(name, id);
        that[event].notify = GLOBAL.eventSubscribers[id].notify;
    };

    var getServiceByName = function (name) {
        var item = GLOBAL.actors[name];
        return item;
    };
    function parseJSON(data) {
        return JSON && JSON.parse ? JSON.parse(data) : (new Function("return " + data))();
    }
    /*
     !!!!!!!!!!!!!!!!
    */
    var getApplicableServicePipe = function (context, serviceItem, definitionOrDefinitionType, definition, name, arg) {
        var pipeType = definitionOrDefinitionType ;
        var actualDefinition =  definition ;

      var pipeName = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[name] && GLOBAL._TEST_OBJECTS_[name].pipeName;

      if (pipeName) {
          pipeType = pipeName;
      }
        var testServicePipe = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[name] && GLOBAL._TEST_OBJECTS_[name].servicePipe;

        var testServicePipeCondition = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[name] && GLOBAL._TEST_OBJECTS_[name].servicePipeCondition;
       

        var tmpDefinition;
        if (testServicePipe && !pipeName) {
            GLOBAL.system.$$currentContext = {
                servicePipes: GLOBAL.servicePipes,
                definition: actualDefinition,
                serviceName: name,
                pipeName: undefined,
                arg: arg
            };
            if (testServicePipeCondition) {
                if (testServicePipeCondition.call(GLOBAL.system, actualDefinition)) {
                    tmpDefinition = testServicePipe.call(GLOBAL.system, actualDefinition);
                }
            } else {
                tmpDefinition = testServicePipe.call(GLOBAL.system, actualDefinition);
            }
        } else {
            var isAMatch = false;
            var length = GLOBAL.servicePipes.length;
            for (var j = 0; j < length; j++) {
                var pipe = GLOBAL.servicePipes[j];

                isAMatch = pipeType &&(pipe.name === pipeType) && (testServicePipeCondition || pipe.condition).call(GLOBAL.system, actualDefinition);

                if (isAMatch) {
                    GLOBAL.system.$$currentContext = {
                        servicePipes: GLOBAL.servicePipes,
                        definition: actualDefinition,
                        serviceName: name,
                        pipeName: pipe.name,
                        arg: arg
                    };

                    tmpDefinition = (testServicePipe || pipe.definition).call(GLOBAL.system, actualDefinition);

                    break;
                }
            }
        }
        return tmpDefinition;
    };
    var runSuppliedServiceFunction = function (context, serviceItem, definitionOrDefinitionType, definition, name, arg) {

        //start testing
        if (GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[name] && GLOBAL._TEST_OBJECTS_[name].service) {            
            definitionOrDefinitionType = GLOBAL._TEST_OBJECTS_[name].type || definitionOrDefinitionType; 
            definition = GLOBAL._TEST_OBJECTS_[name].service || definition;              
        }

        //end testing
        var tmpDefinition = getApplicableServicePipe(context, serviceItem, definitionOrDefinitionType, definition, name, arg);

        //expecting function from pipe plugin
        if (typeof tmpDefinition !== "function") {
            var message = "Cannot process service '" + name + "' "
            message = message + (tmpDefinition ? "'" + definitionOrDefinitionType + "' service pipe must return a function" : "no matching service pipe  exists ");
            console.error(message);
            throw message;
        }

        return tmpDefinition.call(GLOBAL.system, arg);
    };

    var createServiceDefinitionFromSuppliedFn = function (context, serviceItem, definitionOrDefinitionType, definition, name) {
        setUpServiceEvent(serviceItem, "before", name);
        setUpServiceEvent(serviceItem, "after", name);
        setUpServiceEvent(serviceItem, "error", name);
        setUpServiceEvent(serviceItem, "success", name);

        return function (arg, callerContext) {
            var result;
            context.callerContext = callerContext;
            GLOBAL.utility.tryCatch(context, function () { return serviceItem["before"].notify(); }, function () { }, function () { });

            GLOBAL.utility.tryCatch(context, function () {
                result = runSuppliedServiceFunction(context, serviceItem, definitionOrDefinitionType, definition, name, arg);
                return result;
            }, function (o) {
                return serviceItem["success"].notify(o, context, "service-success");
            }, function (o) {
                return serviceItem["error"].notify(o, context, "service-error");
            });

            GLOBAL.utility.tryCatch(context, function () { return serviceItem["after"].notify(); }, function () { }, function () { });
            return result;
        }
    };

    var defineService = function (name, definitionOrDefinitionType, definition) {

        if (!definition) {
            definition = definitionOrDefinitionType;
            definitionOrDefinitionType = GLOBAL.DEFAULT_PIPE_NAME;
        } 

        var context = {
            name: name, step: function (o) {
                _light["event"].notify(name, context, "service-call");
                this.steps.push(o);
            },
            steps: []
        };
        var serviceItem = function (arg) {
            arg = arg || {};
            return serviceItem.redefinition(arg);
        };
        serviceItem.position = GLOBAL.actorsDef.length + 1;

        serviceItem.redefinition = createServiceDefinitionFromSuppliedFn(context, serviceItem, definitionOrDefinitionType, definition, name);

        serviceItem.me = name;
        GLOBAL.actors[name] = serviceItem;
        GLOBAL.actorsDef.push(GLOBAL.actors[name]);
        GLOBAL.system[name] = function (arg) {
            context.step(name);
            return serviceItem.redefinition(arg, context);
        }
    };

    //context are invocable other services

    var _light = function (f) {
        typeof f === "function" && f.call(GLOBAL.actors, null);
    };

    _light.startService = function (name, f) {
        typeof f === "function" && f.call(GLOBAL.actors, getServiceByName(name));
    };

    _light.version = 1;
    setUpSystemEvent(_light, "event", "$system");

    _light.servicePipe = function (name, condition, definition) {
        GLOBAL.servicePipes.push({
            name: name,// todo check for unique name
            condition: condition,
            definition: definition
        });
    }

    _light.service = defineService;

    _light.advance = {
        testService: function (setup, f) {
            GLOBAL._TEST_OBJECTS_ = setup;
            f.call(GLOBAL.actors, setup);
            GLOBAL._TEST_OBJECTS_ = undefined
        }
    };


    _light.servicePipe(GLOBAL.DEFAULT_PIPE_NAME, function (definition) { return typeof definition === "function"; }, function (definition) { return definition; });

    return _light;
})();

// default function servicePipe plugin


//light.servicePipe("dom", function (definition) { return true; }, function (definition) {
//    return function () {
//     document.body.innerHTML=   definition();
//    }
//});

//light.service("setThings", "dom", function () { return "<bold>wooooooooooooo</bold>";  });

if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = light;
}

if (typeof define === 'function' && define.amd) {
    define('light', [], function () { return light; });
}