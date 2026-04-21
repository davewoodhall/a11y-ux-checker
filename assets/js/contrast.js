(function ($) {

	$.fn.a11yContrastReport = function (options) {

		var settings = $.extend({
			level: 'AA',
			ignore: '',
			ignoreDescendants: false,
			log: true
		}, options);

		var thresholds = {
			A: { normal: 3, large: 2 },
			AA: { normal: 4.5, large: 3 },
			AAA: { normal: 7, large: 4.5 }
		};

		var current = thresholds[settings.level] || thresholds.AA;

		// -------------------------
		// CORE COLOR UTILS
		// -------------------------
		function getRGB(color) {
			if (!color) {
				return [0, 0, 0];
			}
			var match = color.match(/\d+(\.\d+)?/g);
			return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
		}

		function luminance(r, g, b) {
			var a = [r, g, b].map(function (v) {
				v /= 255;
				return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
			});
			return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
		}

		function contrast(c1, c2) {
			var l1 = luminance(c1[0], c1[1], c1[2]);
			var l2 = luminance(c2[0], c2[1], c2[2]);
			return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
		}

		function isTransparent(bg) {
			if (!bg || bg === 'transparent') {
				return true;
			}

			if (bg.indexOf('rgba') === 0) {
				var parts = bg.match(/\d+(\.\d+)?/g);
				if (parts && typeof parts[3] !== 'undefined') {
					return parseFloat(parts[3]) === 0;
				}
			}

			return false;
		}

		function getBackground(el) {

			while (el && el !== document) {

				var bg = window.getComputedStyle(el).backgroundColor;

				if (!isTransparent(bg)) {
					return bg;
				}

				el = el.parentElement;
			}

			return 'rgb(255,255,255)';
		}

		function isIgnored($el) {
			if (!settings.ignore) {
				return false;
			}

			if ($el.is(settings.ignore)) {
				return true;
			}

			if (settings.ignoreDescendants && $el.closest(settings.ignore).length) {
				return true;
			}

			return false;
		}

		// -------------------------
		// STATE DETECTION HELPERS (NEW)
		// -------------------------
		function getState(el, $el) {

			var state = [];

			if (el.matches(':hover')) {
				state.push('hover');
			}
			if (el.matches(':focus')) {
				state.push('focus');
			}
			if (el.matches(':active')) {
				state.push('active');
			}
			if ($el.is(':disabled')) {
				state.push('disabled');
			}

			return state;
		}

		function hasPseudoVisualImpact(style) {

			// heuristic: detects hidden but styled overlays or pseudo-risk
			return (
				style.boxShadow !== 'none' ||
				style.textDecoration !== 'none' ||
				style.outlineStyle !== 'none'
			);
		}

		var report = [];

		return this.each(function () {

			var $root = $(this);
			var l = (window.a11yUxChecker && window.a11yUxChecker.contrast) || {};
			var fmt = window.a11yUxSprintf || function (f) {
				return f;
			};

			$root.find('*').each(function () {

				var el = this;
				var $el = $(el);

				if (!$el.is(':visible')) {
					return;
				}
				if (isIgnored($el)) {
					return;
				}

				var style = window.getComputedStyle(el);

				var color = style.color;
				var bg = getBackground(el);

				// skip invisible text
				if (parseFloat(style.opacity) === 0 || color === 'transparent') {
					return;
				}

				var fgRGB = getRGB(color);
				var bgRGB = getRGB(bg);

				var ratio = contrast(fgRGB, bgRGB);

				var fontSize = parseFloat(style.fontSize || 0);
				var fontWeight = parseInt(style.fontWeight, 10) || 400;

				var isLarge =
					fontSize >= 18 ||
					(fontSize >= 14 && fontWeight >= 700);

				var threshold = isLarge ? current.large : current.normal;

				var state = getState(el, $el);

				// -------------------------
				// EXTENDED VISUAL CONTEXT (LIST A ADDITIONS)
				// -------------------------

				var isIconOnly =
					$el.find('svg').length > 0 &&
					$.trim($el.text()).length === 0;

				var hasOpacityLayer = parseFloat(style.opacity) < 1;

				var backgroundIssues =
					isTransparent(bg) || hasOpacityLayer;

				var contrastIssueType = null;

				if (ratio < threshold) {
					contrastIssueType = 'text-contrast';
				}

				// detect non-text contrast risks
				var nonTextRisk =
					isIconOnly ||
					style.border !== 'none' ||
					style.outline !== 'none';

				// link contrast heuristic
				var isLink = el.tagName === 'A';

				// focus visibility check (outline suppression)
				var focusVisibilityRisk =
					state.includes('focus') &&
					(style.outline === 'none' || style.outlineStyle === 'none');

				// -------------------------
				// FAILURE REPORTING
				// -------------------------
				if (
					ratio < threshold ||
					(isIconOnly && ratio < 3) ||
					focusVisibilityRisk ||
					backgroundIssues && ratio < threshold
				) {

					report.push({
						el: $el,
						ratio: Number(ratio.toFixed(2)),
						required: threshold,
						severity: ratio < threshold / 2 ? 'error' : 'warning',

						type: contrastIssueType || 'visual-contrast-risk',

						state: state,

						details: {
							foregroundColor: color,
							backgroundColor: bg,
							fontSize: style.fontSize,
							fontFamily: style.fontFamily,
							fontWeight: style.fontWeight,
							opacity: style.opacity,

							isLargeText: isLarge,
							isIconOnly: isIconOnly,
							isLink: isLink,

							hasOpacityLayer: hasOpacityLayer,
							backgroundTransparencyRisk: isTransparent(bg),

							nonTextContrastRisk: nonTextRisk,
							focusVisibilityRisk: focusVisibilityRisk,

							pseudoVisualImpact: hasPseudoVisualImpact(style)
						},

						note:
							focusVisibilityRisk
								? (l.note_focus_visibility || '')
								: isTransparent(bg)
									? (l.note_transparency || '')
									: isIconOnly
										? (l.note_icon_only || '')
										: (l.note_standard_failure || '')
					});
				}
			});

			// -------------------------
			// OUTPUT (STATE-AWARE REPORT)
			// -------------------------
			if (settings.log) {

				console.group(fmt(l.console_group_title || '', settings.level));

				console.log(fmt(l.failures_count || '', report.length));

				// grouped insights (added UX/contrast categories)
				var groups = {
					textContrast: report.filter(function (r) {
						return r.type === 'text-contrast';
					}),
					iconOrNonText: report.filter(function (r) {
						return r.details.isIconOnly;
					}),
					focusIssues: report.filter(function (r) {
						return r.details.focusVisibilityRisk;
					}),
					transparencyIssues: report.filter(function (r) {
						return r.details.backgroundTransparencyRisk;
					})
				};

				console.group(l.group_text_contrast || '');
				console.log(groups.textContrast);
				console.groupEnd();

				console.group(l.group_icon_non_text || '');
				console.log(groups.iconOrNonText);
				console.groupEnd();

				console.group(l.group_focus_visibility || '');
				console.log(groups.focusIssues);
				console.groupEnd();

				console.group(l.group_transparency || '');
				console.log(groups.transparencyIssues);
				console.groupEnd();

				console.group(l.group_full_report || '');
				console.log(report);
				console.groupEnd();

				console.groupEnd();
			}

		});

		return report;
	};

})(jQuery);
