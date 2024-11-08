require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Customers = require('../models/customers');
const saltRounds = 10;

const createCustomerService = async (data) => {
    try {
        //check email exist
        const customer = await Customers.findOne({ where: { email: data.email } });
        if (customer) {
            return {
                EC: 3, //email đã tồn tại
                EM: `Email ${data.email} đã tồn tại, hãy thử email khác` //thông báo lỗi
            }
        }

        //check phone exist
        const customerPhone = await Customers.findOne({ where: { phone: data.phone } });
        if (customerPhone) {
            return {
                EC: 4, //phone đã tồn tại
                EM: `Số điện thoại ${data.phone} đã tồn tại, hãy thử số khác` //thông báo lỗi
            }
        }

        //hash user password
        const hashPassword = await bcrypt.hash(data.password, saltRounds);

        let result = await Customers.create({
            id: data.id,
            name: data.name,
            email: data.email,
            password: hashPassword,
            phone: data.phone,
        })
        return result;

    } catch (error) {
        console.log(error);
        return null;
    }
}

const loginCustomerService = async (data) => {
    try {
        // fetch user by email
        const customer = await Customers.findOne({ where: { email: data.email } });
        if (customer) {
            //compare password
            const match = await bcrypt.compare(data.password, customer.password);
            if (!match) {
                return {
                    EC: 2, // có email nhưng password không đúng
                    EM: "Email/Password không hợp lệ"
                }
            }
            else {
                //create access token
                const payload = {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                }

                const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
                });
                console.log(access_token);
                return {
                    EC: 0, //login success
                    access_token,
                    user: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                    }
                }
            }
        } else {
            return {
                EC: 1, //email không tồn tại
                EM: "Email/Password không hợp lệ" //thông báo lỗi
            }
        }

    } catch (error) {
        console.log(error);
        return null;
    }
}

// const getAllCustomerService = async () => {
//     try {
//         const result = await Customers.findAll({
//             attributes: { exclude: ['password'] }
//         });        
//         return result;

//     } catch (error) {
//         console.log(error);
//         return null;
//     }
// }

const getAllCustomerService = async (page, pageSize) => { 
    try {
        const offset = (page - 1) * pageSize;
        const result = await Customers.findAndCountAll({
            attributes: { exclude: ['password'] },
            offset: offset,
            limit: pageSize,
        });

        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}


module.exports = {
    createCustomerService,
    loginCustomerService,
    getAllCustomerService
}