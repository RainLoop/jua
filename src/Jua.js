
(function () {

	'use strict';

	var
		Utils = require('./Utils.js'),
		Globals = require('./Globals.js')
	;

	/**
	 * @constructor
	 * @param {Object=} oOptions
	 */
	function Jua(oOptions)
	{
		oOptions = Utils.isUndefined(oOptions) ? {} : oOptions;

		var
			self = this,

			Driver = null,

			window = require('window'),
			$ = require('$'),

			queue = require('queue')
		;

		self.bEnableDnD = true;

		self.oEvents = {
			'onDialog': null,
			'onSelect': null,
			'onStart': null,
			'onComplete': null,
			'onCompleteAll': null,
			'onProgress': null,
			'onDragEnter': null,
			'onDragLeave': null,
			'onDrop': null,
			'onBodyDragEnter': null,
			'onBodyDragLeave': null,
			'onLimitReached': null
		};

		self.oOptions = Utils.extend({
			'action': '',
			'name': '',
			'hidden': {},
			'queueSize': 10,
			'clickElement': false,
			'dragAndDropElement': false,
			'dragAndDropBodyElement': false,
			'disableAjaxUpload': false,
			'disableDragAndDrop': false,
			'disableMultiple': false,
			'disableDocumentDropPrevent': false,
			'multipleSizeLimit': 50
		}, oOptions);

		self.oQueue = queue(Utils.pInt(Utils.getValue(self.oOptions, 'queueSize', 10)));
		if (self.runEvent('onCompleteAll'))
		{
			self.oQueue.await(function () {
				self.runEvent('onCompleteAll');
			});
		}

		Driver = (self.isAjaxUploaderSupported() && !Utils.getValue(self.oOptions, 'disableAjaxUpload', false) ?
			require('./AjaxDriver.js') : require('./IframeDriver.js'));

		self.oDriver = new Driver(self, self.oOptions);

		self.oClickElement = Utils.getValue(self.oOptions, 'clickElement', null);

		if (self.oClickElement)
		{
			$(self.oClickElement).css({
				'position': 'relative',
				'overflow': 'hidden'
			});

			if ('inline' === $(this.oClickElement).css('display'))
			{
				$(this.oClickElement).css('display', 'inline-block');
			}

			this.oDriver.generateNewInput(this.oClickElement);
		}

		if (this.oDriver.isDragAndDropSupported() && Utils.getValue(this.oOptions, 'dragAndDropElement', false) &&
			!Utils.getValue(this.oOptions, 'disableAjaxUpload', false))
		{
			(function (self) {
				var
					$doc = $(window.document),
					oBigDropZone = $(Utils.getValue(self.oOptions, 'dragAndDropBodyElement', false) || $doc),
					oDragAndDropElement = Utils.getValue(self.oOptions, 'dragAndDropElement', false),
					fHandleDragOver = function (oEvent) {
						if (self.bEnableDnD && oEvent)
						{
							oEvent = Utils.getEvent(oEvent);
							if (oEvent && oEvent.dataTransfer && Utils.eventContainsFiles(oEvent))
							{
								try
								{
									var sEffect = oEvent.dataTransfer.effectAllowed;

									Utils.mainClearTimeout(self.iDocTimer);

									oEvent.dataTransfer.dropEffect = (sEffect === 'move' || sEffect === 'linkMove') ? 'move' : 'copy';

									oEvent.stopPropagation();
									oEvent.preventDefault();

									oBigDropZone.trigger('dragover', oEvent);
								}
								catch (oExc) {}
							}
						}
					},
					fHandleDrop = function (oEvent) {
						if (self.bEnableDnD && oEvent)
						{
							oEvent = Utils.getEvent(oEvent);
							if (oEvent && Utils.eventContainsFiles(oEvent))
							{
								oEvent.preventDefault();

								Utils.getDataFromDragEvent(oEvent, function (oFile) {
										if (oFile)
										{
											self.runEvent('onDrop', [oFile, oEvent]);
											self.addNewFile(oFile);
											Utils.mainClearTimeout(self.iDocTimer);
										}
									},
									Utils.getValue(self.oOptions, 'multipleSizeLimit', Globals.iDefLimit),
									self.getEvent('onLimitReached')
								);
							}
						}

						self.runEvent('onDragLeave', [oEvent]);
					},
					fHandleDragEnter = function (oEvent) {
						if (self.bEnableDnD && oEvent)
						{
							oEvent = Utils.getEvent(oEvent);
							if (oEvent && Utils.eventContainsFiles(oEvent))
							{
								Utils.mainClearTimeout(self.iDocTimer);

								oEvent.preventDefault();
								self.runEvent('onDragEnter', [oDragAndDropElement, oEvent]);
							}
						}
					},
					fHandleDragLeave = function (oEvent) {
						if (self.bEnableDnD && oEvent)
						{
							oEvent = Utils.getEvent(oEvent);
							if (oEvent)
							{
								var oRelatedTarget = window.document['elementFromPoint'] ? window.document['elementFromPoint'](oEvent['clientX'], oEvent['clientY']) : null;
								if (oRelatedTarget && Utils.contains(this, oRelatedTarget))
								{
									return;
								}

								Utils.mainClearTimeout(self.iDocTimer);
								self.runEvent('onDragLeave', [oDragAndDropElement, oEvent]);
							}

							return;
						}
					}
				;

				if (oDragAndDropElement)
				{
					if (!Utils.getValue(self.oOptions, 'disableDocumentDropPrevent', false))
					{
						$doc.on('dragover', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								oEvent = Utils.getEvent(oEvent);
								if (oEvent && oEvent.dataTransfer && Utils.eventContainsFiles(oEvent))
								{
									try
									{
										oEvent.dataTransfer.dropEffect = 'none';
										oEvent.preventDefault();
									}
									catch (oExc) {}
								}
							}
						});
					}

					if (oBigDropZone && oBigDropZone[0])
					{
						oBigDropZone
							.on('dragover', function (oEvent) {
								if (self.bEnableDnD && oEvent)
								{
									Utils.mainClearTimeout(self.iDocTimer);
								}
							})
							.on('dragenter', function (oEvent) {
								if (self.bEnableDnD && oEvent)
								{
									oEvent = Utils.getEvent(oEvent);
									if (oEvent && Utils.eventContainsFiles(oEvent))
									{
										Utils.mainClearTimeout(self.iDocTimer);
										oEvent.preventDefault();

										self.runEvent('onBodyDragEnter', [oEvent]);
									}
								}
							})
							.on('dragleave', function (oEvent) {
								if (self.bEnableDnD && oEvent)
								{
									oEvent = Utils.getEvent(oEvent);
									if (oEvent)
									{
										Utils.mainClearTimeout(self.iDocTimer);
										self.iDocTimer = setTimeout(function () {
											self.runEvent('onBodyDragLeave', [oEvent]);
										}, 200);
									}
								}
							})
							.on('drop', function (oEvent) {
								if (self.bEnableDnD && oEvent)
								{
									oEvent = Utils.getEvent(oEvent);
									if (oEvent)
									{
										var bFiles = Utils.eventContainsFiles(oEvent);
										if (bFiles)
										{
											oEvent.preventDefault();
										}

										self.runEvent('onBodyDragLeave', [oEvent]);

										return !bFiles;
									}
								}

								return false;
							})
						;
					}

					$(oDragAndDropElement)
						.bind('dragenter', fHandleDragEnter)
						.bind('dragover', fHandleDragOver)
						.bind('dragleave', fHandleDragLeave)
						.bind('drop', fHandleDrop)
					;
				}

			}(self));
		}
		else
		{
			self.bEnableDnD = false;
		}

		Utils.setValue(self, 'on', self.on);
		Utils.setValue(self, 'cancel', self.cancel);
		Utils.setValue(self, 'isDragAndDropSupported', self.isDragAndDropSupported);
		Utils.setValue(self, 'isAjaxUploaderSupported', self.isAjaxUploaderSupported);
		Utils.setValue(self, 'setDragAndDropEnabledStatus', self.setDragAndDropEnabledStatus);
	}

	/**
	 * @type {boolean}
	 */
	Jua.prototype.bEnableDnD = true;

	/**
	 * @type {number}
	 */
	Jua.prototype.iDocTimer = 0;

	/**
	 * @type {Object}
	 */
	Jua.prototype.oOptions = {};

	/**
	 * @type {Object}
	 */
	Jua.prototype.oEvents = {};

	/**
	 * @type {?Object}
	 */
	Jua.prototype.oQueue = null;

	/**
	 * @type {?Object}
	 */
	Jua.prototype.oDriver = null;

	/**
	 * @param {string} sName
	 * @param {Function} fFunc
	 */
	Jua.prototype.on = function (sName, fFunc)
	{
		this.oEvents[sName] = fFunc;
		return this;
	};

	/**
	 * @param {string} sName
	 * @param {string=} aArgs
	 */
	Jua.prototype.runEvent = function (sName, aArgs)
	{
		if (this.oEvents[sName])
		{
			this.oEvents[sName].apply(null, aArgs || []);
		}
	};

	/**
	 * @param {string} sName
	 */
	Jua.prototype.getEvent = function (sName)
	{
		return this.oEvents[sName] || null;
	};

	/**
	 * @param {string} sUid
	 */
	Jua.prototype.cancel = function (sUid)
	{
		this.oDriver.cancel(sUid);
	};

	/**
	 * @return {boolean}
	 */
	Jua.prototype.isAjaxUploaderSupported = function ()
	{
		return Globals.bIsAjaxUploaderSupported;
	};

	/**
	 * @param {boolean} bEnabled
	 */
	Jua.prototype.setDragAndDropEnabledStatus = function (bEnabled)
	{
		this.bEnableDnD = !!bEnabled;
	};

	/**
	 * @return {boolean}
	 */
	Jua.prototype.isDragAndDropSupported = function ()
	{
		return this.oDriver.isDragAndDropSupported();
	};

	/**
	 * @param {Object} oFileInfo
	 */
	Jua.prototype.addNewFile = function (oFileInfo)
	{
		this.addFile(Utils.getNewUid(), oFileInfo);
	};

	/**
	 * @param {string} sUid
	 * @param {Object} oFileInfo
	 */
	Jua.prototype.addFile = function (sUid, oFileInfo)
	{
		var fOnSelect = this.getEvent('onSelect');
		if (oFileInfo && (!fOnSelect || (false !== fOnSelect(sUid, oFileInfo))))
		{
			this.oDriver.regTaskUid(sUid);
			this.oQueue.defer(Utils.scopeBind(this.oDriver.uploadTask, this.oDriver), sUid, oFileInfo);
		}
		else
		{
			this.oDriver.cancel(sUid);
		}
	};

	module.exports = Jua;

}());
