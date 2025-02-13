import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { execute,saveData, checkLogin, saveMessage, loadMessageToUser,loadMessagesViaChannelServerName,loadMoreMessagesToUser} from "./sql.js";  
import internal from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

//TODO add a sql database for the names
const serverList = [["The Good Server", "general", "memes", "chill"], ["HW Help", "general", "memes", "math", "english", "science", "history", "spainish"], ["Ur Mom's House", "roof", "livingroom", "kitchen", "closet", "basement"]];

//DELEATE DATABSAE
// import fs from 'fs';
// const filePath = "/data/thiscord.db";
// fs.unlink(filePath, (err) => {
//     if (err) {
//         console.error(`Error deleting file: ${err.message}`);
//         return;
//     }
//     console.log(`File "${filePath}" deleted successfully.`);
// });

import { createHash } from 'crypto';
const sha256Token = "thisC0rdIsTHeBestReallycoolButIamIsBadAtCodingit";

function hashUser(username) {
  return createHash('sha256').update((username + sha256Token)).digest('hex');
}

function escapeHTML(unsafe_str) {
  return unsafe_str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
}

function getDate() {
  let date_time = new Date();
  let date = ("0" + date_time.getDate()).slice(-2);
  let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
  let year = date_time.getFullYear();
  let hours = date_time.getHours();
  let minutes = date_time.getMinutes();
  hours -= 8;
  return (month + "/" + date + "/" + year + " @ " + hours + ":" + minutes)
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});
app.use(express.static(__dirname + '/public'));

app.get('*', function(req, res){
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

io.on('connection', (socket) => {
  //loadMessageToUser(socket);
  console.log("somebody joined");
  socket.on('sendMessage', (server, channel, username, token, msg,time) => {
    if (hashUser(username) == token) {
      saveMessage(server, channel, username,msg,time,socket);
      socket.broadcast.emit("loadMessage",username, server, channel, escapeHTML(msg),time,'nothing');
    } else {
      console.log(" Username Changed:" + username + " token: " + token + " time: " + time);
      socket.emit("kick");
    }
  });
  socket.on('signup', (username, password) => {
    console.log("User signup: ", username + " password: " + password);
    saveData(username, password, socket);
  });
  socket.on('getServerList', () => {
    socket.emit('serverList', serverList);
  });
  socket.on('loadServerMessages', (server, channel) => {
    //console.log("Loading messages for server: ", server + " channel: " + channel);
    loadMessagesViaChannelServerName(server, channel,socket);
  });
  socket.on('loadMoreMessages', (server, channel, amount) => {
    //console.log("Loading more messages for server: ", server + " channel: " + channel + " amount: " + amount);
    loadMoreMessagesToUser(server, channel, amount ,socket);
  });
  socket.on('signin', (username, password) => {
    console.log("User signin: ", username + " password: " + password);
    checkLogin(username, password, socket);
  });

});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
