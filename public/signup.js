var socket = io();

var signup = document.getElementById('log-in');
var usernamesignup = document.getElementById('usrname');
var passwordsignup = document.getElementById('passwd');

signup.addEventListener('submit', function (e) {
    if (usernamesignup.value != '' && passwordsignup.value != '') {
        e.preventDefault();
        socket.emit('signup', usernamesignup.value, passwordsignup.value);
    }
});

/*var buttonsend = document.getElementById("passwd");

buttonsend.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        if (usernamesignin.value != '' && passwordsignin.value != '') {
            socket.emit('signup', usernamesignup.value, passwordsignup.value);
        }
    }
});*/

socket.on('signin message', (msg,token) => {
    console.log('message: ' + msg);
    document.getElementById("errormessage").innerText = msg;
    if (msg == "Signup successful!") {
        document.cookie = "username=" + usernamesignup.value + "; path=/";
        document.cookie = "token=" + token + "; path=/";
        usernamesignup.value = '';
        passwordsignup.value = '';
        window.location.href = "/main.html";
    }
});