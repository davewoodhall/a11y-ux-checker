(function ($) {

	$.fn.a11yStructureAudit = function (options) {

		var settings = $.extend({
			log: true,
			checkHeadingOrder: true,
			checkMultipleH1: true,
			checkMissingLandmarks: true,
			checkDocumentLang: true,
			checkDocumentTitle: true,
			checkMetaViewport: true,
			checkImages: true,
			checkSvg: true,
			checkTables: true,
			checkSkipLinks: true,
			checkDialogSemantics: true
		}, options);

		var report = {
			error: [],
			warning: [],
			info: [],
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

		function hasDirectTextNode(el) {
			var hasText = false;

			$.each(el.childNodes, function (_, node) {
				if (node.nodeType === 3 && $.trim(node.nodeValue)) {
					hasText = true;
				}
			});

			return hasText;
		}

		function isNativeInteractive($el) {
			return $el.is('a,button,input,select,textarea');
		}

		function getAttr($el, attr) {
			var v = $el.attr(attr);
			return v ? v.trim() : '';
		}

		function isVisibleForAudit(el) {
			if (!el || el.nodeType !== 1) {
				return false;
			}
			var st = window.getComputedStyle(el);
			if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) {
				return false;
			}
			var r = el.getBoundingClientRect();
			return r.width > 0 && r.height > 0;
		}

		return this.each(function () {

			var $root = $(this);

			// =========================================================
			// DOCUMENT & LANGUAGE
			// =========================================================
			if (settings.checkDocumentLang) {
				var lang = document.documentElement.getAttribute('lang');
				if (!lang || !$.trim(lang)) {
					push('error', 'Missing or empty lang attribute on document element', $(document.documentElement));
				}
			}

			if (settings.checkDocumentTitle) {
				var docTitle = typeof document.title === 'string' ? $.trim(document.title) : '';
				if (!docTitle) {
					push('warning', 'Document title is empty or missing');
				}
			}

			if (settings.checkMetaViewport && typeof document.head !== 'undefined') {
				if (!$('head meta[name="viewport"]', document).length) {
					push('info', 'No meta viewport in document head (check responsive behaviour)');
				}
			}

			// =========================================================
			// LANDMARKS
			// =========================================================
			var $main = $root.find('main');

			if ($main.length !== 1) {
				push('error', 'Expected exactly 1 <main> element', $main);
			}

			if (settings.checkMissingLandmarks) {
				if ($root.find('nav').length === 0) push('warning', 'Missing <nav> landmark');
				if ($root.find('header').length === 0) push('warning', 'Missing <header> landmark');
				if ($root.find('footer').length === 0) push('warning', 'Missing <footer> landmark');
			}

			if ($root.find('header').length > 1) {
				push('warning', 'Multiple <header> landmarks detected', $root.find('header'));
			}

			if ($root.find('footer').length > 1) {
				push('warning', 'Multiple <footer> landmarks detected', $root.find('footer'));
			}

			$root.find('nav').each(function () {
				var $el = $(this);
				if (!($el.attr('aria-label') || $el.attr('aria-labelledby'))) {
					push('warning', 'Navigation landmark missing accessible name', $el);
				}
			});

			// =========================================================
			// HEADING STRUCTURE
			// =========================================================
			var headings = $root.find('h1,h2,h3,h4,h5,h6');
			var lastLevel = 0;

			if (settings.checkMultipleH1 && $root.find('h1').length > 1) {
				push('warning', 'Multiple <h1> elements detected', $root.find('h1'));
			}

			if ($root.find('h1').length === 0) {
				push('warning', 'Missing <h1> element');
			}

			headings.each(function () {

				var $el = $(this);
				var level = parseInt(this.tagName.substring(1), 10);

				if (!text($el)) {
					push('error', 'Empty heading detected', $el);
				}

				if (settings.checkHeadingOrder && lastLevel && level > lastLevel + 1) {
					push('warning',
						'Heading level skipped (H' + lastLevel + ' → H' + level + ')',
						$el
					);
				}

				lastLevel = level;
			});

			// =========================================================
			// SECTION STRUCTURE
			// =========================================================
			$root.find('section').each(function () {

				var $el = $(this);

				var hasLabel =
					$el.attr('aria-label') ||
					$el.attr('aria-labelledby') ||
					$el.find('h1,h2,h3,h4,h5').length;

				if (!hasLabel) {
					push('warning', 'Section missing accessible name', $el);
				}

				if (!text($el)) {
					push('warning', 'Empty section detected', $el);
				}
			});

			// =========================================================
			// LISTS
			// =========================================================
			$root.find('ul,ol').each(function () {

				var $el = $(this);

				if ($el.children('li').length === 0) {
					push('error', 'List has no <li> elements', $el);
				}
			});

			// =========================================================
			// ARIA VALIDATION (ENHANCED)
			// =========================================================
			var ariaAttrs = ['aria-labelledby', 'aria-describedby', 'aria-controls'];

			ariaAttrs.forEach(function (attr) {

				$root.find('[' + attr + ']').each(function () {

					var $el = $(this);
					var val = getAttr($el, attr);

					if (!val) {
						push('error', attr + ' is empty', $el);
						return;
					}

					val.split(/\s+/).forEach(function (id) {
						if (id && !document.getElementById(id)) {
							push('error',
								attr + ' references missing ID: ' + id,
								$el
							);
						}
					});
				});
			});

			// ARIA misuse + redundancy checks
			$root.find('[aria-label]').each(function () {

				var $el = $(this);
				var label = getAttr($el, 'aria-label');
				var visibleText = text($el);

				if (!label) {
					push('error', 'Empty aria-label', $el);
				}

				if (label && visibleText && label.toLowerCase() === visibleText.toLowerCase()) {
					push('info',
						'Redundant aria-label duplicates visible text',
						$el
					);
				}
			});

			$root.find('[role]').each(function () {

				var $el = $(this);
				var role = getAttr($el, 'role');

				if (!role) {
					push('error', 'Empty role attribute detected', $el);
				}

				if (role === 'button' && $el.is('button')) {
					push('info', 'Redundant role="button" on native button', $el);
				}

				if (role === 'link' && $el.is('a')) {
					push('info', 'Redundant role="link" on native anchor', $el);
				}
			});

			// =========================================================
			// INTERACTIVE ELEMENTS
			// =========================================================
			$root.find('[onclick],[onmouseover],[onmousedown],[onmouseup]').each(function () {
				push('info', 'Inline event handler detected', $(this));
			});

			$root.find('[onclick]').each(function () {

				var $el = $(this);

				if (!isNativeInteractive($el)) {
					push('warning',
						'Non-semantic clickable element detected',
						$el
					);
				}
			});

			// =========================================================
			// DUPLICATE LINKS
			// =========================================================
			var linkMap = {};

			$root.find('a[href]').each(function () {

				var $el = $(this);
				var href = $el.attr('href');

				if (!href || href.indexOf('#') === 0) return;
				if ($el.closest('nav').length) return;

				if (!linkMap[href]) linkMap[href] = [];
				linkMap[href].push($el);
			});

			Object.keys(linkMap).forEach(function (href) {

				if (linkMap[href].length > 1) {
					push('info',
						'Multiple links to same page: ' + href,
						$(linkMap[href])
					);
				}
			});

			// =========================================================
			// DIRECT TEXT IN BLOCKS
			// =========================================================
			$root.find('div,section,article,aside').each(function () {

				if (hasDirectTextNode(this)) {
					push('info',
						'Block contains direct text node (consider semantic wrapper)',
						$(this)
					);
				}
			});

			// =========================================================
			// LINKED CONTAINERS
			// =========================================================
			$root.find('a').each(function () {

				var $a = $(this);

				if ($a.children().length && $a.closest('div,section,article').length) {
					push('warning',
						'Linked container detected',
						$a
					);
				}
			});

			// =========================================================
			// STRUCTURAL RISKS (ADDED FROM LIST A)
			// =========================================================

			// Duplicate ID safety
			var idMap = {};
			$root.find('[id]').each(function () {
				var id = this.id;
				if (!id) return;
				idMap[id] = (idMap[id] || 0) + 1;
			});

			Object.keys(idMap).forEach(function (id) {
				if (idMap[id] > 1) {
					push('error', 'Duplicate ID detected: #' + id, $('#' + id));
				}
			});

			// Positive tabindex risk
			$root.find('[tabindex]').each(function () {

				var $el = $(this);
				var ti = parseInt($el.attr('tabindex'), 10);

				if (ti > 0) {
					push('warning',
						'Positive tabindex breaks natural focus order',
						$el,
						{ tabindex: ti }
					);
				}
			});

			// Focusable inside aria-hidden
			$root.find('[aria-hidden="true"]').each(function () {

				var $el = $(this);

				if ($el.find('a,button,input,select,textarea,[tabindex]').length) {
					push('error',
						'Focusable elements inside aria-hidden container',
						$el
					);
				}
			});

			// Native interactive without label
			$root.find('button,a,input,select,textarea').each(function () {

				var $el = $(this);

				if (!text($el) && !$el.attr('aria-label') && !$el.attr('aria-labelledby')) {
					push('warning',
						'Interactive element missing accessible name',
						$el
					);
				}
			});

			// =========================================================
			// IMAGES
			// =========================================================
			if (settings.checkImages) {
				$root.find('img').each(function () {
					var el = this;
					if (!el.hasAttribute('alt')) {
						push('error', 'img element missing alt attribute', $(el));
					}
				});
			}

			// =========================================================
			// SVG (accessible name)
			// =========================================================
			if (settings.checkSvg) {
				$root.find('svg').each(function () {
					var $svg = $(this);
					if ($svg.attr('aria-hidden') === 'true') {
						return;
					}
					var r = ($svg.attr('role') || '').toLowerCase();
					if (r === 'presentation' || r === 'none') {
						return;
					}
					var hasName =
						$svg.find('title').length ||
						$svg.attr('aria-label') ||
						$svg.attr('aria-labelledby');
					if (!hasName) {
						push('warning',
							'SVG may be missing an accessible name (title, aria-label, or aria-labelledby)',
							$svg
						);
					}
				});
			}

			// =========================================================
			// TABLES (data tables)
			// =========================================================
			if (settings.checkTables) {
				$root.find('table').each(function () {
					var $t = $(this);
					if (!$t.find('th').length) {
						push('warning', 'Table has no th elements', $t);
					}
					if ($t.find('td').length > 4 && !$t.find('caption').length) {
						push('info', 'Large table without caption — consider adding a caption', $t);
					}
				});
			}

			// =========================================================
			// SKIP / BYPASS LINKS
			// =========================================================
			if (settings.checkSkipLinks) {
				$root.find('a[href^="#"]').each(function () {
					var $a = $(this);
					var href = $a.attr('href') || '';
					var id = href.replace(/^#/, '');
					var label = text($a) + ' ' + ($a.attr('class') || '') + ' ' + ($a.attr('id') || '');
					var skipLike = /skip|passer|aller|content|main|contenu|navigation/i.test(label);
					if (!skipLike) {
						return;
					}
					var target = id ? document.getElementById(id) : null;
					if (!target) {
						push('warning',
							'Skip/bypass link points to a missing fragment target: ' + href,
							$a
						);
					} else {
						push('info', 'Skip/bypass link pattern detected', $a);
					}
				});
			}

			// =========================================================
			// DIALOG SEMANTICS (static)
			// =========================================================
			if (settings.checkDialogSemantics) {
				$root.find('[role="dialog"],[role="alertdialog"]').each(function () {
					var $d = $(this);
					var hasName = $d.attr('aria-label') || $d.attr('aria-labelledby');
					if (!hasName) {
						push('warning',
							'Dialog or alertdialog missing accessible name (aria-label or aria-labelledby)',
							$d
						);
					}
					if (!$d.attr('aria-modal')) {
						push('info',
							'Dialog without aria-modal (verify modal behaviour and focus trap)',
							$d
						);
					}
				});
			}

			// =========================================================
			// KEYBOARD — INERT SUBTREE (heuristic)
			// =========================================================
			$root.find('[inert]').each(function () {
				var $el = $(this);
				var $bad = $el.find('a,button,input,select,textarea').addBack('a,button,input,select,textarea').filter(function () {
					var ti = parseInt($(this).attr('tabindex'), 10);
					if (!isNaN(ti) && ti < 0) {
						return false;
					}
					return isVisibleForAudit(this);
				});
				if ($bad.length) {
					push('warning',
						'Visible focusable control inside [inert] subtree (keyboard/focus conflict risk)',
						$el
					);
				}
			});

			// =========================================================
			// OUTPUT
			// =========================================================
			if (settings.log) {

				console.group('A11Y STRUCTURE AUDIT');

				console.group('ERRORS (' + report.error.length + ')');
				console.log(report.error);
				console.groupEnd();

				console.group('WARNINGS (' + report.warning.length + ')');
				console.log(report.warning);
				console.groupEnd();

				console.group('INFO (' + report.info.length + ')');
				console.log(report.info);
				console.groupEnd();

				console.group('PATTERNS (' + report.pattern.length + ')');
				console.log(report.pattern);
				console.groupEnd();

				console.groupEnd();
			}

			return report;
		});

	};

})(jQuery);