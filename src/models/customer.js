const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Customer extends Model {
        static associate(models) {
            Customer.belongsTo(models.Employee, {
                foreignKey: 'sales_id',
                as: 'sales',
            });
            Customer.hasMany(models.Transaction, {
                foreignKey: 'customer_id',
                as: 'transactions'
            });
            Customer.hasMany(models.DeliveryNote, {
                foreignKey: 'customer_id',
                as: 'delivery_notes'
            });
            Customer.hasMany(models.Order, {
                foreignKey: 'customer_id',
                as: 'orders'
            });
            Customer.hasMany(models.Consignment, {
                foreignKey: 'customer_id',
                as: 'consignments'
            });
            Customer.hasMany(models.Complaint, {
                foreignKey: 'customer_id',
                as: 'complaints'
            });

            Customer.hasMany(models.Product, {
                foreignKey: 'customer_id',
                as: 'products'
            })
        }
    }

    Customer.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        balance: {
            type: DataTypes.DECIMAL(15, 0),
            defaultValue: 0,
        },
        sales_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'employees',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        purchase_discount: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
        },
        shipping_discount: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        deposit_rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 70,
        },
        accumulation: {
            type: DataTypes.DECIMAL(15, 0),
            defaultValue: 0,
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'customers',
        modelName: 'Customer'
    });

    return Customer;
};
