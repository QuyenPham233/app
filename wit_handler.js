
function responseFromWit(data) {
  console.log("data from wit:");
  console.log(JSON.stringify(data));

  const intent = data.intents.length > 0 && data.intents[0] || "__foo__";
  switch (intent.name) {
    case "chao_hoi":
      return LoiGioiThieu(data);
    default:
      return handleGibberish();
  }
}

function handleGibberish() {
  return Promise.resolve(
    "Xin chào! Tôi chưa được dạy để xử lý thông tin này. Bạn có thể quay lại sau!'"
  );
}

// ----------------------------------------------------------------------------
// Chào hỏi
function LoiGioiThieu(data){
  
  return Promise.resolve("Xin chào! Tôi là Agitech bot chuyên viên trả lời tự động.");
}

exports.responseFromWit = responseFromWit;
