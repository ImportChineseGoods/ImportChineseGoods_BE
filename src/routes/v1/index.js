const express = require("express");

const router = express.Router()
const defaultRoutes = [
  {
    path: "/customer",
    route: require("./customer.js")
  },
  {
    path: "/employee",
    route: require("./employee.js")
  }
]
defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

module.exports = router