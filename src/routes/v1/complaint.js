const express = require('express');
const { createComplaint, getAllComplaint, queryComplaint, getComplaintsByCustomerId,  updateComplaint, deleteComplaint, confirmProcess } = require('../../controllers/complaintController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", checkRole('exclude', ['customer', 'warehouse']), getAllComplaint);
router.get("/query", checkRole('exclude', ['customer', 'warehouse']), queryComplaint);
router.post("/new", checkRole('include', ['customer']), createComplaint);
router.get("/customer", checkRole('include', ['customer']), getComplaintsByCustomerId);
router.patch("/confirm/:id", checkRole('exclude', ['customer', 'warehouse']), confirmProcess);
router.patch("/:id", checkRole('exclude', ['customer', 'warehouse']), updateComplaint);
router.patch("/cancel/:id", checkRole('exclude', ['warehouse']), deleteComplaint);

module.exports = router; 