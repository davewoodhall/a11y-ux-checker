<?php
/**
 * Plugin Name: A11Y & UX Checker
 * Description: Vérifie l'accessibilité et l'expérience utilisateur du site.
 * Version: 0.0.1
 * Author: ADN Communication
 * Author URI: https://adn.communication
 * Text Domain: adn-a11y-checker
 * GitHub URI: https://github.com/adn-communication/adn-a11y-ux-checker
 *
 * @package AdnA11yChecker
 */

if (!defined('ABSPATH')) {
	exit;
}

define('ADN_A11Y_CHECKER_VERSION', '0.0.1');
define('ADN_A11Y_CHECKER_FILE', __FILE__);
define('ADN_A11Y_CHECKER_PATH', plugin_dir_path(__FILE__));

require_once dirname(__FILE__) . '/autoload.php';

\AdnA11yChecker\Plugin::get_instance();
\AdnA11yChecker\Plugin_Updater::get_instance();

define('ADN_A11Y_CHECKER_GITHUB_REPO', 'https://github.com/davewoodhall/adn-a11y-ux-checker');
