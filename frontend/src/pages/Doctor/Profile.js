import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../../redux/alertsSlice";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import DoctorForm from "../../components/DoctorForm";
import moment from "moment";

function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const params = useParams();
  const [doctor, setDoctor] = useState(null);
  const navigate = useNavigate();

  // Fetch doctor data and convert timings to Moment objects
  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/doctor/get-doctor-info-by-user-id",
        { userId: params.userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        const doctorData = response.data.data;
        // Convert stored string timings into Moment objects for the form
        if (doctorData.timings && doctorData.timings.length === 2) {
          doctorData.timings = doctorData.timings.map((t) =>
            moment(t, "HH:mm")
          );
        }
        setDoctor(doctorData);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Error fetching doctor data:", error);
    }
  };

  // onFinish called when the form is submitted
  const onFinish = async (values) => {
    try {
      // Log values to check the format of timings
      console.log("Form submitted values:", values);
      dispatch(showLoading());
      const response = await axios.post(
        "/api/doctor/update-doctor-profile",
        {
          ...values,
          userId: user._id,
          // Convert timings from Moment objects to strings
          timings: [
            moment(values.timings[0]).format("HH:mm"),
            moment(values.timings[1]).format("HH:mm"),
          ],
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
        navigate("/");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Error updating doctor profile:", error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (user) {
      getDoctorData();
    }
  }, [user]);

  return (
    <Layout>
      <h1 className="page-title">Doctor Profile</h1>
      <hr />
      {doctor && <DoctorForm onFinish={onFinish} initialValues={doctor} />}
    </Layout>
  );
}

export default Profile;
