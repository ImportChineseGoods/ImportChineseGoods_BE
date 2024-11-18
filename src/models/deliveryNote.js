const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class DeliveryNote extends Model {
        static associate(models) {
            DeliveryNote.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });
            DeliveryNote.hasMany(models.Order, {
                foreignKey: 'delivery_id',
                as: 'orders'
            });
            DeliveryNote.hasMany(models.Consignment, {
                foreignKey: 'delivery_id',
                as: 'consignments'
            });
        }
    }

    DeliveryNote.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        customer_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        total_weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        total_shipping_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        incurred_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        amount_paid: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        outstanding_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(
                'not exported',
                'exported',
                'cancelled'
            ),
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM('order', 'consignment'),
            allowNull: false
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'delivery_notes',
        modelName: 'DeliveryNote',
        sequelize, 
    });


    return DeliveryNote;
}
