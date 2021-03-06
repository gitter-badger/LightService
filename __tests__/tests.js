jest.dontMock('../lightservice');
var light = require('../lightservice') || light;
/*
light.event(function (e, context,notificationInfo) {
 console.log("logging full ---- " );
   console.log(JSON.stringify(context));
   console.log(notificationInfo);
   console.log(e);
});*/
light.event(function (e, context, notificationInfo) { });

light.service("test", function (arg) { });
light.service("test-2", function (arg) { });
light.service("test-2b2", function (arg) { });
light.service("test_error", function (arg) { throw "error occured"; });
light.service("sample1", function (arg) { return arg.x * arg.y; });
light.service("sample2", function (arg) {
    return this.sample1({ x: 2, y: 3 });
});

describe('light', function () {
    it('exists', function () {
        expect(light.version).toBe(1);
    });

    it('using new api', function () {
        light(function () {
            var test = this.test_error;
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function () { path.push("error"); });
            test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("error");
            expect(path[2]).toBe("after");
            expect(path.length).toBe(3);
        });
    });

    it('event listening are not available in service definition', function () {
        light.service("sample_no_event", function (arg) {
            expect(this.sample1.before).toBe(undefined);
            expect(this.sample1.error).toBe(undefined);
            expect(this.sample1.after).toBe(undefined);

            return this.sample1({ x: 2, y: 3 });
        });

        light(function () {
            this.sample_no_event();
        });
    });

    it('should allow event subscription - forEachSubscriber', function () {
        light.startService("test-2", function (test) {
            var path = [];

            var subs = "";
            var subsExpected = "";
            subs += test.after(function () {
                path.push("2");
            });

            subs += test.after(function () {
                path.push("1");
            });

            test.after.forEachSubscriber(function (it) {
                subsExpected += it.ref;
            });

            expect(subs).toBe(subsExpected);
            test();
            expect(subs).toBe(subsExpected);
            test();
        });
    });

    it('should allow light definition', function () {
        light.startService("test", function (test) {
            expect(test.me).toBe("test");
            expect(test.position).toBe(1);
        });
    });

    it('should allow event subscription 1', function () {
        light.startService("test", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test();
            expect(path[0]).toBe("before");
            expect(path.length).toBe(1);
        });
    });
    it('should allow event subscription 2', function () {
        light.startService("test", function (test) {
            var path = [];
            test.after(function () {
                path.push("after1");
            });
            test();
            expect(path[0]).toBe("after1");
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription 2', function () {
        light.startService("test", function (test) {
            var path = [];
            test.after(function () {
                path.push("after2");
            });

            test.after.forEachSubscriber(function (it) {
                console.warn(it);
            });

            test();
            expect(path[0]).toBe("after2");
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription - forEachSubscriber ', function () {
        light.startService("test-2b2", function (test) {
            var path = [];

            var subs = "";
            var subsExpected = "";
            subs += test.after(function () {
                path.push("2");
            });
            test.before(function () {
                path.push("1");
            });
            subs += test.after(function () {
                path.push("1");
            });
            test.error(function () {
                path.push("1");
            });

            test.after.forEachSubscriber(function (it) {
                subsExpected += it.ref;
            });

            expect(subs).toBe(subsExpected);
            test();
            expect(subs).toBe(subsExpected);
            test();
        });
    });

    it('should allow event subscription 3', function () {
        light.startService("test", function (test) {
            var path = [];
            test.error(function () { path.push("error"); });
            test();
            expect(path.length).toBe(0);
        });
    });

    it('should allow event subscription 5', function () {
        light.startService("test", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function () { path.push("error"); });
            test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
        });
    });

    it('should allow event subscription 4', function () {
        light.startService("test_error", function (test) {
            var path = [];
            test.error(function () { path.push("error"); });
            test();
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription 6', function () {
        light.startService("test_error", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function () { path.push("error"); });
            test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("error");
            expect(path[2]).toBe("after");
            expect(path.length).toBe(3);
        });
    });

    it('should run 1', function () {
        light.startService("sample2", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function (o) { path.push("error"); console.log(o); });
            var answer = test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
            expect(answer).toBe(6);
        });
    });

    it('should run 2', function () {
        light.startService("sample1", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function (o) { path.push("error"); console.log(o); });
            var answer = test({ x: 2, y: 3 });
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
            expect(answer).toBe(6);
        });
    });

    var testObj = {
        sample1: {
            type: undefined,
            service: function (arg) {
                return arg.x + arg.y;
            }
        }
    };
    it('native tests', function () {
        light(function () {
            light.advance.testService(testObj, function () {
                var test = this.sample2;
                var path = [];
                test.before(function () { path.push("before"); });
                test.after(function () { path.push("after"); });
                test.error(function (o) { path.push("error"); console.log(o); });
                var answer = test();
                expect(path[0]).toBe("before");
                expect(path[1]).toBe("after");
                expect(path.length).toBe(2);
                expect(answer).toBe(5);
            });
        });
    });

    it('native tests 2', function () {
        light(function () {
            light.advance.testService(testObj, function () {
                var test = this.sample2;
                var answer = test();
                expect(answer).toBe(5);
            });
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('native tests 2', function () {
        light.advance.testService(testObj, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('native tests pipes 1', function () {
        var testType1 = {
            sample1: {
                servicePipeCondition: function (definition) {
                    return typeof definition === "function";
                },
                servicePipe: function (definition) {
                    return definition;
                },
                //pipeName: "testType1",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 1', function () {
        var testType1 = {
            sample1: {
                servicePipeCondition: function (definition) {
                    return typeof definition === "function";
                },
                servicePipe: function (definition) {
                    return definition;
                },
                //pipeName: "testType1", CAN USE DEFAULT PIPE
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 2', function () {
        var testType1 = {
            sample1: {
                //servicePipeCondition: function (definition) {
                //    return typeof definition === "function";
                //},
                servicePipe: function (definition) {
                    return definition;
                },
                //pipeName: "testType2",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 3', function () {
        var testType1 = {
            sample1: {
                servicePipeCondition: function (definition) {
                    return typeof definition === "function";
                },
                //servicePipe: function (definition) {
                //    return definition;
                //},
                //pipeName: "testType3",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 4', function () {
        var testType1 = {
            sample1: {
                //servicePipeCondition: function (definition) {
                //    return typeof definition === "function";
                //},
                //servicePipe: function (definition) {
                //    return definition;
                //},
                //pipeName: "testType4",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });
    it('can use default function pipe 5', function () {
        var testType1 = {
            sample1: {
                servicePipeCondition: function (definition) {
                    return typeof definition === "function";
                },
                //servicePipe: function (definition) {
                //    return definition;
                //},
                //pipeName: "testType1",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 6', function () {
        var testType1 = {
            sample1: {
                servicePipe: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(15);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 7', function () {
        var testType1 = {
            sample1: {
                servicePipe: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(16);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 8', function () {
        var testType1 = {
            sample1: {
                servicePipe: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(16);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 9', function () {
        var testType1 = {
            sample1: {
                servicePipe: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(15);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 10', function () {
        var testType1 = {
            sample1: {
                servicePipeCondition: function (definition) {
                    return typeof definition === "string";
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(undefined);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 11', function () {
        var testType1 = {
            sample1: {
                servicePipeCondition: function (definition) {
                    return typeof definition === "string";
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(undefined);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });



    light.servicePipe("pipeRegular", function (definition) {
        return typeof definition === "function";
    }, function (definition) {
        return definition
    });

    light.servicePipe("pipeChange", function (definition) {
        return typeof definition === "function";
    }, function (definition) {
        return function (arg) {
           return definition(arg) + 10;
        };
    });

    light.servicePipe("pipeWrong", function (definition) {
        return typeof definition === "string";
    }, function (definition) {
        return definition() + 10;
    });

    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                pipeName:"pipeRegular"
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });


    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                pipeName: "pipeChange"
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(16);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });


    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                pipeName: "pipeWrong"
            }
        };

        light.advance.testService(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(undefined);
        });
        light(function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

});