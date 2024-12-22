require('dotenv').config();

const sequelize = require('../config');
const Transaction = sequelize.models.Transaction;
const Consignment = sequelize.models.Consignment;
const Order = sequelize.models.Order;
const Customer = sequelize.models.Customer;
const Employee = sequelize.models.Employee;
const responseCodes = require('../untils/response_types');
const { Op } = require('sequelize');

const withdrawTransactionService = async (user, data) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const customer = await Customer.findOne({ where: { id: user.id } }, { dbTransaction });

        const customerBalance = parseInt(customer.balance, 10);
        const transactionValue = parseInt(data.value, 10);

        data.balance_after = parseInt(customerBalance - transactionValue, 10);
        if (data.balance_after < 0) return responseCodes.BALANCE_NOT_ENOUGH;

        data.customer_id = user.id;
        data.type = 'withdraw';
        data.status = 'processing';
        data.content = `KH ${user.id} rút tiền về tài khoản ${data.bank_account}, ngân hàng ${data.bank}, chủ sở hữu ${data.bank_owner}, note: ${data.note}`;

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
            data.balance_after = parseInt(customer.balance, 10) + parseInt(data.value, 10);
        }

        if (data.type === 'withdraw') {
            data.balance_after = parseInt(customer.balance, 10) - parseInt(data.value, 10);
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
        const order = await Order.findOne({ where: { id: data.order_id, customer_id: user.id } }, { dbTransaction });

        const deposit = Math.round(customer.deposit_rate / 100 * order.commodity_money * order.applicable_rate - order.amount_paid);
        if (data.value !== deposit) return responseCodes.INVALID;

        if (customer.balance < data.value) return responseCodes.BALANCE_NOT_ENOUGH;
        else data.balance_after = parseInt(customer.balance, 10) - parseInt(data.value, 10);
        data.customer_id = user.id;
        data.type = 'payment';
        data.content = 'Đặt cọc đơn hàng ' + order.id;
        
        data.status = 'completed';
        const amount_paid = order.amount_paid + data.value;

        await customer.update({ balance: data.balance_after }, { dbTransaction });
        await order.update({ status: 'deposited', amount_paid: amount_paid}, { dbTransaction });
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
        data.balance_after = parseInt(customer.balance, 10) - parseInt(data.value, 10); // Đảm bảo balance là số nguyên
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
        data.balance_after = parseInt(customer.balance, 10) + parseInt(data.value, 10); // Đảm bảo balance là số nguyên
        data.status = 'completed';

        const result = await Transaction.create(data, { dbTransaction });
        await dbTransaction.commit();
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

const approveTransactionService = async (user, id) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const transaction = await Transaction.findOne({ where: { id } }, { dbTransaction });
        if (!transaction) return responseCodes.NOT_FOUND;

        if (transaction.status !== 'processing') return responseCodes.INVALID;

        await transaction.update({
            status: 'completed',
            employee_id: user.id
        }, { dbTransaction });

        await dbTransaction.commit();
        return responseCodes.UPDATE_SUCCESS;
    } catch (error) {
        await dbTransaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const cancelTransactionService = async (user, id) => {
    const dbTransaction = await sequelize.transaction();
    try {
        const transaction = await Transaction.findOne({ where: { id } }, { dbTransaction });
        const customer = await Customer.findOne({ where: { id: transaction.customer_id } }, { dbTransaction });
        if (!transaction) return responseCodes.NOT_FOUND;

        if (transaction.status !== 'processing') return responseCodes.INVALID;

        const employeeId = user.role === 'customer' ? null : user.id;

        const transactionValue = parseInt(transaction.value, 10);
        const customerBalance = parseInt(customer.balance, 10);

        await transaction.update({ status: 'cancelled', employee_id: employeeId }, { dbTransaction });

        if (transaction.type === 'withdraw') {
            await Transaction.create({
                customer_id: transaction.customer_id,
                type: 'refund',
                value: transactionValue,  // Đảm bảo giá trị là số nguyên
                status: 'completed',
                content: `Yêu cầu rút tiền ${transaction.id} bị hủy`,
                employeeId: employeeId,
                balance_after: customerBalance + transactionValue, // Cập nhật số dư sau khi hoàn tiền
            }, { dbTransaction });

            await customer.update({ balance: customerBalance + transactionValue }, { dbTransaction });
        }

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

const queryTransactionService = async (user, query) => {
    try {
        const conditions = {};
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 50;
        if (user.role === 'customer') {
            conditions.customer_id = user.id;
        }

        if (query.status && query.status.length > 0) {
            conditions.status = {
                [Op.in]: query.status
            };
        }

        if (query.type && query.type.length > 0) {
            conditions.type = {
                [Op.in]: query.type
            };
        }

        if (query.search) {
            conditions[Op.or] = [
                { customer_id: { [Op.like]: `%${query.search}%` } },
                { id: { [Op.like]: `%${query.search}%` } },
                { content: { [Op.like]: `%${query.search}%` } },
            ];
        }

        if (query?.dateRange) {
            const fromDate = new Date(query.dateRange[0]);
            const toDate = new Date(query.dateRange[1]);

            if (!isNaN(fromDate) && !isNaN(toDate)) {
                conditions.create_at = {
                    [Op.between]: [fromDate, toDate]
                };
            }
        }

        const transactions = await Transaction.findAndCountAll({
            order: [['update_at', 'DESC']],
            include: [
                { 
                    model: Employee, 
                    as: 'employee',
                    attributes: ['id', 'username']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name']
                }
            ],
            where: conditions,
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });
        return {
            ...responseCodes.GET_DATA_SUCCESS,
            transactions,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

module.exports = {
    withdrawTransactionService,
    createTransactionService,
    depositTransactionService,
    getTransactionsByStatusService,
    refundTransactionService,
    paymentTransactionService,
    approveTransactionService,
    cancelTransactionService,
    getAllTransactionsService,
    getTransactionByCustomerIdService,
    queryTransactionService,
};
