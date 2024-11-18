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
                model: Order,
                key: 'id'
            }
        },
        consignment_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: Consignment,
                key: 'id'
            }
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
                model: Employee,
                key: 'id'
            }
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
                'in progress',
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


    return Complaint;
}
