const express = require('express');
const { createCustomer, handleLogin, getAllCustomer, getAccount } = require('../controllers/customerController');
const auth = require('../middleware/auth');
const delay = require('../middleware/delay');

const routerAPI = express.Router(); // /v1/api

routerAPI.all("*", auth)

routerAPI.get("/", (req,res) => {
    return res.status(200).json("Hello word!")
})

routerAPI.post("/register", createCustomer);
routerAPI.post("/login", handleLogin);

routerAPI.get("/customer", getAllCustomer);
routerAPI.get("/account", getAccount);

module.exports = routerAPI; //export default