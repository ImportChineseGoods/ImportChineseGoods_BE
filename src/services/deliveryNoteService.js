require('dotenv').config();

const sequelize = require('../config');
const DeliveryNote = sequelize.models.DeliveryNote;
const Consignment = sequelize.models.Consignment;
const Order = sequelize.models.Order;
const Customer = sequelize.models.Customer;
const History = sequelize.models.History;
const Employee = sequelize.models.Employee;
const BOL = sequelize.models.BOL;

const { Op } = require('sequelize');

const responseCodes = require('../untils/response_types');
const { paymentTransactionService } = require('./transactionService');

const createDeliveryNoteService = async (user, data) => {
    const transaction = await sequelize.transaction();
    try {
        const orders = data.orders;

        if (!Array.isArray(orders) || orders.length === 0) {
            await transaction.rollback();
            return responseCodes.INVALID;
        }

        const deliveryNote = await DeliveryNote.create(
            {
                customer_id: data.customer,
                incurred_fee: data.incurred_fee,
                number_of_order: data.number,
                status: 'waiting_export',
                type: data.type,
                note: data?.note,
            },
            { transaction, user }
        );

        let total_weight = 0;
        let total_amount = 0;
        let amount_paid = 0;
        let outstanding_amount = 0;

        if (data.type === 'consignment') {
            for (const order of orders) {
                if (!order) {
                    console.log('Invalid order:', order);
                    continue;
                }

                const consignment = await Consignment.findOne({
                    where: { id: order.id },
                    lock: transaction.LOCK.SHARE,
                    transaction
                });

                if (consignment) {
                    await consignment.update(
                        {
                            delivery_id: deliveryNote.id,
                            status: 'waiting_export',
                        },
                        { transaction, user }
                    );
                } else {
                    await transaction.rollback();
                    return responseCodes.INVALID;
                }

                total_weight += consignment.weight;
                total_amount += consignment.total_amount;
                amount_paid += consignment.amount_paid;
                outstanding_amount += consignment.outstanding_amount;
            }
        } else if (data.type === 'order') {
            for (const order of orders) {
                if (!order) {
                    console.log('Invalid order:', order);
                    continue;
                }

                const existingOrder = await Order.findOne({
                    where: { id: order.id },
                    lock: transaction.LOCK.SHARE,
                    transaction
                });

                if (existingOrder) {
                    await existingOrder.update(
                        {
                            delivery_id: deliveryNote.id,
                            status: 'waiting_export',
                        },
                        { transaction, user }
                    );
                } else {
                    await transaction.rollback();
                    return responseCodes.INVALID;
                }

                total_weight += existingOrder.weight;
                total_amount += existingOrder.total_amount;
                amount_paid += existingOrder.amount_paid;
                outstanding_amount += existingOrder.outstanding_amount;
            }
        }


        await deliveryNote.update(
            {
                total_weight,
                total_amount: total_amount + data.incurred_fee,
                amount_paid,
                outstanding_amount: total_amount + data.incurred_fee - amount_paid,
            },
            { transaction, user }
        );

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
        const deliveryNote = await DeliveryNote.findOne({ 
            where: { id },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['name', 'id', 'phone', 'address']
                },
                {
                    model: Order,
                    as: 'orders',
                    attributes: ['id', 'total_amount', 'amount_paid', 'outstanding_amount', 'weight'],
                    include: [
                        { model: BOL, as: 'bol', attributes: ['bol_code'] }
                    ]
                },
                {
                    model: Consignment,
                    as: 'consignments',
                    attributes: ['id', 'total_amount', 'amount_paid', 'outstanding_amount', 'weight'],
                    include: [
                        { model: BOL, as: 'bol', attributes: ['bol_code'] }
                    ]
                },
                {
                    model: History,
                    as: 'histories',
                    include: [{ model: Employee, as: 'employee', attributes: ['name'] }]
                }
            ]
        });
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

        if (query?.status && query.status !== 'all') {
            conditions.status = query.status;
        }

        if (query.search) {
            conditions[Op.or] = [
                { customer_id: { [Op.like]: `%${query.search}%` } },
                { id: { [Op.like]: `%${query.search}%` } }
            ];
        }

        if (query?.dateRange) {
            const fromDate = new Date(query.dateRange[0]);
            const toDate = new Date(query.dateRange[1]);

            if (!isNaN(fromDate) && !isNaN(toDate)) {
                conditions.update_at = {
                    [Op.between]: [fromDate, toDate]
                };
            }
        }

        const deliveryNotes = await DeliveryNote.findAndCountAll({
            where: conditions,
            deliveryNote: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            order: [['update_at', 'DESC']], 
            distinct: true,
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['name', 'id']
                },
                {
                    model: History,
                    as: 'histories',
                    include: [{ model: Employee, as: 'employee', attributes: ['name'] }]
                }
            ],
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
                { model: Order, as: 'orders', attributes: ['id', 'total_amount', 'amount_paid', 'outstanding_amount', 'weight'] },   
                { model: Consignment, as: 'consignments', attributes: ['id', 'total_amount', 'amount_paid', 'outstanding_amount', 'weight'] },
            ],
            transaction,
        });

        if (!deliveryNote) {
            await transaction.rollback();
            return responseCodes.NOT_FOUND;
        }
        if (deliveryNote.status !== 'waiting_export') {
            await transaction.rollback();
            return responseCodes.UNPROFITABLE;
        }

        await deliveryNote.update({ status: 'cancelled' }, { transaction, user });

        if (deliveryNote.orders.length > 0) {
            for (const order of deliveryNote.orders) {
                await order.update(
                    {
                        delivery_id: null,
                        status: 'vietnam_warehouse_received', 
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
                        status: 'vietnam_warehouse_received', 
                    },
                    { transaction, user }
                );
            }
        }

        await transaction.commit();
        return {
            ...responseCodes.UPDATE_SUCCESS,
            deliveryNote,
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
                { model: Customer, as: 'customer' },
            ],
            transaction,
        });
        if (!deliveryNote) {
            await transaction.rollback();
            return responseCodes.NOT_FOUND;
        }

        if (deliveryNote.status !== 'waiting_export') {
            await transaction.rollback();
            return responseCodes.DELIVERY_EXPORTED;
        }

        if (deliveryNote.orders.length > 0) {
            for (const order of deliveryNote.orders) {
                const paymentData = {
                    customer_id: order.customer_id,
                    value: order.outstanding_amount,
                    type: 'payment',
                    content: 'Thanh toán đơn hàng ' + order.id,
                    employee_id: user.id,
                }
                await paymentTransactionService(paymentData, transaction);
                await order.update(
                    {
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
                    content: 'Thanh toán đơn ký gửi ' + consignment.id,
                    employee_id: user.id,
                }
                await paymentTransactionService(paymentData, transaction);
                await consignment.update(
                    {
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
        const customer = await Customer.findOne({ where: { id: deliveryNote.customer_id }, transaction });

        if (customer) {
            await customer.update(
                { 
                    accumulation: customer.accumulation + deliveryNote.total_amount 
                },
                { transaction, user }
            );
        }

        await transaction.commit();
        return {
            ...responseCodes.UPDATE_SUCCESS,
            deliveryNote,
        };
    } catch (error) {

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