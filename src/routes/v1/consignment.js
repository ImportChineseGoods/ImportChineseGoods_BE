const express = require('express');
const {
    createConsignment,
    getAllConsignment,
    getConsignmentByCustomerId,
    getConsignmentById,
    queryConsignment,
    updateConsignment,
    cancelConsignment,
    customerCancelConsignment,
} = require('../../controllers/consignmentController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", getAllConsignment);
router.post("/new", createConsignment);
router.get("/query", queryConsignment);
router.get("/customer/:customer_id", getConsignmentByCustomerId);
router.get("/:id", getConsignmentById);
router.patch("/cancel/:id", checkRole('include', ['admin']), cancelConsignment);
router.patch("/customer-cancel/:id", checkRole('include', ['customer']), customerCancelConsignment);
router.patch("/:id", checkRole('include', ['admin']), updateConsignment);

module.exports = router; 