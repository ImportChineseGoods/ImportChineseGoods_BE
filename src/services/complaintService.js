require('dotenv').config();

const sequelize = require('../config');
const Consignment = sequelize.models.Consignment;
const Order = sequelize.models.Order;
const Complaint = sequelize.models.Complaint;
const responseCodes = require('../untils/response_types');

const createComplaintService = async (data) => {
    try {
        if (data.order_id) {
            const order = await Order.findOne({ where: { id: data.order_id } });
            if (!order) {
                return responseCodes.ORDER_NOT_FOUND;
            }
        }

        if (data.consignment_id) {
            const consignment = await Consignment.findOne({ where: { id: data.consignment_id } });
            if (!consignment) {
                return responseCodes.ORDER_NOT_FOUND;
            }
        }

        data.status = "pending";

        const result = await Complaint.create(data);

        return {
            ...responseCodes.CREATE_COMPLAINT_SUCCES,
            complaint: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllComplaintService = async (page, pageSize) => {
    try {;
        const complaints = await Complaint.findAndCountAll({
            order: [['update_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            complaints
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getComplaintsByCustomerIdService = async (customerId, page, pageSize) => {
    try {
        const complaints = await Complaint.findAndCountAll({
            where: { customer_id: customerId },
            order: [['update_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            complaints
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
}

const updateComplaintService = async (id, user, data) => {
    try {
        const complaint = await Complaint.findOne({ where: { id } });
        if (!complaint) {
            return responseCodes.NOT_FOUND;
        }
        await complaint.update(data, { user });
        return {
            ...responseCodes.UPDATE_SUCCESS,
            complaint
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteComplaintService = async (user, id) => {
    try {
        const complaint = await Complaint.findOne({where: { id } });
        if (!complaint) {
            return responseCodes.NOT_FOUND;
        }

        await complaint.update({ status: "cancelled" }, { user });
        return responseCodes.DELETE_ORDER_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const confirmProcessService = async (user, id) => {
    try {
        const complaint = await Complaint.findOne({ where: { id } });
        if (!complaint) {
            return responseCodes.NOT_FOUND;
        }

        if (complaint.status !== "pending") {
            return responseCodes.COMPLAINT_ALREADY_PROCESSED;
        }

        await complaint.update({ status: "processing", employee_id: user.id }, { user });
        return responseCodes.CONFIRM_PROCESS_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
}

module.exports = {
    createComplaintService,
    getAllComplaintService,
    getComplaintsByCustomerIdService,
    updateComplaintService,
    deleteComplaintService,
    confirmProcessService
}