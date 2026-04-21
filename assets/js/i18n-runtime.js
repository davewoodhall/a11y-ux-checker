/**
 * Sprintf-style helper for localized audit strings (numbered %1$d and positional %s/%d).
 *
 * @package AdnA11yChecker
 */
(function (w) {
	'use strict';

	/**
	 * Replaces placeholders in a format string (matches WordPress gettext patterns).
	 *
	 * @param {string} format Format string.
	 * @param {...*} args Values for placeholders.
	 * @return {string}
	 */
	w.a11yUxSprintf = function (format) {
		var args = Array.prototype.slice.call(arguments, 1);
		var pos = 0;

		var str = String(format).replace(/%(\d+)\$([sd])/g, function (_, num) {
			var v = args[parseInt(num, 10) - 1];
			return v === undefined || v === null ? '' : String(v);
		});

		return str.replace(/%([sd])/g, function () {
			var v = args[pos];
			pos += 1;
			return v === undefined || v === null ? '' : String(v);
		});
	};
}(window));
