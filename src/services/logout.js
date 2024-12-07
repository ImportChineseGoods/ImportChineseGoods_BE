const jwt = require('jsonwebtoken');
const client = require('./redisClient');

const logout = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.decode(token);
            const ttl = decoded.exp - Math.floor(Date.now() / 1000);

            if (ttl > 0) {
                await client.setEx(token, ttl, decoded.exp);
                return res.status(200).json({ message: 'Đăng xuất thành công' });
            } else {
                return res.status(400).json({ message: 'Token đã hết hạn' });
            }
        } catch (err) {
            console.error(err);
            return res.status(400).json({ message: 'Token không hợp lệ' });
        }
    }

    return res.status(400).json({ message: 'Token không được cung cấp' });
};

module.exports = logout;
