<?php
/**
 * Translation strings for PHP output and JavaScript audits (localized via wp_localize_script).
 *
 * Source strings use Canadian English (en_CA). French Canada (fr_CA) is provided under /languages.
 *
 * @package AdnA11yChecker
 */

namespace AdnA11yChecker;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Supplies gettext-wrapped strings for the plugin UI and front-end audits.
 */
class Plugin_I18n {

	/**
	 * Returns the active text domain constant.
	 *
	 * @return string
	 */
	private static function text_domain() {
		return defined('A11Y_UX_CHECKER_TEXT_DOMAIN') ? A11Y_UX_CHECKER_TEXT_DOMAIN : 'a11y_ux_checker';
	}

	/**
	 * Returns all strings passed to JavaScript (nested arrays).
	 *
	 * @return array<string, mixed>
	 */
	public static function get_script_i18n() {
		return [
			'structure' => self::get_structure_strings(),
			'contrast'  => self::get_contrast_strings(),
			'forms'     => self::get_forms_strings(),
			'ux'        => self::get_ux_strings(),
			'modal'     => self::get_modal_strings(),
		];
	}

	/**
	 * Structure audit labels and console titles.
	 *
	 * @return array<string, string>
	 */
	private static function get_structure_strings() {
		$d = self::text_domain();

		return [
			'missing_document_lang'              => __('Missing or empty lang attribute on the document element', $d),
			'empty_document_title'               => __('Document title is empty or missing', $d),
			'no_meta_viewport'                   => __('No meta viewport in the document head (check responsive behaviour)', $d),
			'expected_one_main'                  => __('Expected exactly one <main> element', $d),
			'missing_nav_landmark'               => __('Missing <nav> landmark', $d),
			'missing_header_landmark'            => __('Missing <header> landmark', $d),
			'missing_footer_landmark'            => __('Missing <footer> landmark', $d),
			'multiple_header_landmarks'          => __('Multiple <header> landmarks detected', $d),
			'multiple_footer_landmarks'          => __('Multiple <footer> landmarks detected', $d),
			'nav_missing_name'                   => __('Navigation landmark missing an accessible name', $d),
			'multiple_h1'                        => __('Multiple <h1> elements detected', $d),
			'missing_h1'                         => __('Missing <h1> element', $d),
			'empty_heading'                      => __('Empty heading detected', $d),
			/* translators: 1: Previous heading level number, 2: Current heading level number. */
			'heading_level_skipped'              => __('Heading level skipped (H%1$d → H%2$d)', $d),
			'section_missing_name'               => __('Section missing an accessible name', $d),
			'empty_section'                      => __('Empty section detected', $d),
			'list_no_li'                         => __('List has no <li> elements', $d),
			/* translators: %s: ARIA attribute name. */
			'aria_attr_empty'                    => __('%s is empty', $d),
			/* translators: 1: ARIA attribute name, 2: Referenced ID. */
			'aria_attr_missing_id'               => __('%1$s references a missing ID: %2$s', $d),
			'empty_aria_label'                   => __('Empty aria-label', $d),
			'redundant_aria_label'               => __('Redundant aria-label duplicates visible text', $d),
			'empty_role'                         => __('Empty role attribute detected', $d),
			'redundant_role_button'              => __('Redundant role="button" on a native button', $d),
			'redundant_role_link'                => __('Redundant role="link" on a native anchor', $d),
			'inline_event_handler'               => __('Inline event handler detected', $d),
			'non_semantic_clickable'             => __('Non-semantic clickable element detected', $d),
			/* translators: %s: Destination URL or path. */
			'multiple_links_same_page'           => __('Multiple links to the same page: %s', $d),
			'block_direct_text_node'             => __('Block contains a direct text node (consider a semantic wrapper)', $d),
			'linked_container'                   => __('Linked container detected', $d),
			/* translators: %s: Duplicate element ID without hash. */
			'duplicate_id'                       => __('Duplicate ID detected: #%s', $d),
			'positive_tabindex'                  => __('Positive tabindex disrupts natural focus order', $d),
			'focusable_inside_aria_hidden'       => __('Focusable elements inside an aria-hidden container', $d),
			'interactive_missing_name'           => __('Interactive element missing an accessible name', $d),
			'img_missing_alt'                    => __('img element missing an alt attribute', $d),
			'svg_missing_accessible_name'        => __('SVG may be missing an accessible name (title, aria-label, or aria-labelledby)', $d),
			'table_no_th'                        => __('Table has no th elements', $d),
			'large_table_no_caption'             => __('Large table without a caption — consider adding a caption', $d),
			/* translators: %s: Link fragment (e.g. #main). */
			'skip_link_missing_target'           => __('Skip link points to a missing fragment target: %s', $d),
			'skip_link_pattern'                  => __('Skip link pattern detected', $d),
			'dialog_missing_name'                => __('Dialog or alertdialog missing an accessible name (aria-label or aria-labelledby)', $d),
			'dialog_no_aria_modal'               => __('Dialog without aria-modal (verify modal behaviour and focus trap)', $d),
			'focusable_inside_inert'             => __('Visible focusable control inside an [inert] subtree (keyboard/focus conflict risk)', $d),
			'console_group_title'                => __('A11y structure audit', $d),
			/* translators: %d: Number of issues. */
			'console_errors'                     => __('Errors (%d)', $d),
			/* translators: %d: Number of issues. */
			'console_warnings'                   => __('Warnings (%d)', $d),
			/* translators: %d: Number of items. */
			'console_info'                       => __('Info (%d)', $d),
			/* translators: %d: Number of patterns. */
			'console_patterns'                   => __('Patterns (%d)', $d),
		];
	}

