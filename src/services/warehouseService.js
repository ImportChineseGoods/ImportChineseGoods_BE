require('dotenv').config();

const sequelize = require('../config/sequelize');
const Warehouse = require('../models/warehouse')(sequelize);
const responseCodes = require('../untils/response_types');

const createWarehouseService = async (data) => {
    try {
        const result = await Warehouse.create(data);

        return {
            ...responseCodes.CREATE_WAREHOUSE_SUCCESS,
            warehouse: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllWarehouseService = async (page, pageSize) => {
    try {
        const warehouses = await Warehouse.findAll({
            order: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            warehouses,
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateWarehouseService = async (id, data) => {
    try {
        const warehouse = await Warehouse.findOne({ where: { id } });
        if (!warehouse) {
            return responseCodes.NOT_FOUND;
        }
        await warehouse.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            warehouse
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteWarehouseService = async (id) => {
    try {
        const warehouse = await Warehouse.findOne({where: { id } });
        if (!warehouse) {
            return responseCodes.NOT_FOUND;
        }

        await warehouse.destroy();
        return responseCodes.DELETE_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createWarehouseService,
    getAllWarehouseService,
    updateWarehouseService,
    deleteWarehouseService,
}