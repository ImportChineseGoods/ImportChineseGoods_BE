const { createOrderService, getAllOrderService, customerCancelOrderService, getOrderByCustomerIdService, assignContractCodeService,approveOrderService, assignBOLService, cancelOrderService, getOrderByIdService, queryOrderService,updateOrderService} = require("../services/orderService");
const responseCodes = require('../untils/response_types');

const createOrder = async (req, res) => {
    if (!req.body.products || req.body.products.length === 0 || !req.body.warehouse_id) {
            const result = responseCodes.NOT_ENOUGH;
            return res.status(result.status).json(result);
    }
    
    const result = await createOrderService(req.user.id, req.body);
    return res.status(result.status).json(result);
}

const getAllOrder = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllOrderService(page, pageSize);
    return res.status(result.status).json(result);
};

const getOrderByCustomerId = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getOrderByCustomerIdService(req.user.id, page, pageSize);
    return res.status(result.status).json(result);
}

const getOrderById = async (req, res) => {
    const result = await getOrderByIdService(req.user.id, req.params.id);
    return res.status(result.status).json(result);
}

const queryOrder = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await queryOrderService(req.user, req.query, page, pageSize);
    return res.status(result.status).json(result);
}

const updateOrder = async (req, res) => {
    if (req.body?.purchase_fee < 0 
        || req.body?.china_shipping_fee < 0 
        || req.body?.weight < 0 
        || req.body?.incurred_fee < 0 
        || req.body?.counting_fee < 0 
        || req.body?.packing_fee < 0
        || req.body?.actual_payment_amount < 0
        || req.body?.shipping_discount < 0
        || req.body?.shipping_discount > 100
        || req.body?.purchase_discount < 0
        || req.body?.purchase_discount > 100
        || req.body.status 
        || req.body.contract_code
    ) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    const result = await updateOrderService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const cancelOrder = async (req, res) => {
    const result = await cancelOrderService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const customerCancelOrder = async (req, res) => {
    const result = await customerCancelOrderService(req.user, req.params.id);
    return res.status(result.status).json(result);
}
const assignContractCode = async (req, res) => {
    const result = await assignContractCodeService(req.user, req.params.id, req.body.contract_code);
    return res.status(result.status).json(result);
}

const assignBOL = async (req, res) => {
    const result = await assignBOLService(req.user, req.params.id, req.body.bol_code);
    return res.status(result.status).json(result);
}

const approveOrder = async (req, res) => {
    const result = await approveOrderService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

module.exports = {
    createOrder,
    getAllOrder,
    getOrderByCustomerId,
    getOrderById,
    queryOrder,
    updateOrder,
    cancelOrder,
    customerCancelOrder,
    assignContractCode,
    assignBOL,
    approveOrder
}