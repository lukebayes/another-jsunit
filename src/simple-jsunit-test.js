
// Test the provided assertions and their
// respective failures
var AssertionTest = TestCase.extend({
	
	testPassingTest: function() {
		this.assertTrue(true);
	},

	testFailingTest: function() {
		try {
			this.assertTrue(false, 'SomeMessage');
		}
		catch(e) {
			this.assertTrue(e instanceof AssertionFailure, 'Expected an AssertionFailure');
		}
	},
	
	testAssertEquals: function() {
		this.assertEquals('a', 'a');
	},
	
	testAssertEqualsFailure: function() {
		try {
			this.assertEquals('a', 'b');
		}
		catch(e) {
			if(e instanceof AssertionFailure) {
				this.assertTrue(e.message.indexOf("Expected 'a' but was 'b'") > -1);
			}
		}
	},
	
	testAssertSame: function() {
		var a = {};
		var b = a;
		this.assertSame(a, b);
	},
	
	testAssertException: function() {
		this.assertException(function() {
			throw "SomeFailure";
		});
	},
	
	testAssertExceptionWithMessage: function() {
		var message = "CustomMessage";
		try {
			this.assertException(function() {
			}, message);
		}
		catch(e) {
			if(e instanceof AssertionFailure) {
				if(e.toString().indexOf(message) == -1) {
					throw new AssertionFailure("Custom message was not forwarded properly with expected exception");
				}
			}
		}
	}
});

// One should be able to call addAsync when
// asynchronous events will be trigerred in their
// application. This will pause test execution
// until either that handler is called, or the timeout
// expires (default 1 second).
var AsyncMethodTest = TestCase.extend({
	testSomething: function() {
		var timeout = 0;
		var startTime = new Date();
		var handler = function() {
			var duration = new Date() - startTime;
			this.assertTrue(true, 'ExpectedFailure');
		}
		setTimeout(this.addAsync(handler), timeout);
	}
});

// We can call addAsync in the setUp method
// and/or in actual test methods.
var AsyncSetUpTest = TestCase.extend({
	setUp: function() {
		this.timeout = 0;
		var self = this;
		var startTime = new Date();
		var handler = function() {
			self.duration = new Date - startTime;
		}
		setTimeout(this.addAsync(handler), this.timeout);
	},
	
	testSomething: function() {
		this.assertTrue(this.duration >= this.timeout, 'Duration ' + this.duration + ' should be greater than or equal to timeout');
	}
});

// One should be able to call addAsync as many times
// as they like, and test execution should remain
// paused until the last async handler is triggered.
var AsyncMultiMethodTest = TestCase.extend({
	testSomething: function() {
		var timeout = 0;
		var startTime = new Date();
		var handler = function() {
			var duration = new Date() - startTime;
			this.assertTrue(true, 'ExpectedFailure');
		}
		setTimeout(this.addAsync(handler), timeout);
		setTimeout(this.addAsync(handler), timeout);
		setTimeout(this.addAsync(handler), timeout);
	}
});
