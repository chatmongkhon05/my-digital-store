import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'ไม่พบ STRIPE_SECRET_KEY ในไฟล์ .env.local' }, { status: 500 })
    }

    const stripe = new Stripe(secretKey)

    const body = await req.json()
    const { items, userId } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'ไม่มีสินค้าในตะกร้า' }, { status: 400 })
    }

    const totalPrice = items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0)

    // 1. บันทึกคำสั่งซื้อลงตาราง orders เพียง 1 รอบ
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          total_amount: totalPrice,
          status: 'paid',
        },
      ])
      .select()
      .single()

    if (orderError || !orderData) {
      console.error('Supabase Order Error:', orderError)
      return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลคำสั่งซื้อได้' }, { status: 500 })
    }

    // 2. บันทึกรายการสินค้าลงตาราง order_items
    const orderItemsData = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id,
      price: item.price,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData)
    if (itemsError) {
      console.error('Supabase Order Items Error:', itemsError)
      return NextResponse.json({ error: 'ไม่สามารถบันทึกรายการสินค้าได้' }, { status: 500 })
    }

    // 3. สร้าง Stripe Checkout Session
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'thb',
        product_data: {
          name: item.title || 'Digital Product',
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Number(item.quantity) || 1,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://my-digital-store-psi.vercel.app'}/my-library?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://my-digital-store-psi.vercel.app'}/cart?canceled=true`,
      metadata: {
        userId: userId || '',
        orderId: orderData.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe API Error:', error)
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ Stripe' }, { status: 500 })
  }
}