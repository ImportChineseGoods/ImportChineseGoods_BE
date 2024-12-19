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
    deleteConsignment
} = require('../../controllers/consignmentController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", checkRole('exclude', ['customer']), getAllConsignment);
router.post("/new", createConsignment);
router.get("/query", queryConsignment);
router.get("/customer", getConsignmentByCustomerId);
router.get("/:id", getConsignmentById);
router.patch("/cancel/:id", checkRole('include', ['admin']), cancelConsignment);
router.patch("/customer-cancel/:id", checkRole('include', ['customer']), customerCancelConsignment);
router.patch("/:id", checkRole('exclude', ['customer']), updateConsignment);
router.delete("/:id", checkRole('include', ['customer']), deleteConsignment);

module.exports = router; 