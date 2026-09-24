'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface OrderItem {
  id: string
  price: number
  products: {
    id: string
    title: string
    image_url: string
  }
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = orders.filter((order) => {
        const matchId = order.id.toLowerCase().includes(query)
        const matchProduct = order.order_items?.some((item) =>
          item.products?.title?.toLowerCase().includes(query)
        )
        return matchId || matchProduct
      })
      setFilteredOrders(filtered)
    }
  }, [searchQuery, orders])

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            price,
            products (
              id,
              title,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setOrders(data as any)
        setFilteredOrders(data as any)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">ประวัติการสั่งซื้อ</h1>
            <p className="text-xs text-slate-500 mt-1">ตรวจสอบรายการคำสั่งซื้อและสถานะการชำระเงินของคุณ</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200/80 shadow-2xs"
          >
            <span>←</span>
            <span>กลับหน้าหลักร้านค้า</span>
          </a>
        </div>

        {/* Search Input */}
        {!loading && orders.length > 0 && (
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ (ID) หรือชื่อสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm font-medium">กำลังโหลดประวัติการสั่งซื้อ...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm font-semibold mb-4">
              {orders.length === 0 ? 'คุณยังไม่มีประวัติการสั่งซื้อสินค้า' : 'ไม่พบรายการคำสั่งซื้อที่ค้นหา'}
            </p>
            {orders.length === 0 && (
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md transition"
              >
                ไปเลือกซื้อสินค้า
              </a>
            )}
          </div>
        ) : (
          /* 🟢 เพิ่มกล่องเลื่อนดูรายการ (Scrollable Container) ความสูงพอดีหน้าจอ พร้อมแต่ง Scrollbar */
          <div className="max-h-[650px] overflow-y-auto space-y-5 pr-2 custom-scrollbar">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition">
                
                {/* Order Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">หมายเลขคำสั่งซื้อ (ID)</span>
                    <span className="font-mono font-bold text-slate-700">{order.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">วันที่ทำรายการ</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(order.created_at).toLocaleString('th-TH', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">สถานะ</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      ชำระเงินแล้ว ({order.status?.toUpperCase() || 'PAID'})
                    </span>
                  </div>
                </div>

                {/* Order Items List */}
                <div className="space-y-3 mb-4">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-3">
                        {item.products?.image_url ? (
                          <img src={item.products.image_url} alt={item.products.title} className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold">📦</div>
                        )}
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.products?.title || 'สินค้าดิจิทัล'}</h4>
                      </div>
                      <span className="text-xs font-black text-emerald-600 shrink-0">฿{item.price?.toLocaleString() || 0}</span>
                    </div>
                  ))}
                </div>

                {/* Order Footer Total */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 font-bold">ยอดรวมทั้งสิ้นสุทธิ</span>
                  <span className="text-base font-black text-emerald-600">฿{order.total_amount?.toLocaleString() || 0}</span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}