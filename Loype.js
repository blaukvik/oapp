
// constructor for Post objekt
function Post(lat, lon, nr){
  this.lat=lat;
  this.lon= lon;
  this.nr=nr;
}


function loype_addPost(post)
{
  this.poster.push(post);
  this.numposter++; 
}

function Loype(loypename, loypenr){

   this.loypenavn=loypename;
   this.loypenummer=loypenr;
   this.numposter=0;
   this.poster = new Array();

   this.addPost=loype_addPost;

}





