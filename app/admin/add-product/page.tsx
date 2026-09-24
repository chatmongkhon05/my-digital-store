'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// 🟢 อีเมล Admin
const ADMIN_EMAIL = 'admin@gmail.com'

export default function AddProductPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('eBook')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [digitalFile, setDigitalFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  // 🟢 State สำหรับแสดง Pop-up บันทึกสำเร็จ
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Admin เท่านั้น')
      router.push('/')
      return
    }
    setCheckingAuth(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !digitalFile) {
      setMessage({ text: 'กรุณาเลือกทั้งรูปภาพและไฟล์สินค้า', isError: true })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const imageExt = imageFile.name.split('.').pop()
      const imageName = `${Date.now()}_img.${imageExt}`
      const { error: imgError } = await supabase.storage
        .from('public-images')
        .upload(imageName, imageFile)

      if (imgError) throw imgError

      const { data: imgUrlData } = supabase.storage
        .from('public-images')
        .getPublicUrl(imageName)

      const fileExt = digitalFile.name.split('.').pop()
      const fileName = `${Date.now()}_file.${fileExt}`
      const { error: fileError } = await supabase.storage
        .from('digital-files')
        .upload(fileName, digitalFile)

      if (fileError) throw fileError

      const { error: dbError } = await supabase.from('products').insert([
        {
          title,
          description,
          price: parseFloat(price),
          category,
          image_url: imgUrlData.publicUrl,
          file_url: fileName,
        },
      ])

      if (dbError) throw dbError

      // 🟢 เปิดใช้งาน Modal แจ้งเตือนสำเร็จแทนการใช้ alert() ของเบราว์เซอร์
      setShowSuccessModal(true)
    } catch (error: any) {
      console.error(error)
      setMessage({ text: `เกิดข้อผิดพลาด: ${error.message}`, isError: true })
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium">
        กำลังตรวจสอบสิทธิ์ Admin...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">เพิ่ม Digital Product</h1>
            <p className="text-slate-500 text-xs mt-1">อัปโหลดรายการสินค้าดิจิทัลใหม่เข้าสู่ร้านค้า</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition border border-slate-200/80 shadow-sm"
          >
            <span>←</span>
            <span>กลับไปหน้าแรก</span>
          </a>
        </div>

        {message && (
          <div
            className={`p-4 mb-6 rounded-2xl text-xs font-semibold ${
              message.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              ชื่อสินค้า
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 p-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น E-Book สอนเขียน Full-Stack Next.js"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              รายละเอียดสินค้า
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 p-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="อธิบายข้อมูลสินค้าสั้นๆ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                ราคา (บาท)
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-slate-200 p-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="290"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
              รูปภาพตัวอย่างสินค้า
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full border border-slate-200 p-2 rounded-xl text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              ไฟล์สินค้าจริง (PDF, ZIP ฯลฯ)
            </label>
            <input
              type="file"
              required
              onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
              className="w-full border border-slate-200 p-2 rounded-xl text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition disabled:bg-slate-300 shadow-sm mt-4"
          >
            {loading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกสินค้าลงระบบ'}
          </button>
        </form>
      </div>

      {/* 🟢 MODAL: บันทึกสินค้าสำเร็จ (สไตล์มินิมอลแบบใหม่) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center border border-slate-100 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold text-slate-900">บันทึกสินค้าสำเร็จ!</h3>
            <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
              เพิ่มสินค้าใหม่เข้าสู่ระบบร้านค้าเรียบร้อยแล้ว
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/admin/products')
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              ไปยังหน้ารายการสินค้าทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  )
}