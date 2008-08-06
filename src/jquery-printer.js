/////////////////////////////////////

var JQueryPrinter = TestPrinter.extend({
	init: function(selector) {
		this._super();
		this.selector = selector;
		this.configureOutput(selector);
		this.startTime = new Date();
	},
	
	configureOutput: function(selector) {
		$(selector).css('text-align', 'left');
		$(selector).append("<div id='test-status' class='succeeded'></div>");
		$(selector).append("<div id='test-header'>Unit Test Results:</div>");
		//$(selector).append("<div id='test-header'>Unit Test Results &nbsp;&nbsp;&nbsp; <img id='spinner' src='/images/util/spinner12.gif' /></div>");
		$(selector).append("<div id='test-successes'></div>");
		$(selector).append("<div id='test-summary'></div>");
		$(selector).append("<div id='test-failures'><ol></ol></div>");
		$(selector).append("<div id='test-errors'><ol></ol></div>");
		$(selector).append("<div id='test-all-tests'><ol></ol></div>");
		
		this.successOutput = $(selector + ' #test-successes');
		this.failureOutput = $(selector + ' #test-failures ol');
		this.errorOutput = $(selector + ' #test-errors ol');
		this.allTestsOutput = $(selector + ' #test-all-tests ol');
	},

	addSuccess: function(success) {
		this._super(success);
		this.printSuccess(success);
	},
	
	printTestComplete: function() {
		this.allTestsOutput.append("<li class='test-case test-complete'>" + this.currentTest + " Completed</li>");
	},

	printSuccess: function(success) {
		this.successOutput.text(this.successOutput.text() + '.');
	},
	
	printFailure: function(failure) {
		this.failureOutput.append(this.failureLinePrinter(failure));
	},
	
	failureLinePrinter: function(failure) {
		return "<li class='failure'><strong>[FAILURE] " + failure.testCase + "." + failure.name + ":</strong><br /> " + failure.error + "</li>";
	},
	
	failureOrErrorEncountered: function() {
		var status = $('#test-status');
		status.removeClass('succeeded');
		status.addClass('failed');
	},
	
	printError: function(error) {
		this.errorOutput.append(this.errorLinePrinter(error));
	},
	
	errorLinePrinter: function(error) {
		return "<li class='error'><strong>[ERROR] " + error.testCase + "." + error.name + ":</strong><br />" + error.error + "</li>";
	},

	printSummary: function(error) {
		var duration = new Date() - this.startTime;
		var summary = "Executed " + this.assertions + " assertions in " + this.timeSummary(duration);
		$('#test-summary').text(summary);
		//$('#spinner').hide();
	},
	
	timeSummary: function(duration) {
		if(duration > 1000) {
			return (duration / 1000) + " seconds";
		}
		else {
			return duration + " milliseconds";
		}
	}
});

