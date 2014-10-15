
/* 
 * Oapp.js
 * 
 * sammlet utgave
 * 
 * 
 */

if (google !== undefined)
    google.maps.event.addDomListener(window, 'load', initialize);
else
    logText("Ingen forbindelse til googlemaps");

var nopos = false;

var loypeModus = 0;
var startTime = 0;

//var count = 0;
var totlen =0;

var loypeNr = 1;
var num_poster = 0;
// array av LatLon pos
var post_pos = [];
// array av markører
var marker_post = [];

var post_strek;

/* 
 * selve kartet
 * @type google.maps.Map
 */
var map;

/**
 * senter pos, default er Høiås
 * Oppdateres og settes til virkelig posisjon når den finnnes
 * @type google.maps.LatLng
 */
var pos_center = new google.maps.LatLng(59.12870, 11.40735);

var zoom_level = 18;

/*
 * Eegen posisjon, oppdateres 
 * @type google.maps.LatLng|google.maps.LatLng
 * 
 */
var ownPosition;

/**
 * Hvis satt, så tegnes marker og sirkel
 * @type Number
 */
var visEgenPos = 1;
var own_marker;
var own_circle;

/*
 * Halen er en array av de siste "haleLengde" punktene
 * @type Number
 */
var visHale = 1;
var haleLengde = 50;
var hale;

var updateLocation;
var updCount = 0;


var automatiskSentrering = 1;
var maxSenterAvstand = 48;


var lopsModus = false;
var lopernavn="";
var next_control = 0;
var harStartet = false;
var klarTilStart = false;
var post_found;

var FIND_LIMIT = 5;
var POST_COLOR = '#CC00CC';
var FOUND_COLOR = '#00AA00';
//var NEXT_COLOR = '#00FF00';
var NEXT_COLOR = 'yellow';

var linjefarge = "#E01BE0";


/*
 * funksjon som setter opp kart fra kartverket
 * legger inn funksjon spm henter tile fra statkart
 */
function StatkartMapType(name, layer)
{
    this.layer = layer;
    this.name = name;
    this.alt = name;

    this.tileSize = new google.maps.Size(256, 256);
    this.maxZoom = 19;

    /* set opp funksjon som henter karttiles */
    this.getTile = function(coord, zoom, ownerDocument) {
        var div = ownerDocument.createElement('DIV');
        div.style.width = this.tileSize.width + 'px';
        div.style.height = this.tileSize.height + 'px';
        div.style.backgroundImage = "url(http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=" + this.layer + "&zoom=" + zoom + "&x=" + coord.x + "&y=" + coord.y + ")";
        return div;
    };
}


function calcDistance(a, b)
{
    var distance = google.maps.geometry.spherical.computeDistanceBetween(a, b);
    return distance;
}
function calcHeading(a, b)
{
    var h = google.maps.geometry.spherical.computeHeading(a, b);
    return h;
}

/*
 * Sentrer
 * @returns {undefined}
 */
function onEgenPosKlikk()
{
    // set senter
    map.setCenter(ownPosition);
}

/*
 * Resentrer på løype
 */
function OnSenterKlikk() {
    map.setCenter(pos_center);
    map.setZoom(zoom_level);

}

function onNyKlikk() {
    
    // tøm
    for (n = 1; n <= num_poster; n++)
    {
        marker_post[n - 1].setMap(null);
    }
    num_poster = 0;
    marker_post = [];

    post_strek.getPath().clear();    

    totlen = 0;
    setText('id_loypelengde', totlen + " m");
 
}

/*
 Kalles når pos kommer OK første gang
 */
