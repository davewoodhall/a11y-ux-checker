<?php
/**
 * PSR-4–style autoloader for the AdnA11yChecker namespace.
 *
 * Maps `AdnA11yChecker\Plugin` and `Plugin_Updater` to `includes/class-*.php`.
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
		$map      = [
			'Plugin'         => 'class-plugin.php',
			'Plugin_Updater' => 'class-plugin-updater.php',
		];
		if (!isset($map[$relative])) {
			return;
		}
		$file = dirname(__FILE__) . '/includes/' . $map[$relative];
		if (is_readable($file)) {
			require $file;
		}
	}
);
