const { createComplaintService, confirmProcessService, getAllComplaintService, getComplaintsByCustomerIdService, updateComplaintService, deleteComplaintService } = require("../services/complaintService");
const responseCodes = require('../untils/response_types');

const createComplaint = async (req, res) => {
    const identifiers = [req.body?.order_id, req.body?.consignment_id];
    const filledFields = identifiers.filter((field) => field);

    if (filledFields.length > 1 || !req.body.type || !req.body.description) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createComplaintService(req.user.id, req.body);
    return res.status(result.status).json(result);
}

const getAllComplaint = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllComplaintService(page, pageSize);
    return res.status(result.status).json(result);
}

const getComplaintsByCustomerId = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getComplaintsByCustomerIdService(req.user.id, page, pageSize);
    return res.status(result.status).json(result);

};

const updateComplaint = async (req, res) => {
    const result = await updateComplaintService(req.params.id, req.user.id, req.body);
    return res.status(result.status).json(result);
}

const deleteComplaint = async (req, res) => {
    const result = await deleteComplaintService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const confirmProcess = async (req, res) => {
    const result = await confirmProcessService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

module.exports = {
    createComplaint,
    getAllComplaint,
    getComplaintsByCustomerId,
    updateComplaint,
    deleteComplaint,
    confirmProcess
}