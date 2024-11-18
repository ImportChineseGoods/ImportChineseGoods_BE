const express = require('express');
const { createCustomer, handleLogin, getAllCustomer, getCustomerById, updateCustomer, deleteCustomer, changePassword, searchCustomer } = require('../../controllers/customerController');
const auth = require('../../middleware/auth');
const delay = require('../../middleware/delay');

const router = express.Router(); // /v1/api

router.all("*", auth)

router.get("/", getAllCustomer);
router.post("/register", createCustomer);
router.post("/login", handleLogin);
router.get("/search", searchCustomer)
router.get("/:id", getCustomerById);
router.post("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.post("/change-password/:id", changePassword);

module.exports = router; 