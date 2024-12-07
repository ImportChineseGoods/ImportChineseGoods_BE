const { Model, DataTypes } = require('sequelize');
const { options } = require('../routes/v1');

module.exports = (sequelize) => {
    class Product extends Model {
        static associate(models) {
            Product.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'order'
            });
            Product.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });
        }
    }

    Product.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        link: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        image_url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        shop: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customer_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'customers',
                key: 'id'
            },
            onDelete: 'CASCADE',
        },
        order_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'orders',
                key: 'id'
            },
            onDelete: 'CASCADE',
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'products',
        modelName: 'Product',
        sequelize,
    });

    Product.afterUpdate(async (product, options) => {
        const Order = sequelize.models.Order;

        if (product.order_id &&
            (product._previousDataValues.quantity !== product.quantity || product._previousDataValues.price !== product.price)) {
            const order = await Order.findOne({
                where: { id: product.order_id },
                include: [
                    { model: Product, as: 'products' },
                ],
            });
            order.commodity_money = order.products.reduce((total, product) => total + product.price * product.quantity, 0);

            await order.save();
        }
    });

    return Product;
};
