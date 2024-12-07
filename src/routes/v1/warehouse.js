const express = require('express');
const { createWarehouse, getAllWarehouse,  updateWarehouse, deleteWarehouse } = require('../../controllers/warehouseController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.all("*", checkRole('include', ['admin']))

router.post("/new", createWarehouse);
router.get("/get/:customerId", getAllWarehouse);
router.patch("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);

module.exports = router; 