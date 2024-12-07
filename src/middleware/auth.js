require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const whiteLists = [
        '/',
        '/customer/login',
        '/customer/register',
        '/employee/login',
    ];

    if (whiteLists.includes(req.path)) {
        return next();
    }

    if (req.headers && req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];

        // // Kiểm tra token trong blacklist
        // if (blackLists.has(token)) {
        //     return res.status(403).json({ message: 'Token đã bị hủy' });
        // }

        // Xác thực token
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ' });
            }
            req.user = user;
            next();
        });
    } else {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc chưa được cung cấp' });
    }
};

module.exports = auth;