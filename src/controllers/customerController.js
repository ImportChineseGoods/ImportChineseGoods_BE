const { createCustomerService, loginCustomerService } = require("../services/customerService");
const connection = require('../config/database');
const moment = require('moment-timezone');


const generateNextId = async () => {
    // Lấy `id` lớn nhất hiện tại từ bảng `customers`
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT id FROM customers ORDER BY id DESC LIMIT 1`,
            (err, results) => {
                if (err) return reject(err);

                let nextId = 'A0001'; // Mặc định là A0001 nếu không có id nào
                if (results.length > 0) {
                    let currentId = results[0].id; // Lấy `id` lớn nhất hiện tại
                    let prefix = currentId[0]; // Lấy ký tự đầu (A, B,...)
                    let number = parseInt(currentId.slice(1)); // Lấy số phía sau

                    if (number < 9999) {
                        // Tăng số nếu chưa đạt đến 9999
                        number++;
                    } else {
                        // Đổi ký tự đầu và đặt lại số nếu vượt quá 9999
                        prefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
                        number = 1;
                    }

                    // Tạo `id` mới với tiền tố và số
                    nextId = `${prefix}${number.toString().padStart(4, '0')}`;
                }
                resolve(nextId);
            }
        );
    });
};


const createCustomer = async(req, res) => {
    const {name, email, phone, password} = req.body;
    let id = await generateNextId();

    const now = moment.tz("Asia/Bangkok");
    const create_at = now.format('YYYY-MM-DD HH:mm:ss');
    const update_at = create_at;

    const data = {
        id,
        name,
        email,
        phone,
        password,
        create_at,
        update_at
    };

    const result = await createCustomerService(data);

    if (result) {
        console.log(result);
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Failed to create customer" });
    }
}

const handleLogin = async(req, res) => {
    const {email, password} = req.body;

    const data = {
        email,
        password
    };

    const result = await loginCustomerService(data);
    console.log(result);

    if (result) {
        console.log(result);
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Đăng nhập thất bại, hãy thử lại sau" });
    }
}

module.exports = {
    createCustomer,
    handleLogin,

}