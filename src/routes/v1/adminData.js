const express = require('express');
const { getOverviewData, getAllCustomerData, getCustomer, getOrderByCustomer } = require('../../controllers/adminDataController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/overview", checkRole('exclude', ['customer']), getOverviewData);
router.get("/customers", checkRole('exclude', ['customer']), getAllCustomerData);
router.get("/getCustomer", checkRole('exclude', ['customer']), getCustomer);
router.get("/getOrderByCustomer", checkRole('exclude', ['customer']), getOrderByCustomer);

module.exports = router; 