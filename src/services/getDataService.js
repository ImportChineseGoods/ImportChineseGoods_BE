require('dotenv').config();

const sequelize = require('../config/sequelize');
const Order = require('../models/order')(sequelize);
const Consignment = require('../models/consignment')(sequelize);
const DeliveryNote = require('../models/deliveryNote')(sequelize);
const Complaint = require('../models/complaint')(sequelize);
const History = require('../models/history')(sequelize);
const Customer = require('../models/customer')(sequelize);
const responseCodes = require('../untils/response_types');

const getOverviewService = async (user) => {
    try {
        const customer = await Customer.findByPk(user.id, {
            attributes: ['balance'],
        });

        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        const ordersCount = await Order.count({
            where: { customer_id: user.id },
        })

        const consignmentsCount = await Consignment.count({
            where: { customer_id: user.id },
        })

        const complaintsCount = await Complaint.count({
            where: { customer_id: user.id },
        })

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            data: {
                balance: customer.balance,
                ordersCount,
                consignmentsCount,
                complaintsCount,
            },
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    getOverviewService,
}