'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'admin@gmail.com'

interface OrderItem {
  id: string
  price: number
  products: {
    title: string
    image_url: string
  }
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  user_id: string
  order_items: OrderItem[]
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAndFetchOrders()
  }, [])

  useEffect(() => {
    let result = orders
    if (search.trim() !== '') {
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(search.toLowerCase()) ||
          order.order_items?.some((item) =>
            item.products?.title?.toLowerCase().includes(search.toLowerCase())
          )
      )
    }
    setFilteredOrders(result)
  }, [search, orders])

  const checkAdminAndFetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setUser(user)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          user_id,
          order_items (
            id,
            price,
            products (
              title,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setOrders(data as any)
        setFilteredOrders(data as any)
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const totalOrders = orders.length
  const paidOrders = orders.filter((o) => o.status === 'paid').length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            <div className="flex items-center gap-6">
              <a href="/admin/dashboard" className="flex items-center gap-3.5 group">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition duration-200">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    Admin Portal
                  </span>
                  <span className="text-[10px] font-extrabold text-indigo-600 tracking-widest mt-1">MANAGEMENT HUB</span>
                </div>
              </a>

              {user && user.email === ADMIN_EMAIL && (
                <div className="hidden md:flex items-center gap-2.5 pl-6 border-l border-slate-200">
                  <a href="/admin/dashboard" className="px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 transition shadow-2xs">
                    📊 แดชบอร์ดสรุปยอด
                  </a>
                  <a href="/admin/products" className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
                    📦 จัดการสินค้าทั้งหมด
                  </a>
                  <a href="/admin/add-product" className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
                    + เพิ่มสินค้าใหม่
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2.5 bg-slate-100/90 border border-slate-200 px-4.5 py-2.5 rounded-2xl shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-slate-700">{user.email}</span>
                </div>
              )}

              <a
                href="/"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition border border-slate-200 shadow-2xs"
              >
                🏠 ไปหน้าร้านค้า
              </a>

              <button
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition"
              >
                ออกจากระบบ
              </button>
            </div>

          </div>
        </nav>

        {/* Dashboard Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">ภาพรวมระบบและยอดขาย</h1>
            <p className="text-xs text-slate-500 mt-1">ติดตามสถิติการสั่งซื้อและรายได้ทั้งหมดของร้านค้า</p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลแดชบอร์ด...</div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">รายได้รวมทั้งสิ้น</p>
                    <h3 className="text-3xl font-black text-emerald-600">฿{totalRevenue.toLocaleString()}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                    💰
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">คำสั่งซื้อทั้งหมด</p>
                    <h3 className="text-3xl font-black text-slate-900">{totalOrders} <span className="text-sm font-normal text-slate-500">รายการ</span></h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
                    📋
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ชำระเงินสำเร็จ</p>
                    <h3 className="text-3xl font-black text-indigo-600">{paidOrders} <span className="text-sm font-normal text-slate-500">ออร์เดอร์</span></h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
                    ⚡
                  </div>
                </div>
              </div>

              {/* Orders Table Container with Search & Scroll */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">รายการสั่งซื้อทั้งหมด</h3>
                    <p className="text-xs text-slate-400 mt-0.5">ค้นหาและตรวจสอบประวัติการทำรายการของลูกค้า</p>
                  </div>

                  {/* 🟢 ช่องค้นหาคำสั่งซื้อ */}
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="ค้นหาด้วยรหัส หรือชื่อสินค้า..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs font-semibold">ไม่พบรายการสั่งซื้อที่คุณค้นหา</div>
                ) : (
                  /* 🟢 ครอบตารางด้วยความสูงจำกัดและเปิดระบบเลื่อน (Scroll) */
                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-4 px-6">รหัสคำสั่งซื้อ (ID)</th>
                          <th className="py-4 px-6">วันที่ทำรายการ</th>
                          <th className="py-4 px-6">รายการสินค้า</th>
                          <th className="py-4 px-6">สถานะ</th>
                          <th className="py-4 px-6 text-right">ยอดรวม (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-4 px-6 font-mono font-semibold text-slate-600">
                              {order.id.slice(0, 12)}...
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-medium">
                              {new Date(order.created_at).toLocaleString('th-TH', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                {order.order_items?.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    {item.products?.image_url && (
                                      <img src={item.products.image_url} alt="" className="w-6 h-6 rounded object-cover border border-slate-200 shrink-0" />
                                    )}
                                    <span className="font-bold text-slate-800 line-clamp-1">{item.products?.title || 'สินค้าดิจิทัล'}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {order.status?.toUpperCase() || 'PAID'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-emerald-600 text-sm">
                              ฿{order.total_amount?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>

      <footer className="bg-white border-t border-slate-200/80 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-xs font-semibold">
          <p>© {new Date().getFullYear()} DigitalStore Admin Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}