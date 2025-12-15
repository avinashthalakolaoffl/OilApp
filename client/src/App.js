import { useEffect, useState } from "react";
import API_BASE_URL from "./config";


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
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setMsg("");

    const url = isLogin
      ? `${BASE_URL}/api/auth/login`
      : `${BASE_URL}/api/auth/register`;

    const payload = isLogin
      ? { email: form.email, password: form.password }
      : form;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Login failed ❌");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        setMsg("Registration successful ✅ Please login.");
      }

      setForm({ name: "", email: "", password: "" });
    } catch {
      setMsg("Cannot connect to server ❌");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setOrders([]);
    setShowOrders(false);
  };

  const handleOrderChange = (e) =>
    setOrder({ ...order, [e.target.name]: e.target.value });

  const handlePlaceOrder = async () => {
    setOrderMsg("");

    if (!order.oilType || !order.quantityLitres || !order.address) {
      setOrderMsg("Please fill all fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        setOrderMsg(data.message);
        return;
      }

      setOrderMsg("Order placed successfully ✅");
      setOrder({ oilType: "", quantityLitres: "", address: "" });
    } catch {
      setOrderMsg("Server error ❌");
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setOrders(data);
    } catch {
      alert("Failed to fetch orders");
    }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");
    await fetch(`${BASE_URL}/api/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  if (user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Oil Sales Dashboard</h2>
          <p>Welcome <b>{user.name}</b></p>

          {!showOrders && (
            <>
              <button onClick={() => { fetchOrders(); setShowOrders(true); }}>
                View Orders
              </button>

              <select name="oilType" value={order.oilType} onChange={handleOrderChange} style={styles.input}>
                <option value="">Select Oil</option>
                <option>Diesel</option>
                <option>Petrol</option>
                <option>Engine Oil</option>
              </select>

              <input name="quantityLitres" type="number" placeholder="Quantity" value={order.quantityLitres} onChange={handleOrderChange} style={styles.input} />

              <textarea name="address" placeholder="Address" value={order.address} onChange={handleOrderChange} style={styles.input} />

              <button onClick={handlePlaceOrder}>Place Order</button>
              {orderMsg && <p>{orderMsg}</p>}
            </>
          )}

          {showOrders && (
            <>
              <button onClick={() => setShowOrders(false)}>⬅ Back</button>
              {orders.map(o => (
                <div key={o._id} style={styles.orderCard}>
                  <p>{o.oilType} — {o.quantityLitres}L</p>
                  <p>Status: {o.status}</p>
                  <button onClick={() => updateStatus(o._id, "Confirmed")}>Confirm</button>
                  <button onClick={() => updateStatus(o._id, "Delivered")}>Deliver</button>
                </div>
              ))}
            </>
          )}

          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{isLogin ? "Login" : "Register"}</h2>

        {!isLogin && <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={styles.input} />}
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={styles.input} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} style={styles.input} />

        <button onClick={handleSubmit}>{isLogin ? "Login" : "Register"}</button>
        {msg && <p>{msg}</p>}

        <p onClick={() => setIsLogin(!isLogin)} style={styles.switch}>
          {isLogin ? "Create an account" : "Already have an account?"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#0f172a" },
  card: { width: 380, padding: 20, background: "#1e293b", color: "#fff", borderRadius: 8, textAlign: "center" },
  input: { width: "100%", padding: 8, margin: "8px 0" },
  orderCard: { background: "#334155", padding: 10, marginTop: 10 }
};

export default App;
