const { createEmployeeService, loginEmployeeService, getAllEmployeeService, updateEmployeeService, deleteEmployeeService, changePasswordService, getEmployeeByIdService, searchEmployeeService } = require("../services/employeeService");
const responseCodes = require('../untils/response_types');

const createEmployee = async (req, res) => {
    const { name, email, username, phone, password, role } = req.body;
    if (!name || !email || !username || !phone || !password || !role) return res.status(400).json(responseCodes.NOT_ENOUGH);

    const result = await createEmployeeService(req.body);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json(responseCodes.NOT_ENOUGH);

    const result = await loginEmployeeService(req.body);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const getAllEmployee = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await getAllEmployeeService(page, pageSize);

    if (result) {
        return res.status(200).json({
            data: result.rows,
            pagination: {
                total: result.count || 0,
                current: page,
                pageSize: pageSize,
            },
        });
    } else {
        return res.status(500).json(result);
    }

};

const getEmployeeById = async (req, res) => {
    const result = await getEmployeeByIdService(req.params.id);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const updateEmployee = async (req, res) => {
    const result = await updateEmployeeService(req.params.id, req.body);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const deleteEmployee = async (req, res) => {
    const result = await deleteEmployeeService(req.params.id);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json(responseCodes.NOT_ENOUGH);

    const result = await changePasswordService(req.params.id, req.body);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const searchEmployee = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await searchEmployeeService(req.params.keyword, page, pageSize);

    if (result) {
        return res.status(200).json({
            data: result.rows,
            pagination: {
                total: result.count || 0,
                current: page,
                pageSize: pageSize,
            },
        });
    } else {
        return res.status(500).json(result);
    }
}
module.exports = {
    createEmployee,
    handleLogin,
    getAllEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    changePassword,
    searchEmployee
}