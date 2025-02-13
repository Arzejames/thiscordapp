var socket = io();
const messageInput = document.getElementById("messageBox");

let currentServer = "server1";
let currentChannel = "channel1";


socket.emit('getServerList');

//const serverList = [["The Good Server", "general", "memes", "chill", "HELLO"], ["HW Help", "general", "hwHelp", "CPMmemes"], ["Ur Mom's House", "livingRoom", "basement", "roof"]];
let serverList;
socket.on('serverList', (list) => {
    serverList = list;
    for (let i = 0; i < serverList.length; i++) {
        document.getElementById("server" + (i + 1) + "Text").innerText = serverList[i][0];
    }
    changeServer('server1');
    loadChannels('server1');
    setCurrentToBold(currentServer,currentServer);
});

function loadChannels(server) {
    const serverIndex = server.match(/\d/g) - 1;
    for (let i = 0; i < serverList[serverIndex].length - 1; i++) {
        let channelElement = document.getElementById("channel" + (i + 1) + "Text");
        if (!channelElement) {
            const newParagraph = document.createElement("p");
            newParagraph.innerHTML = `<li onclick="changeChannel('channel${i + 1}')" id="channel${i + 1}Text">channel${i + 1}</li>`;
            document.getElementById("channelList").appendChild(newParagraph);
            channelElement = document.getElementById("channel" + (i + 1) + "Text");
        }
        channelElement.innerText = serverList[serverIndex][i + 1];
    }
    setCurrentToBold(currentChannel, currentChannel);
}



function setCurrentToBold(idToModify, oldId) {
    const oldElement = document.getElementById(oldId + "Text");
    const newElement = document.getElementById(idToModify + "Text");
    if (oldElement) {
        oldElement.style.fontWeight = "normal";
    }
    if (newElement) {
        newElement.style.fontWeight = "bold";
    }
    console.log(`old:${oldId} new:${idToModify}`);
}



function deleteAllCookies() {
    document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
}

socket.on('kick', () => {
    clearCookiesRedirect();
});

function clearCookiesRedirect() {
    deleteAllCookies();
    window.location.href = "/login.html";
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
if (!getCookie("username")) {
    window.location.href = "/login.html";
}

var buttonsend = document.getElementById("messageBox");

buttonsend.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function getDate() {
    let date_time = new Date();
    let date = ("0" + date_time.getDate()).slice(-2);
    let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
    let year = date_time.getFullYear();
    let hours = date_time.getHours();
    let minutes = date_time.getMinutes();
    if (minutes < 10) {
        return (month + "/" + date + "/" + year + " @ " + hours + ":" + "0" + minutes)
    }
    else {
        return (month + "/" + date + "/" + year + " @ " + hours + ":" + minutes)
    }
}

function askNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications.");
      return;
    }
    Notification.requestPermission().then((permission) => {
    });
  }
  
askNotificationPermission();

function sendMessage() {
    if (messageInput.value != '') {
        socket.emit('sendMessage', currentServer, currentChannel, getCookie("username"), getCookie("token"), messageInput.value,getDate());
            const message = document.createElement("li");
            if (messageInput.value.search("fileContents:") == -1) {
                message.innerHTML = `<div id="row"><div id="name">${getCookie("username")}</div><div id="date">${getDate()}</div></div><div id="msg">${escapeHTML(messageInput.value)}</div>`;
            } else {
                message.innerHTML = `<div id="row"><div id="name">${getCookie("username")}</div><div id="date">${getDate()}</div></div><div id="msg"><img id="messageImg" src="${'data:image/png;base64,' + messageInput.value.split('fileContents:')[1]}"></div>`;
            }
            const element = document.getElementById("messageList");
            
            element.appendChild(message);
            messageInput.value = '';
            messageInput.readonly = false;
            element.scrollTop = element.scrollHeight;
    }
}

