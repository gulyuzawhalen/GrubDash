const router = require("express").Router();
const controller = require("./orders.controller");
const methodNotAllowed  = require("../errors/methodNotAllowed");

router
  .route("/")
  .get(controller.list)
  .post(controller.create)  
  .all(methodNotAllowed);

router
  .route("/:orderId")
  .delete(controller.delete)
  .get(controller.read)
  .put(controller.update)
  .all(methodNotAllowed);

module.exports = router;
