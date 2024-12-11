
const { Sequelize } = require('sequelize');

const modelDefiners = require('../models')

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
});

// for (const modelDefiner of modelDefiners) {
//   modelDefiner(sequelize);
// }

// for (const model of Object.keys(sequelize.models)) {
//   if (sequelize.models[model].associate) {
//       sequelize.models[model].associate(sequelize.models)
//   }
// }


module.exports = sequelize;