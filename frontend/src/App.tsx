import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4000';

type ReportState = {
  loading: boolean;
  error: string | null;
  sales: any[];
  stock: any[];
  pendingOrders: any[];
  complaints: any[];
};

function App() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [token, setToken] = useState<string | null>(null);
   const [role, setRole] = useState<string | null>(null);
   const [userName, setUserName] = useState<string | null>(null);
   const [retailerOrders, setRetailerOrders] = useState<any[]>([]);
   const [retailerComplaints, setRetailerComplaints] = useState<any[]>([]);
   const [products, setProducts] = useState<any[]>([]);
   const [orderProductId, setOrderProductId] = useState<number | ''>('');
   const [orderQuantity, setOrderQuantity] = useState<number>(1);
   const [complaintSubject, setComplaintSubject] = useState('');
   const [complaintDescription, setComplaintDescription] = useState('');
  const [reportState, setReportState] = useState<ReportState>({
    loading: false,
    error: null,
    sales: [],
    stock: [],
    pendingOrders: [],
    complaints: [],
  });

  const updateOrderStatus = async (orderId: number, status: string) => {
    if (!token) return;
    setReportState((prev) => ({ ...prev, error: null }));
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update order status');
      }
      await loadReports();
    } catch (err: any) {
      setReportState((prev) => ({
        ...prev,
        error: err.message || 'Failed to update order status',
      }));
    }
  };

  const updateComplaint = async (
    complaintId: number,
    status: string,
    assignedToUserId?: number | null
  ) => {
    if (!token) return;
    setReportState((prev) => ({ ...prev, error: null }));
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          assigned_to_user_id:
            assignedToUserId === undefined ? null : assignedToUserId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update complaint');
      }
      await loadReports();
    } catch (err: any) {
      setReportState((prev) => ({
        ...prev,
        error: err.message || 'Failed to update complaint',
      }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportState((prev) => ({ ...prev, error: null }));
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      setToken(data.token);
      setRole(data.role);
      setUserName(data.name);
    } catch (err: any) {
      setReportState((prev) => ({
        ...prev,
        error: err.message || 'Login error',
      }));
    }
  };

  const loadReports = async () => {
    if (!token) return;
    setReportState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [salesRes, stockRes, pendingRes, complaintsRes] = await Promise.all([
        fetch(`${API_BASE}/api/reports/sales`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/reports/stock`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/reports/pending-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/reports/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!salesRes.ok || !stockRes.ok || !pendingRes.ok || !complaintsRes.ok) {
        throw new Error('Failed to load reports');
      }

      const [sales, stock, pendingOrders, complaints] = await Promise.all([
        salesRes.json(),
        stockRes.json(),
        pendingRes.json(),
        complaintsRes.json(),
      ]);

      setReportState({
        loading: false,
        error: null,
        sales,
        stock,
        pendingOrders,
        complaints,
      });
    } catch (err: any) {
      setReportState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load reports',
      }));
    }
  };

  if (!token) {
    return (
      <div className="App">
        <div className="auth-card">
          <h1>FLR Depot CRM</h1>
          <p className="subtitle">Login</p>
          {reportState.error && (
            <div className="error-banner">{reportState.error}</div>
          )}
          <form onSubmit={handleLogin} className="form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="primary-btn">
              Log In
            </button>
          </form>
          <p className="hint">
            Use your Admin/Staff or Retailer account credentials.
          </p>
        </div>
      </div>
    );
  }

  // Admin / Staff dashboard (reports)
  if (role === 'ADMIN' || role === 'STAFF') {
    return (
    <div className="App">
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="app-name">FLR Depot CRM</span>
          <span className="app-tagline">
            {role === 'ADMIN' ? 'Admin Dashboard' : 'Staff Dashboard'}
          </span>
        </div>
        <button
          className="secondary-btn"
          onClick={() => {
            setToken(null);
            setRole(null);
            setUserName(null);
          }}
        >
          Log out
        </button>
      </header>

      <main className="dashboard">
        <section className="dashboard-header">
          <h2>Reports</h2>
          <button
            className="primary-btn"
            onClick={loadReports}
            disabled={reportState.loading}
          >
            {reportState.loading ? 'Loading…' : 'Refresh data'}
          </button>
          {reportState.error && (
            <div className="error-banner">{reportState.error}</div>
          )}
        </section>

        <section className="cards-grid">
          <div className="card">
            <h3>Sales (by day)</h3>
            {reportState.sales.length === 0 ? (
              <p className="muted">No sales data yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Transactions</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportState.sales.map((row: any) => (
                    <tr key={row.day}>
                      <td>{row.day}</td>
                      <td>{row.transactions_count}</td>
                      <td>{row.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3>Stock Levels</h3>
            {reportState.stock.length === 0 ? (
              <p className="muted">No products yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {reportState.stock.map((p: any) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.sku}</td>
                      <td>{p.unit_price}</td>
                      <td>{p.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3>Pending Orders</h3>
            {reportState.pendingOrders.length === 0 ? (
              <p className="muted">No pending orders.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Retailer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportState.pendingOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.retailer_name}</td>
                      <td>{o.status}</td>
                      <td>{o.total_amount}</td>
                      <td>
                        <select
                          defaultValue={o.status}
                          onChange={(e) =>
                            updateOrderStatus(o.id, e.target.value)
                          }
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3>Unresolved Complaints</h3>
            {reportState.complaints.length === 0 ? (
              <p className="muted">No open complaints.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Subject</th>
                    <th>Retailer / Customer</th>
                    <th>Status</th>
                    <th>Assign to User ID</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {reportState.complaints.map((c: any) => {
                    let assignedInput: HTMLInputElement | null = null;
                    let statusSelect: HTMLSelectElement | null = null;
                    return (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.subject}</td>
                        <td>{c.retailer_name || c.customer_name || 'N/A'}</td>
                        <td>
                          <select
                            defaultValue={c.status}
                            ref={(el) => {
                              statusSelect = el;
                            }}
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            placeholder="User ID"
                            defaultValue={c.assigned_to_user_id ?? ''}
                            ref={(el) => {
                              assignedInput = el;
                            }}
                          />
                        </td>
                        <td>
                          <button
                            className="secondary-btn"
                            onClick={() =>
                              updateComplaint(
                                c.id,
                                statusSelect?.value || c.status,
                                assignedInput?.value
                                  ? Number(assignedInput.value)
                                  : null
                              )
                            }
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
  }

  // Retailer dashboard
  const loadRetailerData = async () => {
    if (!token) return;
    setReportState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [ordersRes, complaintsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!ordersRes.ok || !complaintsRes.ok || !productsRes.ok) {
        throw new Error('Failed to load retailer data');
      }
      const [orders, complaintsList, productsList] = await Promise.all([
        ordersRes.json(),
        complaintsRes.json(),
        productsRes.json(),
      ]);
      setRetailerOrders(orders);
      setRetailerComplaints(complaintsList);
      setProducts(productsList);
      setReportState((prev) => ({ ...prev, loading: false }));
    } catch (err: any) {
      setReportState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load retailer data',
      }));
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !orderProductId || orderQuantity <= 0) return;
    setReportState((prev) => ({ ...prev, error: null }));
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{ product_id: orderProductId, quantity: orderQuantity }],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to place order');
      }
      await loadRetailerData();
      setOrderQuantity(1);
      setOrderProductId('');
    } catch (err: any) {
      setReportState((prev) => ({
        ...prev,
        error: err.message || 'Failed to place order',
      }));
    }
  };

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !complaintSubject || !complaintDescription) return;
    setReportState((prev) => ({ ...prev, error: null }));
    try {
      const res = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: complaintSubject,
          description: complaintDescription,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit complaint');
      }
      setComplaintSubject('');
      setComplaintDescription('');
      await loadRetailerData();
    } catch (err: any) {
      setReportState((prev) => ({
        ...prev,
        error: err.message || 'Failed to submit complaint',
      }));
    }
  };

  return (
    <div className="App">
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="app-name">FLR Depot CRM</span>
          <span className="app-tagline">
            Retailer Portal{userName ? ` – ${userName}` : ''}
          </span>
        </div>
        <button
          className="secondary-btn"
          onClick={() => {
            setToken(null);
            setRole(null);
            setUserName(null);
          }}
        >
          Log out
        </button>
      </header>

      <main className="dashboard">
        <section className="dashboard-header">
          <h2>My Orders & Complaints</h2>
          <button
            className="primary-btn"
            onClick={loadRetailerData}
            disabled={reportState.loading}
          >
            {reportState.loading ? 'Loading…' : 'Refresh data'}
          </button>
          {reportState.error && (
            <div className="error-banner">{reportState.error}</div>
          )}
        </section>

        <section className="cards-grid">
          <div className="card">
            <h3>Place New Order</h3>
            {products.length === 0 ? (
              <p className="muted">
                No products available yet. Contact admin to add products.
              </p>
            ) : (
              <form className="form" onSubmit={submitOrder}>
                <label>
                  Product
                  <select
                    value={orderProductId}
                    onChange={(e) =>
                      setOrderProductId(
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                  >
                    <option value="">Select a product</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stock: {p.stock_quantity})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min={1}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  />
                </label>
                <button type="submit" className="primary-btn">
                  Submit Order
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3>My Orders</h3>
            {retailerOrders.length === 0 ? (
              <p className="muted">You have no orders yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {retailerOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.status}</td>
                      <td>{o.total_amount}</td>
                      <td>{o.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3>Submit Complaint</h3>
            <form className="form" onSubmit={submitComplaint}>
              <label>
                Subject
                <input
                  type="text"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  rows={3}
                  required
                />
              </label>
              <button type="submit" className="primary-btn">
                Send Complaint
              </button>
            </form>
          </div>

          <div className="card">
            <h3>My Complaints</h3>
            {retailerComplaints.length === 0 ? (
              <p className="muted">You have no complaints yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {retailerComplaints.map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.subject}</td>
                      <td>{c.status}</td>
                      <td>{c.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
