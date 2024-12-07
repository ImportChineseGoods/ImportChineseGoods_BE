const express = require('express');
const { createEmployee, handleLogin, getAllEmployee, getEmployeeById, editInfo, updateEmployee, deleteEmployee, changePassword, searchEmployee } = require('../../controllers/employeeController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", checkRole('include', ['admin']), getAllEmployee);
router.post("/register", checkRole('include', ['admin']), createEmployee);
router.post("/login", handleLogin);
router.get("/search", checkRole('exclude', ['customer']), searchEmployee)
router.get("/:id", checkRole('exclude', ['customer']), getEmployeeById);
router.patch("/edit-info", checkRole('exclude', ['customer']), editInfo);
router.patch("/lock/:id", checkRole('include', ['admin']), deleteEmployee);
router.patch("/change-password", checkRole('exclude', ['customer']), changePassword);
router.patch("/:id", checkRole('include', ['admin']), updateEmployee);

module.exports = router; 