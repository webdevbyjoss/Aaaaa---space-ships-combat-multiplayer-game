<?php
/*
 * Define the absolute/relative paths to the library path, the app library path,
* app path and the database configuration path
*/
define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/../app') );
define('APPLICATION_CACHE', realpath(APPLICATION_PATH . '/../tmp'));
define('APPLICATION_LIBRARY_PATH', realpath(APPLICATION_PATH . '/../library'));

$paths = ''; // $paths = explode(PATH_SEPARATOR, get_include_path());
$paths[] = '/usr/share/php/libzend-framework-php';
$paths[] = APPLICATION_LIBRARY_PATH;
set_include_path(implode(PATH_SEPARATOR, $paths));
unset($paths);

// init autoloading
require_once 'Zend/Loader/Autoloader.php';
$loader = Zend_Loader_Autoloader::getInstance();
$loader->registerNamespace(array('Aaaaa_'));

// bootstrap application
require_once '../bootstrap.php';