const mongoose = require("mongoose");

const requesterSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  country: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
  },
  password: {
    type: String,
    minlength: 8,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  postal_code: {
    type: Number,
  },
  mobile: {
    type: Number,
    required: true,
    min: 999999999,
  },
});

module.exports = mongoose.model("Requester", requesterSchema);
