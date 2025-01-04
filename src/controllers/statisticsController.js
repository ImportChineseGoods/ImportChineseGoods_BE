const { revenueStatisticsService,
    profitStatisticsService,
    debtStatisticsService,
    getOrderService} = require("../services/statisticsService");
const responseCodes = require('../untils/response_types');

const getOrder = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const result = await getOrderService(req.query, page, pageSize);
    return res.status(result.status).json(result);
}   

const getRevenueStatistics = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await revenueStatisticsService(req.query, page, pageSize);
    return res.status(result.status).json(result);
}

const getProfitStatistics = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await profitStatisticsService(req.query, page, pageSize);
    return res.status(result.status).json(result);
}   


const getDebtStatistics = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await debtStatisticsService(req.query, page, pageSize);
    return res.status(result.status).json(result);
}

module.exports = {
    getOrder,
    getRevenueStatistics,
    getProfitStatistics,
    getDebtStatistics,
}