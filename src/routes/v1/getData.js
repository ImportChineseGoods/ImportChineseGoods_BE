const express = require('express');
const { getOverviewData } = require('../../controllers/getDataController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/overview", checkRole('include', ['customer']), getOverviewData);

module.exports = router; 