require('dotenv').config();

const sequelize = require('../config/sequelize');
const AnonymousConsignment = require('../models/anonymousConsignment')(sequelize);
const BOL = require('../models/bol')(sequelize);
const Consignment = require('../models/consignment')(sequelize);
const Order = require('../models/order')(sequelize);
const Customer = require('../models/customer')(sequelize);
const History = require('../models/history')(sequelize);
const responseCodes = require('../untils/response_types');
const { createConsignmentService } = require('./consignmentService');

const createBOLService = async (data, dbTransation) => {
    const transaction = dbTransation || await sequelize.transaction();
    if (!data.bol_code || !data.status) {
        return responseCodes.INVALID;
    }
    try {
        const anonymous = await AnonymousConsignment.create({
            status: data.status,
            weight: data.weight,
        }, { transaction });
        data.anonymous_id = anonymous.id;

        const result = await BOL.create(data, { transaction });

        await transaction.commit();
        return {
            ...responseCodes.CREATE_BOL_SUCCESS,
            bol: result,
        };
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateBOLService = async (user, bol_code, data) => {
    const transaction = await sequelize.transaction();
    try {
        const bol = await BOL.findOne({ where: { bol_code }, transaction });
        if (!bol) {
            data.bol_code = bol_code;
            return await createBOLService(data, transaction);
        }

        await bol.update(data, { transaction });

        if (data.status) {
            if (bol.order_id) {
                const order = await Order.findOne({ where: { id: bol.order_id }, transaction });
                await order.update(
                    {
                        status: data.status,
                        weight: data?.weight
                    }, { transaction, user }
                );
            } else if (bol.consignment_id) {
                const consignment = await Consignment.findOne({ where: { id: bol.consignment_id }, transaction });
                await consignment.update(
                    {
                        status: data.status,
                        weight: data?.weight
                    }, { transaction, user });
            } else if (bol.anonymous_id) {
                const anonymous = await AnonymousConsignment.findOne({ where: { id: bol.anonymous_id }, transaction });
                await anonymous.update(
                    {
                        status: data.status,
                        weight: data?.weight
                    }, { transaction, user });
            }
        }

        await transaction.commit();
        return {
            ...responseCodes.UPDATE_SUCCESS,
            bol,
        };
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const assignCustomerService = async (user, customerId, data) => {
    const transaction = await sequelize.transaction();
    try {
        const customer = await Customer.findOne({ where: { id: customerId }, transaction })
        
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        for (const bol of bols) {
            const consignment = await createConsignmentService(customerId, {
                status: bol.status,
                weight: bol.weight,
            }, { transaction, user });
            const anonymous = await AnonymousConsignment.findOne({ where: { id: bol.anonymous_id }, transaction });
            const histories = await History.findAll({ where: { anonymous_id: anonymous.id}})
            for (const history of histories) {
                await history.update({ 
                    consignment_id: consignment.id,
                    anonymous_id: null
                }, { transaction });
            }
            await anonymous.destroy({ transaction });
            await BOL.update(
                { 
                    consignment_id: consignment.id,
                    anonymous_id: null
                },
                { where: { bol_code: bol.bol_code }, transaction }
            );
        }
        await transaction.commit();
        return responseCodes.UPDATE_SUCCESS;
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getBOLsByStatusService = async (status, page, pageSize) => {
    try {
        const bols = await BOL.findAll({
            where: { status: status },
            include: [
                { model: Order, as: 'order' },
                { model: Consignment, as: 'consignment' },
                { model: AnonymousConsignment, as: 'anonymous' },
            ],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        if (bols.length === 0) return responseCodes.DATA_NOT_FOUND;

        const formattedBOLs = bols.map((bol) => {
            let order = null;

            if (bol.order) {
                order = {
                    type: 'order',
                    data: bol.order,
                };
            } else if (bol.consignment) {
                order = {
                    type: 'consignment',
                    data: bol.consignment,
                };
            } else if (bol.anonymous) {
                order = {
                    type: 'anonymous',
                    data: bol.anonymous,
                };
            }

            return {
                bol_code: bol.bol_code,
                status: bol.status,
                order: order,
            };
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            bols: formattedBOLs,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const searchBOLService = async (keyword, page, pageSize) => {
    try {
        const bols = await BOL.findAndCountAll({
            where: {
                bol_code: {
                    [sequelize.Op.like]: `%${keyword}%`,
                },
            },
            offset: (page - 1) * pageSize,
            limit: pageSize,
            include: [
                { model: Order, as: 'order' },
                { model: Consignment, as: 'consignment' },
                { model: AnonymousConsignment, as: 'anonymous' },
            ],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            bols
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

const deleteBOLService = async (id) => {
    try {
        const bol = await BOL.findOne({ where: { id } });
        if (!bol) {
            return responseCodes.BOL_NOT_FOUND;
        }

        if (bol.anonymous_id && bol.create_at === bol.update_at) {
            await bol.destroy();
            return responseCodes.DELETE_BOL_SUCCESS;
        }

        return responseCodes.UNPROFITABLE;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createBOLService,
    getBOLsByStatusService,
    searchBOLService,
    updateBOLService,
    assignCustomerService,
    deleteBOLService,
}