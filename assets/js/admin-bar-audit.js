/**
 * Triggers bundled jQuery audits when the admin bar item is activated.
 * Runs an additional asynchronous Escape-key probe for visible modals/dialogs.
 */
(function ($) {
	'use strict';

	/**
	 * Whether an element is painted and considered visible for the modal probe.
	 *
	 * @param {Element} el DOM element.
	 * @return {boolean} True if visible.
	 */
	function isModalElementVisible(el) {
		if (!el || !el.getBoundingClientRect || !document.body.contains(el)) {
			return false;
		}
		var st = window.getComputedStyle(el);
		if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) {
			return false;
		}
		if (el.getAttribute('aria-hidden') === 'true') {
			return false;
		}
		var r = el.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	}

	/**
	 * Whether a modal node appears dismissed after an Escape probe.
	 *
	 * @param {Element} el Modal root previously visible.
	 * @return {boolean} True if dismissed or hidden.
	 */
	function isModalDismissed(el) {
		if (!document.body.contains(el)) {
			return true;
		}
		if (!isModalElementVisible(el)) {
			return true;
		}
		if (el.getAttribute('aria-hidden') === 'true') {
			return true;
		}
		if (el.classList) {
			if (el.classList.contains('hidden') || el.classList.contains('is-closed') || el.classList.contains('modal-closed')) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Focuses the first tabbable control inside a container (helps listeners that depend on focus).
	 *
	 * @param {Element} container Modal root.
	 * @return {void}
	 */
	function focusFirstFocusable(container) {
		if (!container || !container.querySelector) {
			return;
		}
		var sel = [
			'a[href]',
			'button:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])'
		].join(', ');
		var el = container.querySelector(sel);
		if (el && typeof el.focus === 'function') {
			try {
				el.focus();
			} catch (e) {
				// Ignore cross-origin or non-focusable edge cases.
			}
		}
	}

	/**
	 * Dispatches synthetic keydown/keyup Escape on relevant targets (bubbling).
	 *
	 * @param {Element} modalRoot Modal element.
	 * @return {void}
	 */
	function dispatchSyntheticEscape(modalRoot) {
		var types = ['keydown', 'keyup'];
		var base = {
			key: 'Escape',
			code: 'Escape',
			keyCode: 27,
			which: 27,
			bubbles: true,
			cancelable: true
		};
		types.forEach(function (type) {
			var ev = new KeyboardEvent(type, base);
			modalRoot.dispatchEvent(ev);
			if (document.body) {
				document.body.dispatchEvent(ev);
			}
			document.dispatchEvent(ev);
			window.dispatchEvent(ev);
		});
	}

	/**
	 * Collects likely visible modal/dialog roots in the document.
	 *
	 * @return {Element[]} Unique elements.
	 */
	function collectVisibleModalCandidates() {
		var selectors = [
			'[role="dialog"]',
			'[role="alertdialog"]',
			'[aria-modal="true"]',
			'.modal.show',
			'.modal.is-active',
			'.modal.is-open'
		];
		var seen = [];
		var out = [];
		selectors.forEach(function (sel) {
			try {
				var list = document.querySelectorAll(sel);
				for (var i = 0; i < list.length; i++) {
					var el = list[i];
					if (seen.indexOf(el) !== -1) {
						continue;
					}
					if (!isModalElementVisible(el)) {
						continue;
					}
					seen.push(el);
					out.push(el);
				}
			} catch (err) {
				// Ignore invalid selector in edge environments.
			}
		});
		return out;
	}

	/**
	 * Sequentially probes each visible modal with a synthetic Escape (may close modals).
	 *
	 * @return {void}
	 */
	function runModalEscapeProbe() {
		var candidates = collectVisibleModalCandidates();

		console.group('MODAL × ÉCHAP (test clavier)');

		if (!candidates.length) {
			console.info(
				'Aucune modale ou boîte de dialogue visible au moment du test. ' +
				'Ouvrez une modale puis relancez l’analyse pour vérifier la touche Échap.'
			);
			console.groupEnd();
			return;
		}

		console.warn(
			'Des événements clavier Escape synthétiques sont envoyés : les modales ouvertes peuvent se fermer.'
		);

		var index = 0;
		var delayMs = 280;

		function probeNext() {
			if (index >= candidates.length) {
				console.groupEnd();
				return;
			}

			var el = candidates[index];
			index += 1;

			if (!document.body.contains(el) || !isModalElementVisible(el)) {
				setTimeout(probeNext, 0);
				return;
			}

			focusFirstFocusable(el);
			dispatchSyntheticEscape(el);

			window.setTimeout(function () {
				if (isModalDismissed(el)) {
					console.log(
						'Comportement plausible : la modale ne semble plus visible après Escape (ou équivalent).',
						el
					);
				} else {
					console.warn(
						'À vérifier : la modale est encore visible après Escape — raccourci absent, listener différent (keyup), ou piège au focus.',
						el
					);
				}
				probeNext();
			}, delayMs);
		}

		probeNext();
	}

	/**
	 * Runs all a11y/UX audit plugins against document.body.
	 *
	 * @return {void}
	 */
	function runAudits() {
		var $root = $('body');

		if ($.fn.a11yStructureAudit) {
			$root.a11yStructureAudit();
		}
		if ($.fn.a11yContrastReport) {
			$root.a11yContrastReport();
		}
		if ($.fn.a11yFormsReport) {
			$root.a11yFormsReport();
		}
		if ($.fn.uxAudit) {
			$root.uxAudit();
		}

		window.setTimeout(runModalEscapeProbe, 0);
	}

	$(function () {
		$(document).on(
			'click',
			'#wp-admin-bar-adn-a11y-audit a.ab-item, #wp-admin-bar-adn-a11y-audit .ab-item',
			function (e) {
				e.preventDefault();
				runAudits();
			}
		);
	});
})(jQuery);
