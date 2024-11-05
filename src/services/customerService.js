require('dotenv').config();

const Customer = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

const createCustomerService = async (data) => {
    try {
        //hash user password
        const hashPassword = await bcrypt.hash(data.password, saltRounds);

        let result = await Customer.create({
            id: data.id,
            name: data.name,
            email: data.email,
            password: hashPassword,
            phone: data.phone,
            create_at: data.create_at,
            update_at: data.update_at,
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
        const customer = await Customer.findOne({ where: { email: data.email } });
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
                //create session token
                const payload = {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                }

                const session_token = jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
                });
                console.log(session_token);
                return {
                    EC: 0, //login success
                    session_token,
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




module.exports = {
    createCustomerService,
    loginCustomerService,
}