const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Parameter extends Model {
        static associate(models) {
            
        }
    }

    Parameter.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM(
                'applicable_rate', 
                'original_rate', 
                'weight_fee', 
                'original_weight_fee', 
                'warehouse_china', 
                'office_vietnam', 
                'hotline', 
                'email', 
                'youtube',
                'facebook',
                'bank',
                'bank_account',
                'bank_owner',
            ),
            allowNull: false,
            unique: true
        }
    }, {
        timestamps: true,
        createdAt: 'create_at',
        updatedAt: 'update_at',
        tableName: 'parameters',
        modelName: 'Parameter',
        sequelize,        
    });

    return Parameter;
};