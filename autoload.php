<?php
/**
 * PSR-4–style autoloader for the AdnA11yChecker namespace.
 *
 * Maps `AdnA11yChecker\Plugin` to `includes/class-plugin.php`.
 *
 * @package AdnA11yChecker
 */

if (!defined('ABSPATH')) {
	exit;
}

spl_autoload_register(
	static function ($class) {
		$prefix = 'AdnA11yChecker\\';
		$len    = strlen($prefix);
		if (strncmp($prefix, $class, $len) !== 0) {
			return;
		}
		$relative = substr($class, $len);
		if ($relative !== 'Plugin') {
			return;
		}
		$file = dirname(__FILE__) . '/includes/class-plugin.php';
		if (is_readable($file)) {
			require $file;
		}
	}
);
