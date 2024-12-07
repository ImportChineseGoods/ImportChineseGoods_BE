const express = require('express');
const {
    createDeliveryNote,
    getAllDeliveryNote,
    getDeliveryNoteById,
    queryDeliveryNote,
    updateDeliveryNote,
    cancelDeliveryNote,
    exportDeliveryNote,
} = require('../../controllers/deliveryNoteController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.all("*", checkRole('exclude', ['customer']));

router.get("/", getAllDeliveryNote);
router.post("/new", createDeliveryNote);
router.get("/query", queryDeliveryNote);
router.get("/:id", getDeliveryNoteById);
router.patch("/cancel/:id", cancelDeliveryNote);
router.patch("/export", exportDeliveryNote);
router.patch("/:id", updateDeliveryNote);

module.exports = router; 