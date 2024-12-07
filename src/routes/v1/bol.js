const express = require('express');
const { createBOL, getBOLsByStatus, searchBOL,  updateBOL, assignCustomer, deleteBOL } = require('../../controllers/bolController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.all("*", checkRole('exclude', ['customer']))

router.post("/new", createBOL);
router.get("/get/:status", getBOLsByStatus);
router.get("/search", searchBOL)
router.patch("/assign/:customer_id", assignCustomer);
router.patch("/:bol_code", updateBOL);
router.delete("/:bol_code", deleteBOL);

module.exports = router; 