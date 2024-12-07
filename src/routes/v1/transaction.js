const express = require('express');
const {
    withdrawTransaction,
    createTransaction,
    getTransactionsByStatus,
    depositTransaction,
    searchTransaction,
    approveTransaction,
    cancelTransaction,
    getAllTransation,
    getTransactionByCustomerId,
} = require('../../controllers/transactionController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", checkRole('exclude', ['customer', 'warehouse']), getAllTransation);
router.get("/customer/:customerId", checkRole('exclude', ['warehouse']), getTransactionByCustomerId);
router.post("/withdraw", checkRole('include', ['customer']), withdrawTransaction);
router.post("/deposit/:orderId", checkRole('include', ['customer']), depositTransaction);
router.post("/approve", checkRole('include', ['admin', 'accountant']), approveTransaction);
router.post("/cancel", checkRole('exclude', ['warehouse']), cancelTransaction);
router.post("/new", checkRole('include', ['admin', 'accountant']), createTransaction);
router.get("/status/:status", checkRole('exclude', ['customer']), getTransactionsByStatus);
router.get("/search", checkRole('exclude', ['customer']), searchTransaction);

module.exports = router; 