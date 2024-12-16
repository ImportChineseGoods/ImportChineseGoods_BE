require('dotenv').config();

const { QueryTypes } = require('sequelize');
const sequelize = require('../config');
const BOL = sequelize.models.BOL
const History = sequelize.models.History;
const Order = sequelize.models.Order
const Product = sequelize.models.Product;
const Employee = sequelize.models.Employee
const Warehouse = sequelize.models.Warehouse
const Customer = sequelize.models.Customer;
const responseCodes = require('../untils/response_types');
const { refundTransactionService } = require('./transactionService');
const { getProductByIdService } = require('./productService');

const createOrderService = async (customerId, data) => {
    const transaction = await sequelize.transaction();
    try {
        const lastOrder = await Order.findOne({
            order: [['id', 'DESC']],
            attributes: ['id'],
            transaction,
        });

        let newOrderId = 'DH0001';
        if (lastOrder) {
            const lastNumber = parseInt(lastOrder.id.replace('DH', ''), 10);

            if (lastNumber < 9999) {
                newOrderId = `DH${String(lastNumber + 1).padStart(4, '0')}`;
            } else {
                newOrderId = `DH${lastNumber + 1}`;
            }
        }

        const shop = data.products[0]?.shop;
        const allSameShop = data.products.every(product => product.shop === shop);
        if (!allSameShop) {
            await transaction.rollback();
            return responseCodes.ORDER_DIFFERENT_SHOP;
        }

        data.number_of_product = data.products && Array.isArray(data.products)
            ? data.products.reduce((total, product) => total + product.quantity, 0)
            : 0;

        data.commodity_money = data.products && Array.isArray(data.products)
            ? data.products.reduce((total, product) => total + product.price * product.quantity, 0)
            : 0;

        const result = await Order.create(
            {
                ...data,
                id: newOrderId,
                customer_id: customerId,
                status: 'waiting_deposit'
            },
            { transaction }
        );

        if (data.number_of_product === 0) {
            await transaction.rollback();
            return responseCodes.NOT_ENOUGH;
        }

        if (data.products && Array.isArray(data.products)) {
            for (const product of data.products) {
                const productData = getProductByIdService(product.id);
                if (productData.order_id) {
                    await transaction.rollback();
                    return responseCodes.PRODUCT_ALREADY_ORDERED;
                }
                await Product.update(
                    {
                        order_id: result.id,
                        quantity: product.quantity,
                        note: product.note
                    },
                    { where: { id: product.id }, transaction }
                );
            }
        }

        await transaction.commit();
        return {
            ...responseCodes.CREATE_ORDER_SUCCESS,
            order: result,
        };
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllOrderService = async (page, pageSize) => {
    try {
        const orders = await Order.findAndCountAll({
            order: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            include: [
                { model: BOL, as: 'bol', attributes: ['bol_code'] },
                { model: Product, as: 'products', attributes: ['image_url'], limit: 1 },
                { model: Customer, as: 'customer', attributes: ['name', 'id'] }
            ]
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            orders
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getOrderByCustomerIdService = async (customerId, page, pageSize) => {
    try {
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const orders = await Order.findAndCountAll({
            where: { customer_id: customerId },
            order: [['update_at', 'DESC']],
            limit,
            offset,
            include: [
                { model: BOL, as: 'bol', attributes: ['bol_code'] },
                { model: Product, as: 'products', attributes: ['image_url'], limit: 1 }
            ]
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            orders,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getOrderByIdService = async (user, id) => {
    try {
        let order;
        if (user.role === 'customer') {
            order = await Order.findOne({
                where: { id: id, customer_id: user.id },
                include: [
                    { model: Product, as: 'products' },
                    { model: BOL, as: 'bol' },
                    {
                        model: Warehouse,
                        as: 'warehouse',
                        attributes: ['name']
                    },
                    {
                        model: History,
                        as: 'histories',
                        include: [
                            { model: Employee, as: 'employee', attributes: ['name'] }
                        ]

                    }
                ],
                attributes: { exclude: ['original_rate', 'original_weight_fee', 'actual_payment_amount', 'negotiable_money', 'contract_code'] }
            });
        } else {
            order = await Order.findOne({
                where: { id },
                include: [
                    { model: Product, as: 'products' },
                    { model: BOL, as: 'bol' },
                    { model: Customer, as: 'customer', attributes: ['name', 'id'] },
                    {
                        model: Warehouse,
                        as: 'warehouse',
                        attributes: ['name']
                    },
                    {
                        model: History,
                        as: 'histories',
                        include: [
                            { model: Employee, as: 'employee', attributes: ['name'] }
                        ]

                    }
                ],
            });
        }
            if (!order) {
                return responseCodes.NOT_FOUND;
            }

            return {
                ...responseCodes.GET_DATA_SUCCESS,
                order
            };
        } catch (error) {
            console.error(error);
            return responseCodes.SERVER_ERROR;
        }
    }

const queryOrderService = async (user, query, page, pageSize) => {
        try {
            const conditions = {};
            if (user.role === 'customer') {
                conditions.customer_id = user.id;
            }

            if (query.status && query.status.length > 0) {
                conditions.status = {
                    [sequelize.Op.in]: query.status
                };
            }

            if (query.search) {
                conditions[sequelize.Op.or] = [
                    { customer_id: { [sequelize.Op.like]: `%${query.search}%` } },
                    { id: { [sequelize.Op.like]: `%${query.search}%` } },
                    { contract_code: { [sequelize.Op.like]: `%${query.search}%` } },
                    { bol: { [sequelize.Op.like]: `%${query.search}%` } }
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

            const orders = await Order.findAndCountAll({
                order: [['update_at', 'DESC']],
                include: [
                    { model: BOL, as: 'bol' }
                ],
                where: conditions,
                limit: pageSize,
                offset: (page - 1) * pageSize
            });

            return {
                ...responseCodes.GET_DATA_SUCCESS,
                orders
            };
        } catch (error) {
            console.error(error);
            return responseCodes.SERVER_ERROR;
        }
    };

    const updateOrderService = async (id, data) => {
        try {
            const order = await Order.findOne({ where: { id } });
            if (!order) {
                return responseCodes.NOT_FOUND;
            }
            await order.update(data);
            return {
                ...responseCodes.UPDATE_SUCCESS,
                order
            };

        } catch (error) {
            console.log(error);
            return responseCodes.SERVER_ERROR;
        }
    };

    const cancelOrderService = async (user, id) => {
        const transaction = await sequelize.transaction();
        try {
            const order = await Order.findOne({ where: { id }, transaction });
            if (!order) {
                await transaction.rollback();
                return responseCodes.ORDER_NOT_FOUND;
            }
            const status = ['exported', 'cancelled'];
            if (status.includes(order.status)) {
                await transaction.rollback();
                return responseCodes.UNPROFITABLE;
            }
            await order.update(
                { status: 'cancelled' },
                { transaction, user }
            );
            if (order.amount_paid > 0) {
                const refunData = {
                    customer_id: order.customer_id,
                    value: order.amount_paid,
                    type: 'refund',
                    content: 'Hoàn tiền cho đơn hàng ' + order.id,
                    employee_id: user.id
                }
                await refundTransactionService(refunData, transaction);
            }

            await transaction.commit();
            return {
                ...responseCodes.UPDATE_SUCCESS,
                order,
            };

        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return responseCodes.SERVER_ERROR
        }
    };

    const customerCancelOrderService = async (user, id) => {
        try {
            const order = await Order.findOne({ where: { id, customer_id: user.id } });
            if (!order) {
                return responseCodes.ORDER_NOT_FOUND;
            }
            const status = ['waiting_deposit', 'deposited'];
            if (status.includes(order.status)) {
                await order.update({ status: 'cancelled' });
                if (order.amount_paid > 0) {
                    const refunData = {
                        customer_id: order.customer_id,
                        value: order.amount_paid,
                        type: 'refund',
                        content: 'Hoàn tiền cho đơn hàng ' + order.id,
                    }
                    await refundTransactionService(refunData, transaction);
                }
            } else {
                return responseCodes.UNPROFITABLE;
            }
            await order.update({ status: 'cancelled' });
            return responseCodes.UPDATE_SUCCESS;

        } catch (error) {
            console.log(error);
            return responseCodes.SERVER_ERROR;
        }
    }

    const assignContractCodeService = async (user, id, contractCode) => {
        const transaction = await sequelize.transaction();
        try {
            const order = await Order.findOne({ where: { id }, transaction });
            if (!order) {
                await transaction.rollback();
                return responseCodes.ORDER_NOT_FOUND;
            }

            const orderCode = await Order.findOne({ where: { contract_code: contractCode }, transaction });
            if (orderCode) {
                await transaction.rollback();
                return responseCodes.CONTRACT_CODE_EXISTED;
            }

            if (order.status === 'waiting_deposit') {
                await transaction.rollback();
                return responseCodes.ORDER_NOT_DEPOSIT;
            }

            if (order.status === 'deposited') {
                await order.update({ contract_code: contractCode, status: 'ordering' }, { transaction, user });
            } else {
                await order.update({ contract_code: contractCode }, { transaction });
            }

            await transaction.commit();
            return {
                ...responseCodes.UPDATE_SUCCESS,
                order,
                history
            };
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return responseCodes.SERVER_ERROR;
        }
    };

    const approveOrderService = async (user, id) => {
        const transaction = await sequelize.transaction();
        try {
            const order = await Order.findOne({ where: { id }, transaction });
            if (!order) {
                await transaction.rollback();
                return responseCodes.ORDER_NOT_FOUND;
            }

            if (order.status !== 'ordering') {
                await transaction.rollback();
                return responseCodes.ORDER_NOT_ORDERING;
            }

            await order.update({ status: 'ordered' }, { transaction, user });

            await transaction.commit();
            return {
                ...responseCodes.UPDATE_SUCCESS,
                order,
                history
            };
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return responseCodes.SERVER_ERROR;
        }
    }

    const assignBOLService = async (user, id, bolCode) => {
        const transaction = await sequelize.transaction();
        try {
            const order = await Order.findOne({ where: { id }, transaction });
            if (!order) {
                await transaction.rollback();
                return responseCodes.ORDER_NOT_FOUND;
            }

            const bol = await BOL.findOne({ where: { bol_code: data.bol_code } });
            if (bol) return responseCodes.BOL_EXISTS;

            if (order.status === 'ordered') {
                await order.update({ status: 'shop_shipping' }, { transaction, user });

                const bolData = {
                    order_id: id,
                    bol_code: bolCode,
                    status: 'shop_shipping'
                }
                await BOL.create(bolData, { transaction });
            } else {
                await transaction.rollback();
                return responseCodes.ORDER_NOT_ORDERING;
            }
            await transaction.commit();
            return {
                ...responseCodes.UPDATE_SUCCESS,
                order,
            };
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return responseCodes.SERVER_ERROR;
        }
    }
    module.exports = {
        createOrderService,
        getAllOrderService,
        getOrderByCustomerIdService,
        getOrderByIdService,
        queryOrderService,
        updateOrderService,
        assignContractCodeService,
        approveOrderService,
        assignBOLService,
        cancelOrderService,
        customerCancelOrderService
    }