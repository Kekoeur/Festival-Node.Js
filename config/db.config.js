require('dotenv-flow').config({ silent: true });
const env = process.env;
const { v4: uuidv4 } = require('uuid');
const ucfirst = require("ucfirst");
const Jabber = require('jabber');
const jabber = new Jabber();
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const { RandomPicture } = require('random-picture')

initialize().then();

module.exports = db = {};

async function initialize() {

    const config = {
        'host': env.DATABASE_HOST,
        'port': env.DATABASE_PORT,
        'user': env.DATABASE_USERNAME,
        'password': env.DATABASE_PASSWORD,
        'database': env.DATABASE_NAME,
    };

    // create db if it doesn't already exist
    const { host, port, user, password, database } = config;
    const connection = await mysql.createConnection({ host, port, user, password });
    //await connection.query(`DROP DATABASE IF EXISTS \`${database}\`;`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    // connect to db
    const sequelize = new Sequelize(database, user, password, {
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            dateStrings: true,
            typeCast: true
        }, // timezone: 'Europe/Paris'
    });

    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

    // init models and add them to the exported db object
    db.User = require('/Models/user.model')(sequelize);
    db.Chat = require('/Models/chat.model')(sequelize);

    // Relations
    //db.Chat.belongsToMany(db.User, { through: 'UserChat', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    const jsonUser = {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        foreignKey: {
            as: 'User',
            name: 'user_uuid',
            allowNull: false,
        }
    };

    db.User.hasMany(db.Chat, { ...jsonUser });
    db.Chat.belongsTo(db.User, { ...jsonUser });

    // const jsonOwner = {
    //     onDelete: 'CASCADE',
    //     onUpdate: 'CASCADE',
    //     foreignKey: {
    //         as: 'User',
    //         name: 'created_by',
    //         allowNull: false,
    //     }
    // };
    // db.User.hasMany(db.Groupe, { ...jsonOwner });
    // db.Groupe.belongsTo(db.User, { ...jsonOwner });

    // sync all models with database
    await sequelize.sync();
}
