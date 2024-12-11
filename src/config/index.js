const sequelize = require("./sequelize");
const modelDefiners = require('../models')
for (const modelDefiner of modelDefiners) {
    modelDefiner(sequelize);
}

for (const model of Object.keys(sequelize.models)) {
    if (sequelize.models[model].associate) {
        sequelize.models[model].associate(sequelize.models)
    }
}

module.exports = sequelize;
