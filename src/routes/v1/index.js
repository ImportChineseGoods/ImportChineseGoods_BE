const express = require("express");
const auth = require('../../middleware/auth');

const router = express.Router()
router.all("*", auth)
const defaultRoutes = [
  {
    path: "/customer",
    route: require("./customer.js")
  },
  {
    path: "/employee",
    route: require("./employee.js")
  },
  {
    path: "/product",
    route: require("./product.js")
  },
  {
    path: "/parameter",
    route: require("./parameter.js")
  },
  {
    path: "/bol",
    route: require("./bol.js")
  },
  {
    path: "/anonymous",
    route: require("./anonymous.js")
  },
  {
    path: "/warehouse",
    route: require("./warehouse.js")
  },
  {
    path: "/history",
    route: require("./history.js")  
  },
  {
    path: "/complaint",
    route: require("./complaint.js")
  },
  {
    path: "/transaction",
    route: require("./transaction.js")
  },
  {
    path: "/order",
    route: require("./order.js")
  },
  {
    path: "/consignment",
    route: require("./consignment.js")
  },
  {
    path: "/delivery",
    route: require("./deliveryNote.js")
  },
  {
    path: "/get",
    route: require("./getData.js")
  },
]
defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

module.exports = router