const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Employee extends Model {
        static associate(models) {
            Employee.hasMany(models.Customer, {
                foreignKey: 'sales_id',
                as: 'customers'
            });
            Employee.hasMany(models.Complaint, {
                foreignKey: 'employee_id',
                as: 'complaints'
            });
            Employee.hasMany(models.Transaction, {
                foreignKey: 'employee_id',
                as: 'transactions'
            });
        }
    }

    Employee.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        role: {
            type: DataTypes.ENUM('admin', 'accountant', 'sales', 'order', 'warehouse'),
            allowNull: false
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'employees',
        modelName: 'Employee',
        sequelize,
    });

    return Employee;
}
