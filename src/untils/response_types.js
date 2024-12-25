// responseCodes.js
module.exports = {
    SERVER_ERROR: {
        status: 500,
        RC: -1,
        RM: "Đã xảy ra lỗi, vui lòng thử lại sau"
    },
    UNPROFITABLE: {
        status: 403,
        RC: 0,
        RM: "Bạn không có quyền thực hiện thao tác này"
    },
    REGISTER_SUCCESS: {
        status: 200,
        RC: '0001',
        RM: "Tạo tài khoản thành công"
    },
    EMAIL_EXISTS: {
        status: 400,
        RC: '0002',
        RM: "Email đã tồn tại, hãy thử email khác"
    },
    PHONE_EXISTS: {
        status: 400,
        RC: '0003',
        RM: "Số điện thoại đã tồn tại, hãy thử số điện thoại khác"
    },
    LOGIN_SUCCESS: {
        status: 200,
        RC: '0004',
        RM: "Đăng nhập thành công"
    },
    INVALID_CREDENTIALS: {
        status: 400,
        RC: '0005',
        RM: "Email hoặc Password không hợp lệ"
    },
    ACCOUNT_NOT_FOUND: {
        status: 404,
        RC: '0006',
        RM: "Tài khoản không tồn tại"
    },
    UPDATE_SUCCESS: {
        status: 200,
        RC: '0007',
        RM: "Cập nhật thông tin thành công"
    },
    DELETE_SUCCESS: {
        status: 200,
        RC: '0008',
        RM: "Xóa tài khoản thành công"
    },
    CHANGE_PASSWORD_SUCCESS: {
        status: 200,
        RC: '0009',
        RM: "Đổi mật khẩu thành công"
    },
    NO_MATCH_PASSWORD: {
        status: 400,
        RC: '0010',
        RM: "Mật khẩu cũ không khớp"
    },
    USERNAME_EXISTS: {
        status: 400,
        RC: '0011',
        RM: "Tên đăng nhập đã tồn tại, hãy thử tên đăng nhập khác"
    },
    INVALID_EMPLOYEE: {
        status: 400,
        RC: '0012',
        RM: "Username hoặc password không hợp lệ"
    },
    NOT_ENOUGH: {
        status: 400,
        RC: '0013',
        RM: "Thông tin không đủ, hãy kiểm tra lại"
    },
    CREATE_PRODUCT_SUCCESS: {
        status: 200,
        RC: '0014',
        RM: "Thêm sản phẩm thành công"
    },
    PRODUCT_NOT_FOUND: {
        status: 404,
        RC: '0015',
        RM: "Sản phẩm không tồn tại"
    },
    DELETE_PRODUCT_SUCCESS: {
        status: 200,
        RC: '0016',
        RM: "Xóa sản phẩm thành công"
    },
    PRODUCT_HAS_ORDER: {
        status: 400,
        RC: '0017',
        RM: "Sản phẩm đã được đặt hàng, không thể xóa"
    },
    INVALID: {
        status: 400,
        RC: '0018',
        RM: "Thông tin không hợp lệ, hãy kiểm tra lại"
    },
    BOL_EXISTS: {
        status: 400,
        RC: '0019',
        RM: "Mã vận đơn đã tồn tại"
    },
    ORDER_NOT_FOUND: {
        status: 404,
        RC: '0020',
        RM: "Đơn hàng không tồn tại"
    },
    NOT_FOUND: {
        status: 404,
        RC: '0021',
        RM: "Không tìm thấy dữ liệu"
    },
    BOL_NOT_FOUND: {
        status: 404,
        RC: '0022',
        RM: "Mã vận đơn không tồn tại"
    },
    DELETE_PARAMETER_SUCCESS: {
        status: 200,
        RC: '0023',
        RM: "Xóa thông số thành công"
    },
    DELETE_ORDER_SUCCESS: {
        status: 200,
        RC: '0024',
        RM: "Xóa đơn hàng thành công"
    },
    DELETE_BOL_SUCCESS: {
        status: 200,
        RC: '0025',
        RM: "Xóa mã vận đơn thành công"
    },
    CREATE_COMPLAINT_SUCCES: {
        status: 200,
        RC: '0027',
        RM: "Tạo khiếu nại thành công"
    },
    SHOP_LIMIT: {
        status: 400,
        RC: '0028',
        RM: "Giỏ hàng quá nhiều, hãy bỏ bớt sản phẩm trước khi thêm mới"
    },
    COMPLAINT_ALREADY_PROCESSED: {
        status: 400,   
        RC: '0029',
        RM: "Khiếu nại đã được xử lý"
    },
    CONFIRM_PROCESS_SUCCESS: {
        status: 200,
        RC: '0030',
        RM: "Xác nhận xử lý thành công"
    },
    INVALID_TRANSACTION: {
        status: 400,
        RC: '0031',
        RM: "Giao dịch không hợp lệ"
    },
    BALANCE_NOT_ENOUGH: {
        status: 400,
        RC: '0032',
        RM: "Số dư không đủ"
    },
    CREATE_TRANSACTION_SUCCESS: {
        status: 200,
        RC: '0033',
        RM: "Tạo giao dịch thành công"
    },
    CREATE_ORDER_SUCCESS: {
        status: 200,
        RC: '0034',
        RM: "Tạo đơn hàng thành công"
    },
    ORDER_NOT_DEPOSIT: {
        status: 400,
        RC: '0035',
        RM: "Đơn hàng chưa đặt cọc"
    },
    CREATE_HISTORY_SUCCESS: {
        status: 200,
        RC: '0036',
        RM: "Tạo lịch sử thành công"
    },
    ORDER_NOT_ORDERING: {
        status: 400,
        RC: '0037',
        RM: "Đơn hàng chưa được đặt hàng"
    },
    CREATE_BOL_SUCCESS: {
        status: 200,
        RC: '0038',
        RM: "Tạo mã vận đơn thành công"
    },
    CREATE_DELIVERY_SUCCESS: {
        status: 200,
        RC: '0039',
        RM: "Tạo phiếu giao hàng thành công"
    },
    DELIVERY_EXPORTED: {
        status: 400,
        RC: '0040',
        RM: "Phiếu giao hàng đã được xuất kho"
    },
    CREATE_WAREHOUSE_SUCCESS: {
        status: 200,
        RC: '0041',
        RM: "Tạo kho thành công"
    },
    ORDER_DIFFERENT_SHOP: {
        status: 400,
        RC: '0042',
        RM: "Các sản phẩm không cùng shop"
    },
    PRODUCT_ALREADY_ORDERED: {
        status: 400,
        RC: '0043',
        RM: "Sản phẩm đã được đặt hàng"
    },
    CONTRACT_CODE_EXISTED: {
        status: 400,
        RC: '0044',
        RM: "Mã hợp đồng đã tồn tại"
    },
    GET_DATA_SUCCESS: {
        status: 200,
        RC: '0045',
        RM: "Lấy dữ liệu thành công"
    },
    DATA_NOT_FOUND: {
        status: 200,
        RC: '0046',
        RM: "Không có kết quả nào được tìm thấy"
    },
    BOL_IMPORTED: {
        status: 400,
        RC: '0047',
        RM: "Đơn hàng đã được nhập kho"
    },
    STATUS_ORDER_INCORRECT: {
        status: 400,
        RC: '0048',
        RM: "Trạng thái đơn hàng không chính xác"
    }
};
