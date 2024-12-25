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

        if (data.status === 'china_warehouse_received' && bol.status !== 'shop_shipping' ||
            data.status === 'vietnam_warehouse_received' && bol.status !== 'china_warehouse_received' ||
            data.status === 'waiting_export' && bol.status !== 'vietnam_warehouse_received' ||
            data.status === 'exported' && bol.status !== 'waiting_export') {
            await transaction.rollback();
            return responseCodes.STATUS_ORDER_INCORRECT;
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
        const customer = await Customer.findOne({ where: { id: customerId }, transaction });

        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        const lastConsignment = await Consignment.findOne({
            order: [['id', 'DESC']],
            attributes: ['id'],
            limit: 1,
        }, { transaction });

        let newConsignmentId = 'KG0001';

        if (lastConsignment) {
            const lastNumber = parseInt(lastConsignment.id.replace('KG', ''), 10);
            newConsignmentId = `KG${String(lastNumber + 1).padStart(4, '0')}`;
        }

        for (const bol of data.bols) {
            const lastNumber = parseInt(newConsignmentId.replace('KG', ''), 10);
            newConsignmentId = `KG${String(lastNumber + 1).padStart(4, '0')}`;

            const consignment = await Consignment.create({
                id: newConsignmentId,
                customer_id: customerId,
                warehouse_id: 1,
                status: bol?.status,
                weight: bol?.weight,
                note: `Gán khách hàng ${customer.name} cho vận đơn ${bol.bol_code}`,
            }, { transaction, user });

            await BOL.update(
                { consignment_id: consignment.id },
                { where: { bol_code: bol.bol_code }, transaction }
            );

            if (bol.anonymous_id) {
                const histories = await History.findAll({ where: { anonymous_id: bol.anonymous.id }, transaction });
                for (const history of histories) {
                    await history.update({
                        consignment_id: consignment.id,
                        anonymous_id: null
                    }, { transaction });
                }
                const anonymous = await AnonymousConsignment.findOne({ where: { id: bol.anonymous_id }, transaction });
                if (anonymous) {
                    await anonymous.destroy({ transaction });
                }
            }
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
        console.log(query);

        if (query?.status) {
            conditions.status = query.status;
        }

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

            if (query.customer !== 'anonymous') {
                customerConditions.id = query.customer;
                conditions.anonymous_id = null;
            } else {
                conditions.order_id = null;
                conditions.consignment_id = null;
            }
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
                    attributes: ['id', 'customer_id'],
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                            attributes: ['id', 'name'],
                            where: customerConditions,
                            required: true
                        }
                    ]
                },
                {
                    model: Consignment,
                    as: 'consignment',
                    attributes: ['id', 'customer_id'],
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                            attributes: ['id', 'name'],
                            where: customerConditions,
                            required:  true
                        }
                    ]
                },
                { model: AnonymousConsignment, as: 'anonymous' },
            ],
        });

        console.log(conditions)

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
            await bol.destroy();
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
            const sortedHistories = [...bol.order.histories].reverse();
            previousStatus = sortedHistories[1]?.status;
        } else if (bol.consignment && bol.consignment.histories.length > 1) {
            const sortedHistories = [...bol.consignment.histories].reverse();
            previousStatus = sortedHistories[1]?.status;
        } else if (bol.anonymous && bol.anonymous.histories.length > 1) {
            const sortedHistories = [...bol.anonymous.histories].reverse();
            previousStatus = sortedHistories[1]?.status;
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