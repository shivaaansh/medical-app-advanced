const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");
router.post("/register", async (req, res) => {
  try {
    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) {
      return res
        .status(200)
        .send({ message: "User already exist", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newuser = new User(req.body);
    await newuser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login successful", success: true, token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logining user", success: false, error });
  }
});
router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res
        .status(404)
        .send({ message: "User not found", success: false });
    }
    res.status(200).send({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error getting user info",
      success: false,
      error,
    });
  }
});
router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const newDoctor = new Doctor({ ...req.body, status: "pending" });
    await newDoctor.save();

    const adminUser = await User.findOne({ isAdmin: true });
    const unseenNotifications = adminUser.unseenNotifications;

    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account.`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
      },
      onClickPath: "/admin/doctorslist",
    });

    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });

    res
      .status(200)
      .send({ message: "Doctor Profile applied successfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying for doctor account",
      success: false,
      error,
    });
  }
});
router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error marking as seen notifications",
        success: false,
        error,
      });
    }
  }
);
router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications deleted",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error deleting the notifications",
      success: false,
      error,
    });
  }
});
router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors, // Ensure this is doctors, not user
    });
  } catch (error) {
    res.status(500).send({
      message: "Error fetching doctor list",
      success: false,
      error,
    });
  }
});
router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    console.log("Booking appointment request body:", req.body);

    // Ensure we have a valid userId for the doctor
    if (!req.body.doctorInfo?.userId) {
      return res.status(400).send({
        success: false,
        message: "doctorInfo.userId is missing or undefined",
      });
    }

    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();

    // Find the doctor's user record
    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    console.log("Doctor's user record:", user);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Doctor's user account not found",
      });
    }

    // If user.unseenNotifications is missing or undefined, handle it
    if (!user.unseenNotifications) {
      user.unseenNotifications = [];
    }

    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${
        req.body.userInfo?.name || "Unknown"
      }`,
      onClickPath: "/doctor/appointments",
    });

    await user.save();

    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error: error.message || error,
    });
  }
});
router.post("/check-booking-availability", authMiddleware, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
    const doctorId = req.body.doctorId;
    const appointments = await Appointment.find({
      doctorId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });

    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointments Available",
        success: true,
      });
    }

    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error: error.message || error,
    });
  }
});
router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.body.userId });
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
});
module.exports = router;