	/**
	 * Contrast audit strings.
	 *
	 * @return array<string, string>
	 */
	private static function get_contrast_strings() {
		$d = self::text_domain();

		return [
			'note_focus_visibility'           => __('Focus state lacks sufficient visible contrast (outline suppressed or insufficient)', $d),
			'note_transparency'               => __('Transparency chain affects effective contrast (computed background may differ from perception)', $d),
			'note_icon_only'                  => __('Icon-only element may require non-text contrast validation', $d),
			'note_standard_failure'           => __('Standard contrast failure', $d),
			/* translators: %s: WCAG level (e.g. AA). */
			'console_group_title'             => __('A11y contrast report (%s)', $d),
			/* translators: %d: Failure count. */
			'failures_count'                  => __('Failures: %d', $d),
			'group_text_contrast'             => __('Text contrast', $d),
			'group_icon_non_text'             => __('Icon / non-text risk', $d),
			'group_focus_visibility'          => __('Focus visibility issues', $d),
			'group_transparency'              => __('Transparency / layering issues', $d),
			'group_full_report'               => __('Full report', $d),
		];
	}

	/**
	 * Forms audit group labels and title.
	 *
	 * @return array<string, mixed>
	 */
	private static function get_forms_strings() {
		$d = self::text_domain();

		return [
			'console_group_title' => __('A11y forms audit', $d),
			'groups'              => [
				'missingLabels'                => __('Missing labels', $d),
				'missingIds'                   => __('Missing IDs', $d),
				'missingNames'                 => __('Missing names', $d),
				'missingIdAndName'             => __('Missing ID and name', $d),
				'hiddenLabels'                 => __('Hidden labels', $d),
				'inputTypeMismatch'            => __('Input type mismatch', $d),
				'placeholderAsLabel'           => __('Placeholder used as label', $d),
				'autocompleteMissing'          => __('Autocomplete missing', $d),
				'requiredIndicatorMismatch'    => __('Required indicator mismatch', $d),
				'requiredFieldOverload'        => __('Required field overload', $d),
				'ariaInvalidMissing'           => __('aria-invalid missing', $d),
				'ariaRequiredMismatch'         => __('aria-required mismatch', $d),
				'ariaDescribedbyBroken'        => __('Broken aria-describedby', $d),
				'errorLiveRegionMissing'       => __('Error live region missing', $d),
				'fieldsetMissing'              => __('Fieldset missing', $d),
				'legendMissing'                => __('Legend missing', $d),
				'emptyErrorContainers'         => __('Empty error containers', $d),
				'helpTextUnlinked'             => __('Help text not linked', $d),
				'ambiguousInputs'              => __('Ambiguous inputs', $d),
				'submitButtonAmbiguity'        => __('Submit button ambiguity', $d),
				'multiStepClarityIssues'       => __('Multi-step clarity issues', $d),
				'loadingStateMissing'          => __('Loading state missing', $d),
				'focusableHiddenFields'        => __('Focusable hidden fields', $d),
				'tabOrderIssues'               => __('Tab order issues', $d),
				'focusFlowIssues'              => __('Focus flow issues', $d),
				'submitWithoutFocusManagement' => __('Submit without focus management', $d),
				'mutationStateIssues'          => __('Mutation state issues', $d),
				'correct'                      => __('Correct', $d),
			],
		];
	}

