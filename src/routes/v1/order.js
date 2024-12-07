const express = require('express');
const {
    createOrder,
    getAllOrder,
    getOrderByCustomerId,
    getOrderById,
    queryOrder,
    updateOrder,
    cancelOrder,
    customerCancelOrder,
    assignContractCode,
    assignBOL,
    approveOrder
} = require('../../controllers/orderController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", checkRole('exclude', ['customer']), getAllOrder);
router.post("/new", checkRole('include', ['customer']), createOrder);
router.get("/query", queryOrder);
router.get("/customer/:customer_id", getOrderByCustomerId);
router.get("/:id", getOrderById);
router.patch("/cancel/:id", checkRole('exclude', ['customer', 'warehouse']), cancelOrder);
router.patch("/customer-cancel/:id", checkRole('include', ['customer']), customerCancelOrder);
router.patch("/assign-contract-code/:id", checkRole('exclude', ['customer', 'warehouse']), assignContractCode);
router.patch("/assign-bol/:id", checkRole('exclude', ['customer', 'warehouse']), assignBOL);
router.patch("/approve/:id", checkRole('exclude', ['customer', 'warehouse']), approveOrder);
router.patch("/:id", checkRole('exclude', ['customer', 'warehouse']), updateOrder);

module.exports = router; 