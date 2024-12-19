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
            Order.hasMany(models.History, {
                foreignKey: 'order_id',
                as: 'histories'
            })
            Order.hasOne(models.BOL, {
                foreignKey: 'order_id',
                as: 'bol'
            })
        }
    }

    Order.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
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
            allowNull: false,
            defaultValue: 0
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
        china_shipping_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        purchase_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true,
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: true,
        },
        incurred_fee: {
            type: DataTypes.DECIMAL(10, 0),
            allowNull: false,
            defaultValue: 0
        },
        number_of_product: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
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
            allowNull: false,
            defaultValue: 0
        },
        purchase_discount: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0
        },
        shipping_discount: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0
        },
        packing_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
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
            allowNull: true,
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
        },
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'orders',
        modelName: 'Order',
        sequelize,
    });
    Order.beforeCreate(async (order, options) => {
        const Parameter = sequelize.models.Parameter;
        const Customer = sequelize.models.Customer;

        const weightFeeParameter = await Parameter.findOne({ where: { type: 'weight_fee' } });
        const originalWeightFeeParameter = await Parameter.findOne({ where: { type: 'original_weight_fee' } });
        const applicableRateParameter = await Parameter.findOne({ where: { type: 'applicable_rate' } });
        const originalRateParameter = await Parameter.findOne({ where: { type: 'original_rate' } });

        if (!weightFeeParameter || !originalWeightFeeParameter || !applicableRateParameter || !originalRateParameter) {
            throw new Error('Missing required Parameter values');
        }

        order.weight_fee = weightFeeParameter.value;
        order.original_weight_fee = originalWeightFeeParameter.value;
        order.applicable_rate = applicableRateParameter.value;
        order.original_rate = originalRateParameter.value;

        const customer = await Customer.findOne({ where: { id: order.customer_id } });
        if (!customer) {
            throw new Error('Customer not found');
        }

        order.purchase_discount = customer.purchase_discount || 0;
        order.shipping_discount = customer.shipping_discount || 0;

        order.shipping_fee = order.weight * order.weight_fee || 0;
        order.purchase_fee = Math.max(0.03 * order.commodity_money * order.applicable_rate, 10000);

        order.total_amount =
            order.shipping_fee * (1 - order.shipping_discount / 100) +
            (order.incurred_fee || 0) +
            (order.commodity_money * order.applicable_rate) +
            (order.packing_fee || 0) +
            (order.counting_fee || 0) +
            (order.purchase_fee || 0) * (1 - order.purchase_discount / 100) +
            (order.china_shipping_fee || 0) * order.applicable_rate;

        order.outstanding_amount = order.total_amount - (order.amount_paid || 0);
    });

    Order.afterCreate(async (order, options) => {
        const History = sequelize.models.History;
        await History.create({
            order_id: order.id,
            status: order.status,
        }, { transaction: options.transaction });
    });

    Order.beforeUpdate(async (order, options) => {
        const Customer = sequelize.models.Customer;
        const History = sequelize.models.History;
        const customer = await Customer.findOne({ where: { id: order.customer_id } });
        order.shipping_fee = order.weight * order.weight_fee;
        order.total_amount =
            order.shipping_fee * (1 - order.shipping_discount / 100) +
            order.incurred_fee +
            order.commodity_money * order.applicable_rate +
            order.packing_fee +
            order.counting_fee +
            order.purchase_fee * (1 - order.purchase_discount / 100) +
            order.china_shipping_fee * order.applicable_rate;
        order.outstanding_amount = order.total_amount - order.amount_paid;

        const deposit = customer.deposit_rate / 100 * order.commodity_money * order.applicable_rate;
        const status = ['deposited', 'ordering'];
        if (order.amount_paid < deposit && status.includes(order.status)) {
            order.status = 'waiting_deposit';
        }
        if (order._previousDataValues.status !== order.status) {
            const employeeId = options.user?.id || null;

            await History.create(
                {
                    order_id: order.id,
                    status: order.status,
                    employee_id: employeeId,
                },
                { transaction: options.transaction }
            );
        }
    });

    Order.afterUpdate(async (order, { transaction }) => {
        if (order.delivery_id && order._previousDataValues.outstanding_amount !== order.outstanding_amount) {
            const DeliveryNote = sequelize.models.DeliveryNote;

            const delivery = await DeliveryNote.findOne({
                where: { id: order.delivery_id },
                include: [
                    { model: Order, as: 'orders' },
                ],
                transaction,
            });

            if (delivery) {
                delivery.total_amount = delivery.orders.reduce((acc, cur) => acc + cur.total_amount, 0) + (delivery.incurred_fee || 0);

                delivery.amount_paid = delivery.orders.reduce((acc, cur) => acc + cur.amount_paid, 0);
                delivery.outstanding_amount = delivery.total_amount - delivery.amount_paid;

                await delivery.save({ transaction });
            }
        }
    });

    return Order;
}
