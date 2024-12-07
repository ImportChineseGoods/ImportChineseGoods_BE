const {
    createDeliveryNoteService,
    getAllDeliveryNoteService,
    getDeliveryNoteByIdService,
    queryDeliveryNoteService,
    updateDeliveryNoteService,
    cancelDeliveryNoteService,
    exportDeliveryNoteService,
} = require("../services/deliveryNoteService");
const responseCodes = require('../untils/response_types');

const createDeliveryNote = async (req, res) => {
    const types = ['consignment', 'order'];
    if (!req.body.orders || req.body.orders.lenghth === 0 || !req.body.customer_id|| !types.includes(req.body.type)) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    const result = await createDeliveryNoteService(req.user, req.body);
    return res.status(result.status).json(result);
}

const getAllDeliveryNote = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllDeliveryNoteService(page, pageSize);
    return res.status(result.status).json(result);
};

const getDeliveryNoteById = async (req, res) => {
    const result = await getDeliveryNoteByIdService(req.params.id);
    return res.status(result.status).json(result);
}

const queryDeliveryNote = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await queryDeliveryNoteService(req.query, page, pageSize);
    return res.status(result.status).json(result);
}

const updateDeliveryNote = async (req, res) => {
    if (req.body?.incurred_fee < 0 
        || req.body.status 
        || req.body.contract_code
    ) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    const result = await updateDeliveryNoteService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const cancelDeliveryNote = async (req, res) => {
    const result = await cancelDeliveryNoteService(req.user, req.params.id);
    return res.status(result.status).json(result);
}

const exportDeliveryNote = async (req, res) => {
    const result = await exportDeliveryNoteService(req.query);
    return res.status(result.status).json(result);
}

module.exports = {
    createDeliveryNote,
    getAllDeliveryNote,
    getDeliveryNoteById,
    queryDeliveryNote,
    updateDeliveryNote,
    cancelDeliveryNote,
    exportDeliveryNote,
}