import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { hideLoading, showLoading } from "../../redux/alertsSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { Table } from "antd";
import moment from "moment";
function UsersList() {
  const [users, setUsers] = useState([]);
  const dispatch = useDispatch();
  const getUsersData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.get("/api/admin/get-all-users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      dispatch(hideLoading());
      if (response.data.success) {
        setUsers(response.data.data); // Store users data in state
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Error fetching user data:", error); // Log error for debugging
    }
  };
  useEffect(() => {
    getUsersData();
  }, []);
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (text, record) => moment(record.createdAt).format("DD-MM-YYYY"),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => (
        <div className="d-flex">
          <h1 className="anchor">Block</h1>{" "}
          {/* Implement actual blocking logic */}
        </div>
      ),
    },
  ];
  return (
    <Layout>
      <h1 className="page-header">Users List</h1>
      <Table columns={columns} dataSource={users} />
    </Layout>
  );
}

export default UsersList;
