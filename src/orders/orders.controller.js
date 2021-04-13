const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
function bodyData(propertyName) {
  return (req, res, next) => {
    const value = req.body.data[propertyName];
    if(value) {
      return next()
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  }
}
const hasDeliverTo = bodyData("deliverTo");
const hasMobileNumber = bodyData("mobileNumber");

function hasValidStatus(req, res, next) {
  const { data = {} } = req.body;
  const status = data.status;
  if (validStatuses.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of ${validStatuses}`,
  });
}

function hasValidDishes(req, res, next) {
  const { data = {} } = req.body;
  const dishes = data.dishes;
  if (dishes && Array.isArray(dishes) && dishes.length) {
    res.locals.dishes = dishes;
    return next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

function dishesHaveQuantity(req, res, next) {
  const { data = {} } = req.body;
  const message = data.dishes
    .map((dish, index) => dish.quantity && Number.isInteger(dish.quantity) ? null : `Dish ${index} must have a quantity that is an integer greater than 0`)
    .filter((errorMessage) => errorMessage != null)
    .join(",");
  
  if(message) {
    return next({ status: 400, message })
  }
  next();
}

function routeIdMatchesBodyId(req, res, next) {
  const dishId = req.params.orderId;
  const { id } = req.body.data;

  if (!id || id === dishId) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${dishId}`,
  });
}

function create(req, res, next) {
  const order = req.body.data;
  order.id = nextId();
  order.status = "pending";
  orders.push(order);
  res.status(201).json({
    data: order,
  });
}

function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function list(req, res, next) {
  res.json({data: orders});
}

function read(req, res, next) {
  res.json({data: res.locals.order});
}

function isNotDelivered(req, res, next) {
  if(res.locals.order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function isPending (req, res, next) {
  // const {data: {status} } = req.body;
  if (res.locals.order.status === "pending") {
    next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}


function orderIdExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${req.params.orderId}`,
  });
}

function update(req, res) {
  const { id } = res.locals.order;

  Object.assign(res.locals.order, req.body.data, {id})
  res.json({ data: res.locals.order })
}

// function update(req, res, next) {
//   const {data: {order} = {} } = req.body;
//   res.sendStatus(201).json({
//     data: res.locals.order,
//   });
// }

module.exports = {
  create: [
    hasDeliverTo, 
    hasMobileNumber, 
    hasValidDishes, 
    dishesHaveQuantity, 
    create
  ],
  delete: [orderIdExists, isPending, destroy],
  list,
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    routeIdMatchesBodyId, 
    hasValidStatus, 
    isNotDelivered,
    hasDeliverTo, 
    hasMobileNumber, 
    hasValidDishes, 
    dishesHaveQuantity, 
    update,
  ],
};