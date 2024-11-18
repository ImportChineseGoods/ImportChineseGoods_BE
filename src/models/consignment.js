const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Consignment extends Model {
        static associate(models) {
            Consignment.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });
            Consignment.belongsTo(models.Warehouse, {
                foreignKey: 'warehouse_id',
                as: 'warehouse'
            });
            Consignment.belongsTo(models.DeliveryNote, {
                foreignKey: 'delivery_id',
                as: 'delivery'
            });
            Consignment.hasMany(models.Complaint, {
                foreignKey: 'consignment_id',
                as: 'complaints'
            });
            Consignment.hasMany(models.OrderHistory, {
                foreignKey: 'consignment_id',
                as: 'histories'
            })
            Consignment.hasOne(models.bol, {
                foreignKey: 'consignment_id',
                as: 'bol'
            })
        }
    }

    Consignment.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        customer_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'customers',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM(
                'shop_shipping',
                'china_warehouse_received',
                'vietnam_warehouse_received',
                'waiting_export',
                'exported',
                'cancelled'
            ),
            allowNull: false
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true
        },
        incurred_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true
        },
        weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        weight_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true
        },
        original_weight_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true
        },
        shipping_discount: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true
        },
        total_amount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true
        },
        amount_paid: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true
        },
        outstanding_amount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'warehouses',
                key: 'id'
            }
        },
        delivery_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'delivery_notes',
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'consignments',
        modelName: 'Consignment',
        sequelize,  
    });

    return Consignment;
}
