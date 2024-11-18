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
        value: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false
        },
        balance_after: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('withdrawal', 'deposit', 'payment', 'refund'),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('in progress', 'completed', 'cancelled'),
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
