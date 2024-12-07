const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class History extends Model {
        static associate(models) {
            History.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'order'
            });

            History.belongsTo(models.Consignment, {
                foreignKey: 'consignment_id',
                as: 'consignment'
            });

            History.belongsTo(models.DeliveryNote, {
                foreignKey: 'delivery_id',
                as: 'delivery'
            });

            History.belongsTo(models.Complaint, {
                foreignKey: 'complaint_id',
                as: 'complaint'
            });

            History.belongsTo(models.Employee, {
                foreignKey: 'employee_id',
                as: 'employee'
            });

            History.belongsTo(models.AnonymousConsignment, {
                foreignKey: 'anonymous_id',
                as: 'anonymous'
            });
        };
    }

    History.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        order_id: {
            type: DataTypes.STRING,
            references: {
                model: 'orders',
                key: 'id'
            },
            allowNull: true,
            onDelete: 'CASCADE',
        },
        consignment_id: {
            type: DataTypes.STRING,
            references: {
                model: 'consignments',
                key: 'id'
            },
            allowNull: true,
            onDelete: 'CASCADE',
        },
        delivery_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'delivery_notes',
                key: 'id'
            },
            allowNull: true,
            onDelete: 'CASCADE',
        },
        employee_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'employees',
                key: 'id'
            },
            allowNull: true,
            onDelete: 'SET NULL',
        },
        complaint_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'complaints',
                key: 'id'
            },
            allowNull: true,
            onDelete: 'CASCADE',
        },
        anonymous_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'anonymous_consignments',
                key: 'id'
            },
            allowNull: true,
            onDelete: 'CASCADE',
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

                'pending',
                'processing',
                'completed',

                'cancelled',
            ),
            allowNull: false
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'histories',
        modelName: 'History',
        sequelize,
    });

    return History;
}
