function responseFromWit(data) {
  console.log("- - - ");
  console.log(JSON.stringify(data));
  console.log("- - - ");
  
  var intent = mostConfident(data.entities.intent);
  if (intent.value == "distanceBetween"){
    return handleDistanceBetween(data);
  }
  if (intent.value == "timeAtLocation"){
    return handleTimeAtPlace(data);
  }
  
  return handleGibberish();  
}

function handleDistanceBetween(data){
  if (data.en)
  
  if (data.entities.location.length != 2){
    return handleGibberish();
  }
  
}

function handleGibberish(){
  return Promise.resolve("ask me something like 'what time is it in New York?'"); 
}

function handleTimeAtPlace(data){
  var loc = mostConfident(data.entities.location);
  if (loc == null){
    return handleGibberish();
  }

  console.log("loc:");
  console.log(loc);
  
  var tz = loc.resolved.values[0].timezone;
  
  return currentTimeFromTimezone(tz)
    .then(res => {
    return `It's currently ${res}`;
  });
}

//https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


function currentTimeFromTimezone(loc){
  var url = "http://worldtimeapi.org/api/timezone/"+ loc;

  console.log("try fetch:  " + url);
  
  return fetch(url, {})
    .then( res => res.json() )
    .then( data => {
    console.log(data);
    
    //trim off the timezone to avoid date auto-adjusting
    var time = data.datetime.substring(0,19);
    var d = new Date(time);
    // var options = { hour: 'long', minute: 'numeric', month: 'long', day: 'numeric' };
    // console.log(d.toTimeString("en-US"));
    // console.log(d.toUTCString("en-US"));
    var timestring = d.toUTCString("en-US").substring(0,22);
    return timestring;
  });
}

function mostConfident(items){
  console.log("items:");
  console.log(items);
  if (items == null){
    return null;
  }
  if (items.length == null || items.length == 0){
    return null;
  }
  if (items.length == 1){
    return items[0];
  }
  var confidence = 0;
  var itm = null;
  
  items.forEach(function(item){
    if (item.confidence > confidence){
      confidence = item.confidence;
      itm = item;
    }
  });
  return itm;  
}

exports.responseFromWit = responseFromWit;