require('dotenv').config();

const sequelize = require('../config/sequelize');
const Anonymous = require('../models/anonymousConsignment')(sequelize);
const responseCodes = require('../untils/response_types');

const createAnonymousService = async (user, data) => {
    try {
        const result = await Anonymous.create(data, { user });
        return {
            ...responseCodes.CREATE_ORDER_SUCCESS,
            anonymous: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllAnonymousService = async (page, pageSize) => {
    try {
        const results = await Anonymous.findAndCountAll({
            order: [['update_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            anonymouss: results,
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateAnonymousService = async (user, id, data,) => {
    try {
        const anonymous = await Anonymous.findOne({ where: { id } });
        if (!anonymous) {
            return responseCodes.NOT_FOUND;
        }
        await anonymous.update(data, { user });
        return {
            ...responseCodes.UPDATE_SUCCESS,
            anonymous
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteAnonymousService = async (id) => {
try {
    const anonymous = await Anonymous.findOne({ where: { id } });
    if (!anonymous) {
        return responseCodes.NOT_FOUND;
    }
        await anonymous.destroy();
        return responseCodes.DELETE_ORDER_SUCCESS;
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createAnonymousService,
    getAllAnonymousService,
    updateAnonymousService,
    deleteAnonymousService,
}