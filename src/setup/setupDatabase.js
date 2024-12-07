module.exports = function setupDatabase() {
	const sequelize = require('../config/sequelize');
	sequelize.sync().then(() => {
		console.log('Connection has been established successfully')
	}).catch(
		(error) => {
			console.error("Unable to connect to database", error)
		}
	)
}