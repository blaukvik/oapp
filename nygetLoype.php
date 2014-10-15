<?php 
// JSON encode and send back to the server
header('Content-type: application/json; charset=utf-8');


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
  //$jsonloype = '{"loypenavn":"navn","loypenummer":5,"numposter":0,"poster":[]}';



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

/* les tabell  POSTER
*/


$content = mysql_query("SELECT * FROM POSTER WHERE loypeNr=$loype->loypenummer ORDER BY postNr ASC");
if ($content == FALSE)
{
  die('Query failed: ' . mysql_error());
}


/*
{"loypenavn":"navn","loypenummer":3,"numposter":3,"poster":[{"lat":59.13026858015918,"lon":11.406490802764893},
                                                  {"lat":59.13064290694189,"lon":11.404752731323242},
                                                  {"lat":59.13067593557923,"lon":11.406404972076416}
                                                 ]}
*/

  $log_entry = gmdate('r') . " parse loype\n";
  fputs($fp, $log_entry);

$poststring='';

$numposter = 0;

    // første rad
    $row = mysql_fetch_array($content);
       $poststring= $poststring . '{"lat":' . $row['lat'] . ',"lon":' . $row['lon'] . ',"nr":' . $row['postNr'] . '}';
       $numposter++; 
    
  $log_entry = gmdate('r') . $poststring . " \n";
  fputs($fp, $log_entry);

    while($row = mysql_fetch_array($content))
    {
       $poststring= $poststring . ', {"lat":' . $row['lat'] . ',"lon":' . $row['lon'] . ',"nr":' . $row['postNr'] . '}';
       $numposter++; 
  $log_entry = gmdate('r') . $poststring . " \n";
  fputs($fp, $log_entry);
    }

echo "{";

echo '"loypenavn":"dummy",';
echo '"loypenummer":' . $loype->loypenummer . ',';
echo '"numposter":' . $numposter . ',';
echo '"poster":[';
echo $poststring;
echo ']}';


mysql_close($con);
    
  $log_entry = gmdate('r') . "Lest $numposter poster \n";
  fputs($fp, $log_entry);


?>
