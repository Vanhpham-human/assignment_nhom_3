const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    position: {
      type: String,
      required: true,
      enum: ['Sales', 'Senior Sales', 'Supervisor', 'Manager'],
      index: true
    },
    salary: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
