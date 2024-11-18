const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Order extends Model {
        static associate(models) {
            Order.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });
            Order.belongsTo(models.Warehouse, {
                foreignKey: 'warehouse_id',
                as: 'warehouse'
            });
            Order.belongsTo(models.DeliveryNote, {
                foreignKey: 'delivery_id',
                as: 'delivery'
            });
            Order.hasMany(models.Complaint, {
                foreignKey: 'order_id',
                as: 'complaints'
            });
            Order.hasMany(models.Product, {
                foreignKey: 'order_id',
                as: 'products'
            });
            Order.hasMany(models.OrderHistory, {
                foreignKey: 'order_id',
                as: 'histories'
            })
            Order.hasOne(models.bol, {
                foreignKey: 'order_id',
                as: 'bol'
            })
        }
    }

    Order.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        applicable_rate: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        original_rate: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(
                'waiting_deposit',
                'deposited',
                'ordering',
                'ordered',
                'shop_shipping',
                'china_warehouse_received',
                'vietnam_warehouse_received',
                'waiting_export',
                'exported',
                'cancelled'
            ),
            allowNull: false
        },
        commodity_money: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        customer_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'customers',
                key: 'id'
            }
        },
        china_shipping_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        purchase_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        incurred_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        number_of_product: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        weight_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        original_weight_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        counting_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true
        },
        purchase_discount: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true
        },
        shipping_discount: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true
        },
        packing_fee: {
            type: DataTypes.DECIMAL(10, 2),
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
        actual_payment_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        negotiable_money: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        contract_code: {
            type: DataTypes.STRING,
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
        },
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'orders',
        modelName: 'Order',
        sequelize,
    });

    return Order;
}
