const { getOverviewService, getOrderDepositService, getDepositInfoService } = require("../services/getDataService");
const responseCodes = require('../untils/response_types');

const getOverviewData = async (req, res) => {
    const result = await getOverviewService(req.user);
    return res.status(result.status).json(result);
}

const getOrderDepositData = async (req, res) => {
    const result = await getOrderDepositService(req.user.id);
    return res.status(result.status).json(result);
}

const getDepositInfoData = async (req, res) => {
    const result = await getDepositInfoService();
    return res.status(result.status).json(result);
}

module.exports = {
    getOverviewData,
    getOrderDepositData, 
    getDepositInfoData
}