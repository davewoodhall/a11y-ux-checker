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
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Text domain for translations.
	 *
	 * @var string
	 */
	private const TEXT_DOMAIN = 'adn-a11y-checker';

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
	 * Loads plugin translations.
	 *
	 * @return void
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			self::TEXT_DOMAIN,
			false,
			dirname(plugin_basename(ADN_A11Y_CHECKER_FILE)) . '/languages'
		);
	}

	/**
	 * Adds the admin bar link for logged-in users.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar WordPress admin bar controller.
	 * @return void
	 */
	public function register_admin_bar_node($wp_admin_bar) {
		if (!is_user_logged_in()) {
			return;
		}

		$wp_admin_bar->add_node(
			[
				'id'     => 'adn-a11y-audit',
				'parent' => false,
				'title'  => esc_html__('Analyse a11y & UX', self::TEXT_DOMAIN),
				'href'   => '#',
				'meta'   => [
					'class' => 'adn-a11y-audit-trigger',
					'title' => esc_attr__(
						'Lancer l’analyse d’accessibilité et d’UX (résultats dans la console du navigateur).',
						self::TEXT_DOMAIN
					),
				],
			]
		);
	}

	/**
	 * Enqueues jQuery audit scripts when the user is logged in (admin bar context).
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		if (!is_user_logged_in()) {
			return;
		}

		$ver  = ADN_A11Y_CHECKER_VERSION;
		$base = plugins_url('assets/js/', ADN_A11Y_CHECKER_FILE);

		wp_register_script(
			'adn-a11y-structure-audit',
			$base . 'structure-audit.js',
			['jquery'],
			$ver,
			true
		);
		wp_register_script(
			'adn-a11y-contrast',
			$base . 'contrast.js',
			['jquery'],
			$ver,
			true
		);
		wp_register_script(
			'adn-a11y-forms',
			$base . 'forms.js',
			['jquery'],
			$ver,
			true
		);
		wp_register_script(
			'adn-a11y-ux',
			$base . 'ux-audit.js',
			['jquery'],
			$ver,
			true
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
