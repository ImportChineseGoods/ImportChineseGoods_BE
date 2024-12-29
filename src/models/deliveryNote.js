const { Model, DataTypes } = require('sequelize');
const employee = require('./employee');

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

            DeliveryNote.hasMany(models.History, {
                foreignKey: 'delivery_id',
                as: 'histories'
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
            allowNull: true,
            references: {
                model: 'customers',
                key: 'id'
            },
            onDelete: 'RESTRICT',
        },
        total_weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        incurred_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
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
                'waiting_export',
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
        },
        number_of_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'delivery_notes',
        modelName: 'DeliveryNote',
        sequelize, 
    });

    DeliveryNote.afterCreate(async (deliveryNote, options) => {
        const History = sequelize.models.History;
        const Customer = sequelize.models.Customer;

        await History.create({
            delivery_id: deliveryNote.id,
            status: deliveryNote.status,
            employee_id: options.user?.id || null
        }, { transaction: options.transaction });

        if (deliveryNote.status === 'exported') {
            const customer = await Customer.findByPk(deliveryNote.customer_id);
            await customer.update({
                accumulation: Math.round(customer.accumulation) + Math.round(deliveryNote.total_amount),
            }, { transaction: options.transaction });
        }
    });

    DeliveryNote.beforeUpdate(async (deliveryNote, options) => {
        const History = sequelize.models.History;
        const Customer = sequelize.models.Customer;
        
        deliveryNote.outstanding_amount = deliveryNote.total_amount - deliveryNote.amount_paid;
        if (deliveryNote._previousDataValues.status !== deliveryNote.status) {
            const employeeId = options.user?.id || null;
    
            await History.create(
                {
                    delivery_id: deliveryNote.id,
                    status: deliveryNote.status,
                    employee_id: employeeId,
                },
                { transaction: options.transaction }
            );
        }
    });
    return DeliveryNote;
}
