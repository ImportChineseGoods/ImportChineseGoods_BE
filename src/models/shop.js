const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Shop extends Model {
        static associate(models) {
            Shop.hasMany(models.Product, {
                foreignKey: 'shop_id',
                as: 'products'
            });
            Shop.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });
        }
    }

    Shop.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        customer_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'customers',
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'shops',
        modelName: 'Shop',
        sequelize,        
    });

    return Shop;
};