function gotPositionOK(position)
{
    ownPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var posTime = new Date(position.timestamp);

    // flytt marker dit (ble satt til center først)
    own_marker.setPosition(ownPosition);

    // flytt own_circle and update radius & color
    own_circle.setCenter(ownPosition);

    // set egen plass midt på kart
    map.setCenter(ownPosition);
    own_circle.setRadius(position.coords.accuracy);

//  setText('gpsStatus', "upd="+updCount+"," + "gotPosOK");
//  setText('gpsPos', "lat: " + position.coords.latitude + ", lon: " +position.coords.longitude);
    
    setOppdatertTid(posTime);

if (nopos === true)
{
    nopos = false;
    own_marker.setIcon('blue.png');
}


    /*
     hale
     */
    if (hale === undefined)
    {
        
        var tykkelse = 3;
        hale = new google.maps.Polyline({
            strokeColor: linjefarge,
            strokeOpacity: 1.0,
            map: map,
            strokeWeight: tykkelse
        });
    }
    else
    {
        // tøm gammel hale
        hale.getPath().clear();
    }

    // stopp gamle watcher       
    if (updateLocation !== null)
    {
        navigator.geolocation.clearWatch(updateLocation);
    }

    // start watch      
    updateLocation = navigator.geolocation.watchPosition(
            positionUpdateFromWatch,
            positionUpdateFailed,
            {enableHighAccuracy: true, maximumAge: 30000, timeout: 30000});
}


/* første get etter klikk feilet, typisk timeout 
 watch er ikke startet ?
 */
function gotPositionFailed(error)
{
    /*
     bytt til GUL
     */

    logText("gotPositionFailed");
    own_marker.setIcon('yellow.png');

    noPos = true;
}

function setText(elem, txt)
{
//    if (document.getElementById(elem) && document.getElementById(elem).innerHTML)
//        document.getElementById(elem).innerHTML = txt;

    if (document.getElementById(elem)) 
        document.getElementById(elem).value = txt;

}

function setOppdatertTid(posTime) 
{
    setText('id_gpsage', ("0" + posTime
            .getHours())
            .slice(-2) + ":" + ("0" + posTime
            .getMinutes())
            .slice(-2) + ":" + ("0" + posTime
            .getSeconds())
            .slice(-2));
}

function checkIfCloseToNextControl()
{
    if (harStartet === false)
        return;


    var now = new Date();    
    var bruktTid = diffTimeMs(startTime, now);
    var strtid = mstimeToString(bruktTid);
    logText("Brukt tid=" + strtid);
    setText('id_brukttid', strtid);

    var distance = calcDistance(ownPosition, post_pos[next_control]);
    logText("post nr " + next_control + " avstand " + distance);

    if (distance < FIND_LIMIT)
    {
        logText("post nr " + next_control + " funnet !");
        marker_post[next_control].setOptions({strokeColor: FOUND_COLOR});

        if (next_control < num_poster)
        {
            next_control = next_control + 1;
            logText("post nr " + next_control + " er neste");
            marker_post[next_control].setOptions({strokeColor: NEXT_COLOR});
        }
        else
        {
            logText("checkIfCloseToNextControl ferdig");
            setText('id_brukttid', 'Ferdig:' + strtid);
            
            harStartet = false;
            klarTilStart = false;
            
        }
    }
}

function checkIfStart()
{
    if (harStartet)
        return;

//    var distance = calcDistance(ownPosition, post_pos[next_control]);
//    logText("start post, nr " + next_control + ", avstand " + distance.toFixed(0));

    /*
     komme innen for 5 m, og så start tiden når du fjerner deg ...
     */
    var distance = calcDistance(ownPosition, post_pos[0]);
    var heading = calcHeading(ownPosition, post_pos[0]);
    logText("avstand til start " + distance.toFixed(0));
    logText("heading til start " + heading.toFixed(1));
    
    setText('id_brukttid', 'Avst start:' + distance.toFixed(0) + ' m');

    if (klarTilStart == false)
    {
        if (distance < FIND_LIMIT)
        {
            /* nå er vi innenfor post 0 sitt område */
            logText("Klar til start");
            setText('id_brukttid', 'Start når du vil...');
            klarTilStart = true;
            marker_post[0].setOptions({strokeColor: 'green'});
            next_control = 1;
            marker_post[next_control].setOptions({strokeColor: 'yellow'});
        }
    }
    else  // klar til start
    {
        if (distance >= FIND_LIMIT)
        {
            logText("Start");
            startTime = new Date();
            setText('id_brukttid', 'Startet');
            
            harStartet = true;
        }
        else
        {
            logText("Venter ved start");
        }
    }
}


