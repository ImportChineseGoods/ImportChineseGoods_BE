const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Transaction extends Model {
        static associate(models) {
            Transaction.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });

            Transaction.belongsTo(models.Employee, {
                foreignKey: 'employee_id',
                as: 'employee'
            });
        }
    }

    Transaction.init({
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
            onDelete: 'SET NULL',
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'employees',
                key: 'id'
            },
            onDelete: 'SET NULL',
        },
        value: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false
        },
        balance_after: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('withdraw', 'deposit', 'payment', 'refund'),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('processing', 'completed', 'cancelled'),
            allowNull: false
        },
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'transactions',
        modelName: 'Transaction',
        sequelize,
    });

    return Transaction;
};
