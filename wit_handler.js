function responseFromWit(data) {
  console.log("data from wit:");
  console.log(JSON.stringify(data));

  const intent = data.intents.length > 0 && data.intents[0] || "__foo__";
  console.log(intent.name);
  switch (intent.name) {
    case "distanceBetween":
      return handleDistanceBetween(data);
    case "timeAtPlace":
      return handleTimeAtPlace(data);
    case "chao_hoi":
      return LoiGioiThieu(data);
  }
  
  return handleGibberish();
}

function handleGibberish() {
  return Promise.resolve(
    "Xin chào! Tôi chưa được dạy để xử lý thông tin này. Bạn có thể quay lại sau!'"
  );
}

// ----------------------------------------------------------------------------
// handleDistanceBetween

function handleDistanceBetween(data) {
  const location = data.entities['wit$location:location'];
  if (location == null || location.length != 2) {
    return handleGibberish();
  }

  var loc0 = location[0].resolved.values[0];
  var loc1 = location[1].resolved.values[0];
  var distance = getDistanceFromLatLonInKm(
    loc0.coords.lat,
    loc0.coords.long,
    loc1.coords.lat,
    loc1.coords.long
  );
  distance = roundTo(distance, 0.01);
  return Promise.resolve(
    `It's ${distance}km from ${loc0.name} to ${loc1.name}`
  );
}

//https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function roundTo(val, round) {
  return Math.floor(val / round) * round;
}

// ----------------------------------------------------------------------------
// handleTimeAtPlace

function handleTimeAtPlace(data) {
  const loc = data.entities['wit$location:location'] && data.entities['wit$location:location'][0];
  if (loc == null) {
    return handleGibberish();
  }

  const tz = loc.resolved.values[0].timezone;
  const placeName = loc.resolved.values[0].name;

  return currentTimeFromTimezone(tz).then(res => {
    return `It's currently ${res} in ${placeName}`;
  });
}

function currentTimeFromTimezone(loc) {
  const url = "http://worldtimeapi.org/api/timezone/" + loc;

  return fetch(url, {})
    .then(res => res.json())
    .then(data => {
      //trim off the timezone to avoid date auto-adjusting
      const time = data.datetime.substring(0, 19);
      return (new Date(time)).toUTCString("en-US").substring(0, 22);
    });
}

// ----------------------------------------------------------------------------
// Chào hỏi
function LoiGioiThieu(data){
  const noidung = data.entities['loi_mo_dau:xin_chao'];
  if (noidung == null) {
    return handleGibberish();
  }
  return Promise.resolve(
    "Xin chào! Tôi là chuyên viên trả lời tự động.\nBạn có thể hỏi tôi về:\n- Thông tin công ty.\n- Sản phẩm và dịch vụ.'"
  );
}


exports.responseFromWit = responseFromWit;