/*
 callback for checkbox - vis egen pos
 */
function onCbVisEgenPosKlikk() {

    var cb = document.getElementById("id_cbvisegenpos");

    if (cb !== undefined && cb.checked)
    {
        logText("vis egen posisjon");
        visEgenPos = 1;
        own_marker.setVisible(true);
        own_circle.setVisible(true);
    }
    else
    {
        logText("Ikke vis egen posisjon");
        visEgenPos = 0;
        own_marker.setVisible(false);
        own_circle.setVisible(false);
    }
}

function onCbAutoSentrerKlikk()
{
    var cb = document.getElementById("id_cbautosentrer");

    if (cb !== undefined && cb.checked)
    {
        logText("autosentrer posisjon");
        automatiskSentrering = 1;
    }
    else
    {
        logText("Ikke autosentrer");
        automatiskSentrering = 0;
    }
    
}

function onCbHaleKlikk()
{
    var cb = document.getElementById("id_cbhale");

    if (cb !== undefined && cb.checked)
    {
        logText("Hale på");
        visHale = 1;
    }
    else
    {
        logText("Hale av");
        visHale = 0;
        
        if (hale !== undefined)
            hale.getPath().clear();
    }
    
}


/* selve hovedgreia...
 */

function positionUpdateFromWatch(position)
{
    ownPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var posTime = new Date(position.timestamp);


if (nopos === true)
{
    nopos = false;
    own_marker.setIcon('blue.png');
}


    /* flytt markør
     * og fix sirkel etc
     * 
     * synlighet er styrt uavhengig av dette
     */
    own_marker.setPosition(ownPosition);

    // flytt sirkel, set radius & farge
    own_circle.setCenter(ownPosition);
    own_circle.setRadius(position.coords.accuracy);

    if (position.coords.accuracy > 100.0) {
        own_circle.setOptions({strokeColor: '#FF0000'});  //red
    }
    else if (position.coords.accuracy > 50.0) {
        own_circle.setOptions({strokeColor: 'yellow'});
    }
    else if (position.coords.accuracy > 25.0) {
        own_circle.setOptions({strokeColor: '#00AA00'});  // dark green
    }
    else {//if (position.coords.accuracy > 0){
        own_circle.setOptions({strokeColor: 'green'});
    }

    if (visHale)
    {
        // lagre i historien
        if (hale.getPath().length > haleLengde)
            hale.getPath().removeAt(0);

        hale.getPath().push(ownPosition);
    }


    if (automatiskSentrering)
    {
        var dc = calcDistance(ownPosition, map.getCenter());
        logText("Avstand til senter" + dc);

        if (dc > maxSenterAvstand)
        {
            logText("Re-sentrer");
            map.setCenter(ownPosition);
        }
    }

//  // bare noen oppdateringer
//  updCount = updCount + 1;
//  setText('gpsStatus', "upd="+updCount+"," + "updFromWatchOK");
//  setText('gpsPos', "lat: " + position.coords.latitude + ", lon: " +position.coords.longitude);  
//  setText('gpsAccu', position.coords.accuracy);  

    setOppdatertTid(posTime);


    if (lopsModus === true && num_poster > 0)
    {
        logText("Løpsmodus");
        if (harStartet)
            checkIfCloseToNextControl();
        else
            checkIfStart();
    }
    else
        logText("Ikke løp");
  

    logText("positionUpdateFromWatch ferdig");

}

