
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class AnonymousConsignment extends Model {
        static associate(models) {
            AnonymousConsignment.hasOne(models.BOL, {
                foreignKey: 'anonymous_id',
                as: 'bol'
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

    return AnonymousConsignment;
};
