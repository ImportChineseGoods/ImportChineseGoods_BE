require('dotenv').config();

const sequelize = require('../config/sequelize');
const Transaction = require('../models/transaction')(sequelize);
const Consignment = require('../models/consignment')(sequelize);
const Order = require('../models/order')(sequelize);
const Customer = require('../models/customer')(sequelize);
const responseCodes = require('../untils/response_types');
const { Op } = require('sequelize');

const withdrawTransactionService = async (user, data) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const customer = await Customer.findOne({ where: { id: user.id } }, { dbTransaction });
        data.balance_after = customer.balance - data.value;
        if (data.balance_after < 0) return responseCodes.BALANCE_NOT_ENOUGH;
        data.customer_id = user.id;
        data.type = 'withdraw';
        data.status = 'processing';
        data.content = 'Rút tiền từ tài khoản' + user.id;

        await customer.update({ balance: data.balance_after }, { dbTransaction });
        const result = await Transaction.create(data, { dbTransaction });

        await dbTransaction.commit();
        return {
            ...responseCodes.CREATE_TRANSACTION_SUCCESS,
            transaction: result,
        };
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const createTransactionService = async (user, data) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const customer = await Customer.findOne({ where: { id: data.customer_id } }, { dbTransaction });
        if (data.type === 'deposit') {
            data.balance_after = user.balance + data.value;
        }

        if (data.type === 'withdraw') {
            data.balance_after = customer.balance - data.value;
            if (data.balance_after < 0) return responseCodes.BALANCE_NOT_ENOUGH;
        }
        
        data.status = 'completed';
        data.employee_id = user.id;

        await customer.update({ balance: data.balance_after }, { dbTransaction });
        const result = await Transaction.create(data, { dbTransaction });

        await dbTransaction.commit();
        return {
            ...responseCodes.CREATE_TRANSACTION_SUCCESS,
            transaction: result,
        };
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const depositTransactionService = async (user, data) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const customer = await Customer.findOne({ where: { id: user.id } }, { dbTransaction });
        const order = await Order.findOne({ where: { id: data.order_id } }, { dbTransaction });

        const deposit = customer.deposit_rate / 100 * order.commodity_money * order.applicable_rate;
        if (data.value !== deposit) return responseCodes.INVALID;

        data.balance_after = customer.balance - data.value;
        if (data.balance_after < 0) return responseCodes.BALANCE_NOT_ENOUGH;
        data.customer_id = user.id;
        data.type = 'payment';
        data.content = 'Đặt cọc đơn hàng ' + order.id
        
        data.status = 'completed';

        await customer.update({ balance: data.balance_after }, { dbTransaction });
        await order.update({ status: 'deposited', amount_paid: data.value }, { dbTransaction });
        const result = await Transaction.create(data, { dbTransaction });

        await dbTransaction.commit();
        return {
            ...responseCodes.CREATE_TRANSACTION_SUCCESS,
            transaction: result,
        };
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const paymentTransactionService = async (data, dbTransaction) => {
    try {
        const customer = await Customer.findOne({ where: { id: data.customer_id } }, { dbTransaction });
        data.balance_after = customer.balance - data.value;
        data.type = 'payment';
        data.status = 'completed';

        const result = await Transaction.create(data, { dbTransaction });

        await dbTransaction.commit();
        return {
            ...responseCodes.CREATE_TRANSACTION_SUCCESS,
            transaction: result,
        };
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }

}

const refundTransactionService = async (data, dbTransaction) => {
    try {
        const customer = await Customer.findOne({ where: { id: data.customer_id } }, { dbTransaction });
        data.balance_after = customer.balance + data.value;
        data.status = 'completed';

        const result = await Transaction.create(data, { dbTransaction });
        return responseCodes.CREATE_TRANSACTION_SUCCESS;
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

const getTransactionsByStatusService = async (status, page, pageSize) => {
    try {
        const transactions = await Transaction.findAll({
            where: { status: status },
            include: [
                { model: Order, as: 'order' },
                { model: Consignment, as: 'consignment' },
                { model: AnonymousConsignment, as: 'anonymous' },
            ],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        if (!transactions || transactions.length === 0) return responseCodes.NOT_FOUND;

        const formattedTransactions = transactions.map((transaction) => {
            let order = null;

            if (transaction.order) {
                order = {
                    type: 'order',
                    data: transaction.order,
                };
            } else if (transaction.consignment) {
                order = {
                    type: 'consignment',
                    data: transaction.consignment,
                };
            } else if (transaction.anonymous) {
                order = {
                    type: 'anonymous',
                    data: transaction.anonymous,
                };
            }

            return {
                transaction_code: transaction.transaction_code,
                status: transaction.status,
                order: order,
            };
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            transactions: formattedTransactions,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const searchTransactionService = async (keyword, page, pageSize) => {
    try {
        const transactions = await Transaction.findAndCountAll({
            where: {
                transaction_code: {
                    [Op.like]: `%${keyword}%`,
                },
            },
            offset: (page - 1) * pageSize,
            limit: pageSize,
            include: [
                { model: Order, as: 'order' },
                { model: Consignment, as: 'consignment' },
                { model: AnonymousConsignment, as: 'anonymous' },
            ],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            transactions,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const approveTransactionService = async (user, id) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const transaction = await Transaction.findOne({ where: { id } }, { dbTransaction });
        if (!transaction) return responseCodes.NOT_FOUND;

        if (transaction.status !== 'processing') return responseCodes.INVALID;

        await transaction.update({status: 'completed', employee_id: user.id}, { dbTransaction });

        await dbTransaction.commit();
        return responseCodes.UPDATE_SUCCESS;
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

const cancelTransactionService = async (user, id) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const transaction = await Transaction.findOne({ where: { id } }, { dbTransaction });
        if (!transaction) return responseCodes.NOT_FOUND;

        if (transaction.status !== 'processing') return responseCodes.INVALID;

        const employeeId = user.role === 'customer' ? null : user.id;
        await transaction.update({status: 'cancelled', employee_id: employeeId}, { dbTransaction });

        await dbTransaction.commit();
        return responseCodes.UPDATE_SUCCESS;
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

const getAllTransactionsService = async (page, pageSize) => {
    try {
        const transactions = await Transaction.findAndCountAll({
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            transactions,
        }
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getTransactionByCustomerIdService = async (customerId, page, pageSize) => {
    try {
        const transactions = await Transaction.findAndCountAll({
            where: { customer_id: customerId },
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            transactions,
        }
    } catch (error) {
        console.log(error);
        return responseCodes
    }
}

module.exports = {
    withdrawTransactionService,
    createTransactionService,
    depositTransactionService,
    getTransactionsByStatusService,
    searchTransactionService,
    refundTransactionService,
    paymentTransactionService,
    approveTransactionService,
    cancelTransactionService,
    getAllTransactionsService,
    getTransactionByCustomerIdService,
};
