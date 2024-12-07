const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Complaint extends Model {
        static associate(models) {
            Complaint.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'order'
            });

            Complaint.belongsTo(models.Consignment, {
                foreignKey: 'consignment_id',
                as: 'consignment'
            });

            Complaint.belongsTo(models.Employee, {
                foreignKey: 'employee_id',
                as: 'employee'
            });
            Complaint.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });
        }
    }

    Complaint.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        order_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'orders',
                key: 'id'
            }
        },
        consignment_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'consignments',
                key: 'id'
            },
        },
        customer_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'customers',
                key: 'id'
            },
            onDelete: 'CASCADE',
        },
        image_url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
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
        type: {
            type: DataTypes.ENUM(
                'incorrect_deduction',
                'delayed_order_processing',
                'poor_staff_attitude',
                'damaged_item',
                'refund_not_received',
                'incorrect_order_amount',
                'wrong_item',
                'missing_item'
            ),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(
                'pending',
                'processing',
                'completed',
                'cancelled'
            ),
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'complaints',
        modelName: 'Complaint',
        sequelize,
    });

    Complaint.afterCreate(async (complaint, options) => {
        const History = sequelize.models.History;
        await History.create({
            complaint_id: complaint.id,
            status: complaint.status,
        });
    });

    Complaint.afterUpdate(async (complaint, options) => {
        const History = sequelize.models.History;
        if (complaint._previousDataValues.status !== complaint.status) {
            const employeeId = options.user.id || complaint.employee_id || null;

            await History.create({
                complaint_id: complaint.id,
                status: complaint.status,
                employee_id: employeeId,
            });
        }
    });

    return Complaint;
}
