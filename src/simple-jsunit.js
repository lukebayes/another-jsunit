/////////////////////////////////////
// Simple Inheritance from John Resig
// Inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/

(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();

/////////////////////////////////////
// Exception that should be thrown by failed assertions

var AssertionFailure = Class.extend({
	init: function(message) {
		this.message = message;
	},
	
	toString: function() {
		return this.message;
	}
});

/////////////////////////////////////
// Base class for all TestCases
// TODO: Should add more helpful assertions 
// to this class.

var Assert = Class.extend({
	processArguments: function(args, expected) {
		this.printer.incrementAssertions();
		
		var result = {};
		if(args.length == 0) {
			fail('[FAILURE] Invalid Arguments for assertion');
		}
		if(args.length == 1) {
			result = { slot1:args[0] };
		}
		if(args.length == 2) {
			result = { slot1:args[0], slot2:args[1] };
		}
		if(args.length == 3) {
			result = { slot1:args[0], slot2:args[1], slot3:args[2] };
		}
		if(args.length > expected) {
			result.message = args[args.length-1];
		}
		return result;
	},

	assertTrue: function() {
		var args = this.processArguments(arguments, 1);
		if(args.slot1 != true) {
			this.fail("Expected true", args);
		}
	},

	assertEquals: function() {
		var args = this.processArguments(arguments, 2);
		if(args.slot1 != args.slot2) {
			this.fail("Expected '" + args.slot1 + "' but was '" + args.slot2 + "'\n", args);
		}
	},
	
	assertSame: function() {
		var args = this.processArguments(arguments, 2);
		if(args.slot1 !== args.slot2) {
			this.fail("Expected [" + args.slot1 + "] to be the same as [" + args.slot2 + "]\n", args);
		}
	},
	
	assertException: function() {
		var args = this.processArguments(arguments, 1);
		try {
			if(args.slot1 instanceof Function) {
				args.slot1.apply(this);
				this.fail("assertFailure expected an exception. ", args);
			}
			else {
				this.fail("assertFailure expected a function. ", args);
			}
		}
		catch(e) {
			if(e instanceof AssertionFailure) {
				throw e;
			}
		}
	},

	fail: function(msg, args) {
		if(args.message != null) {
			msg += ": '" + args.message + "'";
		}
		throw new AssertionFailure(msg);
	}
});

/////////////////////////////////////
// All tests should ultimately
// extend this base class.
// 
// Subclasses of TestCase should end with 'Test'
// and the following actions will be performed:
// for each method that begins with 'test', 
// the setUp function will be called,
// then the test method,
// then tearDown.
var TestCase = Assert.extend({
	init: function() {
		this.asyncTimeout = TestCase.DEFAULT_TIMEOUT;
		this.testName = null; // Set from Runner
		this.hasRunSetUp = false;
		this.hasRunMethod = false;
		this.currentMethodName = null;
		this.currentMethod = null;
		this.currentCompleteHandler = null;
		this.testMethods = [];
		this.asyncHandlerCount = 0;
		for(var i in this) {
			if(this[i] instanceof Function && i.indexOf('test') == 0) {
				this.testMethods.push( { name: i, method:this[i] } );
			}
		}
	},

	run: function(completeHandler) {
		if(completeHandler != null) {
			this.currentCompleteHandler = completeHandler
			this.runNextMethod();
		}
	},
	
	runCompleted: function() {
		this.currentCompleteHandler.apply();
	},
	
	runNextMethod: function() {
		var tests = this.testMethods;
		if(tests.length > 0) {
			var test = tests.shift();
			this.runMethod(test.name, test.method);
		}
		else {
			this.runCompleted();
		}
	},
	
	runMethod: function(methodName, method) {
		this.currentMethodName = methodName;
		this.currentMethod = method;

		try {
			if(this.runSetUpAndContinue()) {
				if(!this.hasRunMethod) {
					this.hasRunMethod = true;
					method.apply(this);
					this.printer.addSuccess( { name:methodName } );
				}
			}
		}
		catch(e) {
			this.processFailure(methodName, e);
		}
		finally {
			if(!this.shouldBlockForAsync()) {
				this.runTearDown();
				this.runNextMethod();
			}
		}
	},
	
	shouldBlockForAsync: function() {
		return (this.asyncHandlerCount > 0);
	},
	
	runSetUpAndContinue: function() {
		if(this.hasRunSetUp) {
			return true;
		}
		else {
			this.hasRunSetUp = true;
			this.setUp();
		}
		return !this.shouldBlockForAsync();
	},
	
	runTearDown: function() {
		this.hasRunSetUp = false;
		this.hasRunMethod = false;
		this.tearDown();
	},
	
	addAsync: function(callback) {
		this.asyncHandlerCount++;
		var self = this;
		var isActive = true;
		
		var completeHandler = function() {
			self.asyncHandlerCount--;
			if(!self.shouldBlockForAsync()) {
				self.runMethod(self.currentMethodName, self.currentMethod);
			}
		}
		
		var failureHandler = function(e) {
			self.processFailure(self.currentMethodName, e);
		}
		
		var timeoutHandler = function() {
			isActive = false;
			failureHandler("addAsync timeout (of " + (self.asyncTimeout/1000) + " seconds) expired!");
			completeHandler();
		}

		var timeoutId = setTimeout(timeoutHandler, this.asyncTimeout);

		var closure = function() {
			if(!isActive) {
				return;
			}
			clearTimeout(timeoutId);
			try {
				callback.apply(this, arguments);
			}
			catch(e) {
				failureHandler(e);
			}
			completeHandler();
		}
		return function() {
			closure.call(self, arguments);
		}
	},

	processFailure: function(methodName, error) {
		if(error instanceof AssertionFailure) {
			this.printer.addFailure( { name:methodName, error:error } );
		}
		else {
			this.printer.addError( { name:methodName, error:error } );
		}
	},

	setUp: function() {
	},

	tearDown: function() {
	},
	
	toString: function() {
		return "[" + this.testName + "]";
	}
});

TestCase.DEFAULT_TIMEOUT = 3000; // In milliseconds

/////////////////////////////////////
// The TestRunner is expected to execute all of your 
// provided TestCases.
// it is usually used as follows:
// var runner = new TestRunner();
// runner.addTestCase(SomeTest);
// runner.start();
//
var TestRunner = Class.extend({
	init: function(printer) {
		this.pendingTests = [];
		this.printer = (printer != null) ? printer : new TestPrinter();
	},

	addTestCase: function(test) {
		this.pendingTests.push(test);
	},

	start: function(testConstructor) {
		if(testConstructor != null) { this.addTestCase(testConstructor); }
		this.run();
	},

	run: function() {
		var test;
		if(this.pendingTests.length > 0) {
			this.runTestCase(this.pendingTests.shift());
		}
		else {
			this.printer.print();
		}
	},

	runTestCase: function(testConstructor) {
		var self = this;
		this.printer.run(testConstructor, function() {
			self.run();
		});
	}
});

/////////////////////////////////////
// AllTestsRunner, finds any Functions
// in the global scope that end with 'Test'
// and runs them as TestCases
var AllTestsRunner = TestRunner.extend({

	init: function(printer) {
		this._super(printer);
	},

	start: function(testConstructor) {
		var self = this;

		var search = function() {
			var testCases = [];
			var target = this;
			// Discover Constructors with the right name
			for(var i in target) {
				if(target[i] instanceof Function && i.indexOf('Test') == (i.length - 4)) {
					testCases.push( { name:i, func:target[i] } );
				}
			}
			// Alphabetize the discovered TestCases
			testCases.sort(function(a,b) {
				if(a.name > b.name) {
					return 1;
				}
			});
			var len = testCases.length;
			for(var i = 0; i < len; i++) {
				self.addTestCase(testCases[i].func);
			}
		}

		search.call();
		this._super(testConstructor);
	}
});

/////////////////////////////////////
// TestPrinter should be extended and results
// should be output using whatever mechanism
// is used in your context. 
var TestPrinter = Class.extend( {
	init: function() {
		this.currentTest = null;
		this.successes = [];
		this.failures = [];
		this.errors = [];
		this.assertions = 0;
	},
	
	incrementAssertions: function() {
		this.assertions++;
	},
	
	addSuccess: function(success) {
		success.testCase = this.currentTest;
		this.successes.push(success);
	},
	
	addFailure: function(failure) {
		failure.testCase = this.currentTest;
		this.failures.push(failure);
		this.failureOrErrorEncountered();
	},
	
	addError: function(error) {
		error.testCase = this.currentTest;
		this.errors.push(error);
		this.failureOrErrorEncountered();
	},
	
	setCurrentTestName: function(testConst) {
		var name = 'UnknownTestCase';
		var getClassFromGlobals = function() {
			for(var i in this) {
				if(this[i] == testConst) {
					name = i;
					return;
				}
			}
		}
		getClassFromGlobals();
		this.currentTest = name;
	},
	
	run: function(testConstructor, completeHandler) {
		this.setCurrentTestName(testConstructor);
		var test = new testConstructor();
		test.testName = this.currentTest;
		test.printer = this;
		var self = this;
		test.run(function() {
			self.printTestComplete();
			completeHandler();
		});
	},
	
	failureOrErrorEncountered: function() {
	},
	
	printTestComplete: function() {
	},
	
	printSuccess: function(success) {
	},
	
	printFailure: function(failure) {
	},
	
	printError: function(error) {
	},
	
	printSummary: function(error) {
	},
	
	print: function() {
		var len = this.failures.length;
		for(var i = 0; i < len; i++) {
			this.printFailure(this.failures[i]);
		}

		var len = this.errors.length;
		for(var i = 0; i < len; i++) {
			this.printError(this.errors[i]);
		}
		this.printSummary();
	}
	
});

/////////////////////////////////////

