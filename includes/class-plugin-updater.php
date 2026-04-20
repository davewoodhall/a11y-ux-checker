<?php
/**
 * GitHub (releases) updates via Plugin Update Checker (same stack as wp-core).
 *
 * @package AdnA11yChecker
 */

namespace AdnA11yChecker;

use ADN\PluginUpdateChecker\v5\PucFactory;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Registers the embedded PUC client when a repository URL is configured.
 */
class Plugin_Updater {

	/**
	 * Singleton instance.
	 *
	 * @var Plugin_Updater|null
	 */
	private static $instance = null;

	/**
	 * Whether the PUC bootstrap file was loaded.
	 *
	 * @var bool
	 */
	private static $puc_loaded = false;

	/**
	 * Returns the singleton instance.
	 *
	 * @return Plugin_Updater
	 */
	public static function get_instance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hooks PUC registration on admin requests.
	 *
	 * @return void
	 */
	private function __construct() {
		add_action('plugins_loaded', [$this, 'register_update_checker'], 20);
	}

	/**
	 * Loads Plugin Update Checker and points it at the GitHub repository.
	 *
	 * @return void
	 */
	public function register_update_checker() {
		if (!is_admin() && !wp_doing_cron()) {
			return;
		}

		$url = $this->get_repository_url();
		if ($url === '') {
			return;
		}

		$this->load_puc();
		if (!self::$puc_loaded) {
			return;
		}

		$slug = dirname(plugin_basename(ADN_A11Y_CHECKER_FILE));

		$checker = PucFactory::buildUpdateChecker(
			$url,
			ADN_A11Y_CHECKER_FILE,
			$slug,
			12,
			'puc_adn_a11y_' . str_replace('-', '_', $slug)
		);

		if (defined('ADN_A11Y_CHECKER_GITHUB_TOKEN')) {
			$token = constant('ADN_A11Y_CHECKER_GITHUB_TOKEN');
			if (is_string($token) && $token !== '') {
				$checker->setAuthentication($token);
			}
		}

		/**
		 * Fires after the GitHub update checker is ready (branch, auth, etc. can be adjusted).
		 *
		 * @param \ADN\PluginUpdateChecker\v5p0\Vcs\PluginUpdateChecker $checker Update checker instance.
		 */
		do_action('adn_a11y_checker_update_checker_ready', $checker);
	}

	/**
	 * Resolves the GitHub repository URL (owner/repo) for PUC.
	 *
	 * @return string Empty string if updates from GitHub are disabled.
	 */
	private function get_repository_url() {
		/**
		 * Overrides the GitHub repository URL (e.g. in wp-config.php).
		 *
		 * @param string $url Default URL from constant or plugin header.
		 */
		$url = apply_filters(
			'adn_a11y_checker_github_repository_url',
			$this->get_repository_url_raw()
		);

		if (!is_string($url)) {
			return '';
		}

		$url = trim($url);
		if ($url === '') {
			return '';
		}

		return esc_url_raw($url);
	}

	/**
	 * Reads URL from constant or plugin header.
	 *
	 * @return string
	 */
	private function get_repository_url_raw() {
		if (defined('ADN_A11Y_CHECKER_GITHUB_REPO')) {
			$repo = constant('ADN_A11Y_CHECKER_GITHUB_REPO');
			if (is_string($repo)) {
				return trim($repo);
			}
		}

		$headers = get_file_data(
			ADN_A11Y_CHECKER_FILE,
			[
				'github' => 'GitHub URI',
			],
			'plugin'
		);

		return isset($headers['github']) ? trim((string) $headers['github']) : '';
	}

	/**
	 * Requires the bundled Plugin Update Checker autoloader once.
	 *
	 * @return void
	 */
	private function load_puc() {
		if (self::$puc_loaded) {
			return;
		}

		$bootstrap = \ADN_A11Y_CHECKER_PATH . 'includes/plugin-update-checker.php';
		if (!is_readable($bootstrap)) {
			return;
		}

		require_once $bootstrap;
		self::$puc_loaded = true;
	}
}
