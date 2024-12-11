require('dotenv').config();

const { QueryTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Consignment = sequelize.models.Consignment;
const BOL = sequelize.models.BOL;
const History = sequelize.models.History;
const Employee = sequelize.models.Employee;
const Warehouse = sequelize.models.Warehouse;
const responseCodes = require('../untils/response_types');
const { refundTransactionService } = require('./transactionService');

const createConsignmentService = async (customerId, data, dbTransaction) => {
    const transaction = dbTransaction || await sequelize.transaction();
    try {
        const lastConsignment = await Consignment.findOne({
            order: [['id', 'DESC']],
            attributes: ['id'],
            limit: 1,
        }, { transaction });
        const bol = await BOL.findOne({ where: { bol_code: data.bol_code } });
        if (bol) return responseCodes.BOL_EXISTS;

        let newConsignmentId = 'KG0001';
        if (lastConsignment) {
            const lastNumber = parseInt(lastConsignment.id.replace('KG', ''), 10);

            if (lastNumber < 9999) {
                newConsignmentId = `KG${String(lastNumber + 1).padStart(4, '0')}`;
            } else {
                newConsignmentId = `KG${lastNumber + 1}`;
            }
        }
        const result = await Consignment.create(
            {
                id: newConsignmentId,
                customer_id: customerId,
                warehouse_id: data.warehouse_id,
                status: data?.status || 'shop_shipping',
                note: data?.note,
            },
            { transaction }
        );

        const bolData = {
            consignment_id: result.id,
            bol_code: data.bol_code,
            status: 'shop_shipping'
        }
        await BOL.create(bolData, { transaction });

        await transaction.commit();
        return {
            ...responseCodes.CREATE_ORDER_SUCCESS,
            consignment: result,
        };
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllConsignmentService = async (page, pageSize) => {
    try {
        const consignments = await Consignment.findAndCountAll({
            order: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            consignments
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getConsignmentByCustomerIdService = async (customerId, page, pageSize) => {
    try {
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Truy vấn với LEFT JOIN và phân trang
        // const consignments = await sequelize.query(
        //     `
        //     SELECT c.*, b.bol_code
        //     FROM consignments c
        //     LEFT JOIN bols b ON c.id = b.consignment_id
        //     WHERE c.customer_id = :customerId
        //     ORDER BY c.update_at DESC
        //     LIMIT :limit OFFSET :offset
        //     `,
        //     {
        //         replacements: { customerId, limit, offset },
        //         type: QueryTypes.SELECT
        //     }
        // );

        // const total = await Consignment.count({ where: { customer_id: customerId } });
        const consignments = await Consignment.findAndCountAll({
            where: { customer_id: customerId },
            order: [['update_at', 'DESC']],
            limit,
            offset,
            include: [
                { model: BOL, as: 'bol', attributes: ['bol_code'] }
            ]
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            consignments
        };
    } catch (error) {
        console.error(error.message);
        return responseCodes.SERVER_ERROR;
    }
};

const getConsignmentByIdService = async (customerId, id) => {
    try {
        console.log(id);
        const consignment = await Consignment.findOne({
            where: { id: id, customer_id: customerId },
            include: [
            { model: BOL, as: 'bol', attributes: ['bol_code'] },
            {
                model: History,
                as: 'histories',
                include: [
                    { model: Employee, as: 'employee', attributes: ['name'] }
                ]

            },
            {
                model: Warehouse,
                as: 'warehouse',
                attributes: ['name']
            },
        ]});
    if (!consignment) {
        return responseCodes.NOT_FOUND;
    }

    return {
        ...responseCodes.GET_DATA_SUCCESS,
        consignment
    }
} catch (error) {
    console.error(error);
    return responseCodes.SERVER_ERROR;
}
}

const queryConsignmentService = async (query, page, pageSize) => {
    try {
        const conditions = {};

        if (query.status && query.status.length > 0) {
            conditions.status = {
                [sequelize.Op.in]: query.status
            };
        }

        if (query.search) {
            conditions[sequelize.Op.or] = [
                { customer_id: { [sequelize.Op.like]: `%${query.search}%` } },
                { id: { [sequelize.Op.like]: `%${query.search}%` } }
            ];
        }

        if (query.fromDate && query.toDate) {
            conditions.update_at = {
                [sequelize.Op.between]: [query.fromDate, query.toDate]
            };
        } else if (query.fromDate) {
            conditions.update_at = {
                [sequelize.Op.gte]: query.fromDate
            };
        } else if (query.toDate) {
            conditions.update_at = {
                [sequelize.Op.lte]: query.toDate
            };
        }

        const consignments = await Consignment.findAndCountAll({
            where: conditions,
            order: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            consignments
        }
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateConsignmentService = async (id, data) => {
    try {
        const consignment = await Consignment.findOne({ where: { id } });
        if (!consignment) {
            return responseCodes.NOT_FOUND;
        }
        await consignment.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            consignment
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const cancelConsignmentService = async (user, id) => {
    const transaction = await sequelize.transaction();
    try {
        const consignment = await Consignment.findOne({ where: { id }, transaction });
        if (!consignment) {
            await transaction.rollback();
            return responseCodes.ORDER_NOT_FOUND;
        }
        const status = ['exported', 'cancelled'];
        if (status.includes(consignment.status)) {
            await transaction.rollback();
            return responseCodes.UNPROFITABLE;
        }
        await consignment.update({ status: 'cancelled' }, { transaction, user });
        if (consignment.amount_paid > 0) {
            const refunData = {
                customer_id: consignment.customer_id,
                value: consignment.amount_paid,
                type: 'refund',
                content: 'Hoàn tiền cho đơn hàng ' + consignment.id,
                employee_id: user.id
            }
            await refundTransactionService(refunData, transaction);
        }

        await transaction.commit();
        return {
            ...responseCodes.UPDATE_SUCCESS,
            consignment,
            history
        };

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return responseCodes.SERVER
    }
};

const customerCancelConsignmentService = async (user, id) => {
    try {
        const consignment = await Consignment.findOne({ where: { id, customer_id: user.id } });
        if (!consignment) {
            return responseCodes.ORDER_NOT_FOUND;
        }
        if (consignment.statusv === 'shop_shipping') {
            await consignment.update({ status: 'cancelled' }, { transaction });
            if (consignment.amount_paid > 0) {
                const refunData = {
                    customer_id: consignment.customer_id,
                    value: consignment.amount_paid,
                    type: 'refund',
                    content: 'Hoàn tiền cho đơn hàng ' + consignment.id,
                }
                await refundTransactionService(refunData, transaction);
            }
        } else {
            return responseCodes.UNPROFITABLE;
        }
        await consignment.update({ status: 'cancelled' });
        return responseCodes.UPDATE_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

const deleteConsignmentService = async (id) => {
    try {
        const consignment = await Consignment.findOne({ where: { id } });
        if (!consignment) {
            return responseCodes.NOT_FOUND;
        }

        if (consignment.status !== 'shop_shipping') {
            return responseCodes.UNPROFITABLE;
        }
        await consignment.destroy();
        return responseCodes.DELETE_SUCCESS;
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createConsignmentService,
    getAllConsignmentService,
    getConsignmentByCustomerIdService,
    getConsignmentByIdService,
    queryConsignmentService,
    updateConsignmentService,
    cancelConsignmentService,
    customerCancelConsignmentService,
    deleteConsignmentService
}