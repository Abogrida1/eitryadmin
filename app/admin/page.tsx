"use client";

import { useEffect, useState } from "react";
import StatusDropdown from "@/components/StatusDropdown";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // استخدام localStorage لبقاء تسجيل الدخول دائماً (حفظ الجهاز)
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    }
  }, [isLoggedIn]);

  async function fetchOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        if (res.status === 401) handleLogout();
        setError("فشل جلب الطلبات. تأكد من رمز الدخول.");
      }
    } catch (err) {
      setError("خطأ في الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderNumber: string, status: string) {
    try {
      const res = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_number: orderNumber, new_status: status }),
      });
      if (res.ok) fetchOrders();
      else alert("حدث خطأ أثناء التحديث");
    } catch (err) {
      alert("فشل تحديث الحالة");
    }
  }

  async function syncOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sync-orders", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert("تم المزامنة بنجاح: " + data.message);
        fetchOrders();
      } else {
        // رسالة خطأ واضحة في حال فقدان بيانات Shopify
        if (data.error?.includes("Shopify credentials")) {
          alert("خطأ: لم يتم إعداد بيانات Shopify (API Key) في ملف البيئة .env");
        } else {
          alert("فشل المزامنة: " + (data.error || "خطأ غير معروف"));
        }
      }
    } catch (err) {
      alert("حدث خطأ أثناء محاولة المزامنة");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (token) {
      localStorage.setItem("admin_token", token);
      setIsLoggedIn(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setIsLoggedIn(false);
    setToken("");
    setOrders([]);
  }

  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div className="glass-card login-card">
          <div className="login-header">
            <div className="logo-spark">✨</div>
            <h2>لوحة الإدارة</h2>
            <p>سجل الدخول لإدارة تتبع الطلبات</p>
          </div>
          <div className="input-group">
            <label>رمز الدخول (Access Token)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <button onClick={handleLogin} className="btn btn-primary w-full">
            تسجيل الدخول
          </button>
          
          <div className="login-footer">
            <p>يرجى استخدام الرمز الذي تم إعداده في ADMIN_TOKEN</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="main-header">
        <div className="header-content">
          <div className="brand">
            <h1>لوحة التحكم</h1>
            <span className="badge-live animate-pulse">مباشر</span>
          </div>
          
          <div className="header-actions">
            <button onClick={syncOrders} className="btn btn-ghost" disabled={loading}>
              {loading ? "جاري المزامنة..." : "مزامنة Shopify"}
            </button>
            <button onClick={handleLogout} className="btn-logout">خروج</button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="stats-row">
          <div className="glass-card stat-card">
            <h3>إجمالي الطلبات</h3>
            <div className="value">{orders.length}</div>
          </div>
          <div className="glass-card stat-card">
            <h3>نشط حالياً</h3>
            <div className="value">{orders.filter(o => o.status !== 'delivered').length}</div>
          </div>
        </div>

        <div className="glass-card table-section">
          <div className="table-header">
            <h2>أحدث الشحنات</h2>
            <button onClick={fetchOrders} className="btn-refresh">
              {loading ? "..." : "تحديث القائمة"}
            </button>
          </div>

          <div className="table-responsive" style={{ minHeight: '400px' }}>
            <table className="admin-table responsive">
              <thead>
                <tr>
                  <th>الطلب</th>
                  <th>العميل</th>
                  <th>طريقة الاستلام</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="الطلب"><span className="order-num">{order.order_number}</span></td>
                    <td data-label="العميل">
                      <div className="customer-cell">
                        <div className="customer-name">{order.customer_name || "عميل مجهول"}</div>
                        <div className="customer-phone">{order.customer_phone || "بدون هاتف"}</div>
                      </div>
                    </td>
                    <td data-label="الاستلام">
                      <span className={`method-badge ${order.delivery_method?.toLowerCase() === 'pickup' ? 'pickup' : 'shipping'}`}>
                        {order.delivery_method?.toLowerCase() === 'pickup' ? 'استلام فرع' : 'شحن منزل'}
                      </span>
                    </td>
                    <td data-label="التاريخ">
                      <div className="date-cell">
                        <div>{new Date(order.created_at).toLocaleDateString('ar-EG')}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                          {new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td data-label="الحالة">
                      <span className={`status-badge ${order.status}`}>
                        {order.delivery_method === 'PICKUP' && order.status === 'shipped' ? 'جاهز للاستلام' : 
                         order.delivery_method === 'PICKUP' && order.status === 'delivered' ? 'تم الاستلام' :
                         statusLabels[order.status as keyof typeof statusLabels] || order.status}
                      </span>
                    </td>
                    <td data-label="الإجراء">
                      <StatusDropdown 
                        currentStatus={order.status}
                        isPickup={order.delivery_method === 'PICKUP'}
                        onStatusChange={(newStatus) => updateStatus(order.order_number, newStatus)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && !loading && (
            <div className="empty-state">
              <p>لا توجد طلبات لعرضها حالياً.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const statusLabels = {
  pending: "قيد الطلب",
  processing: "جاري التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل"
};
