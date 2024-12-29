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
            Consignment.hasMany(models.History, {
                foreignKey: 'consignment_id',
                as: 'histories'
            })
            Consignment.hasOne(models.BOL, {
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
            },
            onDelete: 'RESTRICT',
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
            allowNull: false,
            defaultValue: 0
        },
        incurred_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            defaultValue: 0
        },
        weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        weight_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true,
        },
        original_weight_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true,
        },
        shipping_discount: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0
        },
        total_amount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true,
        },
        amount_paid: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            defaultValue: 0
        },
        outstanding_amount: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: true,
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
            },
            onDelete: 'SET NULL',
        },
        delivery_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'delivery_notes',
                key: 'id'
            },
            onDelete: 'SET NULL',
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'consignments',
        modelName: 'Consignment',
        sequelize,
    });

    Consignment.beforeCreate(async (consignment, options) => {
        const Parameter = sequelize.models.Parameter;
        const Customer = sequelize.models.Customer;

        const weightFeeParameter = await Parameter.findOne({ where: { type: 'weight_fee' } });
        const originalWeightFeeParameter = await Parameter.findOne({ where: { type: 'original_weight_fee' } });
        consignment.weight_fee = weightFeeParameter.value;
        consignment.original_weight_fee = originalWeightFeeParameter.value;

        const customer = await Customer.findOne({ where: { id: consignment.customer_id } });
        consignment.shipping_discount = customer.shipping_discount;

        consignment.shipping_fee = Math.round(consignment.weight * consignment.weight_fee);
        consignment.total_amount = 
            consignment.shipping_fee - Math.round(consignment.shipping_fee * consignment.shipping_discount / 100) +
            (consignment.incurred_fee || 0)
        consignment.outstanding_amount = Math.round(
            consignment.total_amount - (consignment.amount_paid || 0)
        );

    });

    Consignment.afterCreate(async (consignment, options) => {
        const History = sequelize.models.History;
        await History.create({
            consignment_id: consignment.id,
            status: consignment.status,
        }, { transaction: options.transaction });
    });

    Consignment.beforeUpdate(async (consignment, options) => {
        consignment.shipping_fee = Math.round(consignment.weight * consignment.weight_fee);
        consignment.total_amount = 
            consignment.shipping_fee - Math.round(consignment.shipping_fee * consignment.shipping_discount / 100) +
            (consignment.incurred_fee || 0)
        consignment.outstanding_amount = Math.round(
            consignment.total_amount - (consignment.amount_paid || 0)
        );
    });

    Consignment.afterUpdate(async (consignment, options) => {
        const History = sequelize.models.History;
        const DeliveryNote = sequelize.models.DeliveryNote;

        if (consignment._previousDataValues.status !== consignment.status) {
            const employeeId = options?.user.id || null;
            console.log(consignment, employeeId)
            await History.create({
                consignment_id: consignment.id,
                status: consignment.status,
                employee_id: employeeId,
            }, { transaction: options.transaction });
        }

        if (consignment.delivery_id && consignment._previousDataValues.outstanding_amount !== consignment.outstanding_amount) {
            const delivery = await DeliveryNote.findOne({
                where: { id: consignment.delivery_id },
                include: [
                    { model: Consignment, as: 'consignments' },
                ],
                transaction: options.transaction,
            });
            delivery.total_amount = delivery.consignments.reduce((acc, cur) => acc + cur.total_amount, 0) + delivery.incurred_fee;
            delivery.amount_paid = delivery.consignments.reduce((acc, cur) => acc + cur.amount_paid, 0);
            delivery.outstanding_amount = delivery.total_amount - delivery.amount_paid;

            await delivery.save({ transaction: options.transaction });
        }
    });

    return Consignment;
}
