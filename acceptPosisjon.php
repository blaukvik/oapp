<?php 

// JSON encode and send back to the server
header('Content-type: application/json; charset=utf-8');

  $log_dir = dirname( __FILE__ ) . '/logs/';
  $log_name = "posts.log";
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
 


  $jsonpos=trim($_POST["json"]);
  //$jsonpos = '{"navn":"Bla","nummer":5,"numpos":3,"posisjoner":[{"tid":1,"lat":43,"lon":12},{"tid":2,"lat":43,"lon":12},{"tid":3,"lat":43,"lon":12}]}';

  $log_entry = gmdate('r') . "jsonpos= " . $jsonpos . "\n";
  fputs($fp, $log_entry);

  $dpos = json_decode($jsonpos);


$con = mysql_connect("localhost","skullcom_oapp","oBalder01");
if (!$con)
  {
       $data = array('status'=> 'error','success'=> false,'message'=> 'DB login feil:' . mysql_error());
       echo(json_encode($data));
       die();
  }

$db_selected = mysql_select_db("skullcom_oapp", $con);
if (!$db_selected)
  {
       $data = array('status'=> 'error','success'=> false,'message'=> 'DB åpningsfeil:' . mysql_error());
       echo(json_encode($data));
       die();
  }

/* legg inn i tabell  POS
   først slett gammel ?
*/


  for( $n = 0; $n < $dpos->numpos; $n++ ) 
  {
        $tid=$dpos->pos[$n]->tid;
        $lat=$dpos->pos[$n]->lat;
        $lon=$dpos->pos[$n]->lon;

/*
        echo("INSERT INTO POS (LoypeNr, LoperNavn, tid, lat, lon)
                              VALUES ('$dpos->nummer', '$dpos->navn', '$tid', '$lat', '$lon' )");
*/
        $result_res = mysql_query("INSERT INTO POSISJONER (loypeNr, loperNavn, tid, lat, lon)
                              VALUES ('$dpos->nummer', '$dpos->navn', '$tid', '$lat', '$lon' )");
        if ($result_res == FALSE)
        {
            $data = array('status'=> 'error','success'=> false,'message'=> 'DB feil:' . mysql_error());
            echo(json_encode($data));
            die();
        }
  }
  mysql_close($con);
    
//return
   $data = array('status'=> 'success','success'=> true,'message'=>'Lagret ' . $n . ' posisjoner  OK');
	 
// JSON encode and send back to the server
 echo(json_encode($data));

  $log_entry = gmdate('r') . "Lagret " . $n . " posisjoner \n";
  fputs($fp, $log_entry);


?>
