<?php

class Aaaaa_Service {
	
	protected $db = null;
	protected $tbl = 'players';
	protected $lastid = null;
	
	public function __construct($db) {
		$this->db = $db;
	}
	
	public function updatePlayer($data, $id = null)
	{
		$player = array();
		foreach ($data as $key => $val) {
			$player[] = " `$key` = '$val' ";
		}
		
		if (empty($id)) {
			$op = 'INSERT INTO ';
			$where = '';
			$player[] = " `created` = NOW() ";
		} else {
			$op = 'UPDATE ';
			$where = ' WHERE id = ' . intval($id);
		}
		
		$sql = $op . $this->tbl . ' SET ' . implode(', ', $player) . ' ' . $where;
		
		$res = $this->db->query($sql);
		
		if (empty($id)) {
			$this->lastid = $this->db->lastInsertId();
		} else {
			$this->lastid = $id;
		}
		
		return $this->lastid;
	}
	
	public function getPlayers() {
		$sql = 'SELECT id, x, y, angle, speed, action FROM '. $this->tbl;
		$data = $this->db->fetchAll($sql);
		
		$players = array();
		foreach ($data as $p) {
			$players[$p['id']] = $p;
		}
		
		return array(
				'id' => $this->lastid,
				'players' => $players,
		);
	}
}