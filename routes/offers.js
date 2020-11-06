const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");
const app = express();
const cloudinary = require("cloudinary").v2;

app.use(formidable());

const User = require("../models/User");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
      picture,
    } = req.fields;
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user,
    });
    let pictureToUpload = req.files.picture.path;
    const result = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `/Vinted/Offers/${newOffer._id}`,
    });
    newOffer.product_image = result;
    await newOffer.save();
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    let newOffer = await Offer.findOne({ _id: req.fields.id });

    newOffer.product_price = req.fields.price;
    newOffer.product_name = req.fields.name;

    await newOffer.save();
    res.status(400).json({ newOffer });
  } catch (error) {
    res.status(403).json({ error: { message: "Bad request" } });
  }
});

router.get("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById({ _id: req.query._id });
    await offer.deleteOne();
    res.status(200).json({ message: "Offer deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", isAuthenticated, async (req, res) => {
  try {
    let { title, priceMin, priceMax, sort, page } = req.query;
    let filters = {};
    const newTitle = new RegExp(title, "i");

    if (title) {
      filters.product_name = newTitle;
    }
    if (priceMin) {
      filters.product_price = { $gte: priceMin };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }
    }

    let sorting = {};

    if (sort === "price-desc") {
      sorting = { product_price: -1 };
    } else if (sort === "price-asc") {
      sorting = { product_price: 1 };
    }

    let limit = 3;
    page = Number(page);
    if (page < 1) {
      page = 1;
    } else {
      page = page;
    }

    const offers = await Offer.find(filters)
      .select("product_name product_price product_description")
      .sort(sorting)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
