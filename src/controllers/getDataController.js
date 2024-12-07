const { getOverviewService } = require("../services/getDataService");
const responseCodes = require('../untils/response_types');

const getOverviewData = async (req, res) => {
    const result = await getOverviewService(req.user);
    return res.status(result.status).json(result);
}



module.exports = {
    getOverviewData
}