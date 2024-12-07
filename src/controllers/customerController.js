const { createCustomerService, loginCustomerService, getAllCustomerService, updateCustomerService, deleteCustomerService, changePasswordService, getCustomerByIdService, searchCustomerService, editInfoService } = require("../services/customerService");
const responseCodes = require('../untils/response_types');

const createCustomer = async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await createCustomerService(req.body);
    return res.status(result.status).json(result);
}

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await loginCustomerService(req.body);
    return res.status(result.status).json(result);
}

const getAllCustomer = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await getAllCustomerService(page, pageSize);

    if (result) {
        return res.status(result.status).json({
            data: result.rows,
            pagination: {
                total: result.count || 0,
                current: page,
                pageSize: pageSize,
            },
        });
    } else {
        return res.status(result.status).json(result);
    }
};

const getCustomerById = async (req, res) => {
    const result = await getCustomerByIdService(req.params.id);
    return res.status(result.status).json(result);
}

const updateCustomer = async (req, res) => {
    const data = {
        sale_id: req.body?.sale_id,
        purchase_discount: req.body?.purchase_discount,
        shipping_discount: req.body?.shipping_discount,
        note: req.body?.note,
        deposit_rate: req.body?.deposit_rate,
    }

    if (data.purchase_discount < 0 || data.purchase_discount > 100 || data.shipping_discount < 0 || data.shipping_discount > 100 || data.deposit_rate < 0 || data.deposit_rate > 100) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    const result = await updateCustomerService(req.params.id, data);
    return res.status(result.status).json(result);
}

const deleteCustomer = async (req, res) => {
    const result = await deleteCustomerService(req.params.id);
    return res.status(result.status).json(result);
}

const searchCustomer = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await searchCustomerService(req.query.keyword, page, pageSize);

    if (result) {
        return res.status(result.status).json({
            data: result.rows,
            pagination: {
                total: result.count || 0,
                current: page,
                pageSize: pageSize,
            },
        });
    } else {
        return res.status(result.status).json(result);
    }
}

const editInfo = async (req, res) => {
    const data = {
        name: req.body?.name,
        email: req.body?.email,
        phone: req.body?.phone,
        address: req.body?.address,
        avatar: req.body?.avatar,
    }

    const result = await editInfoService(req.user, data);
    return res.status(result.status).json(result);
}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }

    const result = await changePasswordService(req.user.id, req.body);
    return res.status(result.status).json(result);
}

module.exports = {
    createCustomer,
    handleLogin,
    getAllCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    editInfo,
    changePassword,
    searchCustomer
}