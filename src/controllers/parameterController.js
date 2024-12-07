const { createParameterService, getAllParametersService, getParameterByTypeService, updateParameterService, deleteParameterService } = require("../services/parameterService");
const responseCodes = require('../untils/response_types');

const createParameter = async (req, res) => {
    const { name, value, type } = req.body;
    if (!name || !value || !type) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createParameterService(req.body);
    return res.status(result.status).json(result);
}

const getAllParameter = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllParametersService(page, pageSize);
    return res.status(result.status).json(result);
};

const updateParameter = async (req, res) => {
    const result = await updateParameterService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const deleteParameter = async (req, res) => {
    const result = await deleteParameterService(req.params.id);
    return res.status(result.status).json(result);
}

const getParameterByType = async (req, res) => {
    const result = await getParameterByTypeService(req.params.type);
    return res.status(result.status).json(result);
}

module.exports = {
    createParameter,
    getAllParameter,
    updateParameter,
    deleteParameter,
    getParameterByType
}