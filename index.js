// On instancie express
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

// On charge "path"
const path = require("path");

// On autorise le dossier "public"
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({
    extended: true
}));

// On crée le serveur http
const http = require("http").createServer(app);

// On instancie socket.io
const io = require("socket.io")(http);

// On charge sequelize
const Sequelize = require("sequelize");

// On fabrique le lien de la base de données
const dbPath = path.resolve(__dirname, "database.sqlite");


// On se connecte à la base
const sequelize = new Sequelize("database", "username", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,

    // Sqlite seulement
    storage: dbPath
});

// On charge le modèle "Chat"
const Chat = require("./Models/Chat")(sequelize, Sequelize.DataTypes);
// On effectue le chargement "réèl"
Chat.sync();

// On charge le modèle "dbUsers"
const dbUsers = require("./Models/dbUsers")(sequelize, Sequelize.DataTypes);
// On effectue le chargement "réèl"
dbUsers.sync();

// On crée la route /
app.get("/", (req, res) => {
    console.log(req.session)
    res.sendFile(__dirname + "/index.html");
});

// On écoute l'évènement "connection" de socket.io
io.on("connection", (socket) => {
    console.log("Une connexion s'active");

    // On écoute les déconnexions
    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté");
    });

    // On écoute les entrées dans les salles
    socket.on("enter_room", (room) => {
        // On entre dans la salle demandée
        socket.join(room);
        console.log(socket.rooms);

        // On envoie tous les messages du salon
        Chat.findAll({
            attributes: ["id", "name", "message", "room", "createdAt"],
            where: {
                room: room
            }
        }).then(list => {
            socket.emit("init_messages", { messages: JSON.stringify(list) });
        });
    });

    // On écoute les sorties dans les salles
    socket.on("leave_room", (room) => {
        // On entre dans la salle demandée
        socket.leave(room);
        console.log(socket.rooms);
    });

    // On gère le chat
    socket.on("chat_message", (msg) => {
        // On stocke le message dans la base
        console.log(msg)
        const message = Chat.create({
            name: msg.name,
            message: msg.message,
            room: msg.room,
            createdAt: msg.createdAt
        }).then(() => {
            // Le message est stocké, on le relaie à tous les utilisateurs dans le salon correspondant
            io.in(msg.room).emit("received_message", msg);
        }).catch(e => {
            console.log(e);
        });
    });

    // On écoute les messages "typing"
    socket.on("typing", msg => {
        socket.to(msg.room).emit("usertyping", msg);
    })
});
app.post('/pages/signup', async function (request, response) {
    const user = await dbUsers.findOne({ where: { lastname: request.body.lastname, firstname: request.body.firstname } })
    console.log(request.body)
    if (null !== user) {
        session = request.session;
        session.user = user;
        connectedUserList.set(request.session.ID, user);
        response.redirect('login')
    } else if ('' !== request.body.username) {
        dbUsers.create({
            lastname: request.body.lastname,
            firstname: request.body.firstname,
            email: request.body.email,
            password: request.body.password,
        }).then(function (dbusers) {
            if (dbusers) {
                response.send(dbusers);
            } else {
                response.status(400).send('Error in insert new record');
            }
        })
        response.redirect('/');
    } else {
        response.redirect('/pages/signup.html');
    }
});
app.post('/pages/login', function (req, res) {
    return new Promise((resolve, reject) => {
        try {
            usermodel.findOne({
                where: {
                    email: req.email // user email
                }
            }).then(async (response) => {
                if (!response) {
                    resolve(false);
                } else {
                    if (!response.dataValues.password ||
                        !await response.validPassword(req.password,
                            response.dataValues.password)) {
                        resolve(false);
                    } else {
                        resolve(response.dataValues)
                    }
                }
            })
        } catch (error) {
            const response = {
                status: 500,
                data: {},
                error: {
                    message: "user match failed"
                }
            };
            reject(response);
        }
    })
});
app.get('/logout', async (req, res) => {
    req.session.destroy()
    res.clearCookie('connect.sid') // clean up!
    res.redirect('/');
});
// On va demander au serveur http de répondre sur le port 3000
http.listen(3000, () => {
    console.log("J'écoute le port 3000");
});