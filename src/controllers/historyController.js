const { createHistoryService, getHistoryByOrderIdService, getHistoryByConsignmentIdService, getHistoryByDeliveryIdService, getHistoryByComplaintIdService, updateHistoryService, deleteHistoryService } = require("../services/historyService");
const responseCodes = require('../untils/response_types');

const createHistory = async (req, res) => {
    if (!req.body.status) return res.status(400).json(responseCodes.NOT_ENOUGH);
    const data = {
        order_id: req.body?.order_id,
        consignment_id: req.body?.consignment_id,
        delivery_id: req.body?.delivery_id,
        complaint_id: req.body?.complaint_id,
        status: req.body.status,
    }
    const identifiers = [order_id, consignment_id, delivery_id, complaint_id];
    const filledFields = identifiers.filter(field => field !== null && field !== undefined).length;

    if (filledFields !== 1) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createHistoryService(req.user, data);
    return res.status(result.status).json(result);
}

const getHistoryByOrderId = async (req, res) => {
    const result = await getHistoryByOrderIdService(req.params.order_id);
    return res.status(result.status).json(result);
};

const getHistoryByConsignmentId = async (req, res) => {
    const result = await getHistoryByConsignmentIdService(req.params.consignment_id);
    return res.status(result.status).json(result);
};

const getHistoryByDeliveryId = async (req, res) => {
    const result = await getHistoryByDeliveryIdService(req.params.delivery_id);
    return res.status(result.status).json(result);
}

const getHistoryByComplaintId = async (req, res) => {
    const result = await getHistoryByComplaintIdService(req.params.complaint_id);
    return res.status(result.status).json(result);
}

const updateHistory = async (req, res) => {
    const result = await updateHistoryService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const deleteHistory = async (req, res) => {
    const result = await deleteHistoryService(req.params.id);
    return res.status(result.status).json(result);
}

module.exports = {
    createHistory,
    getHistoryByOrderId,
    getHistoryByConsignmentId,
    getHistoryByDeliveryId,
    getHistoryByComplaintId,
    updateHistory,
    deleteHistory,
}