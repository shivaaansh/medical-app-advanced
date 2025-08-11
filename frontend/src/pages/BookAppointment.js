import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import moment from "moment";
import { Button, Col, DatePicker, Row, TimePicker } from "antd";

function BookAppointment() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [time, setTime] = useState(null); // controlled state for time string "HH:mm"
  const [date, setDate] = useState(null); // controlled state for date string "DD-MM-YYYY"
  const { user } = useSelector((state) => state.user);
  const [doctor, setDoctor] = useState(null);
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/doctor/get-doctor-info-by-id",
        { doctorId: params.doctorId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        setDoctor(response.data.data);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Error fetching doctor data:", error);
    }
  };

  const checkAvailability = async () => {
    try {
      dispatch(showLoading());
      // Log payload for debugging
      console.log("Check availability payload:", {
        doctorId: params.doctorId,
        date,
        time,
      });
      const response = await axios.post(
        "/api/user/check-booking-availability",
        { doctorId: params.doctorId, date, time },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        setIsAvailable(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Check availability error:", error.response?.data || error);
      toast.error("Error booking appointments");
      dispatch(hideLoading());
    }
  };

  const bookNow = async () => {
    setIsAvailable(false);
    try {
      dispatch(showLoading());
      console.log("Booking payload:", {
        doctorId: params.doctorId,
        userId: user._id,
        doctorInfo: doctor,
        userInfo: user,
        date: date,
        time: time,
      });
      const response = await axios.post(
        "/api/user/book-appointment",
        {
          doctorId: params.doctorId,
          userId: user._id,
          doctorInfo: doctor,
          userInfo: user,
          date,
          time,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/appointments");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Book appointment error:", error.response?.data || error);
      toast.error("Error booking appointments");
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    if (user) {
      getDoctorData();
    }
  }, [user]);

  return (
    <Layout>
      {doctor && (
        <div>
          <h1 className="page-title">
            {doctor.firstName} {doctor.lastName}
          </h1>
          <hr />
          <Row gutter={20} className="mt-5" align="middle">
            <Col span={12} sm={24} xs={24} lg={8}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/2534/2534679.png"
                width="100%"
                height="300"
                alt="Doctor"
              />
            </Col>
            <Col span={12} sm={24} xs={24} lg={8}>
              <h1 className="normal-text">
                <b>Timings : </b>
                {doctor.timings[0]} - {doctor.timings[1]}
              </h1>
              <hr />
              <p>
                <b>Phone Number : </b>
                {doctor.phoneNumber}
              </p>
              <p>
                <b>Address : </b>
                {doctor.address}
              </p>
              <p>
                <b>Fee per Visit : </b>
                {doctor.feePerConsultation}
              </p>
              <p>
                <b>Website : </b>
                {doctor.website}
              </p>
              <div className="d-flex flex-column pt-2 mt-2">
                {/* Controlled DatePicker */}
                <DatePicker
                  format="DD-MM-YYYY"
                  onChange={(value) => {
                    const formattedDate = moment(value).format("DD-MM-YYYY");
                    setDate(formattedDate);
                  }}
                />
                {/* Controlled TimePicker */}
                <TimePicker
                  format="HH:mm"
                  className="mt-3"
                  onChange={(value) => {
                    const formattedTime = moment(value).format("HH:mm");
                    setTime(formattedTime);
                  }}
                />
                {!isAvailable && (
                  <Button
                    className="primary-button mt-3 full-width-button"
                    onClick={checkAvailability}
                  >
                    Check Availability
                  </Button>
                )}
                {isAvailable && (
                  <Button
                    className="primary-button mt-3 full-width-button"
                    onClick={bookNow}
                  >
                    Book Now
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Layout>
  );
}

export default BookAppointment;
