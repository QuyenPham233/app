function responseFromWit(data) {
  console.log("data from wit:");
  console.log(JSON.stringify(data));
  
  var intent = mostConfident(data.entities.intent);
  if (intent == null){
    return handleGibberish();  
  }
  
  if (intent.value == "distanceBetween"){
    return handleDistanceBetween(data);
  }
  if (intent.value == "timeAtPlace"){
    return handleTimeAtPlace(data);
  }
  
  return handleGibberish();  
}

function handleDistanceBetween(data){
  var location = data.entities.location;
  if (location == null || location.length != 2){
    return handleGibberish();
  }

  var loc0 = location[0].resolved.values[0];
  var loc1 = location[1].resolved.values[0];
  var distance = getDistanceFromLatLonInKm(loc0.coords.lat, loc0.coords.long, loc1.coords.lat, loc1.coords.long);
  distance = roundTo(distance, 0.01);
  return Promise.resolve(`It's ${distance}km from ${loc0.name} to ${loc1.name}`); 
}

function handleGibberish(){
  return Promise.resolve("ask me something like 'what time is it in Menlo Park?' or 'how far from Menlo Park to Seattle?'"); 
}

function handleTimeAtPlace(data){
  var loc = mostConfident(data.entities.location);
  if (loc == null){
    return handleGibberish();
  }
  
  var tz = loc.resolved.values[0].timezone;
  var placeName = loc.resolved.values[0].name;
  
  return currentTimeFromTimezone(tz)
    .then(res => {
    return `It's currently ${res} in ${placeName}`;
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

function roundTo(val, round){
  return Math.floor(val / round) * round;
}

function currentTimeFromTimezone(loc){
  var url = "http://worldtimeapi.org/api/timezone/"+ loc;
  
  return fetch(url, {})
    .then( res => res.json() )
    .then( data => {    
    //trim off the timezone to avoid date auto-adjusting
    var time = data.datetime.substring(0,19);
    var d = new Date(time);
    return d.toUTCString("en-US").substring(0,22);
  });
}

function mostConfident(items){
  if (items == null || items.length == null){
    return null;
  }
  var confidence = 0;
  var res = null;
  items.forEach(function(item){
    if (item.confidence > confidence){
      confidence = item.confidence;
      res = item;
    }
  });
  return res;  
}

exports.responseFromWit = responseFromWit;