const express = require('express');
const { getHomepage, postCreateUser } = require('../controllers/homeController');


const router = express.Router();

router.get("/", getHomepage);
router.post("/create-user", postCreateUser);

module.exports = router; //export default