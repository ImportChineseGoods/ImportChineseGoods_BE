const express = require('express');
const { getOverviewData, getOrderDepositData, getDepositInfoData, getComplaintOrderData } = require('../../controllers/getDataController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/overview", checkRole('include', ['customer']), getOverviewData);
router.get("/deposit", checkRole('include', ['customer']), getOrderDepositData);
router.get("/deposit-info", checkRole('include', ['customer']), getDepositInfoData);
router.get("/complaint-order", checkRole('include', ['customer']), getComplaintOrderData);

module.exports = router; 