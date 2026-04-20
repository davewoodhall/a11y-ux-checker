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

		var report = [];

		// -------------------------
		// CORE COLOR UTILS
		// -------------------------
		function getRGB(color) {
			if (!color) return [0, 0, 0];
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
			if (!bg || bg === 'transparent') return true;

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

				if (!isTransparent(bg)) return bg;

				el = el.parentElement;
			}

			return 'rgb(255,255,255)';
		}

		function isIgnored($el) {
			if (!settings.ignore) return false;

			if ($el.is(settings.ignore)) return true;

			if (settings.ignoreDescendants && $el.closest(settings.ignore).length) return true;

			return false;
		}

		// -------------------------
		// STATE DETECTION HELPERS (NEW)
		// -------------------------
		function getState(el, $el) {

			var state = [];

			if (el.matches(':hover')) state.push('hover');
			if (el.matches(':focus')) state.push('focus');
			if (el.matches(':active')) state.push('active');
			if ($el.is(':disabled')) state.push('disabled');

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

		return this.each(function () {

			var $root = $(this);

			$root.find('*').each(function () {

				var el = this;
				var $el = $(el);

				if (!$el.is(':visible')) return;
				if (isIgnored($el)) return;

				var style = window.getComputedStyle(el);

				var color = style.color;
				var bg = getBackground(el);

				// skip invisible text
				if (parseFloat(style.opacity) === 0 || color === 'transparent') return;

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
								? 'Focus state lacks visible contrast (outline suppressed or insufficient)'
								: isTransparent(bg)
									? 'Transparency chain affects effective contrast (computed background differs from visual perception)'
									: isIconOnly
										? 'Icon-only element may require non-text contrast validation'
										: 'Standard contrast failure'
					});
				}
			});

			// -------------------------
			// OUTPUT (STATE-AWARE REPORT)
			// -------------------------
			if (settings.log) {

				console.group('A11Y CONTRAST REPORT (' + settings.level + ')');

				console.log('Failures:', report.length);

				// grouped insights (added UX/contrast categories)
				var groups = {
					textContrast: report.filter(r => r.type === 'text-contrast'),
					iconOrNonText: report.filter(r => r.details.isIconOnly),
					focusIssues: report.filter(r => r.details.focusVisibilityRisk),
					transparencyIssues: report.filter(r => r.details.backgroundTransparencyRisk)
				};

				console.group('TEXT CONTRAST');
				console.log(groups.textContrast);
				console.groupEnd();

				console.group('ICON / NON-TEXT RISK');
				console.log(groups.iconOrNonText);
				console.groupEnd();

				console.group('FOCUS VISIBILITY ISSUES');
				console.log(groups.focusIssues);
				console.groupEnd();

				console.group('TRANSPARENCY / LAYERING ISSUES');
				console.log(groups.transparencyIssues);
				console.groupEnd();

				console.group('FULL REPORT');
				console.log(report);
				console.groupEnd();

				console.groupEnd();
			}

		});

		return report;
	};

})(jQuery);