function positionUpdateFailed(error)
{
    /* oppdatering feilet 
     dvs ingen ny pos i tiden ...
     bytt til '?'
     
     timertask som oppdaterer age ?
     
     */
    //var now = new Date();
    //var age = now.getTime() - lastposition.timestamp;


//  updCount = updCount + 1;
//  setText('gpsStatus', "upd="+updCount+"," + "updFromWatchFailed:" + error.message);  

    logText("gotPositionFailed");
    
    own_marker.setIcon('yellow.png');
    own_circle.setOptions({strokeColor: '#FF0000'});


    nopos=true;
}


function getOwnPosition()
{
    logText("leter etter gps");

    // W3C Geolocation 
    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(
                gotPositionOK,
                gotPositionFailed,
                {enableHighAccuracy: true, maximumAge: 30000, timeout: 30000}
        );
    } else {
        // Browser doesn't support Geolocation
        logText("GPS virker ikke ?");
        alert("Kan ikke få GPS pos, er det skrudd av ?");

        // fjern fra kart  
        if (own_marker)
        {
            own_marker.setMap(null);
        }
        if (own_circle)
        {
            own_circle.setMap(null);
        }
        // bruk defaultsenter    
        ownPosition = pos_center;
    }

}

function lagreLoperNavn()
{  
  var nyttnavn = document.getElementById('id_lopernavn').value;
  localStorage.setItem("oappLoperNavn", nyttnavn);
  logText("Satt navn til " + nyttnavn);
  
  return false;
}

function initialize()
{
    logText("start init");

    /* set navigerings stil for maps
     */
    var useragent = navigator.userAgent;
    var myStyle;

    if (useragent.indexOf('iPhone') != -1) {
        myStyle = google.maps.NavigationControlStyle.SMALL;
    } else if (useragent.indexOf('Android') != -1) {
        myStyle = google.maps.NavigationControlStyle.ANDROID;
    } else {
        myStyle = google.maps.NavigationControlStyle.DEFAULT;  // DEFAULT, SMALL, ZOOM_PAN    
    }

    // fake fullscreen:
    window.scrollTo(0,1);


    loperNavn = localStorage.getItem("oappLoperNavn");
    logText("Satt navn til " + loperNavn);
    setText('id_lopernavn', loperNavn);


    loypeNr = localStorage.getItem("oappLoypeNr");
    logText("Satt nr til " + loypeNr);
    setText('id_loypenr', loypeNr);



    map = new google.maps.Map(document.getElementById("id_mapcanvas"),
            {
                zoom: zoom_level,
                center: pos_center,
                scaleControl: true,
                navigationControlOptions: {
                    style: myStyle
                },
                mapTypeControlOptions: {
                    mapTypeIds: ['topo2', google.maps.MapTypeId.SATELLITE, 'europa'],
                    // mapTypeIds: ['kartdata2', 'sjo_hovedkart2', 'topo2', 'topo2graatone', 'toporaster2', 'europa', google.maps.MapTypeId.SATELLITE],
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
                }
            });

    map.mapTypes.set('topo2', new StatkartMapType("Kart", "topo2"));
    map.mapTypes.set('kartdata2', new StatkartMapType("Kartdata 2", "kartdata2"));
    map.mapTypes.set('sjo_hovedkart2', new StatkartMapType("Sjo hovedkart", "sjo_hovedkart2"));    
    map.mapTypes.set('topo2graatone', new StatkartMapType("Graatone", "topo2graatone"));
    map.mapTypes.set('toporaster2', new StatkartMapType("Toporaster", "toporaster2"));
    map.mapTypes.set('europa', new StatkartMapType("Europa", "europa"));

    // default maptype
    map.setMapTypeId('topo2');


    logText("start i senter");

// lag egen markør - midt i kartet  
    own_marker = new google.maps.Marker({
        position: pos_center,
        visible: false,
        map: map,
        icon: 'blue.png'
    });

    own_circle = new google.maps.Circle({center: pos_center,
        radius: 1000,
        visible: false,
        map: map,
        strokeColor: 'red'});

    if (visEgenPos == 1)
    {
        own_marker.setVisible(true);
        own_circle.setVisible(true);
    }

    if (loypeModus)
    {
        google.maps.event.addListener(map, 'click', onLoypeleggingKlikk);
    }



    /* start posisjonering */
    getOwnPosition();

    ///window.onload = function(){timer.start(10, 'timer');};

    //var t = new timer();
    //timer.start(10, 'timer');


}

