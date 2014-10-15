<?php 
// JSON encode and send back to the server
header('Content-type: application/json; charset=utf-8');

/*header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: *');
*/
//ini_set('display_errors',1); error_reporting(E_ALL); 

  $log_dir = dirname( __FILE__ ) . '/logs/';
  //$log_name = "posts-" . $_SERVER['REMOTE_ADDR'] . "-" . date("Y-m-d-H") . ".log";
  $log_name = "oapp_php.log";
  $fp=fopen( $log_dir . $log_name, 'a' );

if ( isset($_POST) && is_array($_POST) && count($_POST) > 0 ) { 
  $log_entry = gmdate('r') . "\t" . $_SERVER['REQUEST_URI'] . "-" . serialize($_POST) . "\n";
  fputs($fp, $log_entry);

}
else if ( isset($_POST) ) { 
  $log_entry = gmdate('r') . "\t" . $_SERVER['REQUEST_URI'] . "-" . serialize($_POST) . "\n";
  fputs($fp, $log_entry);
}
else
{
  $log_entry = gmdate('r') . "Ikke noe post\n";
  fputs($fp, $log_entry);
}
 


  $jsonloype=trim($_POST["json"]);

  $log_entry = gmdate('r') . "jsonloype= " . $jsonloype . "\n";
  fputs($fp, $log_entry);

  $loype = json_decode($jsonloype);


$con = mysql_connect("localhost","skullcom_oapp","oBalder01");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

$db_selected = mysql_select_db("skullcom_oapp", $con);
if (!$db_selected)
  {
  die('Could not use: ' . mysql_error());
  }

/* legg inn i tabell  POSTER
   først slett gammel
*/

$result_res = mysql_query("DELETE FROM POSTER WHERE LoypeNr=$loype->loypenummer");
if ($result_res == FALSE)
{
  die('Query failed: ' . mysql_error());
}

  for( $n = 0; $n < $loype->numposter; $n++ ) {
    $nummer = $loype->poster[$n]->nr;
    $lat=$loype->poster[$n]->lat;
    $lon=$loype->poster[$n]->lon;

$result_res = mysql_query("INSERT INTO POSTER (LoypeNr, postNr, lat, lon)
                          VALUES ('$loype->loypenummer', '$nummer', '$lat', '$lon' )");
if ($result_res == FALSE)
{
  die('Query failed: ' . mysql_error());
}

  }
mysql_close($con);
    
//return
   $data = array('status'=> 'success','success'=> true,'message'=>'Success message: hooray!');
	 
// JSON encode and send back to the server
//header('Content-type: application/json');
//header('Access-Control-Allow-Origin: *');

 echo(json_encode($data));

  $log_entry = gmdate('r') . "Lagret " . $n . " poster \n";
  fputs($fp, $log_entry);


?>
