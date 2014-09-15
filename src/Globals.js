
(function () {

	'use strict';

	var Globals = {};

	Globals.iDefLimit = 20;

	Globals.bIsAjaxUploaderSupported = (function () {

		var
			window = require('window'),
			oInput = window.document.createElement('input')
		;

		oInput.type = 'file';
		return !!('XMLHttpRequest' in window && 'multiple' in oInput && 'FormData' in window && (new window.XMLHttpRequest()).upload && true);
	}());

	module.exports = Globals;

}());