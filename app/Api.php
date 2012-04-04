<?php 

$s = new Aaaaa_Service($db);

/**
 * Update player information
 */
if (empty($_REQUEST['id'])) {
	$id = $s->updatePlayer($_POST);
} else {
	$id = $s->updatePlayer($_POST, $_REQUEST['id']);
}


/**
 * Get information about other players
 */
$return = $s->getPlayers();

header('Content-type: application/json');
echo json_encode($return);