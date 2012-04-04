<?php

class Aaaaa_Players {
	
	private $_db;
	private $_tbl = 'players';
	
	public function __construct(Zend_Db_Adapter_Abstract $db) {
		$this->_db = $db;
	}
	
	public function save($data) {
		
	}
	
	public function getPlayers() {
		return array();
	}
}