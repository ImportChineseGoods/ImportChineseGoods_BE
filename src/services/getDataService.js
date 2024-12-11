require('dotenv').config();

const sequelize = require('../config');
const Order = sequelize.models.Order;
const Consignment = sequelize.models.Consignment;
const Complaint = sequelize.models.Complaint;
const History = sequelize.models.History;
const Customer = sequelize.models.Customer;
const Parameter = sequelize.models.Parameter;
const responseCodes = require('../untils/response_types');

const { Op } = require('sequelize');

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

const getOrderDepositService = async (customerId) => {
    try {
        const customer = await Customer.findOne({
            where: { id: customerId },
            attributes: ['balance', 'deposit_rate'],
        });

        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            customer,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getDepositInfoService = async () => {
    try {
        const data = await Parameter.findAll({
            attributes: ['type', 'value'],
            where: {
                type: {
                    [Op.in]: ['hotline', 'bank', 'bank_account', 'bank_owner'],
                },
            },
        });
        return {
            ...responseCodes.GET_DATA_SUCCESS,
            data
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    getOverviewService,
    getOrderDepositService,
    getDepositInfoService
}