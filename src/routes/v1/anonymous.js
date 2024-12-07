const express = require('express');
const { createAnonymous, getAllAnonymous,  updateAnonymous, deleteAnonymous } = require('../../controllers/anonymousController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.all("*", checkRole('exclude', ['customer']))

router.get("/", getAllAnonymous);
router.post("/new", createAnonymous);
router.patch("/:id", updateAnonymous);
router.delete("/:id", deleteAnonymous);

module.exports = router; 