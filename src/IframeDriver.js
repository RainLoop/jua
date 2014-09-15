
(function () {

	'use strict';

	var
		window = require('window'),
		$ = require('$'),

		Globals = require('./Globals.js'),
		Utils = require('./Utils.js')
	;
	
	/**
	 * @constructor
	 * @param {Jua} oJua
	 * @param {Object} oOptions
	 */
	function IframeDriver(oJua, oOptions)
	{
		this.oUids = {};
		this.oForms = {};
		this.oJua = oJua;
		this.oOptions = oOptions;
	}

	/**
	 * @type {Object}
	 */
	IframeDriver.prototype.oUids = {};

	/**
	 * @type {Object}
	 */
	IframeDriver.prototype.oForms = {};

	/**
	 * @type {?Jua}
	 */
	IframeDriver.prototype.oJua = null;

	/**
	 * @type {Object}
	 */
	IframeDriver.prototype.oOptions = {};

	/**
	 * @return {boolean}
	 */
	IframeDriver.prototype.isDragAndDropSupported = function ()
	{
		return false;
	};

	/**
	 * @param {string} sUid
	 */
	IframeDriver.prototype.regTaskUid = function (sUid)
	{
		this.oUids[sUid] = true;
	};

	/**
	 * @param {string} sUid
	 * @param {?} oFileInfo
	 * @param {Function} fCallback
	 */
	IframeDriver.prototype.uploadTask = function (sUid, oFileInfo, fCallback)
	{
		if (false === this.oUids[sUid])
		{
			fCallback(null, sUid);
			return false;
		}

		var
			oForm = this.oForms[sUid],
			aHidden = Utils.getValue(this.oOptions, 'hidden', {}),
			fStartFunction = this.oJua.getEvent('onStart'),
			fCompleteFunction = this.oJua.getEvent('onComplete')
		;

		if (oForm)
		{
			oForm.append($('<input type="hidden" />').attr('name', 'jua-post-type').val('iframe'));
			$.each(aHidden, function (sKey, sValue) {
				oForm.append($('<input type="hidden" />').attr('name', sKey).val(Utils.getStringOrCallFunction(sValue, [oFileInfo])));
			});

			oForm.trigger('submit');
			if (fStartFunction)
			{
				fStartFunction(sUid);
			}

			oForm.find('iframe').on('load', function () {

				var
					bResult = false,
					oIframeDoc = null,
					oResult = {}
				;

				if (fCompleteFunction)
				{
					try
					{
						oIframeDoc = this.contentDocument ? this.contentDocument: this.contentWindow.document;
						oResult = $.parseJSON(oIframeDoc.body.innerHTML);
						bResult = true;
					}
					catch (oErr)
					{
						oResult = {};
					}

					fCompleteFunction(sUid, bResult, oResult);
				}

				fCallback(null, sUid);

				window.setTimeout(function () {
					oForm.remove();
				}, 100);
			});
		}
		else
		{
			fCallback(null, sUid);
		}

		return true;
	};

	IframeDriver.prototype.generateNewInput = function (oClickElement)
	{
		var
			self = this,
			sUid = '',
			oInput = null,
			oIframe = null,
			sAction = Utils.getValue(this.oOptions, 'action', ''),
			oForm = null
		;

		if (oClickElement)
		{
			sUid = Utils.getNewUid();

			oInput = Utils.getNewInput(Utils.getValue(this.oOptions, 'name', 'juaFile'), !Utils.getValue(this.oOptions, 'disableMultiple', false));

			oForm = $('<form action="' + sAction + '" target="iframe-' + sUid + '" ' +
	' method="POST" enctype="multipart/form-data" style="display: block; cursor: pointer;"></form>');

			oIframe = $('<iframe name="iframe-' + sUid + '" tabindex="-1" src="javascript:void(0);" ' +
	' style="position: absolute; top: -1000px; left: -1000px; cursor: pointer;" />').css({'opacity': 0});

			oForm.append(Utils.createNextLabel().append(oInput)).append(oIframe);

			$(oClickElement).append(oForm);

			this.oForms[sUid] = oForm;

			oInput
				.on('click', function () {
					var fOn = self.oJua.getEvent('onDialog');
					if (fOn)
					{
						fOn();
					}
				})
				.on('change', function () {
					Utils.getDataFromInput(this, function (oFile) {
							if (oFile)
							{
								oForm.css({
									'position': 'absolute',
									'top': -1000,
									'left': -1000
								});

								self.oJua.addFile(sUid, oFile);
								self.generateNewInput(oClickElement);
							}

						},
						Utils.getValue(self.oOptions, 'multipleSizeLimit', Globals.iDefLimit),
						self.oJua.getEvent('onLimitReached')
					);
				})
			;
		}
	};

	IframeDriver.prototype.cancel = function (sUid)
	{
		this.oUids[sUid] = false;
		if (this.oForms[sUid])
		{
			this.oForms[sUid].remove();
			this.oForms[sUid] = false;
		}
	};

	module.exports = IframeDriver;

}());