(function ($) {

	$.fn.a11yFormsReport = function (options) {

		var settings = $.extend({
			log: true,
			logCorrect: false,
			trackRuntime: true,
			ignore: '',
			ignoreDescendants: false
		}, options);

		var report = {

			// structural
			missingLabels: [],
			missingIds: [],
			missingNames: [],
			missingIdAndName: [],
			hiddenLabels: [],

			// semantic
			inputTypeMismatch: [],
			placeholderAsLabel: [],
			autocompleteMissing: [],
			requiredIndicatorMismatch: [],
			requiredFieldOverload: [],

			// ARIA integrity
			ariaInvalidMissing: [],
			ariaRequiredMismatch: [],
			ariaDescribedbyBroken: [],
			errorLiveRegionMissing: [],

			// structure groups
			fieldsetMissing: [],
			legendMissing: [],

			// UX / usability
			emptyErrorContainers: [],
			helpTextUnlinked: [],
			ambiguousInputs: [],
			submitButtonAmbiguity: [],
			multiStepClarityIssues: [],
			loadingStateMissing: [],
			focusableHiddenFields: [],
			tabOrderIssues: [],

			// interaction lifecycle (runtime)
			focusFlowIssues: [],
			submitWithoutFocusManagement: [],
			mutationStateIssues: [],

			// correctness
			correct: []
		};

		var runtimeState = {
			lastFocused: null,
			submittedForms: new Set(),
			focusHistory: []
		};

		function isIgnored($el) {
			if (!settings.ignore) return false;
			if ($el.is(settings.ignore)) return true;
			if (settings.ignoreDescendants && $el.closest(settings.ignore).length) return true;
			return false;
		}

		function labelIsHidden($label) {
			if (!$label || !$label.length) return false;

			var el = $label[0];
			var style = window.getComputedStyle(el);

			return (
				style.display === 'none' ||
				style.visibility === 'hidden' ||
				parseFloat(style.opacity) === 0 ||
				el.hasAttribute('aria-hidden')
			);
		}

		function getLabel($el, $root) {
			var id = $el.attr('id');
			return id ? $root.find('label[for="' + id + '"]') : $();
		}

		function hasPlaceholder($el) {
			return !!$el.attr('placeholder');
		}

		function isMismatch($el) {
			var type = ($el.attr('type') || '').toLowerCase();
			var name = ($el.attr('name') || '').toLowerCase();

			if (name.includes('email') && type !== 'email') return true;
			if (name.includes('tel') && type !== 'tel') return true;

			return false;
		}

		return this.each(function () {

			var $root = $(this);
			var $forms = $root.find('form');

			// -------------------------
			// RUNTIME TRACKING (focus / submit / mutation)
			// -------------------------
			if (settings.trackRuntime && typeof window !== 'undefined') {

				$root.on('focusin', 'input,select,textarea', function () {
					runtimeState.lastFocused = this;
					runtimeState.focusHistory.push(this);
				});

				$root.on('submit', 'form', function () {
					runtimeState.submittedForms.add(this);

					// check if focus was moved to errors (heuristic)
					setTimeout(function () {
						if (!document.activeElement) return;
						var active = document.activeElement;

						if ($(active).closest('form').length) {
							// weak signal: submit happened without focus jump
							report.submitWithoutFocusManagement.push($(active));
						}
					}, 50);
				});

				var observer = new MutationObserver(function (mutations) {
					mutations.forEach(function (m) {

						if (m.type === 'attributes') {
							var $target = $(m.target);

							if ($target.is('input,select,textarea')) {

								if ($target.attr('aria-invalid') === 'true' &&
									!$target.is(':focus')) {
									report.mutationStateIssues.push($target);
								}
							}
						}
					});
				});

				observer.observe($root[0], {
					subtree: true,
					attributes: true
				});
			}

			// -------------------------
			// FORM-LEVEL ANALYSIS
			// -------------------------
			$forms.each(function () {

				var $form = $(this);

				if ($form.find('[required]').length > 8) {
					report.requiredFieldOverload.push($form);
				}

				if ($form.find('[type="submit"],button').length > 1) {
					report.submitButtonAmbiguity.push($form);
				}

				if ($form.find('[data-step], .step').length &&
					!$form.find('.active,[aria-current]').length) {
					report.multiStepClarityIssues.push($form);
				}

				if ($form.find('.loading,.spinner').length === 0 &&
					$form.data('loading') === true) {
					report.loadingStateMissing.push($form);
				}

				if ($form.find('[aria-invalid="true"]').length &&
					!$form.find('[aria-live], [role="alert"]').length) {
					report.errorLiveRegionMissing.push($form);
				}
			});

			// -------------------------
			// FIELD ANALYSIS
			// -------------------------
			$root.find('input,select,textarea').each(function () {

				var $el = $(this);

				if (isIgnored($el)) return;

				var id = $el.attr('id');
				var name = $el.attr('name');

				var $label = getLabel($el, $root);

				if (!id && !name) {
					report.missingIdAndName.push($el);
					return;
				}

				if (!id) report.missingIds.push($el);
				if (!name) report.missingNames.push($el);
				if (!$label.length) report.missingLabels.push($el);

				if ($label.length && labelIsHidden($label)) {
					report.hiddenLabels.push($el);
				}

				if (hasPlaceholder($el) && !$label.length) {
					report.placeholderAsLabel.push($el);
				}

				if (isMismatch($el)) {
					report.inputTypeMismatch.push($el);
				}

				if (!$el.attr('autocomplete')) {
					report.autocompleteMissing = report.autocompleteMissing || [];
					report.autocompleteMissing.push($el);
				}

				if ($el.attr('required') && !$el.data('indicator')) {
					report.requiredIndicatorMismatch.push($el);
				}

				if ($el.attr('required') && $el.attr('aria-required') === 'false') {
					report.ariaRequiredMismatch.push($el);
				}

				if ($el.attr('required') && typeof $el.attr('aria-invalid') === 'undefined') {
					report.ariaInvalidMissing.push($el);
				}

				var describedby = $el.attr('aria-describedby');
				if (describedby) {
					describedby.split(/\s+/).forEach(function (id) {
						if (id && !document.getElementById(id)) {
							report.ariaDescribedbyBroken.push($el);
						}
					});
				}

				if (!$el.is(':visible') && !$el.prop('disabled')) {
					report.focusableHiddenFields.push($el);
				}

				if (id && name && $label.length) {
					if (settings.logCorrect) report.correct.push($el);
				}
			});

			// -------------------------
			// FIELDSET / LEGEND
			// -------------------------
			$root.find('input[type="radio"],input[type="checkbox"]').each(function () {

				var $group = $(this).closest('fieldset');

				if (!$group.length) {
					report.fieldsetMissing.push($(this));
				} else if (!$group.find('legend').length) {
					report.legendMissing.push($group);
				}
			});

			// -------------------------
			// TAB ORDER
			// -------------------------
			$root.find('[tabindex]').each(function () {
				var val = parseInt($(this).attr('tabindex'), 10);
				if (val > 0) {
					report.tabOrderIssues.push($(this));
				}
			});

			// -------------------------
			// HELP TEXT LINKING
			// -------------------------
			$root.find('.help,.error,.hint,.description').each(function () {
				if (!$(this).attr('id')) {
					report.helpTextUnlinked.push($(this));
				}
			});

			// -------------------------
			// OUTPUT
			// -------------------------
			if (settings.log) {

				console.group('A11Y FORMS FULL AUDIT');

				Object.keys(report).forEach(function (key) {
					console.group(key + ' (' + report[key].length + ')');
					console.log(report[key]);
					console.groupEnd();
				});

				console.groupEnd();
			}

			return report;
		});

	};

})(jQuery);