const { messageModel } = require("../models/messages");
const fs = require("fs");
// import {fileTypeFromFile} from 'file-type';
const fileType = require("file-type");
const apiKey = "bRvfMwVDszDocX1patVYlCt6hnA04L35";
const apiUrl = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&limit=12&offset=0&rating=g&lang=en&bundle=low_bandwidth`;

async function processMsg(userName, text, room, image) {
  currentTime = new Date().getTime();
  fileName = "";
  if (image) {
    const type = await fileType.fromBuffer(image);
    fileName = currentTime + "." + type.ext;
    const filePath = "./private/" + fileName;
    const writeStream = fs.createWriteStream(filePath);
    writeStream.write(image);
    writeStream.end();
  }
  const model = new messageModel({
    room: room,
    userName: userName,
    message: text,
    time: currentTime,
    asset: fileName
  });
  if (text == "Welcome!" && userName == "Admin") {
    return model;
  }
  let message = await model.save();
  return message;
  // return {
  //     username: userName,
  //     text,
  //     time: moment().format('h:mm a')
  // };
}

async function fetchGifs(query) {
  try {
    const response = await fetch(`${apiUrl}&q=${query}`);
    const data = await response.json();
    const gifUrls = data.data.map((gif) => gif.images.original.url);
    return gifUrls;
  } catch (error) {
    console.log(JSON.stringify(error));
    return error;
  }
}

module.exports = { processMsg, fetchGifs };
