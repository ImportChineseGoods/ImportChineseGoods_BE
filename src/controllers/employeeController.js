const { createEmployeeService, loginEmployeeService, getAllEmployeeService, updateEmployeeService, deleteEmployeeService, changePasswordService, getEmployeeByIdService, searchEmployeeService, editInfoService } = require("../services/employeeService");
const responseCodes = require('../untils/response_types');

const createEmployee = async (req, res) => {
    const { name, email, username, phone, password, role } = req.body;
    if (!name || !email || !username || !phone || !password || !role) {
        const result = responseCodes.NOT_ENOUGH;
        return res.status(result.status).json(result);
    }

    const result = await createEmployeeService(req.body);
    return res.status(result.status).json(result);
}

const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        const result = responseCodes.NOT_ENOUGH;
        return res.status(result.status).json(result);
    }

    const result = await loginEmployeeService(req.body);
    return res.status(result.status).json(result);
}

const getAllEmployee = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await getAllEmployeeService(page, pageSize);

    if (result) {
        return res.status(result.status).json(result);
    } else {
        return res.status(result.status).json(result);
    }

};

const getEmployeeById = async (req, res) => {
    const result = await getEmployeeByIdService(req.params.id, req.user);
    return res.status(result.status).json(result);
}

const updateEmployee = async (req, res) => {
    if (req.body.password) {
        const result = responseCodes.INVALID;
        return res.status(result.status).json(result);
    }
    const result = await updateEmployeeService(req.params.id, req.body);
    return res.status(result.status).json(result);
}

const deleteEmployee = async (req, res) => {
    const result = await deleteEmployeeService(req.params.id);
    return res.status(result.status).json(result);
}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        const result = responseCodes.NOT_ENOUGH;
        return res.status(result.status).json(result);
    }

    const result = await changePasswordService(req.user.id, req.body);
    return res.status(result.status).json(result);
}

const searchEmployee = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await searchEmployeeService(req.query, page, pageSize);

    if (result) {
        return res.status(result.status).json(result);
    } else {
        return res.status(result.status).json(result);
    }
}

const editInfo = async (req, res) => {
    const data = {
        name: req.body?.name,
        email: req.body?.email,
        phone: req.body?.phone,
        avatar: req.body?.avatar,
        id: req.user.id
    }

    const result = await editInfoService(data);
    return res.status(result.status).json(result);
}
module.exports = {
    createEmployee,
    handleLogin,
    getAllEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    changePassword,
    editInfo,
    searchEmployee
}