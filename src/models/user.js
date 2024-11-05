const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Kết nối từ tệp database.js

const Customer = sequelize.define('Customer', {
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
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    session_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    token_expiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reset_password_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reset_password_expiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    create_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    update_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    balance: {
        type: DataTypes.DECIMAL(15, 0),
        defaultValue: 0,
    },
    sales_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'sales', // Tên bảng hoặc model bạn tham chiếu
            key: 'id'
        }
    },
    purchase_discount: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
    },
    shipping_discount: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: false // Bỏ qua trường createdAt và updatedAt mặc định của Sequelize
});

module.exports = Customer;
