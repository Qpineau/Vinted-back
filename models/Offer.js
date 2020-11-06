const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, maxlength: 50 },
  product_description: { type: String, maxlenght: 500 },
  product_price: { type: Number, max: 10000 },
  product_details: Array,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  product_image: { type: Object, default: {} },
  product_pictures: Array,
});

module.exports = Offer;