	/**
	 * UX audit strings.
	 *
	 * @return array<string, string>
	 */
	private static function get_ux_strings() {
		$d = self::text_domain();

		return [
			'clickable_non_semantic'        => __('Clickable non-semantic element (missing role or native element)', $d),
			'nested_interactive'            => __('Nested interactive elements detected (click conflict risk)', $d),
			'nav_no_top_items'              => __('Navigation has no detectable top-level items', $d),
			/* translators: %d: Number of navigation items. */
			'nav_high_density'              => __('High top-level navigation density (%d items)', $d),
			'nav_excessive_complexity'      => __('Excessive top-level navigation complexity (cognitive overload risk)', $d),
			/* translators: %d: Nesting depth. */
			'nav_depth_too_deep'            => __('Navigation depth too deep (%d levels)', $d),
			/* translators: %d: Number of CTAs. */
			'high_cta_density'              => __('High CTA density in container (%d elements)', $d),
			/* translators: %d: Number of interactive elements. */
			'excessive_interactive_section' => __('Excessive interactive elements in section (%d)', $d),
			/* translators: 1: Width in px, 2: Height in px. */
			'small_click_target'            => __('Small click target (%1$dx%2$d)', $d),
			/* translators: 1: Link label, 2: Repeat count. */
			'repeated_cta_label'            => __('Repeated CTA label: "%1$s" (used %2$d times)', $d),
			'dead_ui_styled_as_button'      => __('Non-interactive element styled as a button (dead UI risk)', $d),
			'high_link_density_low_content' => __('High link density with low content (clutter risk)', $d),
			/* translators: %d: Number of interactive elements in the viewport. */
			'viewport_interaction_overload' => __('Too many interactive elements in the initial viewport (%d)', $d),
			'cta_section_no_heading'        => __('CTA-heavy section without clear hierarchy (missing heading structure)', $d),
			'target_blank_rel'              => __('Link with target="_blank" should include rel="noopener" (and often noreferrer)', $d),
			/* translators: %s: Link text. */
			'ambiguous_link_text'           => __('Ambiguous or generic link text: "%1$s"', $d),
			'console_group_title'           => __('UX audit', $d),
			/* translators: %d: Number of patterns. */
			'console_patterns'              => __('Patterns (%d)', $d),
			/* translators: %d: Number of warnings. */
			'console_warnings'              => __('Warnings (%d)', $d),
			/* translators: %d: Number of info items. */
			'console_info'                  => __('Info (%d)', $d),
			/**
			 * Pipe-separated regex alternation for generic link text (English and French); translators may extend.
			 */
			'generic_link_regex_body'       => __('click here|read more|more\\b|here\\b|learn more|details|link|en savoir plus|cliquez ici|ici\\b|suite\\b', $d),
		];
	}

	/**
	 * Modal Escape probe strings (admin bar audit).
	 *
	 * @return array<string, string>
	 */
	private static function get_modal_strings() {
		$d = self::text_domain();

		return [
			'console_group_title'      => __('Modal × Escape (keyboard test)', $d),
			'no_visible_modal'         => __('No visible modal or dialog at the time of the test. Open a modal, then run the audit again to verify the Escape key.', $d),
			'synthetic_escape_warning' => __('Synthetic Escape keyboard events are being sent: open modals may close.', $d),
			'modal_dismissed_ok'       => __('Likely behaviour: the modal no longer appears visible after Escape (or equivalent).', $d),
			'modal_still_visible'      => __('Review: the modal is still visible after Escape — missing shortcut, different listener (keyup), or focus trap.', $d),
		];
	}
}
