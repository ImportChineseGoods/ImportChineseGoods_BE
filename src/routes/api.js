const express = require('express');
const { createCustomer, handleLogin, getAllCustomer } = require('../controllers/customerController');
const auth = require('../middleware/auth');

const routerAPI = express.Router(); // /v1/api

routerAPI.all("*", auth)

routerAPI.get("/", (req,res) => {
    return res.status(200).json("Hello word!")
})

routerAPI.post("/register", createCustomer);
routerAPI.post("/login", handleLogin);

routerAPI.get("/customer", getAllCustomer);

module.exports = routerAPI; //export default