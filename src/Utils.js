
(function () {

	'use strict';

	var
		Utils = {},

		window = require('window'),
		$ = require('$'),

		Globals = require('./Globals.js')
	;

	/**
	 * @param {*} mValue
	 * @return {boolean}
	 */
	Utils.isUndefined = function (mValue)
	{
		return 'undefined' === typeof mValue;
	};

	/**
	 * @param {Object} mObjectFirst
	 * @param {Object=} mObjectSecond
	 * @return {Object}
	 */
	Utils.extend = function (mObjectFirst, mObjectSecond)
	{
		if (mObjectSecond)
		{
			for (var sProp in mObjectSecond)
			{
				if (mObjectSecond.hasOwnProperty(sProp))
				{
					mObjectFirst[sProp] = mObjectSecond[sProp];
				}
			}
		}

		return mObjectFirst;
	};

	/**
	 * @param {*} oParent
	 * @param {*} oDescendant
	 *
	 * @return {boolean}
	 */
	Utils.contains = function (oParent, oDescendant)
	{
		var bResult = false;
		if (oParent && oDescendant)
		{
			if (oParent === oDescendant)
			{
				bResult = true;
			}
			else if (oParent.contains)
			{
				bResult = oParent.contains(oDescendant);
			}
			else
			{
				/*jshint bitwise: false*/
				bResult = oDescendant.compareDocumentPosition ?
					!!(oDescendant.compareDocumentPosition(oParent) & 8) : false;
				/*jshint bitwise: true*/
			}
		}

		return bResult;
	};

	Utils.mainClearTimeout = function(iTimer)
	{
		if (0 < iTimer)
		{
			clearTimeout(iTimer);
		}

		iTimer = 0;
	};

	/**
	 * @param {Event} oEvent
	 * @return {?Event}
	 */
	Utils.getEvent = function(oEvent)
	{
		oEvent = (oEvent && (oEvent.originalEvent ?
			oEvent.originalEvent : oEvent)) || window.event;

		return oEvent.dataTransfer ? oEvent : null;
	};

	/**
	 * @param {Object} oValues
	 * @param {string} sKey
	 * @param {?} mDefault
	 * @return {?}
	 */
	Utils.getValue = function (oValues, sKey, mDefault)
	{
		return (!oValues || !sKey || Utils.isUndefined(oValues[sKey])) ? mDefault : oValues[sKey];
	};

	/**
	 * @param {Object} oOwner
	 * @param {string} sPublicName
	 * @param {*} mObject
	 */
	Utils.setValue = function(oOwner, sPublicName, mObject)
	{
		oOwner[sPublicName] = mObject;
	};

	/**
	 * @param {*} aData
	 * @return {boolean}
	 */
	Utils.isNonEmptyArray = function (aData)
	{
		return aData && aData.length && 0 < aData.length ? true : false;
	};

	/**
	 * @param {*} mValue
	 * @return {number}
	 */
	Utils.pInt = function (mValue)
	{
		return parseInt(mValue || 0, 10);
	};

	/**
	 * @param {Function} fFunction
	 * @param {Object=} oScope
	 * @return {Function}
	 */
	Utils.scopeBind = function (fFunction, oScope)
	{
		return function () {
			return fFunction.apply(Utils.isUndefined(oScope) ? null : oScope,
				Array.prototype.slice.call(arguments));
		};
	};

	/**
	 * @param {number=} iLen
	 * @return {string}
	 */
	Utils.fakeMd5 = function (iLen)
	{
		var
			sResult = '',
			sLine = '0123456789abcdefghijklmnopqrstuvwxyz'
		;

		iLen = Utils.isUndefined(iLen) ? 32 : Utils.pInt(iLen);

		while (sResult.length < iLen)
		{
			sResult += sLine.substr(window.Math.round(window.Math.random() * sLine.length), 1);
		}

		return sResult;
	};

	/**
	 * @return {string}
	 */
	Utils.getNewUid = function ()
	{
		return 'jua-uid-' + Utils.fakeMd5(16) + '-' + (new window.Date()).getTime().toString();
	};

	/**
	 * @param {*} oFile
	 * @return {Object}
	 */
	Utils.getDataFromFile = function (oFile)
	{
		var
			sFileName = Utils.isUndefined(oFile.fileName) ? (Utils.isUndefined(oFile.name) ? null : oFile.name) : oFile.fileName,
			iSize = Utils.isUndefined(oFile.fileSize) ? (Utils.isUndefined(oFile.size) ? null : oFile.size) : oFile.fileSize,
			sType = Utils.isUndefined(oFile.type) ? null : oFile.type
		;

		if (sFileName.charAt(0) === '/')
		{
			sFileName = sFileName.substr(1);
		}

		if ('' === sType && 0 === iSize)
		{
			return null; // Folder
		}

		return {
			'FileName': sFileName,
			'Size': iSize,
			'Type': sType,
			'Folder': '',
			'File' : oFile
		};
	};

	/**
	 * @param {*} aItems
	 * @param {Function} fFileCallback
	 * @param {number=} iLimit = 20
	 * @param {Function=} fLimitCallback
	 */
	Utils.getDataFromFiles = function (aItems, fFileCallback, iLimit, fLimitCallback)
	{
		var
			iInputLimit = 0,
			iLen = 0,
			iIndex = 0,
			oItem = null,
			oFile = null,
			bUseLimit = false,
			bCallLimit = false
		;

		iLimit = Utils.isUndefined(iLimit) ? Globals.iDefLimit : Utils.pInt(iLimit);
		iInputLimit = iLimit;
		bUseLimit = 0 < iLimit;

		aItems = aItems && 0 < aItems.length ? aItems : null;
		if (aItems)
		{
			for (iIndex = 0, iLen = aItems.length; iIndex < iLen; iIndex++)
			{
				oItem = aItems[iIndex];
				if (oItem)
				{
					if (!bUseLimit || 0 <= --iLimit)
					{
						oFile = Utils.getDataFromFile(oItem);
						if (oFile)
						{
							fFileCallback(oFile);
						}
					}
					else if (bUseLimit && !bCallLimit)
					{
						if (0 > iLimit && fLimitCallback)
						{
							bCallLimit = true;
							fLimitCallback(iInputLimit);
						}
					}
				}
			}
		}
	};

	/**
	 * @param {*} oInput
	 * @param {Function} fFileCallback
	 * @param {number=} iLimit = 20
	 * @param {Function=} fLimitCallback
	 */
	Utils.getDataFromInput = function (oInput, fFileCallback, iLimit, fLimitCallback)
	{
		var aFiles = oInput && oInput.files && 0 < oInput.files.length ? oInput.files : null;
		if (aFiles)
		{
			Utils.getDataFromFiles(aFiles, fFileCallback, iLimit, fLimitCallback);
		}
		else
		{
			fFileCallback({
				'FileName': oInput.value.split('\\').pop().split('/').pop(),
				'Size': null,
				'Type': null,
				'Folder': '',
				'File' : null
			});
		}
	};

	Utils.eventContainsFiles = function (oEvent)
	{
		var bResult = false;
		if (oEvent && oEvent.dataTransfer && oEvent.dataTransfer.types && oEvent.dataTransfer.types.length)
		{
			var
				iIindex = 0,
				iLen = oEvent.dataTransfer.types.length
			;

			for (; iIindex < iLen; iIindex++)
			{
				if (oEvent.dataTransfer.types[iIindex].toLowerCase() === 'files')
				{
					bResult = true;
					break;
				}
			}
		}

		return bResult;
	};

	/**
	 * @param {Event} oEvent
	 * @param {Function} fFileCallback
	 * @param {number=} iLimit = 20
	 * @param {Function=} fLimitCallback
	 */
	Utils.getDataFromDragEvent = function (oEvent, fFileCallback, iLimit, fLimitCallback)
	{
		var aFiles = null;

		oEvent = Utils.getEvent(oEvent);
		if (oEvent && Utils.eventContainsFiles(oEvent))
		{
			aFiles = (Utils.getValue(oEvent, 'files', null) || (oEvent.dataTransfer ?
				Utils.getValue(oEvent.dataTransfer, 'files', null) : null));

			if (aFiles && 0 < aFiles.length)
			{
				Utils.getDataFromFiles(aFiles, fFileCallback, iLimit, fLimitCallback);
			}
		}
	};

	Utils.createNextLabel = function ()
	{
		return $('<label style="' +
	'position: absolute; background-color:#fff; right: 0px; top: 0px; left: 0px; bottom: 0px; margin: 0px; padding: 0px; cursor: pointer;' +
		'"></label>').css({
			'opacity': 0
		});
	};

	Utils.createNextInput = function ()
	{
		return $('<input type="file" tabindex="-1" hidefocus="hidefocus" style="position: absolute; left: -9999px;" />');
	};

	/**
	 * @param {string=} sName
	 * @param {boolean=} bMultiple = true
	 * @return {?Object}
	 */
	Utils.getNewInput = function (sName, bMultiple)
	{
		sName = Utils.isUndefined(sName) ? '' : sName.toString();

		var oLocal = Utils.createNextInput();
		if (0 < sName.length)
		{
			oLocal.attr('name', sName);
		}

		if (Utils.isUndefined(bMultiple) ? true : bMultiple)
		{
			oLocal.prop('multiple', true);
		}

		return oLocal;
	};

	/**
	 * @param {?} mStringOrFunction
	 * @param {Array=} aFunctionParams
	 * @return {string}
	 */
	Utils.getStringOrCallFunction = function (mStringOrFunction, aFunctionParams)
	{
		return $.isFunction(mStringOrFunction) ?
			mStringOrFunction.apply(null, $.isArray(aFunctionParams) ? aFunctionParams : []).toString() :
			mStringOrFunction.toString();
	};

	module.exports = Utils;

}());