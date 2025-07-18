const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");
const appointmentModel = require("../models/appointmentModel");
const User = require("../models/userModel");
router.post("/get-doctor-info-by-user-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched sucessfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error getting doctor info",
      success: false,
      error,
    });
  }
});
router.post("/update-doctor-profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );
    res.status(200).send({
      success: true,
      message: "Doctor profile updated sucessfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error getting doctor info",
      success: false,
      error,
    });
  }
});
router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.body.doctorId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched sucessfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error getting doctor info",
      success: false,
      error,
    });
  }
});
router.get(
  "/get-appointments-by-doctor-id",
  authMiddleware,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.body.userId });
      const appointments = await appointmentModel.find({
        doctorId: doctor._id,
      });
      res.status(200).send({
        message: "Appointments fetched successfully",
        success: true,
        data: appointments, // Ensure this is doctors, not user
      });
    } catch (error) {
      res.status(500).send({
        message: "Error fetching appointments",
        success: false,
        error,
      });
    }
  }
);
router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    );
    const doctorName = appointment.doctorInfo
      ? `${appointment.doctorInfo.firstName} ${appointment.doctorInfo.lastName}`
      : "the doctor";

    // Find the user (patient) who made the appointment
    const user = await User.findOne({ _id: appointment.userId });
    const unseenNotifications = user.unseenNotifications || [];

    unseenNotifications.push({
      type: "appointment-status-changed",
      message: `Your appointment with Dr. ${doctorName} has been ${status}`,
      onClickPath: "/appointments",
    });
    await user.save();

    res.status(200).send({
      message: "Appointment status updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).send({
      message: "Error updating appointment status",
      success: false,
      error: error.message || error,
    });
  }
});

module.exports = router;
