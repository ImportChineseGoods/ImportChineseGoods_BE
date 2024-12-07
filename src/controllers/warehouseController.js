const { createWarehouseService, getAllWarehouseService, updateWarehouseService, deleteWarehouseService } = require("../services/warehouseService");
const responseCodes = require('../untils/response_types');

const createWarehouse = async (req, res) => {
    const { name, address } = req.body;
    if (!name || !address) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createWarehouseService(req.body);
    return res.status(result.status).json(result);
}

const getAllWarehouse = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getAllWarehouseService(page, pageSize);
    return res.status(result.status).json(result);
};

const updateWarehouse = async (req, res) => {
    const result = await updateWarehouseService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const deleteWarehouse = async (req, res) => {
    const result = await deleteWarehouseService(req.params.id);
    return res.status(result.status).json(result);
}

module.exports = {
    createWarehouse,
    getAllWarehouse,
    updateWarehouse,
    deleteWarehouse,
}