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
  const [reportState, setReportState] = useState<ReportState>({
    loading: false,
    error: null,
    sales: [],
    stock: [],
    pendingOrders: [],
    complaints: [],
  });

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
          <p className="subtitle">Admin / Staff Login</p>
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
            You can use the admin account you created via the API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="app-name">FLR Depot CRM</span>
          <span className="app-tagline">Admin Dashboard</span>
        </div>
        <button className="secondary-btn" onClick={() => setToken(null)}>
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
                  </tr>
                </thead>
                <tbody>
                  {reportState.pendingOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.retailer_name}</td>
                      <td>{o.status}</td>
                      <td>{o.total_amount}</td>
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
                  </tr>
                </thead>
                <tbody>
                  {reportState.complaints.map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.subject}</td>
                      <td>
                        {c.retailer_name || c.customer_name || 'N/A'}
                      </td>
                      <td>{c.status}</td>
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
