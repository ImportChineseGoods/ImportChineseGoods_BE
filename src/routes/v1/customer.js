const express = require('express');
const { createCustomer, handleLogin, getAllCustomer, editInfo, getCustomerById, updateCustomer, deleteCustomer, changePassword, searchCustomer } = require('../../controllers/customerController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", checkRole('exclude', ['customer']), getAllCustomer);
router.post("/register", createCustomer);
router.post("/login", handleLogin);
router.get("/search", checkRole('exclude', ['customer']), searchCustomer)
router.get("/customer", checkRole('include', ['customer']), getCustomerById);
router.get("/:id", checkRole('exclude', ['customer', 'warehouse']), getCustomerById);
router.patch("/edit-info", checkRole('include', ['customer']), editInfo);
router.patch("/change-password", changePassword);
router.patch("/:id", checkRole('include', ['customer', 'admin']), updateCustomer);
router.patch("/lock/:id", checkRole('include', ['admin']), deleteCustomer);

module.exports = router; 