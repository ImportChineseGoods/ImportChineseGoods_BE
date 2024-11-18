const express = require('express');
const { createEmployee, handleLogin, getAllEmployee, getEmployeeById, updateEmployee, deleteEmployee, changePassword, searchEmployee } = require('../../controllers/employeeController');
const auth = require('../../middleware/auth');
const delay = require('../../middleware/delay');

const router = express.Router(); // /v1/api

router.all("*", auth)

router.get("/", getAllEmployee);
router.post("/register", createEmployee);
router.post("/login", handleLogin);
router.get("/search", searchEmployee)
router.get("/:id", getEmployeeById);
router.post("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.post("/change-password/:id", changePassword);

module.exports = router; 