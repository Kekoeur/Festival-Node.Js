const Sequelize = require("sequelize");
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    var userSchema = sequelize.define("users", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        lastname: Sequelize.STRING,
        firstname: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.STRING,
        dispo: Sequelize.STRING,
        price: Sequelize.INTEGER,
    }, {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSaltSync(10, 'a');
                    user.password = bcrypt.hashSync(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSaltSync(10, 'a');
                    user.password = bcrypt.hashSync(user.password, salt);
                }
            }
        },
        instanceMethods: {
            validPassword: (password) => {
                return bcrypt.compareSync(password, this.password);
            }
        }
    });
    userSchema.prototype.validPassword = async (password, hash) => {
        return await bcrypt.compareSync(password, hash);
    }
    return userSchema;
}