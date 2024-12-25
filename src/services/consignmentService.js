require('dotenv').config();

const { QueryTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Consignment = sequelize.models.Consignment;
const BOL = sequelize.models.BOL;
const History = sequelize.models.History;
const Employee = sequelize.models.Employee;
const Warehouse = sequelize.models.Warehouse;
const Customer = sequelize.models.Customer;
const responseCodes = require('../untils/response_types');
const { refundTransactionService } = require('./transactionService');
const { Sequelize, Op } = require('sequelize');

const createConsignmentService = async (customerId, data, transaction) => {
    const managedTransaction = transaction || await sequelize.transaction();
    let isManagedTransaction = !transaction;
    try {
        const lastConsignment = await Consignment.findOne({
            order: [['id', 'DESC']],
            attributes: ['id'],
            limit: 1,
        }, { transaction: managedTransaction });


        const bol = await BOL.findOne({ where: { bol_code: data.bol_code } }, { managedTransaction });
        if (bol) return responseCodes.BOL_EXISTS;

        let newConsignmentId = 'KG0001';
        if (lastConsignment) {
            const lastNumber = parseInt(lastConsignment.id.replace('KG', ''), 10);
            newConsignmentId = `KG${String(lastNumber + 1).padStart(4, '0')}`;
        }

        const result = await Consignment.create({
            id: newConsignmentId,
            customer_id: customerId,
            warehouse_id: data.warehouse_id,
            status: data?.status || 'shop_shipping',
            note: data?.note,
            weight: data?.weight,
        }, { transaction: managedTransaction });

        await BOL.create({
            consignment_id: result.id,
            bol_code: data.bol_code,
            status: data?.status || 'shop_shipping'
        }, { transaction: managedTransaction });

        if (isManagedTransaction) {
            await managedTransaction.commit();
        }
        return {
            ...responseCodes.CREATE_ORDER_SUCCESS,
            consignment: result,
        };
    } catch (error) {
        if (isManagedTransaction && managedTransaction.rollback) {
            await managedTransaction.rollback();
        }
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

const getConsignmentByIdService = async (user, id) => {
    try {
        let consignment; 
        if (user.role === 'customer') {
        consignment = await Consignment.findOne({
            where: { id: id, customer_id: user.id },
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
            ]
        });}
        else {
            consignment = await Consignment.findOne({
                where: { id },
                include: [
                    { model: BOL, as: 'bol', attributes: ['bol_code'] },
                    { model: Customer, as: 'customer', attributes: ['id', 'name'] },
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
                ]
            });
        }
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

const queryConsignmentService = async (user, query, page, pageSize) => {
    try {
        const conditions = {};
        if (query) {
            if (user.role === 'customer') {
                conditions.customer_id = user.id;
            } else if (query?.customer) {
                conditions.customer_id = query.customer;
            }

            if (query?.status && query.status !== 'all') {
                conditions.status = query.status;
            }
            if (query?.search) {
                conditions[Op.or] = [
                    { customer_id: { [Op.like]: `%${query.search}%` } },
                    { id: { [Op.like]: `%${query.search}%` } },
                    Sequelize.literal(`EXISTS (
                        SELECT 1 FROM bols AS bol
                        WHERE bol.consignment_id = Consignment.id AND bol.bol_code LIKE '%${query.search}%'
                    )`)
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
        }

        const consignments = await Consignment.findAndCountAll({
            where: conditions,
            order: [['update_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            distinct: true,
            include: [
                { model: BOL, as: 'bol', attributes: ['bol_code'] },
                { model: Customer, as: 'customer', attributes: ['id', 'name'] },
                {
                    model: History,
                    as: 'histories',
                    include: [
                        { model: Employee, as: 'employee', attributes: ['name'] }
                    ]

                },
            ]
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

const updateConsignmentService = async (user, id, data) => {
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
    try {
        const consignment = await Consignment.findOne({ where: { id }});
        if (!consignment) {
            return responseCodes.ORDER_NOT_FOUND;
        }
        const status = ['exported', 'cancelled'];
        if (status.includes(consignment.status)) {
            return responseCodes.UNPROFITABLE;
        }
        await consignment.update({ status: 'cancelled' }, { user });
        if (consignment.amount_paid > 0) {
            const refunData = {
                customer_id: consignment.customer_id,
                value: consignment.amount_paid,
                type: 'refund',
                content: 'Hoàn tiền cho đơn hàng ' + consignment.id,
                employee_id: user.id
            }
            await refundTransactionService(refunData);
        }

        return {
            ...responseCodes.UPDATE_SUCCESS,
            consignment,
        };

    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR
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