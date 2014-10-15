
// constructor for oPos objekt
function oPos(latLon){
  this.tid = 1; //new Date().getTime();
  this.lat = 2; //latLon.lat();
  this.lon = 3;//latLon.lng();
}


function pos_addOPos(pos)
{
  this.posisjoner.push(pos);
  this.numpos++;
}

function oPosisjon(lopernavn, loypenr)
{
   this.lopernavn=lopernavn;
   this.loypenummer=loypenr;
   this.numpos=0;
   this.posisjoner = new Array();

   this.addOPos=pos_addOPos;
}





