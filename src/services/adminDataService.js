require('dotenv').config();

const sequelize = require('../config');
const Order = sequelize.models.Order;
const Consignment = sequelize.models.Consignment;
const Complaint = sequelize.models.Complaint;
const DeliveryNote = sequelize.models.DeliveryNote;
const Customer = sequelize.models.Customer;
const BOL = sequelize.models.BOL;
const History = sequelize.models.History;
const responseCodes = require('../untils/response_types');

const { Op } = require('sequelize');

const getOverviewService = async (user) => {
    try {
        if (user.role === 'warehouse') {
            const deliveryNoteCount = await DeliveryNote.count({
                where: {
                    status: 'not exported',
                    update_at: {
                        [Op.gt]: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            });

            const warehouseVN = await Order.count({
                where: {
                    status: 'vietnam_warehouse_received',
                },
            }) + await Consignment.count({
                where: {
                    status: 'vietnam_warehouse_received',
                },
            });

            const warehouseTQ = await Order.count({
                where: {
                    status: 'china_warehouse_received',
                },
            }) + await Consignment.count({
                where: {
                    status: 'china_warehouse_received',
                },
            });

            return {
                ...responseCodes.GET_DATA_SUCCESS,
                data: {
                    deliveryNoteCount,
                    warehouseVN,
                    warehouseTQ,
                },
            };
        }
        const ordersCount = await Order.count({
            where: {
                status: {
                    [Op.notIn]: ['returned', 'cancelled'],
                },
            },
        });

        const consignmentsCount = await Consignment.count({
            where: {
                status: {
                    [Op.notIn]: ['returned', 'cancelled'],
                },
            },
        });

        const complaintsCount = await Complaint.count({
            where: {
                status: {
                    [Op.notIn]: ['completed', 'cancelled'],
                },
            },
        });

        const dailyOrderRevenue = await Order.sum('total_amount', {
            where: {
                status: 'exported',
                update_at: {
                    [Op.gt]: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });

        const dailyConsignmentsRevenue = await Consignment.sum('total_amount', {
            where: {
                status: 'exported',
                update_at: {
                    [Op.gt]: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });

        const dailyRevenue = dailyOrderRevenue + dailyConsignmentsRevenue;

        const deliveryNoteCount = await DeliveryNote.count({
            where: {
                status: 'not exported',
                update_at: {
                    [Op.gt]: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            data: {
                ordersCount,
                consignmentsCount,
                complaintsCount,
                dailyRevenue,
            },
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllCustomerService = async () => {
    try {
        const customers = await Customer.findAll({
            attributes: ['id', 'name'],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            data: customers,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
}

const getCustomerService = async (query) => {
    const customerConditions = {};

    if (query?.search) {
        customerConditions[Op.or] = [
            { id: { [Op.like]: `%${query.search}%` } },
            { name: { [Op.like]: `%${query.search}%` } }
        ];
    }

    const customers = await Customer.findAll({
        where: customerConditions,
        attributes: ['id', 'name'],
        limit: 10,
    });

    return {
        ...responseCodes.GET_DATA_SUCCESS,
        data: customers,
    }
};

const getOrderByCustomerService = async ({customer, type, status}) => {
    try {
        let orders = [];

        if (type === 'order') {
            orders = await Order.findAndCountAll({
                where: {
                    customer_id: customer,
                    status: status,
                },
                distinct: true,
                attributes: ['id', 'total_amount', 'status', 'amount_paid', 'outstanding_amount', 'update_at', 'weight'],
                include: [
                    {
                        model: BOL,
                        as: 'bol',
                        attributes: ['bol_code'],
                    },
                    {
                        model: History,
                        as: 'histories',
                    }
                ],
                order: [['update_at', 'DESC']]
            });
        } else {
            orders = await Consignment.findAndCountAll({
                where: {
                    customer_id: customer,
                    status: status,
                },
                distinct: true,
                attributes: ['id', 'total_amount', 'status', 'amount_paid', 'outstanding_amount', 'update_at', 'weight'],
                include: [
                    {
                        model: BOL,
                        as: 'bol',
                        attributes: ['bol_code'],
                    },
                    {
                        model: History,
                        as: 'histories',
                    }
                ],
                order: [['update_at', 'DESC']]
            });
        }

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            data: orders,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
}


module.exports = {
    getOverviewService,
    getAllCustomerService,
    getCustomerService,
    getOrderByCustomerService
}