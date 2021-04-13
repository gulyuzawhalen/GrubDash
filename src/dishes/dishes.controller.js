const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyDataHas(propertyName) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    const value = data[propertyName];
    if(value) {
      return next()
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  }
}
const hasName = bodyDataHas("name");
const hasDescription = bodyDataHas("description");
const hasImage = bodyDataHas("image_url");

function hasValidPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price) && price > 0) {
    return next();
  }
    next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

function routeIdMatchesId(req, res, next) {
  const dishId = req.params.dishId;
  const { id } = req.body.data;

  if (!id || id === dishId) {
    next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  })
}

function create(req, res, next) {
  const dish = req.body.data;
  dish.id = nextId();
  dishes.push(dish);
  res.status(201).json({
    data: dish,
  });
}

function destroy(req, res) {
  const index = dishes.findIndex((dish) => dish.id === res.locals.dish);
  dishes.splice(index, 1);
  res.sendStatus(204);
}

function dishIdExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${req.params.dishId}`,
  })
}

function list(req, res, next) {
  res.json({
    data: dishes,
  });
}

function read(req, res, next) {
  res.json({
    data: res.locals.dish,
  });
}

function update(req, res) {
  const { id } = res.locals.dish;
  Object.assign(res.locals.dish, req.body.data, {id})
  res.json({ data: res.locals.dish })
}

module.exports = {
  create: [
    hasName, 
    hasDescription, 
    hasValidPrice, 
    hasImage, 
    create
  ],
  delete: [dishIdExists, destroy],
  list,
  read: [dishIdExists, read],
  update: [
    dishIdExists, 
    routeIdMatchesId, 
    hasName, 
    hasDescription, 
    hasValidPrice, 
    hasImage, 
    update,
  ],
};

