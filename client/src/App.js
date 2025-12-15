// src/App.js
import { useEffect, useState } from "react";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState(null);



  const [order, setOrder] = useState({
    oilType: "",
    quantityLitres: "",
    address: "",
  });
  const [orderMsg, setOrderMsg] = useState("");
  const [orders, setOrders] = useState([]); // shown only after clicking View Orders
  const [showOrders, setShowOrders] = useState(false);

  // load saved user on app start (persist login)
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.warn("Failed to parse saved user", e);
      }
    }
  }, []);

  // -------- AUTH HANDLERS --------
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

 const handleSubmit = async () => {
  setMsg("");

  const url = isLogin
    ? "/api/auth/login"
    : "/api/auth/register";

  const payload = isLogin
    ? { email: form.email, password: form.password }
    : form;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();       // 👈 IMPORTANT
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      setMsg(data.message || "Login failed ❌");
      return;
    }

    if (isLogin) {
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setMsg("");
    } else {
      setMsg("Registration successful ✅ Please login.");
    }

    setForm({ name: "", email: "", password: "" });
  } catch (err) {
    console.error("FETCH ERROR:", err);
    setMsg("Cannot connect to server ❌");
  }
};


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMsg("Logged out ✅");
    setIsLogin(true);
    setOrders([]);
    setShowOrders(false);
  };

  // -------- ORDER HANDLERS --------
  const handleOrderChange = (e) =>
    setOrder({ ...order, [e.target.name]: e.target.value });

  const handlePlaceOrder = async () => {
    setOrderMsg("");

    if (!order.oilType || !order.quantityLitres || !order.address) {
      setOrderMsg("Please fill all order fields");
      return;
    }

    if (!user) {
      setOrderMsg("You must be logged in to place an order.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          customerName: user.name,
          email: user.email,
          oilType: order.oilType,
          quantityLitres: Number(order.quantityLitres),
          address: order.address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOrderMsg(data.message || "Error placing order");
        return;
      }

      setOrderMsg("Order placed successfully ✅");
      setOrder({ oilType: "", quantityLitres: "", address: "" });

      // if currently viewing orders, refresh them
      if (showOrders) fetchOrders();
    } catch (err) {
      console.error("Place order error:", err);
      setOrderMsg("Server error while placing order ❌");
    }
  };

  const fetchOrders = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/orders", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed to fetch orders");
      return;
    }

    const data = await res.json();
    setOrders(data);
  } catch (error) {
    console.error("Fetch orders error:", error);
    alert("Failed to fetch orders");
  }
};



  // update status (owner/admin)
  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update" }));
        alert(err.message || "Failed to update status");
        return;
      }

      // refresh list
      fetchOrders();
    } catch (error) {
      console.error("Update status error:", error);
      alert("Failed to update status");
    }
  };

  // -------- DASHBOARD VIEW --------
  if (user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Oil Sales Dashboard</h2>
          <p>
            Welcome, <b>{user.name}</b>
          </p>
          <p>Email: {user.email}</p>

          {/* Place Order + View Orders */}
          {!showOrders && (
            <div style={{ marginTop: "20px", textAlign: "left" }}>
              <h3>Place Oil Order</h3>

<button
  onClick={() => {
    fetchOrders();
    setShowOrders(true);
  }}
>
  View Orders
</button>



              <select
                name="oilType"
                value={order.oilType}
                onChange={handleOrderChange}
                style={styles.input}
              >
                <option value="">Select Oil Type</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Engine Oil">Engine Oil</option>
              </select>

              <input
                name="quantityLitres"
                type="number"
                placeholder="Quantity (Litres)"
                value={order.quantityLitres}
                onChange={handleOrderChange}
                style={styles.input}
              />

              <textarea
                name="address"
                placeholder="Delivery Address"
                value={order.address}
                onChange={handleOrderChange}
                style={{ ...styles.input, height: 70 }}
              />

              <button onClick={handlePlaceOrder} style={styles.button}>
                Place Order
              </button>
              {orderMsg && <p style={{ marginTop: 8 }}>{orderMsg}</p>}
            </div>
          )}

          {/* ORDERS LIST – visible only when showOrders === true */}
          {showOrders && (
            <div
              style={{
                marginTop: "20px",
                textAlign: "left",
                maxHeight: "350px",
                overflowY: "auto",
                borderTop: "1px solid #475569",
                paddingTop: "10px",
              }}
            >
              <h3>Orders List</h3>

              <button
                onClick={() => {
                  setShowOrders(false);
                  // optionally clear orders if you prefer:
                  // setOrders([]);
                }}
                style={{
                  marginBottom: 10,
                  background: "#fbbf24",
                  border: "none",
                  padding: "5px",
                }}
              >
                ⬅ Back to Dashboard
              </button>

              {orders.length === 0 ? (
                <p>No orders found.</p>
              ) : (
                orders.map((o) => (
                  <div key={o._id} style={styles.orderCard}>
                    <p>
                      <b>Name:</b> {o.customerName}
                    </p>
                    <p>
                      <b>Email:</b> {o.email}
                    </p>
                    <p>
                      <b>Oil:</b> {o.oilType}
                    </p>
                    <p>
                      <b>Qty:</b> {o.quantityLitres} L
                    </p>
                    <p>
                      <b>Address:</b> {o.address}
                    </p>
                    <p>
                      <b>Status:</b> {o.status}
                    </p>

                    <div style={{ marginTop: 6 }}>
                      <button
                        onClick={() => updateStatus(o._id, "Confirmed")}
                        style={{ marginRight: 6 }}
                      >
                        ✅ Confirm
                      </button>
                      <button
                        onClick={() => updateStatus(o._id, "Delivered")}
                        style={{
                          background: "#4ade80",
                          border: "none",
                          padding: "4px 6px",
                        }}
                      >
                        🚚 Delivered
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{ ...styles.button, marginTop: 20, background: "#f97373" }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // -------- LOGIN / REGISTER VIEW --------
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{isLogin ? "Login" : "Register"}</h2>

        {!isLogin && (
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
          />
        )}

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={styles.input}
        />

        <button onClick={handleSubmit} style={styles.button}>
          {isLogin ? "Login" : "Register"}
        </button>

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

        <p onClick={() => setIsLogin(!isLogin)} style={styles.switch}>
          {isLogin ? "Create an account" : "Already have an account?"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
  },
  card: {
    width: "380px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "20px",
    background: "#1e293b",
    color: "white",
    borderRadius: "8px",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: "8px",
    margin: "8px 0",
    borderRadius: "4px",
    border: "none",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#38bdf8",
    border: "none",
    marginTop: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  switch: {
    marginTop: "10px",
    cursor: "pointer",
    color: "#38bdf8",
  },
  orderCard: {
    background: "#334155",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
};

export default App;
