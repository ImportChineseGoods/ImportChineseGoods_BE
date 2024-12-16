require('dotenv').config();

const sequelize = require('../config');
const deliveryNote = require('../models/deliveryNote');
const Order = sequelize.models.Order;
const Consignment = sequelize.models.Consignment;
const Complaint = sequelize.models.Complaint;
const DeliveryNote = sequelize.models.DeliveryNote;
const Customer = sequelize.models.Customer;
const Parameter = sequelize.models.Parameter;
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

// const getOrderDepositService = async (customerId) => {
//     try {
//         const customer = await Customer.findOne({
//             where: { id: customerId },
//             attributes: ['balance', 'deposit_rate'],
//         });

//         if (!customer) {
//             return responseCodes.ACCOUNT_NOT_FOUND;
//         }

//         return {
//             ...responseCodes.GET_DATA_SUCCESS,
//             customer,
//         };
//     } catch (error) {
//         console.error(error);
//         return responseCodes.SERVER_ERROR;
//     }
// };

// const getDepositInfoService = async () => {
//     try {
//         const data = await Parameter.findAll({
//             attributes: ['type', 'value'],
//             where: {
//                 type: {
//                     [Op.in]: ['hotline', 'bank', 'bank_account', 'bank_owner'],
//                 },
//             },
//         });
//         return {
//             ...responseCodes.GET_DATA_SUCCESS,
//             data
//         }
//     } catch (error) {
//         console.error(error);
//         return responseCodes.SERVER_ERROR;
//     }
// };

// const getComplaintOrderService = async (customerId) => {
//     try {
//         const orders = await Order.findAll({
//             where: { customer_id: customerId },
//             attributes: ['id'],
//         });

//         const consignments = await Consignment.findAll({
//             where: { customer_id: customerId},
//             attributes: ['id'],
//         });

//         return {
//             ...responseCodes.GET_DATA_SUCCESS,
//             data: {
//                 orders,
//                 consignments,
//             },
//         }
//     } catch (error) {
//         console.error(error);
//         return responseCodes.SERVER_ERROR;
//     }
// }

module.exports = {
    getOverviewService,
    // getOrderDepositService,
    // getDepositInfoService,
    // getComplaintOrderService
}