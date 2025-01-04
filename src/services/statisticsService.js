require('dotenv').config();

const sequelize = require('../config');
const Order = sequelize.models.Order;
const Consignment = sequelize.models.Consignment;
const Customer = sequelize.models.Customer;
const Employee = sequelize.models.Employee;

const responseCodes = require('../untils/response_types');

const { Op, literal } = require('sequelize');

const normalQuery = async (query) => {
    const conditions = {};
    if (query?.dateRange) {
        conditions.update_at = { [Op.between]: query.dateRange }
    }

    if (query?.employee && query.employee !== 'all') {
        const customerIds = await Customer.findAll({
            attributes: ['id'],
            where: { sales_id: query.employee }
        });

        const customerIdList = customerIds.map(c => c.id);

        if (customerIdList.length) {
            conditions.customer_id = { [Op.in]: customerIdList };
        } else {
            conditions.customer_id = null;
        }
    }

    conditions.status = 'exported';

    return conditions;
}

const getOrderService = async (query, page, pageSize) => {
    try {
        const conditions = await normalQuery(query);
        let orders, consignments;
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        if (query.type === 'order') {
            orders = await Order.findAndCountAll({
                where: conditions,
                order: [['update_at', 'DESC']],
                limit: pageSize,
                offset: (page - 1) * pageSize,
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: ['name', 'id']
                    }
                ]
            });

            return {
                ...responseCodes.GET_DATA_SUCCESS,
                data: orders.rows,
                count: orders.count
            }
        }

        if (query.type === 'consignment') {
            consignments = await Consignment.findAndCountAll({
                where: conditions,
                order: [['update_at', 'DESC']],
                limit: pageSize,
                offset: (page - 1) * pageSize,
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: ['name', 'id']
                    }
                ]
            });

            return {
                ...responseCodes.GET_DATA_SUCCESS,
                data: consignments.rows,
                count: consignments.count
            }
        }

        let whereClauseOrder = [];
        let whereClauseConsignment = [];
        let replacements = {};

        if (conditions.update_at) {
            whereClauseOrder.push('o.update_at BETWEEN :fromDate AND :toDate');
            whereClauseConsignment.push('csg.update_at BETWEEN :fromDate AND :toDate');
            replacements.fromDate = conditions.update_at[Op.between][0];
            replacements.toDate = conditions.update_at[Op.between][1];
        }

        if (query.employee !== 'all') {
            if (conditions.customer_id) {
                whereClauseOrder.push('o.customer_id IN (:customerIds)');
                whereClauseConsignment.push('csg.customer_id IN (:customerIds)');
                replacements.customerIds = conditions.customer_id[Op.in];
            } else {
                whereClauseOrder.push('o.customer_id IS NULL');
                whereClauseConsignment.push('csg.customer_id IS NULL');
            }
        }

        if (conditions.status) {
            whereClauseOrder.push('o.status = :status');
            whereClauseConsignment.push('csg.status = :status');
            replacements.status = conditions.status;
        }

        const whereClauseOrderStr = whereClauseOrder.length ? whereClauseOrder.join(' AND ') : '1=1';
        const whereClauseConsignmentStr = whereClauseConsignment.length ? whereClauseConsignment.join(' AND ') : '1=1';

        const mergedResults = await sequelize.query(
            `
            SELECT combined.*, customers.name 
            FROM (
                SELECT o.id, o.update_at, o.customer_id, o.applicable_rate, o.original_rate, o.status, o.commodity_money, o.total_amount, o.create_at, o.shipping_fee, o.weight, o.original_weight_fee, o.actual_payment_amount
                FROM orders o
                INNER JOIN customers c ON o.customer_id = c.id
                WHERE ${whereClauseOrderStr}
                
                UNION ALL
                
                SELECT csg.id, csg.update_at, csg.customer_id, NULL AS applicable_rate, NULL AS original_rate, csg.status, NULL AS commodity_money, csg.total_amount, csg.create_at, csg.shipping_fee, csg.weight, csg.original_weight_fee, NULL AS actual_payment_amount
                FROM consignments csg
                INNER JOIN customers c ON csg.customer_id = c.id
                WHERE ${whereClauseConsignmentStr}
            ) AS combined
            INNER JOIN customers ON combined.customer_id = customers.id
            ORDER BY combined.update_at DESC
            LIMIT ${limit} OFFSET ${offset};
            `,
            {
                replacements: {
                    ...replacements,
                    pageSize,
                    offset: (page - 1) * pageSize
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            data: mergedResults,
            count: mergedResults.length
        }
    } catch (error) {
        console.log('error', error);
        return responseCodes.SERVER_ERROR;
    }
}

