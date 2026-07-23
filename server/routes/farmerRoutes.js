const express = require("express");
const router = express.Router();

const Farmer = require("../models/Farmer");

// Add Farmer
router.post("/", async (req, res) => {

  try {

    const farmer = new Farmer(req.body);

    await farmer.save();

    res.status(201).json({
      success: true,
      message: "Farmer added successfully",
      farmer,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  } 

});

router.get("/", async (req, res) => {

  try {

    const farmers = await Farmer.find();

    res.status(200).json({
      success: true,
      totalFarmers: farmers.length,
      farmers,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

});
router.get("/:id", async (req, res) => {

  try {

    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    res.status(200).json({
      success: true,
      farmer,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

}); 

router.post("/", async (req, res) => {
  try {
    const farmer = await Farmer.create(req.body);

    res.status(201).json({
      success: true,
      farmer,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}); 
// Update Farmer
router.put("/:id", async (req, res) => {

  try {

    const updatedFarmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Farmer updated successfully",
      updatedFarmer,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

});

// Delete Farmer
router.delete("/:id", async (req, res) => {

  try {

    await Farmer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Farmer deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

}); 

module.exports = router; 