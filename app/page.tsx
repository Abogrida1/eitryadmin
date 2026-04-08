import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10)

  return (
    <main className="public-container">
      <div className="glass-card welcome-card">
        <header className="welcome-header">
          <div className="status-dot animate-pulse"></div>
          <h1>نظام تتبع الطلبات</h1>
          <p>مرحباً بك في نظام التتبع المتقدم. يمكنك متابعة حالة شحنتك هنا.</p>
        </header>

        <div className="orders-overview">
          <div className="overview-header">
            <h2>آخر الطلبات المحدثة</h2>
          </div>
          
          <div className="orders-list">
            {orders?.map((order) => (
              <div key={order.id} className="order-item">
                <div className="order-info">
                  <span className="order-number">{order.order_number}</span>
                  <span className="order-date">{new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
                <span className={`status-pill ${order.status}`}>
                  {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                </span>
              </div>
            ))}
            {(!orders || orders.length === 0) && (
              <div className="empty-orders">
                <p>لا توجد بيانات حالياً.</p>
              </div>
            )}
          </div>
        </div>

        <div className="footer-links">
          <Link href="/admin" className="btn btn-primary">
            لوحة تحكم الإدارة
          </Link>
        </div>
      </div>


    </main>
  )
}

const statusLabels = {
  pending: "قيد الطلب",
  processing: "جاري التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل"
};
