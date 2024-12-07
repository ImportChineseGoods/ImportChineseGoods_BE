const { createAnonymousService, getAllAnonymousService, updateAnonymousService, deleteAnonymousService } = require("../services/anonymousService");
const responseCodes = require('../untils/response_types');

const createAnonymous = async (req, res) => {
    const { status, weight } = req.body;
    if (!status, weight < 0) { 
        const ans = responseCodes.INVALID;
        return res.status(ans.status).json(ans);
    }

    const result = await createAnonymousService(req.user, req.body);
    return res.status(result.status).json(result);
}

const getAllAnonymous = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllAnonymousService(page, pageSize);
    return res.status(result.status).json(result);
};

const updateAnonymous = async (req, res) => {
    const result = await updateAnonymousService(req.user, req.params.id, req.body);
    return res.status(result.status).json(result);
};

const deleteAnonymous = async (req, res) => {
    const result = await deleteAnonymousService(req.params.id);
    return res.status(result.status).json(result);
}

module.exports = {
    createAnonymous,
    getAllAnonymous,
    updateAnonymous,
    deleteAnonymous,
}