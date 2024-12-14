
const VALID_ROLES = ['customer', 'admin', 'accountant', 'sales', 'order', 'warehouse'];

const checkRole = (type, roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole || !VALID_ROLES.includes(userRole)) {
            return res.status(403).json({ RM: 'Token không hợp lệ hoặc chưa được cung cấp' });
        }

        if (type !== 'include' && type !== 'exclude') {
            return res.status(500).json({ RM: 'Yêu cầu không hợp lệ' });
        }

        if (
            (type === 'include' && !roles.includes(userRole)) || 
            (type === 'exclude' && roles.includes(userRole))
        ) {
            return res.status(403).json({ RM: 'Bạn không có quyền thực hiện thao tác này' });
        }
        
        next();
    };
};

module.exports = checkRole;
