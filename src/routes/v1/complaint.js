const express = require('express');
const { createComplaint, getAllComplaint, getComplaintsByCustomerId,  updateComplaint, deleteComplaint, confirmProcess } = require('../../controllers/complaintController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.all("*", checkRole('exclude', ['customer', 'warehouse']))

router.get("/", getAllComplaint);
router.post("/new", createComplaint);
router.get("/:customerId", getComplaintsByCustomerId);
router.patch("/confirm/:id", confirmProcess);
router.patch("/:id", updateComplaint);
router.patch("/:id", deleteComplaint);

module.exports = router; 