const revenueStatisticsService = async (query, page, pageSize) => {
    try {
        const conditions = await normalQuery(query);
        const revenue = {}

        if (query.type !== 'consignment') {

            revenue.totalOrder = await Order.count({
                where: conditions
            });

            revenue.totalRevenueOrder = await Order.sum('total_amount', {
                where: conditions
            });

            revenue.totalCommodityMoneyTQ = await Order.sum('commodity_money', {
                where: conditions
            });

            const orders = await Order.findAll({
                attributes: ['commodity_money', 'applicable_rate', 'shipping_fee', 'shipping_discount'],
                where: conditions
            });

            revenue.totalCommodityMoneyVN = orders.reduce((sum, order) => {
                return sum + (order.commodity_money * order.applicable_rate);
            }, 0);

            revenue.totalShippingFee = orders.reduce((sum, order) => {
                return sum + order.shipping_fee * (1 - order.shipping_discount / 100);
            }, 0);
        }

        if (query.type !== 'order') {
            revenue.totalConsignment = await Consignment.count({
                where: conditions
            });

            revenue.totalRevenueConsignment = await Consignment.sum('total_amount', {
                where: conditions
            });

            const consignments = await Consignment.findAll({
                attributes: ['shipping_fee', 'shipping_discount'],
                where: conditions
            });

            revenue.totalConsignmentShippingFee = consignments.reduce((sum, consignment) => {
                return sum + consignment.shipping_fee * (1 - consignment.shipping_discount / 100);
            }, 0);
        }

        if (revenue) {
            return {
                ...responseCodes.GET_DATA_SUCCESS,
                statistics: {
                    count: (revenue?.totalOrder || 0) + (revenue?.totalConsignment || 0),
                    totalRevenue: (revenue?.totalRevenueOrder || 0) + (revenue?.totalRevenueConsignment || 0),
                    totalCommodityMoneyTQ: revenue?.totalCommodityMoneyTQ || 0,
                    totalCommodityMoneyVN: revenue?.totalCommodityMoneyVN || 0,
                    totalShippingFee: (revenue?.totalShippingFee || 0) + (revenue?.totalConsignmentShippingFee || 0)
                }
            }
        } else {
            return responseCodes.NOT_FOUND;
        }
    }
    catch (error) {
        console.log('error', error);
        return responseCodes.SERVER_ERROR;
    }
}

const profitStatisticsService = async (query, page, pageSize) => {
    try {
        const conditions = await normalQuery(query);
        const revenue = {}

        if (query.type !== 'consignment') {
            revenue.totalOrder = await Order.count({
                where: conditions
            });

            revenue.totalRevenueOrder = await Order.sum('total_amount', {
                where: conditions
            });

            revenue.totalCommodityMoneyTQ = await Order.sum('commodity_money', {
                where: conditions
            });

            const orders = await Order.findAll({
                attributes: ['commodity_money', 'applicable_rate', 'original_rate', 'shipping_fee', 'shipping_discount', 'weight', 'original_weight_fee', 'total_amount', 'actual_payment_amount'],
                where: conditions
            });

            revenue.totalCommodityMoneyVN = orders.reduce((sum, order) => {
                return sum + (order.commodity_money * order.applicable_rate);
            }, 0);

            revenue.totalShippingFee = orders.reduce((sum, order) => {
                return sum + order.shipping_fee * (1 - order.shipping_discount / 100);
            }, 0);

            revenue.totalProfit = orders.reduce((sum, order) => {
                return sum + order.total_amount - order.actual_payment_amount * order.applicable_rate - order.weight * order.original_weight_fee;
            }, 0);
        }

        if (query.type !== 'order') {
            revenue.totalConsignment = await Consignment.count({
                where: conditions
            });

            revenue.totalRevenueConsignment = await Consignment.sum('total_amount', {
                where: conditions
            });

            const consignments = await Consignment.findAll({
                attributes: ['shipping_fee', 'shipping_discount', 'weight', 'original_weight_fee', 'total_amount'],
                where: conditions
            });

            revenue.totalConsignmentShippingFee = consignments.reduce((sum, consignment) => {
                return sum + consignment.shipping_fee * (1 - consignment.shipping_discount / 100);
            }, 0);

            revenue.totalConsignmentProfit = consignments.reduce((sum, consignment) => {
                return sum + consignment.total_amount - consignment.weight * consignment.original_weight_fee;
            }, 0);
        }

        if (revenue) {
            return {
                ...responseCodes.GET_DATA_SUCCESS,
                statistics: {
                    count: (revenue?.totalOrder || 0) + (revenue?.totalConsignment || 0),
                    totalRevenue: (revenue?.totalRevenueOrder || 0) + (revenue?.totalRevenueConsignment || 0),
                    totalCommodityMoneyTQ: revenue?.totalCommodityMoneyTQ || 0,
                    totalCommodityMoneyVN: revenue?.totalCommodityMoneyVN || 0,
                    totalShippingFee: (revenue?.totalShippingFee || 0) + (revenue?.totalConsignmentShippingFee || 0),
                    totalProfit: (revenue?.totalProfit || 0) + (revenue?.totalConsignmentProfit || 0)
                }
            }
        } else {
            return responseCodes.NOT_FOUND;
        }
    }
    catch (error) {
        console.log('error', error);
        return responseCodes.SERVER_ERROR;
    }
}

const debtStatisticsService = async (query, page, pageSize) => {
    try {
        const conditions = {};

        if (query.employee && query.employee !== 'all') {
            conditions.sales_id = query.employee;
        }

        conditions.balance = {
            [Op.lt]: 0
        }

        const customers = await Customer.findAndCountAll({
            attributes: ['id', 'name', 'balance', 'phone', 'accumulation', 'create_at'],
            where: conditions,
            include: [
                {
                    model: Employee,
                    as: 'sales',
                    attributes: ['name']
                }
            ],
            order: [['create_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            customers
        }
    } catch (error) {
        console.log('error', error);
        return responseCodes.SERVER_ERROR;
    }
}

module.exports = {
    revenueStatisticsService,
    profitStatisticsService,
    debtStatisticsService,
    getOrderService,
}