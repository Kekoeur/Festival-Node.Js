
// On instancie express
const express = require("express");
const app = express();
//const http = require('http-proxy');
const session = require('express-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const fs = require('fs');
// On charge "path"
const path = require("path");

// On autorise le dossier "public"
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({
    extended: true
}));
const oneDay = 1000 * 60 * 60 * 24;
const middlewareSession = session({
    secret: 'secretforpostbackfestoche',
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
});
app.use(middlewareSession);
app.use((req, res, next) => {
    if (req.session != undefined && req.session.user != null)
        res.locals.me = req.session.user;
    next();
});
app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');
// On crée le serveur http
var options = {
	target: "http://51.77.245.158:3000",
	ws: true,
	key: fs.readFileSync('./privkey.pem'),
	cert: fs.readFileSync('./cert.pem'),
        ca: fs.readFileSync('./chain.pem'),

        requestCert: false,
        rejectUnauthorized: false
}
const http = require("http").createServer(app);
/*const httpProxy = require("http-proxy");

httpProxy.createProxyServer({
    target: "http://localhost:3000",
    ws: true,
  }).listen(80);*/
//app.listen(3000);
//var server = https.createServer(options, app);
const socketIo = require('socket.io')(http, {
	cors: {
		origin: "//post-back.site",
		methods: ["GET", "POST"]
	}
});
//(server);

// On instancie socket.io
const io = socketIo;

// On charge sequelize
const Sequelize = require("sequelize");

// On fabrique le lien de la base de données
const dbPath = path.resolve(__dirname, "database.sqlite");

// On se connecte à la base
const sequelize = new Sequelize("database", "username", "password", {
    host: "51.77.245.158",
    dialect: "sqlite",
    logging: false,

    // Sqlite seulement
    storage: dbPath,
	dialectOptions: {
    mode: 2
  }
});

// On charge le modèle "Chat"
const Chat = require("./Models/Chat")(sequelize, Sequelize.DataTypes);
// On effectue le chargement "réèl"
Chat.sync();

// On charge le modèle "dbUsers"
const dbUsers = require("./Models/dbUsers")(sequelize, Sequelize.DataTypes);
// On effectue le chargement "réèl"
dbUsers.sync();

var sess;
// On crée la route /
app.get("/", async (req, res) => {
    sess = req.session;
    console.log('req session', req.session);
    if (sess.user) {
        res.render('home', {
            firstname: sess.user.firstname,
            lastname: sess.user.lastname,
            email: sess.user.email,
            dispo: sess.user.dispo
        })
    } else
        res.render('home', {
            firstname: '',
            lastname: '',
            email: '',
            dispo: ''
        })
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
app.get('/register', async (req, res) => {
    res.render('register', {
        'register': true,
        'title': 'register',
        'title_name': 'register2',
        'error': ''
    })
});
app.post('/register', async function (request, response) {
    var user = await dbUsers.findOne({ where: { lastname: request.body.lastname, firstname: request.body.firstname } });
    console.log('user', user)
    if (null !== user) {
        let body = {
            'login': true,
            'title': 'login',
            'title_name': 'login'
        }
        if (user.email == request.body.email) {
            body.error = 'Utilisateur déja incrit, veuillez vous connecter'
            body.email = request.body.email
        } else {
            body.error = 'Utilisateur déja incrit avec une autre adresse mail, veuillez vous connecter'
            body.email = user.email
        }
        response.render('login', body)
    } else if ('' !== request.body.username) {
        dbUsers.create({
            lastname: request.body.lastname,
            firstname: request.body.firstname,
            email: request.body.email,
            password: request.body.password,
            price: request.body.price,
            dispo: request.body.dispo
        }).then(function (user) {
		console.log('user ajouter');
            if (user) {
                sess = request.session;
                sess.user = user;
                response.redirect('/');
            } else {
                response.status(400).send('Error in insert new record');
            }
        })
    } else {
        response.redirect('/register');
    }
});
app.get('/login', async (req, res) => {
    res.render('login', {
        'login': true,
        'title': 'login',
        'title_name': 'login',
        'error': '',
        'email': ''
    })
});
app.post('/login', async function (req, res) {
    let ok = await authenticateUserWithemail({ email: req.body.email, password: req.body.password });
    const user = await dbUsers.findOne({ where: { email: req.body.email } });
    if (ok) {
        sess = req.session;
        sess.user = user;
        res.redirect('/');
    } else {
        obj = {
            'login': true,
            'title': 'login',
            'title_name': 'login',
        };
        if (user) {
            obj.error = 'Mot de passe incorrect',
                obj.email = req.body.email
        } else {
            obj.error = 'Utilisateur inconnue',
                obj.email = ''
        }
        res.render('login', obj)
    }
});
const authenticateUserWithemail = (user) => {
    return new Promise((resolve, reject) => {
        try {
            dbUsers.findOne({
                where: {
                    email: user.email // user email
                }
            }).then(async (response) => {
                if (!response) {
                    resolve(false);
                } else {
                    if (!response.dataValues.password ||
                        !await response.validPassword(user.password,
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
};
app.get('/logout', async (req, res) => {
    req.session.destroy()
    res.clearCookie('connect.sid') // clean up!
    res.redirect('/');
});
app.get("/user", async (req, res) => {
    sess = req.session;
    if (sess.user) {
        res.render('home', {
            firstname: sess.user.firstname,
            lastname: sess.user.lastname,
            email: sess.user.email,
            dispo: sess.user.dispo
        })
    } else
        res.render('home', {
            firstname: '',
            lastname: '',
            email: '',
            dispo: ''
        })
});
// On va demander au serveur http de répondre sur le port 3000
http.listen(3000,  () => {
    console.log("J'écoute le port 3000");
});
