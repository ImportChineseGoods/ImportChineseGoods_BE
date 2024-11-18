require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {

    const white_lists = [
        '/',
        '/login',
        '/register'
    ]

    if (white_lists.includes(req.path)) {
        next();
    } else {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];

            //verify token
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err) {
                    return res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ' });
                } else {
                    req.user = user;
                    console.log("Check auth: >>>>>>>: ", req.user);
                    next();
                }
            });

        } else {
            // return exception
            return res.status(401).json({ message: 'Bạn chưa truyền access token ở header hoặc token hết hạn' });
        }
    }

}

module.exports = auth;