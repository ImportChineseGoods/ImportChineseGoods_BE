const express = require('express');
const { createCustomer, handleLogin } = require('../controllers/customerController');

const routerAPI = express.Router(); // /v1/api

routerAPI.get("/", (req,res) => {
    return res.status(200).json("Hello word!")
})

routerAPI.post("/register", createCustomer);
routerAPI.post("/login", handleLogin);

module.exports = routerAPI; //export default