function logText(intxt)
{
    var now = new Date();
    
    var txt = now.getHours() + ":" + now.getMinutes()+ ":" + now.getSeconds() + ":" + intxt;
    
    if (console)
        console.log(txt);
    else
        alert(txt);

    
    var txtarea = document.getElementById('id_log');
    
    if (txtarea && txtarea.innerHTML)
    {    
        var newtext = txtarea.innerHTML.toString() + txt + '\n';

        txtarea.innerHTML = newtext;

        txtarea.scrollTop =    txtarea.scrollHeight;
    } 

}







function onLagreKlikk() 
{
    logText("lagere og sender loype");
    
    var box = document.getElementById('id_loypenr');
    var loypenr = box.value;
    logText("Loype nr:" + loypenr);

    // lag løype instans
    var loy;    
    loy = new Loype("løypenavn", loypenr);
    var i;
    for (i = 0; i < num_poster; i++)
    {
        var llpos = marker_post[i].center;
        var post = new Post(llpos.lat(), llpos.lng(), i);
        logText("post " + i + " lat=" + post.lat);
        loy.addPost(post);
    }
    sendLoype(loy);
    
    
    logText("Lagring ferdig");

    return false;
}

function sendLoype(loype) 
{
    logText("send");
    var jsonstring = JSON.stringify(loype, replacer);
    logText("jsonstring=" + jsonstring);

    // post til server
    $.ajax({
        type: "POST",
        url: "nyacceptLoype.php",
        data: {json: jsonstring},
        success: function(data) 
        {
            logText('succ:' + data.message);

            return true;
        },
        complete: function() 
        {
            logText('complete:');
        },
        error: function(x, textStatus, errorThrown) 
        {
            logText('ajax err:' + x.status + ', st=' + textStatus + ", t=" + errorThrown);

            if (x.status === 0) {
                logText('Offline ? !\n Sjekk nett.');
            } else if (x.status === 404) {
                logText('Requested URL not found.');
            } else if (x.status === 500) {
                logText('Internel Server Error.');
            } else if (textStatus === 'parsererror') {
                logText('Error.\nParsing JSON Request failed.');
            } else if (textStatus === 'timeout') {
                logText('Request Time out.');
            } else {
                logText('Unknow Error.\n' + x.responseText);
            }

            return false;
        }


    });

}

function sendOPosisjon(pos) 
{
    logText("send");
    var jsonstring = JSON.stringify(pos, replacer);
    logText("jsonstring=" + jsonstring);

    // post til server
    $.ajax({
        type: "POST",
        url: "acceptPosisjon.php",
        data: {json: jsonstring},
        success: function(data) 
        {
            logText('succ:' + data.message);

            return true;
        },
        complete: function() 
        {
            logText('complete:');
        },
        error: function(x, textStatus, errorThrown) 
        {
            logText('ajax err:' + x.status + ', st=' + textStatus + ", t=" + errorThrown);

            if (x.status === 0) {
                logText('Offline ? !\n Sjekk nett.');
            } else if (x.status === 404) {
                logText('Requested URL not found.');
            } else if (x.status === 500) {
                logText('Internel Server Error.');
            } else if (textStatus === 'parsererror') {
                logText('Error.\nParsing JSON Request failed.');
            } else if (textStatus === 'timeout') {
                logText('Request Time out.');
            } else {
                logText('Unknow Error.\n' + x.responseText);
            }

            return false;
        }


    });

}




