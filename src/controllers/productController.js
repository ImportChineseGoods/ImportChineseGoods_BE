const { createProductService, getProductsByCustomerIdService, updateProductInOrderService, updateProductService, deleteProductService } = require("../services/productService");
const responseCodes = require('../untils/response_types');

const createProduct = async (req, res) => {
    const { name, shop, quantity, price, description, link, image_url, note } = req.body;
    if (!name || !shop || !quantity || !price || !description || !link) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createProductService(req.user.id, req.body);
    return res.status(result.status).json(result);
}

const getProductsByCustomerId = async (req, res) => {
    const shopLimit = parseInt(req.query.shopLimit) || 50;
    const productLimit = parseInt(req.query.productLimit) || 50;
    const result = await getProductsByCustomerIdService(req.user.id, shopLimit, productLimit);
    return res.status(result.status).json(result);
};

const updateProduct = async (req, res) => {
    const result = await updateProductService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const updateProductOrder = async (req, res) => {
    if (req.body.price < 0 || req.body.quantity < 0) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    const result = await updateProductInOrderService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const deleteProduct = async (req, res) => {
    const result = await deleteProductService(req.params.id);
    return res.status(result.status).json(result);
}

module.exports = {
    createProduct,
    getProductsByCustomerId,
    updateProduct,
    updateProductOrder,
    deleteProduct,
}