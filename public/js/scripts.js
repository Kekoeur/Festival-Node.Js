// On se connecte au serveur socket
const socket = io('ws://localhost:3000', {
	maxHttpBufferSize: 1e8,
	pingTimeout: 60000,
	transports: ['websocket']});
// On gère l'arrivée d'un nouvel utilisateur
socket.on("connect", () => {
    // On émet un message d'entrée dans une salle
    socket.emit("enter_room", "general");
});


window.onload = () => {
    // Set the date we're counting down to
    var countDownDate = new Date("Jul 2, 2022 19:00:00").getTime();
    // Update the count down every 1 second
    var x = setInterval(function () {

        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (hours < 10) hours = "0" + hours;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        if (minutes < 10) minutes = "0" + minutes;
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        if (seconds < 10) seconds = "0" + seconds;

        document.getElementById(`value_jours`).innerHTML = days;
        document.getElementById(`value_heures`).innerHTML = hours;
        document.getElementById(`value_minutes`).innerHTML = minutes;
        document.getElementById(`value_secondes`).innerHTML = seconds;

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            document.getElementById("countdown").innerHTML = "EXPIRED";
        }
    }, 1000);
    // On écoute l'évènement submit
    let user = document.querySelector('#value_user');
    if(user) {
        user_firstname = user.getAttribute('data-firstname');
    if (user_firstname) {
        document.getElementById('sendMessage').addEventListener("submit", (e) => {
            // On empêche l'envoi du formulaire
            e.preventDefault();
            const name = document.querySelector("#name")
            const message = document.querySelector("#message");
            // On récupère le nom de la salle
            const createdAt = new Date();

            // On envoie le message
            socket.emit("chat_message", {
                name: name.value,
                message: message.value,
                room: 'general',
                createdAt: createdAt
            });

            // On efface le message
            document.getElementById("message").value = "";
        });

        socket.on("received_message", (msg) => {
            console.log(msg)
            publishMessages(msg);
        })
        socket.on("init_messages", msg => {
            console.log(msg)
            let data = JSON.parse(msg.messages);
            if (data != []) {
                data.forEach(donnees => {
                    publishMessages(donnees);
                })
            }
        });
        document.querySelector("#message").addEventListener("input", () => {
            // On récupère le nom
            const name = document.querySelector("#name").value;
            // On récupère le salon

            socket.emit("typing", {
                name: name,
                room: 'general'
            });
        });
        socket.on("usertyping", msg => {
            const writing = document.querySelector("#writing");

            writing.innerHTML = `${msg.name} tape un message...`;

            setTimeout(function () {
                writing.innerHTML = "";
            }, 5000);
        });
    }
}
    //document.getElementById("main-img").style.backgroundImage = "url('img/boom_festival_2016_pierre_ekman_343_2.1300x614.jpg')";

    document.getElementById('nav-toggle').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('nav-toggle').classList.toggle("active");
        document.getElementById('nav-menu').classList.toggle("active");
        document.getElementById('nav-overlay').classList.toggle("active");
    })
    document.getElementById('nav-overlay').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('nav-toggle').classList.toggle("active");
        document.getElementById('nav-menu').classList.toggle("active");
        document.getElementById('nav-overlay').classList.toggle("active");
    })
    /*document.getElementById('user').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('user-opt').classList.toggle("active");
    })*/
};

function publishMessages(msg) {
    let created = new Date(msg.createdAt);
    let texte = `<div><p>${msg.name} <small>${created.toLocaleDateString()}</small></p><p>${msg.message}</p></div>`

    document.querySelector("#messages").innerHTML += texte;
}

document.getElementById('display_chat').addEventListener('click', display_chat);
document.getElementById('close_chat').addEventListener('click', display_chat);
function display_chat() {
    let chat = document.getElementById('contact');
    console.log(chat);
    console.log(chat.style.display)
    let btn_display = document.getElementById('btn-chat');
    console.log(btn_display);
    console.log(btn_display.style.display)
    if (chat.style.display != 'block') {
        chat.style.display = "block";
        btn_display.style.display = 'none'
    } else {
        chat.style.display = "none";
        btn_display.style.display = 'flex'
    }
}

let us = document.getElementsByClassName("us");
for (let i = 0; i < us.length; i++) {
    const element = us[i];
    element.addEventListener('mouseover', switch_photo)
    element.addEventListener('mouseout', switch_photo_back)
}
function switch_photo(){
    this.getElementsByClassName("class")[0].classList.remove("active");
    this.getElementsByClassName("golri")[0].classList.add("active");
}
function switch_photo_back(){
    this.getElementsByClassName("class")[0].classList.add("active");
    this.getElementsByClassName("golri")[0].classList.remove("active");
}
