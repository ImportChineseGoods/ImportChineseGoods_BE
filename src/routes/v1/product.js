const express = require('express');
const { createProduct, getProductsByCustomerId, updateProductOrder, updateProduct, deleteProduct } = require('../../controllers/productController');
const checkRole = require('../../middleware/checkRole');

const router = express.Router(); // /v1/api

router.post("/new", checkRole('include', ['customer']), createProduct);
router.get("/", checkRole('include', ['customer']), getProductsByCustomerId);
router.patch("/update-order/:id", checkRole('exclude', ['customer', 'warehouse']), updateProductOrder);
router.patch("/:id", checkRole('include', ['customer']), updateProduct);
router.delete("/:id", checkRole('include', ['customer']), deleteProduct);

module.exports = router; 