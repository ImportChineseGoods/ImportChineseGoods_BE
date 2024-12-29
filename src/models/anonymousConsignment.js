
const { Model, DataTypes } = require('sequelize');
const employee = require('./employee');

module.exports = (sequelize) => {
    class AnonymousConsignment extends Model {
        static associate(models) {
            AnonymousConsignment.hasOne(models.BOL, {
                foreignKey: 'anonymous_id',
                as: 'bol_anonymous'
            })

            AnonymousConsignment.hasMany(models.History, {
                foreignKey: 'anonymous_id',
                as: 'histories'
            })
        }
    }

    AnonymousConsignment.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        status: {
            type: DataTypes.ENUM('china_warehouse_received', 'vietnam_warehouse_received'),
            allowNull: false
        },
        weight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'anonymous_consignments',
        sequelize,
        modelName: 'AnonymousConsignment'
    });

    AnonymousConsignment.afterCreate(async (anonymous, options) => {
        const History = sequelize.models.History;
        await History.create({
            anonymous_id: anonymous.id,
            status: anonymous.status,
            employee_id: options.user?.id || null
        }, { transaction: options.transaction });
    });

    AnonymousConsignment.afterUpdate(async (anonymous, options) => {
        const History = sequelize.models.History;
        
        if (anonymous._previousDataValues.status !== anonymous.status) {
            const employeeId = options.user?.id || anonymous?.employee_id || null;
    
            await History.create(
                {
                    anonymous_id: anonymous.id,
                    status: anonymous.status,
                    employee_id: employeeId,
                },
                { transaction: options.transaction }
            );
        }
    });

    return AnonymousConsignment;
};
