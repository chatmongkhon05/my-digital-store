'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'admin@gmail.com'

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  image_url: string
  file_url: string
}

interface CartItem extends Product {
  quantity: number
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartPopup, setShowCartPopup] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [showLoginAlert, setShowLoginAlert] = useState(false)
  const [showLogoutAlert, setShowLogoutAlert] = useState(false)
  const router = useRouter()

  const categories = ['All', 'eBook', 'Template', 'Source Code', 'Online Course', 'Design Assets']

  useEffect(() => {
    fetchProducts()
    checkUser()
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  useEffect(() => {
    let result = products
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (search.trim() !== '') {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      )
    }
    setFilteredProducts(result)
  }, [search, selectedCategory, products])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setProducts(data)
        setFilteredProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setShowLogoutAlert(true)
  }

  const handleBuyClick = (product: Product) => {
    if (!user) {
      setShowLoginAlert(true)
      return
    }
    addToCart(product)
  }

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      let updatedCart
      if (existingItem) {
        updatedCart = prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        updatedCart = [...prevCart, { ...product, quantity: 1 }]
      }
      localStorage.setItem('cart', JSON.stringify(updatedCart))
      return updatedCart
    })

    setShowCartPopup(true)
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) => {
      const updated = prevCart.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : null
        }
        return item
      }).filter(Boolean) as CartItem[]

      localStorage.setItem('cart', JSON.stringify(updated))
      return updated
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => {
      const updated = prevCart.filter((item) => item.id !== id)
      localStorage.setItem('cart', JSON.stringify(updated))
      return updated
    })
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between font-sans">
      <div>
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-3.5 group">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/25 group-hover:scale-105 transition duration-200">
                  D
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    DigitalStore
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-600 tracking-widest mt-1">CREATOR HUB</span>
                </div>
              </a>

              {/* 🟢 เมนูแอดมิน: เพิ่มปุ่ม แดชบอร์ดสรุปยอด ไว้เคียงคู่กับเมนูจัดการสินค้า */}
              {user && user.email === ADMIN_EMAIL && (
                <div className="hidden md:flex items-center gap-2.5 pl-6 border-l border-slate-200">
                  <a href="/admin/dashboard" className="px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 transition shadow-2xs border border-indigo-100">
                    📊 แดชบอร์ดสรุปยอด
                  </a>
                  <a href="/admin/products" className="px-4 py-2.5 rounded-2xl text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 transition shadow-2xs">
                    📦 จัดการสินค้าทั้งหมด
                  </a>
                  <a href="/admin/add-product" className="px-4 py-2.5 rounded-2xl text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 transition shadow-2xs">
                    + เพิ่มสินค้าใหม่
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2.5 bg-slate-100/90 border border-slate-200 px-4.5 py-2.5 rounded-2xl shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-700">{user.email}</span>
                  </div>

                  {user.email !== ADMIN_EMAIL && (
                    <>
                      <a
                        href="/cart"
                        className="relative bg-slate-100/90 hover:bg-slate-200 text-slate-700 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 shadow-2xs"
                      >
                        <span>🛒 ตะกร้าสินค้า</span>
                        {totalCartItems > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                            {totalCartItems}
                          </span>
                        )}
                      </a>

                      <a
                        href="/orders"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                      >
                        <span>📋</span>
                        <span>ประวัติการสั่งซื้อ</span>
                      </a>

                      <a href="/my-library" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5">
                        <span>📚</span>
                        <span>คลังสินค้าของฉัน</span>
                      </a>
                    </>
                  )}

                  <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition">
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="/cart"
                    className="relative bg-slate-100/90 hover:bg-slate-200 text-slate-700 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 shadow-2xs"
                  >
                    <span>🛒 ตะกร้า</span>
                    {totalCartItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        {totalCartItems}
                      </span>
                    )}
                  </a>

                  <a href="/auth/login" className="text-slate-700 hover:text-blue-600 hover:bg-slate-100 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition border border-slate-200 shadow-2xs">
                    เข้าสู่ระบบ
                  </a>
                  <a href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-blue-600/25 transition">
                    สมัครสมาชิก
                  </a>
                </div>
              )}
            </div>

          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-blue-50/80 via-indigo-50/20 to-slate-50 border-b border-slate-200/60 py-12 md:py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-extrabold tracking-wide mb-4">
              ⚡ PREMIUM DIGITAL ASSETS & SOURCE CODE
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              ศูนย์รวมสินค้าระบบดิจิทัล <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ดาวน์โหลดใช้งานได้ทันที</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto mb-8">
              เลือกซื้อสินค้าแบบด่วนทันที หรือเพิ่มลงตะกร้าเพื่อชำระเงินผ่านระบบออนไลน์ที่ปลอดภัย
            </p>

            <div className="relative group max-w-xl mx-auto">
              <input
                type="text"
                placeholder="ค้นหาสินค้า เช่น Next.js, E-Book, Template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-500/5 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 text-sm transition"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-4.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </section>

        {/* Main Catalog */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">รายการสินค้าทั้งหมด</h2>
              <p className="text-xs text-slate-500 mt-1">เลือกหมวดหมู่ดิจิทัลที่คุณต้องการ</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition duration-200 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400 font-medium text-sm">กำลังโหลดรายการสินค้า...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto my-10 shadow-sm">
              <p className="text-slate-800 font-bold text-sm">ไม่พบสินค้าที่คุณค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col justify-between group"
                >
                  <div onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                    <div className="relative h-36 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-xs">
                        {product.category}
                      </span>
                    </div>

                    <div className="p-4 pb-2">
                      <h3 className="text-sm font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">{product.title}</h3>
                      <p className="text-slate-500 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 mt-auto">
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">ราคา</span>
                        <span className="text-lg font-black text-emerald-600">฿{product.price.toLocaleString()}</span>
                      </div>
                    </div>

                    {user && user.email === ADMIN_EMAIL ? (
                      <div className="grid grid-cols-2 gap-2">
                        <a href="/admin/products" className="block text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-[11px] font-bold transition border border-slate-200">
                          จัดการสินค้า
                        </a>
                        <a href="/admin/add-product" className="block text-center bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-xl text-[11px] font-bold transition border border-slate-200">
                          + เพิ่มสินค้า
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleBuyClick(product)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[11px] font-bold shadow-sm transition"
                        >
                          ซื้อสินค้า
                        </button>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/80 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <span>🛒</span>
                          <span>เพิ่มตะกร้า</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative transition-all">
            
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition"
            >
              ✕
            </button>

            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-50 mb-4 border border-slate-100">
              <img src={selectedProduct.image_url} alt={selectedProduct.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                {selectedProduct.category || 'Digital Asset'}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">{selectedProduct.title}</h3>
            
            <div className="mb-5 max-h-36 overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line font-normal">
                {selectedProduct.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับสินค้าชิ้นนี้'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">ราคาจำหน่าย</span>
                <span className="text-lg font-black text-emerald-600">฿{selectedProduct.price?.toLocaleString()}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  ปิด
                </button>
                <button
                  onClick={() => {
                    handleBuyClick(selectedProduct)
                    setSelectedProduct(null)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                >
                  ซื้อสินค้าชิ้นนี้
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING CART POPUP */}
      {showCartPopup && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in max-w-sm w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛒</span>
              <h4 className="font-black text-slate-900 text-sm">ตะกร้าสินค้า ({totalCartItems})</h4>
            </div>
            <button
              onClick={() => setShowCartPopup(false)}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition"
            >
              ✕
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 mb-3">
            {cart.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-5">ไม่มีสินค้าในตะกร้า</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <img src={item.image_url} alt={item.title} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-emerald-600">฿{(item.price * item.quantity).toLocaleString()}</span>
                      
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1 py-0.5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-500 hover:text-slate-900 font-bold px-1 text-[11px]">-</button>
                        <span className="text-xs font-bold text-slate-800 px-1">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-500 hover:text-slate-900 font-bold px-1 text-[11px]">+</button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-[10px] font-bold transition shrink-0"
                  >
                    ลบ
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between mb-3 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-bold">ยอดรวมสุทธิ:</span>
            <span className="text-sm font-black text-emerald-600">฿{totalCartPrice.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowCartPopup(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition"
            >
              เลือกซื้อต่อ
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition"
            >
              ไปที่ตะกร้า
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-xs font-semibold">
          <p>© {new Date().getFullYear()} DigitalStore. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Alert Modal */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border border-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">กรุณาเข้าสู่ระบบก่อน</h3>
            <p className="text-slate-500 text-xs mb-5">คุณต้องเข้าสู่ระบบก่อนทำการสั่งซื้อสินค้า</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLoginAlert(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold">ยกเลิก</button>
              <button onClick={() => router.push('/auth/login')} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold">เข้าสู่ระบบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border border-slate-100 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-2">ออกจากระบบแล้ว</h3>
            <button onClick={() => setShowLogoutAlert(false)} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold">
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  )
}