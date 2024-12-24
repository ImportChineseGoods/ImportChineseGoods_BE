const { createBOLService, searchBOLService, undoBOLService, getBOLsByStatusService, updateBOLService, assignCustomerService, deleteBOLService } = require("../services/bolService");
const responseCodes = require('../untils/response_types');

const createBOL = async (req, res) => {
    const { bol_code, status, weight } = req.body;

    if (!bol_code || !status) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createBOLService(req.body);
    return res.status(result.status).json(result);
};

const getBOLsByStatus = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getBOLsByStatusService(req.params.status, page, pageSize);

    return res.status(result.status).json(result);
};

const searchBOL = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await searchBOLService(req.query.query, page, pageSize);
    return res.status(result.status).json(result);
}

const updateBOL = async (req, res) => {
    if (req.body?.status === 'cancelled') {
        const result = responseCodes.INVALID
        return res.status(result.status).json(result);
    }

    const result = await updateBOLService(req.user, req.params.bol_code, req.body);
    return res.status(result.status).json(result);
}

const assignCustomer = async (req, res) => {
    const result = await assignCustomerService(req.user, req.params.customer_id, req.body);
    return res.status(result.status).json(result);
}

const deleteBOL = async (req, res) => {
    const result = await deleteBOLService(req.params.id);
    return res.status(result.status).json(result);
}

const undoBOL = async (req, res) => {
    const result = await undoBOLService(req.user, req.params.bol_code);
    return res.status(result.status).json(result);
}

module.exports = {
    createBOL,
    getBOLsByStatus,
    searchBOL,
    updateBOL,
    assignCustomer,
    deleteBOL,
    undoBOL
}