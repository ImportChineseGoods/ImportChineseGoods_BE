const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderHistory extends Model {
        static associate(models) {
            OrderHistory.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'order'
            });

            OrderHistory.belongsTo(models.Consignment, {
                foreignKey: 'consignment_id',
                as: 'consignment'
            });

            OrderHistory.belongsTo(models.DeliveryNote, {
                foreignKey: 'delivery_id',
                as: 'delivery'
            });

            OrderHistory.belongsTo(models.Employee, {
                foreignKey: 'employee_id',
                as: 'employee'
            });
        };
    }

    OrderHistory.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        order_id: {
            type: DataTypes.STRING,
            references: {
                model: Order,
                key: 'id'
            },
            allowNull: true,
        },
        consignment_id: {
            type: DataTypes.STRING,
            references: {
                model: 'consignments',
                key: 'id'
            },
            allowNull: true,
        },
        delivery_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'delivery_notes',
                key: 'id'
            },
            allowNull: true,
        },
        employee_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'employees',
                key: 'id'
            },
            allowNull: true,
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
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'order_histories',
        modelName: 'OrderHistory',
        sequelize,
    });

    return OrderHistory;
}
