require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('../config');
const Customer = sequelize.models.Customer;
const Employee = sequelize.models.Employee;
const responseCodes = require('../untils/response_types');
const { Op, literal } = require('sequelize');
const { name } = require('ejs');

const saltRounds = 10;

const createCustomerService = async (data) => {
    try {
        const lastCustomer = await Customer.findOne({
            order: [['id', 'DESC']],
            attributes: ['id'],
        });

        let newId = 'A0001';

        if (lastCustomer) {
            const lastId = lastCustomer.id;
            const prefix = lastId[0];
            const number = parseInt(lastId.slice(1));

            if (number < 9999) {
                newId = `${prefix}${String(number + 1).padStart(4, '0')}`;
            } else {
                const nextPrefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
                newId = `${nextPrefix}0001`;
            }
        }

        const customer = await Customer.findOne({ where: { email: data.email } });
        if (customer) {
            return responseCodes.EMAIL_EXISTS;
        }

        const customerPhone = await Customer.findOne({ where: { phone: data.phone } });
        if (customerPhone) {
            return responseCodes.PHONE_EXISTS;
        }

        const hashPassword = await bcrypt.hash(data.password, saltRounds);

        const customers = await Customer.create({
            id: newId,
            name: data.name,
            email: data.email,
            password: hashPassword,
            phone: data.phone,
        });

        return {
            ...responseCodes.REGISTER_SUCCESS,
            customer: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const loginCustomerService = async (data) => {
    try {
        // fetch user by email
        const customer = await Customer.findOne({ where: { email: data.email } });
        if (customer) {
            //compare password
            const match = await bcrypt.compare(data.password, customer.password);
            if (!match) {
                return responseCodes.INVALID_CREDENTIALS;
            }
            else {
                //create access token
                const payload = {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    role: 'customer',
                }

                const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
                });
                return {
                    ...responseCodes.LOGIN_SUCCESS,
                    access_token,
                    user: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        avatar: customer.avatar,
                    }
                }
            }
        } else {
            return responseCodes.INVALID_CREDENTIALS;
        }

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllCustomerService = async (page, pageSize) => {
    try {
        const result = await Customer.findAndCountAll({
            attributes: { exclude: ['password'] },
            offset: (page - 1) * pageSize,
            limit: pageSize,
            where: {
                is_active: true
            },
            order: [['update_at', 'DESC']],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            result
        }
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateCustomerService = async (id, data) => {
    try {
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        await customer.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            customer
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteCustomerService = async (id) => {
    try {
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        await customer.update({
            is_active: false
        });
        return responseCodes.DELETE_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getCustomerByIdService = async (id) => {
    try {
        const customer = await Customer.findOne({
            where: { id },
            attributes: { exclude: ['password', 'avatar'] },
            include: [
                {
                    model: Employee,
                    as: 'sales',
                    attributes: ['id', 'name']
                }
            ]
        });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }
        return {
            ...responseCodes.GET_DATA_SUCCESS,
            customer
        }
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const searchCustomerService = async (query, page, pageSize) => {
    try {
        const conditions = {};

        if (query?.search) {
            conditions[Op.or] = [
                { email: { [Op.like]: `%${query.search}%` } },
                { id: { [Op.like]: `%${query.search}%` } },
                { phone: { [Op.like]: `%${query.search}%` } },
                { name: { [Op.like]: `%${query.search}%` } }
            ];
        }

        if (query?.dateRange) {
            const fromDate = new Date(query.dateRange[0]);
            const toDate = new Date(query.dateRange[1]);

            if (!isNaN(fromDate) && !isNaN(toDate)) {
                conditions.create_at = {
                    [Op.between]: [fromDate, toDate]
                };
            }
        }
        const customers = await Customer.findAndCountAll({
            order: [['create_at', 'DESC']],
            distinct: true,
            offset: (page - 1) * pageSize,
            limit: pageSize,
            where: conditions,
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Employee,
                    as: 'sales',
                    attributes: ['id', 'name']
                }
            ]
        });
        return {
            ...responseCodes.GET_DATA_SUCCESS,
            customers
        }
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const editInfoService = async (user, data) => {
    try {
        const customer = await Customer.findOne({ where: { id: user.id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        if (data.email && data.email !== customer.email) {
            const emailExists = await Customer.findOne({ where: { email: data.email } });
            if (emailExists) {
                return responseCodes.EMAIL_EXISTS;
            }
        }

        if (data.phone && data.phone !== customer.phone) {
            const phoneExists = await Customer.findOne({ where: { phone: data.phone } });
            if (phoneExists) {
                return responseCodes.PHONE_EXISTS;
            }
        }

        await customer.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            customer
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

const changePasswordService = async (id, data) => {
    try {
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        const match = await bcrypt.compare(data.oldPassword, customer.password);
        if (!match) {
            return responseCodes.NO_MATCH_PASSWORD;
        }

        const hashPassword = await bcrypt.hash(data.newPassword, saltRounds);
        await customer.update({
            password: hashPassword
        });
        return responseCodes.CHANGE_PASSWORD_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createCustomerService,
    loginCustomerService,
    getAllCustomerService,
    updateCustomerService,
    deleteCustomerService,
    getCustomerByIdService,
    searchCustomerService,
    editInfoService,
    changePasswordService
}