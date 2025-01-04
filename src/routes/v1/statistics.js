const express = require('express');
const { getOrder, getRevenueStatistics, getProfitStatistics, getDebtStatistics } = require('../../controllers/statisticsController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api
  
router.get("/order", checkRole('include', ['admin', 'accountant']), getOrder);
router.get("/revenue", checkRole('include', ['admin', 'accountant']), getRevenueStatistics);
router.get("/profit", checkRole('include', ['admin', 'accountant']), getProfitStatistics);
router.get("/debt", checkRole('include', ['admin', 'accountant']), getDebtStatistics);

module.exports = router; 