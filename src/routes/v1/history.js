const express = require('express');
const { createHistory, getHistoryByOrderId, getHistoryByConsignmentId, getHistoryByDeliveryId, getHistoryByComplaintId, updateHistory, deleteHistory } = require('../../controllers/historyController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.post("/new", createHistory);
router.get("/order/:order_id", getHistoryByOrderId);
router.get("/consignment/:consignment_id", getHistoryByConsignmentId);
router.get("/delivery/:delivery_id", getHistoryByDeliveryId);
router.get("/complaint/:complaint_id", getHistoryByComplaintId);
router.patch("/:id", checkRole('include', ['admin']), updateHistory);
router.delete("/:id", checkRole('include', ['admin']), deleteHistory);

module.exports = router; 