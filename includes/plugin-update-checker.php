<?php
namespace ADN\PluginUpdateChecker\v5p0;

use ADN\PluginUpdateChecker\v5\PucFactory as MajorFactory;
use ADN\PluginUpdateChecker\v5p0\PucFactory as MinorFactory;

require __DIR__ . '/plugin-update-checker/v5p0/Autoloader.php';
new Autoloader();

require __DIR__ . '/plugin-update-checker/v5p0/PucFactory.php';
require __DIR__ . '/plugin-update-checker/v5/PucFactory.php';

foreach (
    array(
        'Plugin\\UpdateChecker' => Plugin\UpdateChecker::class,
        'Theme\\UpdateChecker'  => Theme\UpdateChecker::class,

        'Vcs\\PluginUpdateChecker' => Vcs\PluginUpdateChecker::class,
        'Vcs\\ThemeUpdateChecker'  => Vcs\ThemeUpdateChecker::class,

        'GitHubApi'    => Vcs\GitHubApi::class,
    )
    as $pucGeneralClass => $pucVersionedClass
) {
    MajorFactory::addVersion($pucGeneralClass, $pucVersionedClass, '5.0');
    MinorFactory::addVersion($pucGeneralClass, $pucVersionedClass, '5.0');
}