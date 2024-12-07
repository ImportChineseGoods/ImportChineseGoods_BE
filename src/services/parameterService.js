require('dotenv').config();

const sequelize = require('../config/sequelize');
const Parameter = require('../models/parameter')(sequelize);
const responseCodes = require('../untils/response_types');

const createParameterService = async (data) => {
    try {
        if (data.value < 0) return responseCodes.INVALID;
        const result = await Parameter.create(data);

        return {
            ...responseCodes.UPDATE_SUCCESS,
            parameter: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllParametersService = async (page, pageSize) => {
    try {
        const parameters = await Parameter.findAll({
            order: [['update_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            parameters,
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateParameterService = async (id, data) => {
    try {
        const parameter = await Parameter.findOne({ where: { id } });
        if (!parameter) {
            return responseCodes.NOT_FOUND;
        }
        await parameter.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            parameter
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteParameterService = async (id) => {
    try {
        const parameter = await Parameter.findOne({where: { id } });
        if (!parameter) {
            return responseCodes.NOT_FOUND;
        }

        await parameter.destroy();
        return responseCodes.DELETE_PARAMETER_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getParameterByTypeService = async (type) => {
    try {
        const parameter = await Parameter.findOne({ where: { type } });
        if (!parameter) {
            return responseCodes.NOT_FOUND;
        }
        return {
            ...responseCodes.GET_DATA_SUCCESS,
            parameter,
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createParameterService,
    getAllParametersService,
    updateParameterService,
    deleteParameterService,
    getParameterByTypeService
}