function onDoGetKlikk()
{
    /* fjern gamle markører */
    for (n = 1; n <= num_poster; n++)
    {
        marker_post[n - 1].setMap(null);
    }
    num_poster = 0;

    


    logText("henter loype");
    var loy;
    var box = document.getElementById('id_loypenr');
    var loypenr = box.value;
    logText("Nr:" + loypenr);
    loy = new Loype("ukjent", loypenr);

    getLoype(loy);
    
    next_control = 0;
    logText("post nr " + next_control + " er neste");
    
    logText("Get Ferdig");
    
    
    localStorage.setItem("oappLoypeNr", loypenr);
    
    $("#contentLayer").click();

    return false;
}

function replacer(key, value)
{
    if (typeof value === 'number' && !isFinite(value)) {
        return String(value);
    }
    return value;
}

function getLoype(loype)
{
    logText("Hent");
    var jsonstring = JSON.stringify(loype, replacer);
    logText("jsonstring", jsonstring);

    $.ajax({
        type: "POST",
        url: "nygetLoype.php",
        data: {json: jsonstring},
        success: function(data) {
            logText('lest inn ' + data.numposter + ' poster');

            logText("tømmer gamle poster");
            var n;
// tøm
delete marker_post;
//while(marker_post.length > 0) {
//   marker_post.pop();
//}

        if (post_strek !== undefined)
        {
          post_strek.getPath().clear();
        }

        //marker_post = [];
        marker_post = new Array();
        post_pos = [];

          post_strek = new google.maps.Polyline({
            strokeColor: linjefarge,
            strokeOpacity: 1.0,
            map: map,
            strokeWeight: 3});

            logText("legger ut poster");
 
            for (n = 0; n < data.numposter; n++)
            {
                var pnr = data.poster[n].nr;                        
                var rad = 10;

                if (map.getZoom() > 14)
                    rad = 5;
                else
                    rad = 15;

                post_pos[pnr] = new google.maps.LatLng(data.poster[n].lat, data.poster[n].lon);

                logText("post " + pnr + " lat=" + data.poster[n].lat);
 
                marker_post[pnr] = new PostSymbol(post_pos[pnr], pnr, 7);

                post_strek.getPath().push(post_pos[pnr]);

            }
            num_poster = data.numposter;

    marker_post[0].setOptions({strokeColor: NEXT_COLOR});
    
    setText('id_brukttid', 'Løype 1');


            return true;
        },
        complete: function() {
            logText('complete:');
        },
        error: function(x, textStatus, errorThrown) {
            logText('ajax err:' + x.status + ', st=' + textStatus + ", t=" + errorThrown);

            if (x.status === 0) {
                logText('You are offline!!\n Please Check Your Network.');
            } else if (x.status === 404) {
                logText('Requested URL not found.');
            } else if (x.status === 500) {
                logText('Internel Server Error.');
            } else if (textStatus === 'parsererror') {
                logText('Error.\nParsing JSON Request failed.');
            } else if (textStatus === 'timeout') {
                logText('Request Time out.');
            } else {
                logText('Unknown Error.\n' + x.responseText);
            }

            setText('id_brukttid', 'Prøv igjen');

            return false;
        }


    });



}



function onLoypeleggingKlikk(event)
{
      var s = new PostSymbol(event.latLng, num_poster, 7);
      marker_post.push(s);

        logText("post " + num_poster + " lat=" + event.latLng.lat());

if (post_strek === undefined)
{
    post_strek = new google.maps.Polyline({
      strokeColor: linjefarge,
      strokeOpacity: 1.0,
      map: map,
      strokeWeight: 3});
}
else
{
    if (num_poster === 0)
        post_strek.getPath().clear();    
}
    post_strek.getPath().push(event.latLng);

    if (num_poster >= 1)
    {
        // tot len
        totlen = totlen + calcDistance(marker_post[num_poster - 1].center, marker_post[num_poster].center);
        logText('loypeLengde ' + totlen + " m");
        setText('id_loypelengde', totlen + " m");



    }

    num_poster++;
    logText( num_poster + " poster");

}



