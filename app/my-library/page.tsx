'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface PurchasedProduct {
  id: string
  title: string
  description: string
  image_url: string
  file_url: string
}

export default function MyLibraryPage() {
  const [products, setProducts] = useState<PurchasedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // เคลียร์ตะกร้าสินค้าทิ้งเมื่อชำระเงินสำเร็จ
    localStorage.removeItem('cart')
    fetchMyLibrary()
  }, [])

  const fetchMyLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_items (
            products (
              id,
              title,
              description,
              image_url,
              file_url
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'paid')

      if (orderError) throw orderError

      const purchased: PurchasedProduct[] = []
      orders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          if (item.products && !purchased.some((p) => p.id === item.products.id)) {
            purchased.push(item.products)
          }
        })
      })

      setProducts(purchased)
    } catch (error) {
      console.error('Error fetching library products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileUrl: string, productId: string) => {
    try {
      setDownloadingId(productId)
      const { data, error } = await supabase.storage
        .from('digital-files')
        .createSignedUrl(fileUrl, 60)

      if (error) throw error
      if (data?.signedUrl) {
        // ใช้ window.location.href เพื่อให้ WebView ใน MIT App Inventor ดักจับ URL ที่มีคำว่า storage ได้
        window.location.href = data.signedUrl
      }
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาดในการดาวน์โหลด: ${error.message}`)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          
          <div className="flex justify-between items-center mb-8 pb-5 border-b border-slate-100">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">คลังสินค้าของฉัน</h1>
              <p className="text-slate-500 text-xs mt-1">ดาวน์โหลดไฟล์ดิจิทัลที่คุณสั่งซื้อเรียบร้อยแล้วได้ทันที</p>
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition border border-slate-200/80 shadow-sm"
            >
              <span>←</span>
              <span>กลับหน้าหลักร้านค้า</span>
            </a>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลคลังสินค้า...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-sm font-medium mb-4">คุณยังไม่มีรายการสินค้าดิจิทัลในคลัง</p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-sm"
              >
                ไปเลือกซื้อสินค้า
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 flex items-center gap-4 hover:bg-white hover:shadow-md transition duration-200"
                >
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-xl border border-slate-200/80 shadow-sm shrink-0"
                  />
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{product.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(product.file_url, product.id)}
                      disabled={downloadingId === product.id}
                      className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm disabled:bg-slate-300 self-start flex items-center gap-1.5"
                    >
                      <span>⬇️</span>
                      <span>{downloadingId === product.id ? 'กำลังเตรียมไฟล์...' : 'ดาวน์โหลดไฟล์'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}