const { withdrawTransactionService, queryTransactionService, createTransactionService, depositTransactionService, getTransactionsByStatusService, approveTransactionService, cancelTransactionService, getAllTransactionsService, getTransactionByCustomerIdService,  } = require("../services/transactionService");
const responseCodes = require('../untils/response_types');

const withdrawTransaction = async (req, res) => {
    if (req.body.value < 0) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    const result = await withdrawTransactionService(req.user, req.body);
    return res.status(result.status).json(result);
}

const createTransaction = async (req, res) => {
    const { customer_id, value, type, content } = req.body;

    const valid = ['withdraw', 'deposit'];

    if (!customer_id || !value || !valid.includes(type) || value < 0) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createTransactionService(req.user, req.body);
    return res.status(result.status).json(result);
}

const depositTransaction = async (req, res) => {
    if (req.body.value < 0) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    req.body.order_id = req.params.orderId;
    console.log(req.user, req.body)
    const result = await depositTransactionService(req.user, req.body);
    return res.status(result.status).json(result);
}

const getTransactionsByStatus = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getTransactionsByStatusService(req.params.status, page, pageSize);
    return res.status(result.status).json(result);
};

const approveTransaction = async (req, res) => {
    const result = await approveTransactionService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const cancelTransaction = async (req, res) => {
    const result = await cancelTransactionService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const getAllTransation = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllTransactionsService(page, pageSize);
    return res.status(result.status).json(result);
}


const getTransactionByCustomerId = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getTransactionByCustomerIdService(req.params.customerId, page, pageSize);
    return res.status(result.status).json(result);
}

const queryTransaction = async (req, res) => {
    console.log(req.query)
    const result = await queryTransactionService(req.user, req.query);
    return res.status(result.status).json(result);
}

module.exports = {
    withdrawTransaction,
    createTransaction,
    getTransactionsByStatus,
    depositTransaction,
    approveTransaction,
    cancelTransaction,
    getAllTransation,
    getTransactionByCustomerId,
    queryTransaction,
}