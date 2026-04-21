<?php

/**
 * Plugin Name: A11Y & UX Checker
 * Description: Runs accessibility and user experience checks for your site.
 * Version: 1.1.0
 * Author: ADN Communication
 * Author URI: https://adn.communication
 * Text Domain: a11y_ux_checker
 * Domain Path: /languages
 * GitHub URI: https://github.com/adn-communication/adn-a11y-ux-checker
 *
 * @package AdnA11yChecker
 */

if (!defined('ABSPATH')) {
	exit;
}

define('ADN_A11Y_CHECKER_VERSION', '1.1.0');
define('ADN_A11Y_CHECKER_FILE', __FILE__);
define('ADN_A11Y_CHECKER_PATH', plugin_dir_path(__FILE__));
define('A11Y_UX_CHECKER_TEXT_DOMAIN', 'a11y_ux_checker');

require_once dirname(__FILE__) . '/autoload.php';

\AdnA11yChecker\Plugin::get_instance();
\AdnA11yChecker\Plugin_Updater::get_instance();

define('ADN_A11Y_CHECKER_GITHUB_REPO', 'https://github.com/davewoodhall/a11y-ux-checker');
