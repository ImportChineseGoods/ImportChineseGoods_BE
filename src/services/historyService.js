require('dotenv').config();

const sequelize = require('../config');
const Order = sequelize.models.Order;
const Consignment = sequelize.models.Consignment;
const DeliveryNote = sequelize.models.DeliveryNote;
const Complaint = sequelize.models.Complaint;
const History = sequelize.models.History;
const responseCodes = require('../untils/response_types');

const createHistoryService = async (user, data) => {
    try {
        if (data.order_id) {
            const order = await Order.findOne({ where: { id: data.order_id } });
            if (!order) {
                return responseCodes.NOT_FOUND;
            }
        }

        if (data.consignment_id) {
            const consignment = await Consignment.findOne({ where: { id: data.consignment_id } });
            if (!consignment) {
                return responseCodes.NOT_FOUND;
            }
        }

        if (data.delivery_id) {
            const delivery = await DeliveryNote.findOne({ where: { id: data.delivery_id } });
            if (!delivery) {
                return responseCodes.NOT_FOUND;
            }
        }

        if (data.complaint_id) {
            const complaint = await Complaint.findOne({ where: { id: data.complaint_id } });
            if (!complaint) {
                return responseCodes.NOT_FOUND;
            }
        }

        if (user.role !== 'customer') data.employee_id = user.id;

        const result = await History.create(data);

        return {
            ...responseCodes.CREATE_HISTORY_SUCCESS,
            history: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getHistoryByOrderIdService = async (order_id) => {
    try {
        const histories = await History.findAndCountAll({
            where: { order_id },
            order: [['update_at', 'DESC']],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            histories,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getHistoryByConsignmentIdService = async (consignment_id) => {
    try {
        const histories = await History.findAndCountAll({
            where: { consignment_id },
            order: [['update_at', 'DESC']],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            histories,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getHistoryByDeliveryIdService = async (delivery_id) => {
    try {
        const histories = await History.findAndCountAll({
            where: { delivery_id },
            order: [['update_at', 'DESC']],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            histories,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getHistoryByComplaintIdService = async (complaint_id) => {
    try {
        const histories = await History.findAndCountAll({
            where: { complaint_id },
            order: [['update_at', 'DESC']],
        });

        return {
            ...responseCodes.GET_DATA_SUCCESS,
            histories,
        };
    } catch (error) {
        console.error(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateHistoryService = async (id, data) => {
    try {
        const history = await History.findOne({ where: { id } });
        if (!history) {
            return responseCodes.NOT_FOUND;
        }
        await history.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            history
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteHistoryService = async (id) => {
    try {
        const history = await History.findOne({where: { id } });
        if (!history) {
            return responseCodes.NOT_FOUND;
        }

        await history.destroy();
        return responseCodes.DELETE_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createHistoryService,
    getHistoryByOrderIdService,
    getHistoryByConsignmentIdService,
    getHistoryByDeliveryIdService,
    getHistoryByComplaintIdService,
    updateHistoryService,
    deleteHistoryService,
}