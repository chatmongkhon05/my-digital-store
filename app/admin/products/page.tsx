'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
  created_at: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Edit Modal States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCategory, setEditCategory] = useState('eBook')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editDigitalFile, setEditDigitalFile] = useState<File | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // 🟢 State สำหรับ Custom Notification (แทนการใช้ alert เบราว์เซอร์)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [toastMessage, setToastMessage] = useState<{ title: string; isError?: boolean } | null>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const showToast = (title: string, isError = false) => {
    setToastMessage({ title, isError })
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }
    setCheckingAuth(false)
    fetchProducts()
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setProducts(data)
    } catch (error: any) {
      console.error('Error fetching products:', error.message)
    } finally {
      setLoadingProducts(false)
    }
  }

  // 🟢 ยืนยันการลบสินค้า
  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', deletingProduct.id)
      if (error) throw error

      setDeletingProduct(null)
      showToast('ลบรายการสินค้าออกจากระบบเรียบร้อยแล้ว')
      fetchProducts()
    } catch (error: any) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, true)
    }
  }

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product)
    setEditTitle(product.title)
    setEditDescription(product.description || '')
    setEditPrice(product.price.toString())
    setEditCategory(product.category)
    setEditImageFile(null)
    setEditDigitalFile(null)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setEditLoading(true)

    try {
      let imageUrl = editingProduct.image_url
      let fileName = editingProduct.file_url

      if (editImageFile) {
        const imageExt = editImageFile.name.split('.').pop()
        const imageName = `${Date.now()}_img.${imageExt}`
        const { error: imgError } = await supabase.storage
          .from('public-images')
          .upload(imageName, editImageFile)

        if (imgError) throw imgError

        const { data: imgUrlData } = supabase.storage
          .from('public-images')
          .getPublicUrl(imageName)

        imageUrl = imgUrlData.publicUrl
      }

      if (editDigitalFile) {
        const fileExt = editDigitalFile.name.split('.').pop()
        fileName = `${Date.now()}_file.${fileExt}`
        const { error: fileError } = await supabase.storage
          .from('digital-files')
          .upload(fileName, editDigitalFile)

        if (fileError) throw fileError
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: editTitle,
          description: editDescription,
          price: parseFloat(editPrice),
          category: editCategory,
          image_url: imageUrl,
          file_url: fileName,
        })
        .eq('id', editingProduct.id)

      if (updateError) throw updateError

      setEditingProduct(null)
      showToast('บันทึกการแก้ไขข้อมูลสินค้าเรียบร้อยแล้ว!')
      fetchProducts()
    } catch (error: any) {
      showToast(`เกิดข้อผิดพลาดในการแก้ไข: ${error.message}`, true)
    } finally {
      setEditLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium text-sm">
        กำลังตรวจสอบสิทธิ์ Admin...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      {/* Toast Notification เด้งมุมขวาบน */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold backdrop-blur-md ${
              toastMessage.isError
                ? 'bg-red-500/90 text-white border-red-400'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            <span>{toastMessage.isError ? '⚠️' : '✨'}</span>
            <span>{toastMessage.title}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-100">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                จัดการรายการสินค้า ({products.length})
              </h1>
              <p className="text-slate-500 text-xs mt-1">
                จัดการ แก้ไข หรือลบสินค้าดิจิทัลในคลังของคุณ
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition border border-slate-200/80 shadow-sm"
              >
                <span>←</span>
                <span>กลับไปหน้าแรก</span>
              </a>
              <a
                href="/admin/add-product"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                + เพิ่มสินค้าใหม่
              </a>
            </div>
          </div>

          {loadingProducts ? (
            <div className="text-center py-16 text-slate-400 text-sm">กำลังโหลดรายการสินค้า...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">ยังไม่มีสินค้าในระบบ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-3">สินค้า</th>
                    <th className="py-3.5 px-3">หมวดหมู่</th>
                    <th className="py-3.5 px-3">ราคา</th>
                    <th className="py-3.5 px-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-3 flex items-center gap-3.5">
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="w-11 h-11 object-cover rounded-xl border border-slate-200/80 shadow-sm"
                        />
                        <span className="font-semibold text-slate-800 line-clamp-1">{p.title}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-medium border border-slate-200/60">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-emerald-600">฿{p.price.toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 🟢 MODAL 1: แก้ไขข้อมูลสินค้า (ปรับสไตล์ให้มินิมอล) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-100 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">แก้ไขข้อมูลสินค้า</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-semibold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  ชื่อสินค้า
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-slate-200 p-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  รายละเอียดสินค้า
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border border-slate-200 p-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full border border-slate-200 p-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    หมวดหมู่
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full border border-slate-200 p-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="eBook">eBook</option>
                    <option value="Template">Template</option>
                    <option value="Source Code">Source Code</option>
                    <option value="Online Course">Online Course</option>
                    <option value="Design Assets">Design Assets</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  รูปภาพตัวอย่างใหม่ (ถ้าไม่เปลี่ยนให้เว้นว่าง)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-200 p-2 rounded-xl text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  ไฟล์สินค้าจริงใหม่ (ถ้าไม่เปลี่ยนให้เว้นว่าง)
                </label>
                <input
                  type="file"
                  onChange={(e) => setEditDigitalFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-200 p-2 rounded-xl text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-semibold transition shadow-sm disabled:bg-slate-300"
                >
                  {editLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 MODAL 2: ยืนยันการลบสินค้า (แทนที่ alert เบราว์เซอร์) */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border border-slate-100 shadow-2xl">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบสินค้า</h3>
            <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
              คุณต้องการลบสินค้า <span className="font-semibold text-slate-800">"{deletingProduct.title}"</span> ออกจากระบบใช่หรือไม่?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingProduct(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}