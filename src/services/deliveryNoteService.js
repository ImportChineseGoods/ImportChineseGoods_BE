require('dotenv').config();

const sequelize = require('../config/sequelize');
const DeliveryNote = require('../models/deliveryNote')(sequelize);
const Consignment = require('../models/consignment')(sequelize);
const Order = require('../models/order')(sequelize);
const responseCodes = require('../untils/response_types');
const { paymentTransactionService } = require('./transactionService');

const createDeliveryNoteService = async (user, data) => {
    const transaction = await sequelize.transaction();
    try {
        const orders = data.orders;

        if (!orders || orders.length === 0) {
            await transaction.rollback();
            return responseCodes.INVALID;
        }

        const totalWeight = orders.reduce((sum, order) => sum + (order.weight || 0), 0);
        const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) + data?.incurred_fee;  
        const amountPaid = orders.reduce((sum, order) => sum + (order.amount_paid || 0), 0);

        const deliveryNote = await DeliveryNote.create(
            {
                customer_id: data.customer_id,
                commodity_money: totalAmount,
                total_weight: totalWeight,
                total_amount: totalAmount,
                amount_paid: amountPaid,
                outstanding_amount: totalAmount - amountPaid,
                number_of_order: orders.length,
                status: 'not exported',
                type: data.type,
                note: data?.note,
            },
            { transaction, user }
        );

        if (data.type === 'consignment') {
            for (const order of orders) {
                const consignment = await Consignment.findOne({ where: { id: order.id }, transaction });
                if (consignment) {
                    await consignment.update(
                        {
                            delivery_id: deliveryNote.id,
                            status: 'waiting_export',
                        },
                        { transaction, user }
                    );
                }
            }
        } else if (data.type === 'order') {
            for (const order of orders) {
                const existingOrder = await Order.findOne({ where: { id: order.id }, transaction });
                if (existingOrder) {
                    await existingOrder.update(
                        {
                            delivery_id: deliveryNote.id,
                            status: 'waiting_export',
                        },
                        { transaction, user }
                    );
                }
            }
        }
        
        await transaction.commit();
        return {
            ...responseCodes.CREATE_DELIVERY_SUCCESS,
            deliveryNote,
        };
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllDeliveryNoteService = async (page, pageSize) => {
    try {
        const deliveryNotes = await DeliveryNote.findAndCountAll({
            deliveryNote: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            deliveryNotes
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getDeliveryNoteByIdService = async (id) => {
    try {
        const deliveryNote = await DeliveryNote.findOne({ where: { id } });
        if (!deliveryNote) {
            return responseCodes.NOT_FOUND;
        }

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            deliveryNote
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
}

const queryDeliveryNoteService = async (query, page, pageSize) => {
    try {
        const conditions = {};

        if (query.status && query.status.length > 0) {
            conditions.status = {
                [sequelize.Op.in]: query.status
            };
        }

        if (query.search) {
            conditions[sequelize.Op.or] = [
                { customer_id: { [sequelize.Op.like]: `%${query.search}%` } },
                { id: { [sequelize.Op.like]: `%${query.search}%` } }
            ];
        }

        if (query.fromDate && query.toDate) {
            conditions.update_at = {
                [sequelize.Op.between]: [query.fromDate, query.toDate]
            };
        } else if (query.fromDate) {
            conditions.update_at = {
                [sequelize.Op.gte]: query.fromDate
            };
        } else if (query.toDate) {
            conditions.update_at = {
                [sequelize.Op.lte]: query.toDate
            };
        }

        const deliveryNotes = await DeliveryNote.findAndCountAll({
            where: conditions,
            deliveryNote: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            deliveryNotes
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateDeliveryNoteService = async (id, data) => {
    try {
        const deliveryNote = await DeliveryNote.findOne({ where: { id } });
        if (!deliveryNote) {
            return responseCodes.NOT_FOUND;
        }
        await deliveryNote.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            deliveryNote
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const cancelDeliveryNoteService = async (user, id) => {
    const transaction = await sequelize.transaction();
    try {
        const deliveryNote = await DeliveryNote.findOne({
            where: { id },
            include: [
                { model: Order, as: 'orders' },
                { model: Consignment, as: 'consignments' },
            ],
            transaction,
        });

        if (!deliveryNote) {
            await transaction.rollback();
            return responseCodes.NOT_FOUND;
        }

        const status = ['exported', 'cancelled'];
        if (status.includes(deliveryNote.status)) {
            await transaction.rollback();
            return responseCodes.UNPROFITABLE;
        }

        await deliveryNote.update({ status: 'cancelled' }, { transaction, user });

        if (deliveryNote.orders.length > 0) {
            for (const order of deliveryNote.orders) {
                await order.update(
                    {
                        delivery_id: null,
                        status: 'waiting_export',
                    },
                    { transaction, user }
                );
            }
        }

        if (deliveryNote.consignments.length > 0) {
            for (const consignment of deliveryNote.consignments) {
                await consignment.update(
                    {
                        delivery_id: null,
                        status: 'waiting_export',
                    },
                    { transaction, user }
                );
            }
        }

        await transaction.commit();
        return {
            ...responseCodes.UPDATE_SUCCESS,
            deliveryNote,
            history,
        };
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const exportDeliveryNoteService = async (user, id) => {
    const transaction = await sequelize.transaction();
    try {
        const deliveryNote = await DeliveryNote.findOne({
            where: { id },
            include: [
                { model: Order, as: 'orders' },
                { model: Consignment, as: 'consignments' },
            ],
            transaction,
        });
        if (!deliveryNote) {
            await transaction.rollback();
            return responseCodes.NOT_FOUND;
        }

        if (deliveryNote.status !== 'not exported') {
            await transaction.rollback();
            return responseCodes.DELIVERY_EXPORTED;
        }

        if (deliveryNote.orders.length > 0) {
            for (const order of deliveryNote.orders) {
                const paymentData = {
                    customer_id: order.customer_id,
                    value: order.outstanding_amount,
                    type: 'payment',
                    content: 'Thanh toán cho đơn hàng ' + order.id,
                    employee_id: user.id,
                }
                await paymentTransactionService(paymentData, transaction);
                await order.update(
                    {
                        delivery_id: null,
                        status: 'exported',
                        amount_paid: order.total_amount,
                    },
                    { transaction, user }
                );
            }
        }

        if (deliveryNote.consignments.length > 0) {
            for (const consignment of deliveryNote.consignments) {
                const paymentData = {
                    customer_id: consignment.customer_id,
                    value: consignment.outstanding_amount,
                    type: 'payment',
                    content: 'Thanh toán cho đơn ký gửi ' + consignment.id,
                    employee_id: user.id,
                }
                await paymentTransactionService(paymentData, transaction);
                await consignment.update(
                    {
                        delivery_id: null,
                        status: 'exported',
                        amount_paid: consignment.total_amount,
                    },
                    { transaction, user }
                );
            }
        }

        if (deliveryNote.incurred_fee > 0) {
            const paymentData = {
                customer_id: deliveryNote.customer_id,
                value: deliveryNote.incurred_fee,
                type: 'payment',
                content: 'Thanh toán phí phát sinh của phiếu xuất kho ' + deliveryNote.id,
                employee_id: user.id,
            }
            await paymentTransactionService(paymentData, transaction);
        }

        await deliveryNote.update({ status: 'exported', amount_paid: deliveryNote.total_amount }, { transaction, user });

        await transaction.commit();
        return {
            ...responseCodes.UPDATE_SUCCESS,
            deliveryNote,
            history,
        };
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
}

module.exports = {
    createDeliveryNoteService,
    getAllDeliveryNoteService,
    getDeliveryNoteByIdService,
    queryDeliveryNoteService,
    updateDeliveryNoteService,
    cancelDeliveryNoteService,
    exportDeliveryNoteService,
}