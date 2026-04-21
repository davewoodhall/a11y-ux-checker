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
			var l = (window.a11yUxChecker && window.a11yUxChecker.structure) || {};
			var fmt = window.a11yUxSprintf || function (f) {
				return f;
			};

			// =========================================================
			// DOCUMENT & LANGUAGE
			// =========================================================
			if (settings.checkDocumentLang) {
				var lang = document.documentElement.getAttribute('lang');
				if (!lang || !$.trim(lang)) {
					push('error', l.missing_document_lang || '', $(document.documentElement));
				}
			}

			if (settings.checkDocumentTitle) {
				var docTitle = typeof document.title === 'string' ? $.trim(document.title) : '';
				if (!docTitle) {
					push('warning', l.empty_document_title || '');
				}
			}

			if (settings.checkMetaViewport && typeof document.head !== 'undefined') {
				if (!$('head meta[name="viewport"]', document).length) {
					push('info', l.no_meta_viewport || '');
				}
			}

			// =========================================================
			// LANDMARKS
			// =========================================================
			var $main = $root.find('main');

			if ($main.length !== 1) {
				push('error', l.expected_one_main || '', $main);
			}

			if (settings.checkMissingLandmarks) {
				if ($root.find('nav').length === 0) {
					push('warning', l.missing_nav_landmark || '');
				}
				if ($root.find('header').length === 0) {
					push('warning', l.missing_header_landmark || '');
				}
				if ($root.find('footer').length === 0) {
					push('warning', l.missing_footer_landmark || '');
				}
			}

			if ($root.find('header').length > 1) {
				push('warning', l.multiple_header_landmarks || '', $root.find('header'));
			}

			if ($root.find('footer').length > 1) {
				push('warning', l.multiple_footer_landmarks || '', $root.find('footer'));
			}

			$root.find('nav').each(function () {
				var $el = $(this);
				if (!($el.attr('aria-label') || $el.attr('aria-labelledby'))) {
					push('warning', l.nav_missing_name || '', $el);
				}
			});

			// =========================================================
			// HEADING STRUCTURE
			// =========================================================
			var headings = $root.find('h1,h2,h3,h4,h5,h6');
			var lastLevel = 0;

			if (settings.checkMultipleH1 && $root.find('h1').length > 1) {
				push('warning', l.multiple_h1 || '', $root.find('h1'));
			}

			if ($root.find('h1').length === 0) {
				push('warning', l.missing_h1 || '');
			}

			headings.each(function () {

				var $el = $(this);
				var level = parseInt(this.tagName.substring(1), 10);

				if (!text($el)) {
					push('error', l.empty_heading || '', $el);
				}

				if (settings.checkHeadingOrder && lastLevel && level > lastLevel + 1) {
					push('warning',
						fmt(l.heading_level_skipped || '', lastLevel, level),
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
					push('warning', l.section_missing_name || '', $el);
				}

				if (!text($el)) {
					push('warning', l.empty_section || '', $el);
				}
			});

			// =========================================================
			// LISTS
			// =========================================================
			$root.find('ul,ol').each(function () {

				var $el = $(this);

				if ($el.children('li').length === 0) {
					push('error', l.list_no_li || '', $el);
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
						push('error', fmt(l.aria_attr_empty || '', attr), $el);
						return;
					}

					val.split(/\s+/).forEach(function (id) {
						if (id && !document.getElementById(id)) {
							push('error',
								fmt(l.aria_attr_missing_id || '', attr, id),
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
					push('error', l.empty_aria_label || '', $el);
				}

				if (label && visibleText && label.toLowerCase() === visibleText.toLowerCase()) {
					push('info',
						l.redundant_aria_label || '',
						$el
					);
				}
			});

			$root.find('[role]').each(function () {

				var $el = $(this);
				var role = getAttr($el, 'role');

				if (!role) {
					push('error', l.empty_role || '', $el);
				}

				if (role === 'button' && $el.is('button')) {
					push('info', l.redundant_role_button || '', $el);
				}

				if (role === 'link' && $el.is('a')) {
					push('info', l.redundant_role_link || '', $el);
				}
			});

			// =========================================================
			// INTERACTIVE ELEMENTS
			// =========================================================
			$root.find('[onclick],[onmouseover],[onmousedown],[onmouseup]').each(function () {
				push('info', l.inline_event_handler || '', $(this));
			});

			$root.find('[onclick]').each(function () {

				var $el = $(this);

				if (!isNativeInteractive($el)) {
					push('warning',
						l.non_semantic_clickable || '',
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

				if (!href || href.indexOf('#') === 0) {
					return;
				}
				if ($el.closest('nav').length) {
					return;
				}

				if (!linkMap[href]) {
					linkMap[href] = [];
				}
				linkMap[href].push($el);
			});

			Object.keys(linkMap).forEach(function (href) {

				if (linkMap[href].length > 1) {
					push('info',
						fmt(l.multiple_links_same_page || '', href),
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
						l.block_direct_text_node || '',
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
						l.linked_container || '',
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
				if (!id) {
					return;
				}
				idMap[id] = (idMap[id] || 0) + 1;
			});

			Object.keys(idMap).forEach(function (id) {
				if (idMap[id] > 1) {
					push('error', fmt(l.duplicate_id || '', id), $('#' + id));
				}
			});

			// Positive tabindex risk
			$root.find('[tabindex]').each(function () {

				var $el = $(this);
				var ti = parseInt($el.attr('tabindex'), 10);

				if (ti > 0) {
					push('warning',
						l.positive_tabindex || '',
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
						l.focusable_inside_aria_hidden || '',
						$el
					);
				}
			});

			// Native interactive without label
			$root.find('button,a,input,select,textarea').each(function () {

				var $el = $(this);

				if (!text($el) && !$el.attr('aria-label') && !$el.attr('aria-labelledby')) {
					push('warning',
						l.interactive_missing_name || '',
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
						push('error', l.img_missing_alt || '', $(el));
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
							l.svg_missing_accessible_name || '',
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
						push('warning', l.table_no_th || '', $t);
					}
					if ($t.find('td').length > 4 && !$t.find('caption').length) {
						push('info', l.large_table_no_caption || '', $t);
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
							fmt(l.skip_link_missing_target || '', href),
							$a
						);
					} else {
						push('info', l.skip_link_pattern || '', $a);
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
							l.dialog_missing_name || '',
							$d
						);
					}
					if (!$d.attr('aria-modal')) {
						push('info',
							l.dialog_no_aria_modal || '',
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
						l.focusable_inside_inert || '',
						$el
					);
				}
			});

			// =========================================================
			// OUTPUT
			// =========================================================
			if (settings.log) {

				console.group(l.console_group_title || '');

				console.group(fmt(l.console_errors || '', report.error.length));
				console.log(report.error);
				console.groupEnd();

				console.group(fmt(l.console_warnings || '', report.warning.length));
				console.log(report.warning);
				console.groupEnd();

				console.group(fmt(l.console_info || '', report.info.length));
				console.log(report.info);
				console.groupEnd();

				console.group(fmt(l.console_patterns || '', report.pattern.length));
				console.log(report.pattern);
				console.groupEnd();

				console.groupEnd();
			}

			return report;
		});

	};

})(jQuery);
