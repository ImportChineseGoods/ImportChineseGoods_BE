const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Warehouse extends Model {
        static associate(models) {
            Warehouse.hasMany(models.Consignment, {
                foreignKey: 'warehouse_id',
                as: 'consignments'
            });

            Warehouse.hasMany(models.Order, {
                foreignKey: 'warehouse_id',
                as: 'orders'
            });
        }
    }

    Warehouse.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'warehouses',
        modelName: 'Warehouse',
        sequelize,
    });

    return Warehouse;
};