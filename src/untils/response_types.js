// responseCodes.js
module.exports = {
    SERVER_ERROR: {
        RC: -1,
        RM: "Đã xảy ra lỗi, vui lòng thử lại sau"
    },
    UNPROFITABLE: {
        RC: 0,
        RM: "Bạn không có quyền thực hiện thao tác này"
    },
    REGISTER_SUCCESS: {
        RC: '0001',
        RM: "Tạo tài khoản thành công"
    },
    EMAIL_EXISTS: {
        RC: '0002',
        RM: "Email đã tồn tại, hãy thử email khác"
    },
    PHONE_EXISTS: {
        RC: '0003',
        RM: "Số điện thoại đã tồn tại, hãy thử số điện thoại khác"
    },
    LOGIN_SUCCESS: {
        RC: '0004',
        RM: "Đăng nhập thành công"
    },
    INVALID_CREDENTIALS: {
        RC: '0005',
        RM: "Email hoặc Password không hợp lệ"
    },
    ACCOUNT_NOT_FOUND: {
        RC: '0006',
        RM: "Tài khoản không tồn tại"
    },
    UPDATE_SUCCESS: {
        RC: '0007',
        RM: "Cập nhật thông tin thành công"
    },
    DELETE_SUCCESS: {
        RC: '0008',
        RM: "Xóa tài khoản thành công"
    },
    CHANGE_PASSWORD_SUCCESS: {
        RC: '0009',
        RM: "Đổi mật khẩu thành công"
    },
    NO_MATCH_PASSWORD: {
        RC: '0010',
        RM: "Mật khẩu cũ không khớp"
    },
    USERNAME_EXISTS: {
        RC: '0011',
        RM: "Tên đăng nhập đã tồn tại, hãy thử tên đăng nhập khác"
    },
    INVALID_EMPLOYEE: {
        RC: '0012',
        RM: "Username hoặc password không hợp lệ"
    },
    NOT_ENOUGH: {
        RC: '0013',
        RM: "Thông tin không đủ, hãy kiểm tra lại"
    }
};
