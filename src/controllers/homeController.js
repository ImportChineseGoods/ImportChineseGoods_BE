const { and } = require('sequelize');
const connection = require('../config/database');

const getHomepage = async (req, res) => {
    return res.render('homepage.ejs');
}

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

const postCreateUser = async (req, res) => {
    let { name, email, password } = req.body;
    console.log(req.body);

    try {
        // Tạo `id` mới
        let id = await generateNextId();

        connection.query(
            `INSERT INTO customers (id, name, email, password) VALUES (?, ?, ?, ?)`,
            [id, name, email, password],
            function (err, result) {
                if (err) {
                    console.log(err);
                    res.send('Create user failed');
                } else {
                    res.send('Create user successfully');
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.send('Failed to generate user ID');
    }
};



module.exports = {
    getHomepage,
    postCreateUser
}