(function ($) {

	$.fn.uxAudit = function (options) {

		var settings = $.extend({
			log: true,
			maxNavTopLevelItems: 9,
			maxCtaPerSection: 3,
			minClickTargetSize: 32,
			maxNavDepth: 3,
			maxInteractivePerSection: 12,
			maxCTAsPerViewport: 8,
			checkTargetBlankRel: true,
			checkGenericLinkText: true
		}, options);

		var report = {
			info: [],
			warning: [],
			pattern: []
		};

		function push(severity, issue, $el, meta) {
			report[severity].push({
				issue: issue,
				el: $el || $(),
				meta: meta || null
			});
		}

		function text($el) {
			return $.trim($el.text() || '');
		}

		function isClickable(el, $el) {
			return (
				el.onclick ||
				$el.attr('role') === 'button' ||
				$el.attr('role') === 'link' ||
				$el.is('a,button,input,select,textarea') ||
				$el.css('cursor') === 'pointer'
			);
		}

		function getDepth($el) {
			var depth = 0;
			var $p = $el.parent();
			while ($p.length) {
				depth++;
				$p = $p.parent();
			}
			return depth;
		}

		function viewport() {
			return {
				w: window.innerWidth,
				h: window.innerHeight
			};
		}

		function getRect(el) {
			return el.getBoundingClientRect();
		}

		return this.each(function () {

			var $root = $(this);

			// =========================================================
			// 1. CLICKABILITY AMBIGUITY
			// =========================================================
			$root.find('div,span,section,article').each(function () {

				var $el = $(this);

				if (!isClickable(this, $el)) return;

				if (!$el.is('a,button') && !$el.attr('role')) {
					push('warning',
						'Clickable non-semantic element (missing role or native element)',
						$el
					);
				}
			});

			// =========================================================
			// 2. NESTED INTERACTIVES
			// =========================================================
			$root.find('a,button').each(function () {

				var $el = $(this);

				if ($el.find('a,button,[onclick]').length > 0) {
					push('pattern',
						'Nested interactive elements detected (click conflict risk)',
						$el
					);
				}
			});

			// =========================================================
			// 3. NAVIGATION (TOP LEVEL ONLY)
			// =========================================================
			$root.find('nav').each(function () {

				var $nav = $(this);

				var $topItems = $nav.find(':scope > ul > li > a');
				if (!$topItems.length) {
					$topItems = $nav.children().find('> a');
				}

				var count = $topItems.length;

				if (count === 0) {
					push('warning',
						'Navigation has no detectable top-level items',
						$nav
					);
				}

				if (count > settings.maxNavTopLevelItems) {
					push('warning',
						'High top-level navigation density (' + count + ' items)',
						$nav
					);
				}

				if (count > settings.maxNavTopLevelItems + 3) {
					push('pattern',
						'Excessive top-level navigation complexity (cognitive overload risk)',
						$nav
					);
				}

				// =====================================================
				// NAV DEPTH CHECK (NEW)
				// =====================================================
				$nav.find('a').each(function () {
					var depth = getDepth($(this));

					if (depth > settings.maxNavDepth) {
						push('pattern',
							'Navigation depth too deep (' + depth + ' levels)',
							$(this),
							{ depth: depth }
						);
					}
				});
			});

			// =========================================================
			// 4. CTA DENSITY PER SECTION
			// =========================================================
			$root.find('section,article,div').each(function () {

				var $el = $(this);
				var ctas = $el.find('a,button');

				if (ctas.length > settings.maxCtaPerSection) {
					push('pattern',
						'High CTA density in container (' + ctas.length + ' elements)',
						$el
					);
				}

				// =====================================================
				// INTERACTION OVERLOAD (NEW)
				// =====================================================
				if (ctas.length > settings.maxInteractivePerSection) {
					push('pattern',
						'Excessive interactive elements in section (' + ctas.length + ')',
						$el
					);
				}
			});

			// =========================================================
			// 5. CLICK TARGET SIZE
			// =========================================================
			$root.find('a,button,[role="button"]').each(function () {

				var $el = $(this);
				var rect = getRect(this);

				if (!rect.width || !rect.height) return;

				if (rect.width < settings.minClickTargetSize ||
					rect.height < settings.minClickTargetSize) {

					push('warning',
						'Small click target (' + Math.round(rect.width) + 'x' + Math.round(rect.height) + ')',
						$el
					);
				}
			});

			// =========================================================
			// 6. REPEATED CTA LABELS
			// =========================================================
			var labelMap = {};

			$root.find('a,button').each(function () {

				var $el = $(this);
				var label = text($el) || $el.attr('aria-label');

				if (!label) return;

				labelMap[label] = labelMap[label] || [];
				labelMap[label].push($el);
			});

			Object.keys(labelMap).forEach(function (label) {

				if (labelMap[label].length > 3) {
					push('pattern',
						'Repeated CTA label: "' + label + '" (' + labelMap[label].length + 'x)',
						$(labelMap[label])
					);
				}
			});

			// =========================================================
			// 7. DEAD UI PATTERNS
			// =========================================================
			$root.find('div,span').each(function () {

				var $el = $(this);

				var looksClickable =
					$el.hasClass('btn') ||
					$el.hasClass('button') ||
					$el.css('cursor') === 'pointer';

				var isRealInteractive =
					$el.is('a,button,input,select,textarea') ||
					$el.attr('role') === 'button';

				if (looksClickable && !isRealInteractive) {
					push('warning',
						'Non-interactive element styled as button (dead UI risk)',
						$el
					);
				}
			});

			// =========================================================
			// 8. INFORMATION DENSITY
			// =========================================================
			$root.find('section,article').each(function () {

				var $el = $(this);

				var linkCount = $el.find('a').length;
				var textLength = text($el).length;

				if (linkCount > 10 && textLength < 300) {
					push('pattern',
						'High link density with low content (clutter risk)',
						$el
					);
				}
			});

			// =========================================================
			// 9. VIEWPORT INTERACTION OVERLOAD (NEW)
			// =========================================================
			var vp = viewport();

			var interactiveInViewport = $root.find('a,button').filter(function () {

				var rect = getRect(this);

				return (
					rect.top >= 0 &&
					rect.top < vp.h &&
					rect.left >= 0 &&
					rect.left < vp.w
				);
			});

			if (interactiveInViewport.length > settings.maxCTAsPerViewport) {
				push('pattern',
					'Too many interactive elements in initial viewport (' + interactiveInViewport.length + ')',
					$(interactiveInViewport)
				);
			}

			// =========================================================
			// 10. VISUAL HIERARCHY SIGNALS (NEW)
			// =========================================================
			$root.find('section').each(function () {

				var $el = $(this);

				var ctas = $el.find('a,button');
				var headings = $el.find('h1,h2,h3,h4,h5,h6');

				if (ctas.length > 0 && headings.length === 0) {
					push('pattern',
						'CTA-heavy section without clear hierarchy (missing heading structure)',
						$el
					);
				}
			});

			// =========================================================
			// 11. TARGET=_BLANK + REL (NOOPENER)
			// =========================================================
			if (settings.checkTargetBlankRel) {
				$root.find('a[target="_blank"]').each(function () {
					var rel = ($(this).attr('rel') || '').toLowerCase();
					if (rel.indexOf('noopener') === -1) {
						push('warning',
							'Link with target="_blank" should include rel="noopener" (and often noreferrer)',
							$(this)
						);
					}
				});
			}

			// =========================================================
			// 12. GENERIC / AMBIGUOUS LINK TEXT
			// =========================================================
			if (settings.checkGenericLinkText) {
				var genericRe = new RegExp(
					'^(click here|read more|more\\b|here\\b|learn more|details|link|'
						+ 'en savoir plus|cliquez ici|ici\\b|suite\\b)$',
					'i'
				);
				$root.find('a[href]').each(function () {
					var $a = $(this);
					var t = text($a);
					if (!t) {
						return;
					}
					t = t.replace(/\s+/g, ' ').trim();
					if (genericRe.test(t)) {
						push('pattern',
							'Ambiguous or generic link text: "' + t + '"',
							$a
						);
					}
				});
			}

			// =========================================================
			// OUTPUT
			// =========================================================
			if (settings.log) {

				console.group('UX AUDIT');

				console.group('PATTERNS (' + report.pattern.length + ')');
				console.log(report.pattern);
				console.groupEnd();

				console.group('WARNINGS (' + report.warning.length + ')');
				console.log(report.warning);
				console.groupEnd();

				console.group('INFO (' + report.info.length + ')');
				console.log(report.info);
				console.groupEnd();

				console.groupEnd();
			}

			return report;
		});

	};

})(jQuery);