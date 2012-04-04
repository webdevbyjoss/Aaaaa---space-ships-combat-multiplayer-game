<?php

// init db connection
$dbConfig = include(APPLICATION_PATH . '/config.php');
$db = Zend_Db::factory('Mysqli', $dbConfig);

// run controller code
require_once APPLICATION_PATH . '/Api.php';