const { getOverviewService, getAllCustomerService, getCustomerService, getOrderByCustomerService } = require("../services/adminDataService");
const responseCodes = require('../untils/response_types');

const getOverviewData = async (req, res) => {
    const result = await getOverviewService(req.user);
    return res.status(result.status).json(result);
}

const getAllCustomerData = async (req, res) => {
    const result = await getAllCustomerService();
    return res.status(result.status).json(result);
}

const getCustomer = async (req, res) => {
    const result = await getCustomerService(req.query);
    return res.status(result.status).json(result);
}

const getOrderByCustomer = async (req, res) => {
    const result = await getOrderByCustomerService(req.query);
    return res.status(result.status).json(result);
}

module.exports = {
    getOverviewData,
    getAllCustomerData,
    getCustomer,
    getOrderByCustomer
}