function changeServer(server) {
    //document.getElementById("currentChannelTitle").innerText = serverList[(server.match(/\d/g)-1)][0];
    document.getElementById("channelList").innerHTML = `<li id="currentChannelTitle">${serverList[(server.match(/\d/g)-1)][0]}</li>`;
    setCurrentToBold(server,currentServer);
    currentChannel = "channel1";
    currentServer = server;
    document.getElementById("messageList").innerHTML = '<button id="loadMore" onclick="loadMore()">Load More</button>';
    loadMessagesViaChannelServerName(currentServer, currentChannel);
    for (let i = 0; i < serverList[server.match(/\d/g)-1].length - 1; i++) {
        const channelElement = document.createElement("li");
        channelElement.onclick = function() { changeChannel(`channel${i+1}`); };
        channelElement.id = `channel${i+1}Text`;
        channelElement.innerText = `channel${i+1}`;
        document.getElementById("channelList").appendChild(channelElement);
        document.getElementById("channel" + (i + 1) + "Text").innerText = serverList[(server.match(/\d/g)-1)][i+1];
    }
    setCurrentToBold("channel1","channel1");
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

function changeChannel(channel) {
    setCurrentToBold(channel, currentChannel);
    currentChannel = channel;
    document.getElementById("messageList").innerHTML = '<button id="loadMore" onclick="loadMore()">Load More</button>';
    loadMessagesViaChannelServerName(currentServer, currentChannel);
}

function loadMessagesViaChannelServerName(server, channel) {
    socket.emit('loadServerMessages', server, channel);
}

//loadMessagesViaChannelServerName(currentServer, currentChannel);

const username = getCookie("username");
if (username) {
    const userElement = document.createElement("p");
    userElement.innerHTML = `<p id="usr">${username}</p>`;
    const element3 = document.getElementById("h");
    element3.appendChild(userElement);
}

function sendNotification(messageUser,messageText) {
    var audio = new Audio('content/tone.wav');
    audio.play();
    const img = "content/icon512.png";
    const text = `New message from ${messageUser}: ${messageText}`;
    const notification = new Notification("ThisCord", { body: text, icon: img });
}

socket.on('loadMessage', (username, server, channel, msg, time, error) => {
    if (currentChannel == channel && currentServer == server) {
        if (error == "startmore") {
            document.getElementById("messageList").innerHTML = '<button id="loadMore" onclick="loadMore()">Load More</button>';
        }
        const message = document.createElement("li");
        if (msg.search("fileContents:") == -1) {
            message.innerHTML = `<div id="row"><div id="name">${username}</div><div id="date">${time}</div></div><div id="msg">${msg}</div>`;
        } else {
            message.innerHTML = `<div id="row"><div id="name">${username}</div><div id="date">${time}</div></div><div id="msg"><img id="messageImg" src="${'data:image/png;base64,' + msg.split('fileContents:')[1]}"></div>`;
        }
        const element = document.getElementById("messageList");
        element.appendChild(message);
        element.scrollTop = element.scrollHeight;
        if (error == "nothing") {
            sendNotification(username,msg);
        } else if (error != "originalLoad") {
            document.getElementById("loadMore").scrollIntoView();
        }
    }
});

let moreToLoad = 0;
function loadMore() {
    moreToLoad += 10;
    socket.emit('loadMoreMessages', currentServer, currentChannel, moreToLoad);
}

// function uploadFile() {
//     const uploadButton = document.getElementById("uploadFile");
//     const fileInput = document.getElementById("fileInput");
//     const file = fileInput.files[0];
//     const reader = new FileReader();
//     reader.onloadend = function() {
//         const base64String = reader.result.split(',')[1];
//        
//     reader.readAsDataURL(file);
// } messageInput.value = base64String;
//         sendMessage();
//     };

function CancelFile() {
    messageInput.value = '';
    document.getElementById("uploadFile").innerText = "Upload File";
    document.getElementById("fileInput").onclick = "";
    messageInput.readOnly = false;
    setTimeout(function(){
        document.getElementById("fileInput").type = "file";
    }, 500);
}
const uploadInput = document.getElementById("fileInput");
uploadInput.addEventListener("change",() => {
    const file = uploadInput.files[0];
    if (file.size <= 16384) {
        if (file.type === "image/png") {
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64String = reader.result.split(',')[1];
                messageInput.value = "file: " + file.name + " fileContents:" + base64String;
                messageInput.readOnly = true;
                document.getElementById("uploadFile").innerText = "Cancel File";
                document.getElementById("fileInput").onclick = CancelFile;
                document.getElementById("fileInput").type = "text";
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById("uploadFile").innerText = "File must be a png";
            setTimeout(function(){
                document.getElementById("uploadFile").innerText = "Upload File";
            }, 3000);
        }
    } else {
        document.getElementById("uploadFile").innerText = "File too large";
        setTimeout(function(){
            document.getElementById("uploadFile").innerText = "Upload File";
        }, 3000);
    }
});