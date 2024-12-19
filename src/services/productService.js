require('dotenv').config();

const sequelize = require('../config');
const Product = sequelize.models.Product;
const Customer = sequelize.models.Customer;
const Order = sequelize.models.Order;
const responseCodes = require('../untils/response_types');

const createProductService = async (id, data) => {
    try {
        if (data.price < 0 || data.quantity < 0) return responseCodes.INVALID;
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) return responseCodes.ACCOUNT_NOT_FOUND;
        const shops = await Product.findAll({ where: { shop: data.shop } });
        if (shops.length > 50) return responseCodes.SHOP_LIMIT;
        data.customer_id = id;
        const result = await Product.create(data);

        return {
            ...responseCodes.CREATE_PRODUCT_SUCCESS,
            product: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getProductsByCustomerIdService = async (customerId, shopLimit, productLimit) => {
    try {
        const products = await Product.findAll({
            where: { customer_id: customerId, order_id: null },
            order: [['shop', 'ASC'], ['update_at', 'DESC']],
            limit: productLimit + 1,
        });

        const groupedProducts = {};
        products.forEach((product) => {
            if (!groupedProducts[product.shop]) {
                groupedProducts[product.shop] = [];
            }
            groupedProducts[product.shop].push(product);
        });

        const sortedShops = Object.entries(groupedProducts)
            .map(([shop, products]) => ({
                shop,
                products,
                latestUpdate: new Date(products[0].update_at).getTime(),
            }))
            .sort((a, b) => b.latestUpdate - a.latestUpdate);

        const result = [];
        let totalProducts = 0;

        for (const shop of sortedShops) {
            if (result.length > shopLimit || totalProducts > productLimit) break;

            const remainingLimit = productLimit - totalProducts;
            const shopProducts = shop.products.slice(0, remainingLimit);

            result.push({
                shop: shop.shop,
                products: shopProducts,
            });

            totalProducts += shopProducts.length;
        }

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            shops: result,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateProductService = async (id, data) => {
    try {
        const product = await Product.findOne({ where: { id } });
        if (!product) {
            return responseCodes.PRODUCT_NOT_FOUND;
        }
        if (data?.quantity < 0) await product.destroy();
        await product.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            product
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateProductInOrderService = async (user, productId, data) => {
    try {
        const product = await Product.findOne({ where: { id: productId } });
        if (!product) return responseCodes.NOT_FOUND;

        await product.update(data);

        const order = await Order.findOne({ where: { id: product.order_id } });
        if (!order) return responseCodes.ORDER_NOT_FOUND;

        const productsInOrder = await Product.findAll({ where: { order_id: product.order_id } });

        const newCommodityMoney = productsInOrder.reduce((total, product) => total + (product.price * product.quantity), 0);
        const newNumberOfProducts = productsInOrder.reduce((total, product) => total + product.quantity, 0);

        const purchaseFee = Math.max(newCommodityMoney * order.applicable_rate * 0.03, 10000);
        console.log(newCommodityMoney, newNumberOfProducts, purchaseFee);

        await order.update({
            commodity_money: newCommodityMoney,
            number_of_product: newNumberOfProducts,
            purchase_fee: purchaseFee
        }, { user });

        return {
            ...responseCodes.UPDATE_SUCCESS,
            order,
            product
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteProductService = async (id) => {
    try {
        const product = await Product.findOne({where: { id } });
        if (!product) {
            return responseCodes.PRODUCT_NOT_FOUND;
        }

        if (product.order_id) return responseCodes.PRODUCT_HAS_ORDER;

        await product.destroy();
        return responseCodes.DELETE_PRODUCT_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getProductByIdService = async (id) => {
    try {
        const product = await Product.findOne({ where: { id } }, { attributes: [order_id]});
        if (!product) return responseCodes.PRODUCT_NOT_FOUND;

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            product
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
}

module.exports = {
    createProductService,
    getProductsByCustomerIdService,
    updateProductService,
    updateProductInOrderService,
    deleteProductService,
    getProductByIdService
}