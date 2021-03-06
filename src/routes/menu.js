const Menu = require("../models/menu");
const Review = require("../models/review");
const route = require("express").Router();

// [GET] all menu
route.get("/", async (req, res) => {
  const menus = await Menu.find({})
    .populate("recipes", {
      _id: true,
      name: true,
    })
    .populate({
      path: "reviews",
      populate: {
        path: "user",
        model: "users",
      },
    });

  if (!menus) {
    return res.status(404).json({ message: "No menu available." });
  }
  return res.status(200).json({ menus });
});

// [GET] specific menu
route.get("/:id", async (req, res) => {
  let menu = await Menu.findById(req.params.id).populate("recipes");

  if (!menu) {
    return res.status(404).json({ message: "Menu not found." });
  }
  return res.status(200).json({ menu });
});

//  [CREATE] menu
route.post("/", async (req, res) => {
  const obj = req.body;
  const menu = new Menu({
    name: obj.name,
    description: obj.description,
  });

  if (obj.recipes) {
    menu.recipes = obj.recipes;
  }

  const newMenu = await menu.save();

  if (newMenu) {
    res.status(200).json({ newMenu });
  } else {
    throw new Error("Menu is not created.");
  }
});

// [UPDATE] specific menu
route.put("/:id", async (req, res) => {
  const updateObj = req.body;

  const updatedMenu = await Menu.findByIdAndUpdate(
    req.params.id,
    { $set: updateObj },
    { new: true }
  );

  if (updatedMenu) {
    return res.status(200).json({ updatedMenu });
  } else {
    throw new Error("Menu failed to update.");
  }
});

// [DELETE] specific menu
route.delete("/:id", async (req, res) => {
  try {
    await Menu.findByIdAndRemove(req.params.id);
    return res.status(204).end();
  } catch (e) {
    throw new Error("Menu failed to be deleted.");
  }
});

// [CREATE] review
route.post("/review/:id", async (req, res) => {
  const { rating, message } = req.body;
  let returnedReview;
  let code = `${req.params.id}_${req.user._id}`;
  const obj = {
    rating,
    message,
  };

  // https://docs.mongodb.com/realm/mongodb/actions/collection.findOneAndUpdate/
  let review = await Review.findOneAndUpdate({ code }, { $set: obj });

  if (review) {
    returnedReview = review;
  } else {
    const review = new Review({
      ...obj,
      user: req.user,
      code,
    });

    returnedReview = await review.save();

    // recipe reference tor reviews
    await Menu.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { reviews: returnedReview } }
    );
  }

  if (returnedReview) {
    return res.status(200).json({ returnedReview });
  } else {
    throw new Error("Review is not created.");
  }
});

module.exports = route;
