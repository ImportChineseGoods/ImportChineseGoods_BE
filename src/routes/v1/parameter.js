const express = require('express');
const { createParameter, getAllParameter, getParameterByType, updateParameter, deleteParameter } = require('../../controllers/parameterController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.get("/", getAllParameter);
router.post("/new", checkRole('include', ['admin']), createParameter);
router.patch("/:id", checkRole('include', ['admin']), updateParameter);
router.delete("/:id", checkRole('include', ['admin']), deleteParameter);
router.get("/:type", getParameterByType);

module.exports = router; 