function diffTimeMs(from,to)
{
    var diff = to.getTime() - from.getTime();
    
    return diff;
}

function mstimeToString(msec)
{
    //var msec = dateval.getTime();
    
    var hh = Math.floor(msec / 3600000);
    msec = msec - hh*3600000;
    
    var mm= Math.floor(msec / 60000);
    msec = msec - mm*60000;
    
    var ss = Math.floor(msec / 1000);
    msec = msec - ss*1000;
    
    var str = "" + (hh<10?"0":"") + hh + ":" + (mm<10?"0":"") + mm + ":" +(ss<10?"0":"") + ss + "." + msec;
    
    return str;    
}




function PostSym_getCenter() 
 { return this.center; }
 
 function PostSym_setOptions(o)
 {
   logText("set options post nr:" + this.nr);

   if (this.nr===0)
      return this.poly.setOptions(o);  
   else
      return this.circle.setOptions(o);  
 }
 function PostSym_setMap(o)
 {
   if (this.nr===0)
       return this.poly.setMap(o);  
   else
       return this.circle.setMap(o);  
 }
function PostSymbol(center, nummer, meter)
{
    var center;
    var nr;
    var poly;
    var cirle;
    
    this.center = center;
    this.nr = nummer;
    
    if (nummer===0)
    {
        // start-trekant
        var topLatLon;
        var leftLatLon;
        var rightLatLon;
        
        var len = Math.sqrt(Math.pow(meter,2) - Math.pow(meter/2, 2));

        topLatLon = google.maps.geometry.spherical.computeOffset(center, len, 0);
        leftLatLon = google.maps.geometry.spherical.computeOffset(center, len, 120);
        rightLatLon = google.maps.geometry.spherical.computeOffset(center, len, 240);

        if (this.poly === undefined)
        {
            this.poly = new google.maps.Polyline({
              strokeColor: linjefarge,
              strokeOpacity: 1.0,
              map: map,
              strokeWeight: 3});
        }
        else
        {
              this.poly.getPath().clear();    
        }
        this.poly.getPath().push(topLatLon);
        this.poly.getPath().push(leftLatLon);
        this.poly.getPath().push(rightLatLon);
        this.poly.getPath().push(topLatLon);
        
    }
    else
    {
        this.circle = new google.maps.Circle({center: center,
            radius: 5,
            fillOpacity: 0.0,
            map: map,
            strokeColor: '#CC00CC'});
    }
    
    
    this.getCenter = PostSym_getCenter;
    this.setOptions = PostSym_setOptions;
    this.setMap = PostSym_setMap;
    
    return this;
    
}



function timer() 
{
    var basePeriod = 10000;
    var timeoutRef;

    return {
      start : function(speed, id) {
        logText("Start timer");
        timer.run();
      },

      run: function() {
        if (timeoutRef) clearInterval(timeoutRef);

        logText("Timer");
        
        if (harStartet === false)
        {
            
        }   
        else
        {
            var now = new Date();    
            var bruktTid = diffTimeMs(startTime, now);
            var strtid = mstimeToString(bruktTid);
            logText("Brukt tid=" + strtid);
            setText('bruktTid', strtid);
        }
        
        logText("lager pos");
        var pos = new oPosisjon("Bårdx", 3);
        var p2 = new oPos(ownPosition);
        pos.addOPos(p2);       
        
        sendOPosisjon(pos);
        
        if (nopos === true)
        {
            logText("restart pos");
            
            getOwnPosition();
        }
        

        timeoutRef = setTimeout(timer.run, basePeriod);
      },

    }

}


