'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  title: string
  price: number
  image_url: string
  quantity: number
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart.map((item) => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : null
      }
      return item
    }).filter(Boolean) as CartItem[]

    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleStripeCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (cart.length === 0) return

    try {
      setLoading(true)
      setErrorMessage(null)

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, userId: user.id }),
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (err) {
        throw new Error(`Server Error (${response.status}): ${text || 'Unknown response'}`)
      }

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบชำระเงิน')
      }

      if (data.url) {
        // ใช้เทคนิคสร้างแท็ก a เสมือนแล้วสั่งคลิก เพื่อบังคับให้ WebView ใน App Inventor ดักจับ URL ของ Stripe ได้
        const a = document.createElement('a')
        a.href = data.url
        a.target = '_self'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        throw new Error('ไม่พบลิงก์ชำระเงินจากระบบ')
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการทำรายการ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        
        <div className="flex justify-between items-center mb-8 pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">ตะกร้าสินค้าของคุณ</h1>
            <p className="text-xs text-slate-500 mt-1">ตรวจสอบรายการสินค้าและชำระเงินผ่านระบบออนไลน์ที่ปลอดภัย</p>
          </div>
          <a href="/" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
            ← กลับหน้าหลัก
          </a>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm font-semibold mb-4">ไม่มีสินค้าในตะกร้าของคุณ</p>
            <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md">
              เลือกซื้อสินค้าเพิ่มเติม
            </a>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-slate-100 mb-8">
              {cart.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                      <p className="text-emerald-600 font-black text-sm mt-1">฿{item.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 text-slate-600 hover:bg-slate-200 font-bold">-</button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 text-slate-600 hover:bg-slate-200 font-bold">+</button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-2xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span> <span>{errorMessage}</span>
              </div>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">ยอดรวมทั้งสิ้น</span>
                <span className="text-2xl font-black text-emerald-600">฿{totalPrice.toLocaleString()}</span>
              </div>

              <button
                onClick={handleStripeCheckout}
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/25 transition disabled:bg-slate-300"
              >
                {loading ? 'กำลังเชื่อมต่อระบบชำระเงิน...' : `ชำระเงินปลอดภัย (${cart.length} รายการ)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}