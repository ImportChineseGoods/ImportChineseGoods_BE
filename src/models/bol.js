const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class BOL extends Model {
        static associate(models) {
            BOL.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'order'
            });

            BOL.belongsTo(models.Consignment, {
                foreignKey: 'consignment_id',
                as: 'consignment'
            });

            BOL.belongsTo(models.AnonymousConsignment, {
                foreignKey: 'anonymous_id',
                as: 'anonymous'
            });
        }
    }

    BOL.init({
        bol_code: {
            type: DataTypes.STRING,
            primaryKey: true,
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
                model: 'consignments',
                key: 'id'
            }
        },
        anonymous_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'anonymous_consignments',
                key: 'id'
            }
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
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'bols',
        modelName: 'BOL',
        sequelize,
    });

    return BOL;
}
