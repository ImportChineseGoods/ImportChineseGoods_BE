const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Product extends Model {
        static associate(models) {
            Product.belongsTo(models.Shop, {
                foreignKey: 'shop_id',
                as: 'shop'
            });
            Product.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'order'
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
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'shops',
                key: 'id'
            }
        },
        order_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'orders',
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'products',
        modelName: 'Product',
        sequelize,
    });

    return Product;
};
