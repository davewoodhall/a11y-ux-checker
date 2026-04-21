<?php
/**
 * Bootstrap: admin bar entry and front-end scripts for a11y/UX audits.
 *
 * @package AdnA11yChecker
 */

namespace AdnA11yChecker;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Main plugin controller (singleton).
 */
class Plugin {

	/**
	 * Capability required to use audits (WordPress Administrators have this on single-site installs).
	 *
	 * @var string
	 */
	private const REQUIRED_CAPABILITY = 'manage_options';

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Script handle for shared i18n runtime (loads before audit scripts).
	 *
	 * @var string
	 */
	private const HANDLE_I18N_RUNTIME = 'adn-a11y-i18n-runtime';

	/**
	 * Returns the singleton instance.
	 *
	 * @return Plugin
	 */
	public static function get_instance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	private function __construct() {
		add_action('plugins_loaded', [$this, 'load_textdomain']);
		add_action('admin_bar_menu', [$this, 'register_admin_bar_node'], 100);
		add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
		add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
	}

	/**
	 * Returns the gettext text domain for this plugin.
	 *
	 * @return string
	 */
	private function text_domain() {
		return defined('A11Y_UX_CHECKER_TEXT_DOMAIN') ? A11Y_UX_CHECKER_TEXT_DOMAIN : 'a11y_ux_checker';
	}

	/**
	 * Whether the current user may load audit scripts and see the admin bar entry.
	 *
	 * Defaults to Administrators (`manage_options`). Multisite: site administrators on that site.
	 *
	 * @return bool
	 */
	private function user_can_run_audits() {
		if (!is_user_logged_in()) {
			return false;
		}

		/**
		 * Filters whether the current user may use A11y & UX Checker (admin bar + scripts).
		 *
		 * Default passes when the user has the `manage_options` capability (Administrators).
		 *
		 * @param bool $allow Whether access is granted.
		 */
		return (bool) apply_filters(
			'a11y_ux_checker_user_can_run_audit',
			current_user_can(self::REQUIRED_CAPABILITY)
		);
	}

	/**
	 * Loads plugin translations.
	 *
	 * @return void
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			$this->text_domain(),
			false,
			dirname(plugin_basename(ADN_A11Y_CHECKER_FILE)) . '/languages'
		);
	}

	/**
	 * Adds the admin bar link for permitted users.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar WordPress admin bar controller.
	 * @return void
	 */
	public function register_admin_bar_node($wp_admin_bar) {
		if (!$this->user_can_run_audits()) {
			return;
		}

		$d = $this->text_domain();

		$wp_admin_bar->add_node(
			[
				'id'     => 'adn-a11y-audit',
				'parent' => false,
				'title'  => esc_html__('A11y & UX audit', $d),
				'href'   => '#',
				'meta'   => [
					'class' => 'adn-a11y-audit-trigger',
					'title' => esc_attr__(
						'Run the accessibility and UX audit (results appear in the browser console).',
						$d
					),
				],
			]
		);
	}

	/**
	 * Enqueues jQuery audit scripts for administrators (or filtered allow list).
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		if (!$this->user_can_run_audits()) {
			return;
		}

		$ver  = ADN_A11Y_CHECKER_VERSION;
		$base = plugins_url('assets/js/', ADN_A11Y_CHECKER_FILE);

		wp_register_script(
			self::HANDLE_I18N_RUNTIME,
			$base . 'i18n-runtime.js',
			[],
			$ver,
			true
		);

		wp_register_script(
			'adn-a11y-structure-audit',
			$base . 'structure-audit.js',
			[
				'jquery',
				self::HANDLE_I18N_RUNTIME,
			],
			$ver,
			true
		);
		wp_register_script(
			'adn-a11y-contrast',
			$base . 'contrast.js',
			[
				'jquery',
				self::HANDLE_I18N_RUNTIME,
			],
			$ver,
			true
		);
		wp_register_script(
			'adn-a11y-forms',
			$base . 'forms.js',
			[
				'jquery',
				self::HANDLE_I18N_RUNTIME,
			],
			$ver,
			true
		);
		wp_register_script(
			'adn-a11y-ux',
			$base . 'ux-audit.js',
			[
				'jquery',
				self::HANDLE_I18N_RUNTIME,
			],
			$ver,
			true
		);

		wp_localize_script(
			self::HANDLE_I18N_RUNTIME,
			'a11yUxChecker',
			Plugin_I18n::get_script_i18n()
		);

		wp_enqueue_script(
			'adn-a11y-admin-bar',
			$base . 'admin-bar-audit.js',
			[
				'jquery',
				'adn-a11y-structure-audit',
				'adn-a11y-contrast',
				'adn-a11y-forms',
				'adn-a11y-ux',
			],
			$ver,
			true
		);
	}
}
