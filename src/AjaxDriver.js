
(function () {

	'use strict';

	var
		$ = require('$'),

		Globals = require('./Globals.js'),
		Utils = require('./Utils.js')
	;

	/**
	 * @constructor
	 * @param {Jua} oJua
	 * @param {Object} oOptions
	 */
	function AjaxDriver(oJua, oOptions)
	{
		this.oXhrs = {};
		this.oUids = {};
		this.oJua = oJua;
		this.oOptions = oOptions;
	}

	/**
	 * @type {Object}
	 */
	AjaxDriver.prototype.oXhrs = {};

	/**
	 * @type {Object}
	 */
	AjaxDriver.prototype.oUids = {};

	/**
	 * @type {?Jua}
	 */
	AjaxDriver.prototype.oJua = null;

	/**
	 * @type {Object}
	 */
	AjaxDriver.prototype.oOptions = {};

	/**
	 * @return {boolean}
	 */
	AjaxDriver.prototype.isDragAndDropSupported = function ()
	{
		return true;
	};

	/**
	 * @param {string} sUid
	 */
	AjaxDriver.prototype.regTaskUid = function (sUid)
	{
		this.oUids[sUid] = true;
	};

	/**
	 * @param {string} sUid
	 * @param {?} oFileInfo
	 * @param {Function} fCallback
	 */
	AjaxDriver.prototype.uploadTask = function (sUid, oFileInfo, fCallback)
	{
		if (false === this.oUids[sUid] || !oFileInfo || !oFileInfo['File'])
		{
			fCallback(null, sUid);
			return false;
		}

		try
		{
			var
				self = this,
				oXhr = new XMLHttpRequest(),
				oFormData = new FormData(),
				sAction = Utils.getValue(this.oOptions, 'action', ''),
				aHidden = Utils.getValue(this.oOptions, 'hidden', {}),
				fStartFunction = this.oJua.getEvent('onStart'),
				fCompleteFunction = this.oJua.getEvent('onComplete'),
				fProgressFunction = this.oJua.getEvent('onProgress')
			;

			oXhr.open('POST', sAction, true);

			if (fProgressFunction && oXhr.upload)
			{
				oXhr.upload.onprogress = function (oEvent) {
					if (oEvent && oEvent.lengthComputable && !Utils.isUndefined(oEvent.loaded) && !Utils.isUndefined(oEvent.total))
					{
						fProgressFunction(sUid, oEvent.loaded, oEvent.total);
					}
				};
			}

			oXhr.onreadystatechange = function () {
				if (4 === oXhr.readyState && 200 === oXhr.status)
				{
					if (fCompleteFunction)
					{
						var
							bResult = false,
							oResult = null
						;

						try
						{
							oResult = $.parseJSON(oXhr.responseText);
							bResult = true;
						}
						catch (oException)
						{
							oResult = null;
						}

						fCompleteFunction(sUid, bResult, oResult);
					}

					if (!Utils.isUndefined(self.oXhrs[sUid]))
					{
						self.oXhrs[sUid] = null;
					}

					fCallback(null, sUid);
				}
				else
				{
					if (4 === oXhr.readyState)
					{
						fCompleteFunction(sUid, false, null);
						fCallback(null, sUid);
					}
				}
			};

			if (fStartFunction)
			{
				fStartFunction(sUid);
			}

			oFormData.append('jua-post-type', 'ajax');
			oFormData.append(Utils.getValue(this.oOptions, 'name', 'juaFile'), oFileInfo['File']);
			$.each(aHidden, function (sKey, sValue) {
				oFormData.append(sKey, Utils.getStringOrCallFunction(sValue, [oFileInfo]));
			});

			oXhr.send(oFormData);

			this.oXhrs[sUid] = oXhr;
			return true;
		}
		catch (oError)
		{
		}

		fCallback(null, sUid);
		return false;
	};

	AjaxDriver.prototype.generateNewInput = function (oClickElement)
	{
		var
			self = this,
			oLabel = null,
			oInput = null
		;

		if (oClickElement)
		{
			oInput = Utils.getNewInput('', !Utils.getValue(this.oOptions, 'disableMultiple', false));
			oLabel = Utils.createNextLabel();
			oLabel.append(oInput);

			$(oClickElement).append(oLabel);

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
							self.oJua.addNewFile(oFile);
							self.generateNewInput(oClickElement);

							setTimeout(function () {
								oLabel.remove();
							}, 10);
						},
						Utils.getValue(self.oOptions, 'multipleSizeLimit', Globals.iDefLimit),
						self.oJua.getEvent('onLimitReached')
					);
				})
			;
		}
	};

	AjaxDriver.prototype.cancel = function (sUid)
	{
		this.oUids[sUid] = false;
		if (this.oXhrs[sUid])
		{
			try
			{
				if (this.oXhrs[sUid].abort)
				{
					this.oXhrs[sUid].abort();
				}
			}
			catch (oError)
			{
			}

			this.oXhrs[sUid] = null;
		}
	};

	module.exports = AjaxDriver;

}());
