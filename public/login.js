var socket = io();
var signin = document.getElementById('log-in');
var usernamesignin = document.getElementById('usrname');
var passwordsignin = document.getElementById('passwd');

signin.addEventListener('submit', function(e) {
    if (usernamesignin.value != '' && passwordsignin.value != '') {
    e.preventDefault();
    socket.emit('signin', usernamesignin.value, passwordsignin.value);
    }
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
// if (getCookie("username")) {
//     window.location.href = "/main2.html";
// }

/*var buttonsend = document.getElementById("passwd");

buttonsend.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        if (usernamesignin.value != '' && passwordsignin.value != '') {
        event.preventDefault();
        socket.emit('signin', usernamesignin.value, passwordsignin.value);
        }
    }
});*/

socket.on('signin message', (msg, token) => {
    console.log('message: ' + msg);
    document.getElementById("errormessage").innerText = msg;
    if (msg == "Login successful!") {
    document.cookie = "username=" + usernamesignin.value + "; path=/";
    document.cookie = "token=" + token + "; path=/";
    usernamesignin.value = '';
    passwordsignin.value = '';
    window.location.href = "/main.html";
    }
    
});