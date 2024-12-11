require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('../config');
const Employee = sequelize.models.Employee;
const responseCodes = require('../untils/response_types');
const { Op } = require('sequelize');

const saltRounds = 10;

const createEmployeeService = async (data) => {
    try {
        const employee = await Employee.findOne({ where: { email: data.email } });
        if (employee) {
            return responseCodes.EMAIL_EXISTS;
        }

        const employeePhone = await Employee.findOne({ where: { phone: data.phone } });
        if (employeePhone) {
            return responseCodes.PHONE_EXISTS;
        }

        const employeeUsername = await Employee.findOne({ where: { username: data.username } });
        if (employeeUsername) {
            return responseCodes.USERNAME_EXISTS;
        }

        const hashPassword = await bcrypt.hash(data.password, saltRounds);

        let result = await Employee.create({
            name: data.name,
            email: data.email,
            username: data.username,
            password: hashPassword,
            phone: data.phone,
            role: data.role
        });
        return {
            ...responseCodes.REGISTER_SUCCESS,
            employee: result
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const loginEmployeeService = async (data) => {
    try {
        // fetch user by username
        const employee = await Employee.findOne({ where: { username: data.username } });
        if (employee) {
            //compare password
            const match = await bcrypt.compare(data.password, employee.password);
            if (!match) {
                return responseCodes.INVALID_EMPLOYEE;
            }
            else {
                //create access token
                const payload = {
                    id: employee.id,
                    username: employee.username,
                    name: employee.name,
                    role: employee.role
                }

                const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
                });
                return {
                    ...responseCodes.LOGIN_SUCCESS,
                    access_token,
                    user: {
                        id: employee.id,
                        name: employee.name,
                        username: employee.username,
                    }
                }
            }
        } else {
            return responseCodes.INVALID_EMPLOYEE;
        }

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllEmployeeService = async (page, pageSize) => { 
    try {
        const result = await Employee.findAndCountAll({
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
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateEmployeeService = async (id, data) => {
    try {
        const employee = await Employee.findOne({ where: { id } });
        if (!employee) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        await employee.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            employee
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteEmployeeService = async (id) => {
    try {
        const employee = await Employee.findOne({ where: { id } });
        if (!employee) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        await employee.update({
            is_active: false
        });
        return responseCodes.DELETE_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getEmployeeByIdService = async (id) => {
    try {
        const employee = await Employee.findOne({ where: { id } });
        if (!employee) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }
        return {
            ...responseCodes.GET_DATA_SUCCESS,
            employee
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const searchEmployeeService = async (keyword, page, pageSize) => {
    try {
        const result = await Employee.findAndCountAll({
            offset: (page - 1) * pageSize,
            limit: pageSize,
            where: {
                [Op.or]: [
                    { email: { [Op.like]: `%${keyword}%` } },
                    { phone: { [Op.like]: `%${keyword}%` } },
                ]
            }
        });
        return {
            ...responseCodes.GET_DATA_SUCCESS,
            result
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const changePasswordService = async (id, data) => {
    try {
        const employee = await Employee.findOne({ where: { id } });
        if (!employee) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        const match = await bcrypt.compare(data.oldPassword, employee.password);
        if (!match) {
            return responseCodes.NO_MATCH_PASSWORD;
        }

        const hashPassword = await bcrypt.hash(data.newPassword, saltRounds);
        await employee.update({
            password: hashPassword
        });
        return responseCodes.CHANGE_PASSWORD_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const editInfoService = async (data) => {
    try {
        const employee = await Employee.findOne({ where: { id: data.id } });
        if (!employee) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        if (data.email && data.email !== employee.email) {
            const emailExists = await Employee.findOne({ where: { email: data.email } });
            if (emailExists) {
                return responseCodes.EMAIL_EXISTS;
            }
        }

        if (data.phone && data.phone !== employee.phone) {
            const phoneExists = await Employee.findOne({ where: { phone: data.phone } });
            if (phoneExists) {
                return responseCodes.PHONE_EXISTS;
            }
        }

        await employee.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            employee
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

module.exports = {
    createEmployeeService,
    loginEmployeeService,
    getAllEmployeeService,
    updateEmployeeService,
    deleteEmployeeService,
    getEmployeeByIdService,
    searchEmployeeService,
    changePasswordService,
    editInfoService,
}