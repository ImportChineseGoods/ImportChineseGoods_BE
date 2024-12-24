require('dotenv').config();

const { Op, literal } = require('sequelize');
const sequelize = require('../config');
const AnonymousConsignment = sequelize.models.AnonymousConsignment;
const BOL = sequelize.models.BOL;
const Consignment = sequelize.models.Consignment;
const Order = sequelize.models.Order;
const Customer = sequelize.models.Customer;
const History = sequelize.models.History;
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

        if (bol.status === data.status) {
            await transaction.rollback();
            return responseCodes.BOL_IMPORTED;
        }

        await bol.update({
            status: data.status,
            weight: data?.weight
        }, { transaction });

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

        for (const bol of data.bols) {
            const consignment = await createConsignmentService(customerId, {
                status: bol.status,
                weight: bol.weight,
            }, { transaction, user });
            const anonymous = await AnonymousConsignment.findOne({ where: { id: bol.anonymous_id }, transaction });
            const histories = await History.findAll({ where: { anonymous_id: anonymous.id } })
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
        const bols = await BOL.findAndCountAll({
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

const searchBOLService = async (query, page, pageSize) => {
    try {
        const conditions = {};
        const customerConditions = {};

        if (query?.search) {
            conditions[Op.or] = [
                { consignment_id: { [Op.like]: `%${query.search}%` } },
                { id: { [Op.like]: `%${query.search}%` } },
                { anonymous_id: { [Op.like]: `%${query.search}%` } },
                { order_id: { [Op.like]: `%${query.search}%` } },
            ];
        }

        if (query?.dateRange) {
            const fromDate = new Date(query.dateRange[0]);
            const toDate = new Date(query.dateRange[1]);

            if (!isNaN(fromDate) && !isNaN(toDate)) {
                conditions.update_at = {
                    [Op.between]: [fromDate, toDate]
                };
            }
        }

        if (query?.customer) {
            customerConditions.customer_id = query.customer;
        }

        const bols = await BOL.findAndCountAll({
            where: conditions,
            order: [['update_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: ['id'],
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                            attributes: ['id', 'name'],
                            where: customerConditions,
                            required: query?.customer ? true : false
                        }
                    ]
                },
                {
                    model: Consignment,
                    as: 'consignment',
                    attributes: ['id'],
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                            attributes: ['id', 'name'],
                            where: customerConditions,
                            required: query?.customer ? true : false
                        }
                    ]
                },
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

const deleteBOLService = async (id, transaction) => {
    try {
        const bol = await BOL.findOne({
            where: { bol_code: id },
            include: [
                {
                    model: AnonymousConsignment,
                    as: 'anonymous',
                    attribute: ['id'],
                    include: [
                        {
                            model: History,
                            as: 'histories',
                            attributes: ['id']
                        }
                    ]
                }
            ],
            transaction
        });
        if (!bol) {
            await transaction.rollback();
            return responseCodes.BOL_NOT_FOUND;
        }

        const anonymous = await AnonymousConsignment.findOne({ where: { id: bol.anonymous_id }, transaction });

        console.log(bol.anonymous.histories.length);
        if (bol.anonymous_id && bol.anonymous.histories.length < 2) {
            await anonymous.destroy();
            await transaction.commit();
            return responseCodes.DELETE_BOL_SUCCESS;
        }

        await transaction.rollback();
        return responseCodes.UNPROFITABLE;

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const undoBOLService = async (user, bol_code) => {
    const transaction = await sequelize.transaction();
    try {
        const bol = await BOL.findOne({
            where: { bol_code },
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: ['id'],
                    include: [
                        {
                            model: History,
                            as: 'histories',
                            order: [['create_at', 'DESC']]
                        }
                    ]
                },
                {
                    model: Consignment,
                    as: 'consignment',
                    attributes: ['id'],
                    include: [
                        {
                            model: History,
                            as: 'histories',
                            order: [['create_at', 'DESC']]
                        }
                    ]
                },
                {
                    model: AnonymousConsignment,
                    as: 'anonymous',
                    attributes: ['id'],
                    include: [
                        {
                            model: History,
                            as: 'histories',
                            order: [['create_at', 'DESC']]
                        }
                    ]
                },
            ],
            transaction
        });

        if (!bol) {
            return responseCodes.BOL_NOT_FOUND;
        }

        let previousStatus = null;

        if (bol.order && bol.order.histories.length > 1) {
            previousStatus = bol.order.histories[1].status;
        } else if (bol.consignment && bol.consignment.histories.length > 1) {
            previousStatus = bol.consignment.histories[1].status;
        } else if (bol.anonymous && bol.anonymous.histories.length > 1) {
            previousStatus = bol.anonymous.histories[1].status;
        }

        if (previousStatus) {
            await bol.update({ status: previousStatus }, { transaction });

            if (bol.order_id) {
                const order = await Order.findOne({ where: { id: bol.order_id }, transaction });
                await order.update({ status: previousStatus }, { user, transaction });
            } else if (bol.consignment_id) {
                const consignment = await Consignment.findOne({ where: { id: bol.consignment_id }, transaction });
                await consignment.update({ status: previousStatus }, { user, transaction });
            } else if (bol.anonymous_id) {
                const anonymous = await AnonymousConsignment.findOne({ where: { id: bol.anonymous_id }, transaction });
                await anonymous.update({ status: previousStatus }, { user, transaction });
            }

        } else {
            return await deleteBOLService(bol_code, transaction);
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

module.exports = {
    createBOLService,
    getBOLsByStatusService,
    searchBOLService,
    updateBOLService,
    assignCustomerService,
    deleteBOLService,
    undoBOLService,
}