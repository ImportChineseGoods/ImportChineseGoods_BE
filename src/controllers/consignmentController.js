const { createConsignmentService, deleteConsignmentService, getAllConsignmentService, customerCancelConsignmentService, getConsignmentByCustomerIdService, cancelConsignmentService, getConsignmentByIdService, queryConsignmentService,updateConsignmentService } = require("../services/consignmentService");
const responseCodes = require('../untils/response_types');

const createConsignment = async (req, res) => {
    if (!req.body.warehouse_id || !req.body.bol_code) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createConsignmentService(req.user.id, req.body);
    return res.status(result.status).json(result);
}

const getAllConsignment = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllConsignmentService(page, pageSize);
    return res.status(result.status).json(result);

};

const getConsignmentByCustomerId = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getConsignmentByCustomerIdService(req.user.id, page, pageSize);
    return res.status(result.status).json(result);
}

const getConsignmentById = async (req, res) => {
    const result = await getConsignmentByIdService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const queryConsignment = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await queryConsignmentService(req.user, req.query, page, pageSize);
    return res.status(result.status).json(result);
}

const updateConsignment = async (req, res) => {
    if (req.body?.weight < 0 
        || req.body?.incurred_fee < 0 
        || req.body.status 
        || req.body?.shipping_discount < 0
        || req.body?.shipping_discount > 100
    ) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await updateConsignmentService(req.user, req.params.id, req.body);
    return res.status(result.status).json(result);
}

const cancelConsignment = async (req, res) => {
    const result = await cancelConsignmentService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const customerCancelConsignment = async (req, res) => {
    const result = await customerCancelConsignmentService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const deleteConsignment = async (req, res) => {
    const result = await deleteConsignmentService(req.params.id);
    return res.status(result.status).json(result);
}
module.exports = {
    createConsignment,
    getAllConsignment,
    getConsignmentByCustomerId,
    getConsignmentById,
    queryConsignment,
    updateConsignment,
    cancelConsignment,
    customerCancelConsignment,
    deleteConsignment
}