import { TYPES } from '../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../sections/flowchart'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'
import type { BulletItem } from '../../sections/bullets'

// ─── Text paragraphs (Section-Text.md: string[]) ─────────────────────────────

export const introParagraphs: string[] = [
  '**Shopee** (ช้อปปี้) เป็นแพลตฟอร์มอีคอมเมิร์ซอันดับ 1 ของไทย ด้วยผู้ใช้งานกว่า 40 ล้านคน และรองรับสินค้ากว่า 100 ล้านรายการ',
  'Shopee สร้างระบบ **E-Commerce Ecosystem** ที่ครบวงจร: ค้นหาสินค้า → เปรียบเทียบ → สั่งซื้อ → ชำระเงิน → รอรับของ → รีวิว ทำให้การช้อปออนไลน์เป็นเรื่องง่าย',
  'บทเรียนนี้จะพาทำความเข้าใจ **Buyer Journey** หรือเส้นทางการช้อปบน Shopee ตั้งแต่เริ่มต้นจนได้รับสินค้า',
]

export const journeyParagraphs: string[] = [
  `## ขั้นตอนการช้อปบน Shopee

1. **Product Discovery (ค้นหาสินค้า)** — ค้นหาผ่าน Search Bar, หมวดหมู่, หรือ Shopee Ads
2. **Product Evaluation (พิจารณา)** — ดูรายละเอียด ราคา รีวิว และเปรียบเทียบผู้ขาย
3. **Add to Cart (ลงตะกร้า)** — เลือกจำนวน สี ขนาด
4. **Checkout (ชำระเงิน)** — เลือกที่อยู่ วิธีส่ง และวิธีชำระ
5. **Fulfillment (จัดส่ง)** — ผู้ขายแพ็กสินค้า Courier จัดส่ง
6. **Delivery & Review (รับของและรีวิว)** — รับพัสดุ ตรวจสอบ ให้คะแนน`,

  `## ระบบชำระเงิน

Shopee Thailand รองรับหลายช่องทาง:

- **ShopeePay** — Digital Wallet ชำระทันที มี Cashback
- **PromptPay** — โอนผ่าน QR Code ของธนาคาร
- **COD (Cash on Delivery)** — เก็บเงินปลายทาง
- **Credit/Debit Card** — Visa, Mastercard
- **SPayLater** — จ่ายทีหลัง 3 เดือน ไม่คิดดอกเบี้ย`,
]

// ─── Flowchart schema (Section-Flowchart.md) ─────────────────────────────────

export const buyerJourneySchema: UnifiedFlowchartSchema = {
  entities: {
    'buyer': {
      title: 'ผู้ซื้อ (Buyer)',
      desc: 'ลูกค้าที่ค้นหา เลือก และสั่งซื้อสินค้าบน Shopee',
      viewTypes: {
        EVENT_STORMING: TYPES.USER,
        SWIMLANES: TYPES.USER,
      },
    },
    'search': {
      title: 'ค้นหาสินค้า (Search)',
      desc: 'Search Bar, หมวดหมู่, Shopee Ads, Recommended',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SWIMLANES: TYPES.PROCESS,
      },
    },
    'product-detail': {
      title: 'หน้ารายละเอียดสินค้า',
      desc: 'รูปภาพ รายละเอียด ราคา รีวิว Variants',
      viewTypes: {
        EVENT_STORMING: TYPES.AGGREGATE,
        SWIMLANES: TYPES.DATA_OBJECT,
      },
    },
    'compare': {
      title: 'เปรียบเทียบสินค้า',
      desc: 'ดูรีวิว เปรียบเทียบราคา ผู้ขายหลายร้าน',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SWIMLANES: TYPES.PROCESS,
      },
    },
    'cart': {
      title: 'ตะกร้า (Shopping Cart)',
      desc: 'รวบรวมสินค้า คำนวณราคารวม Voucher',
      viewTypes: {
        EVENT_STORMING: TYPES.AGGREGATE,
        SWIMLANES: TYPES.PROCESS,
      },
    },
    'checkout': {
      title: 'Checkout',
      desc: 'เลือกที่อยู่จัดส่ง วิธีส่ง วิธีชำระ',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SWIMLANES: TYPES.PROCESS,
      },
    },
    'payment-gateway': {
      title: 'Payment Gateway',
      desc: 'ShopeePay, PromptPay, COD, Card, SPayLater',
      viewTypes: {
        EVENT_STORMING: TYPES.EXTERNAL,
        SWIMLANES: TYPES.EXTERNAL,
      },
    },
    'order-confirmed': {
      title: 'ยืนยันออเดอร์',
      desc: 'ออเดอร์สำเร็จ ผู้ขายเห็นรายการ',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        SWIMLANES: TYPES.DATA_OBJECT,
      },
    },
    'seller-pack': {
      title: 'ผู้ขายแพ็กสินค้า',
      desc: 'พิมพ์ Shipping Label แพ็กของ เตรียมส่ง',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SWIMLANES: TYPES.PROCESS,
      },
    },
    'courier': {
      title: 'Courier / Logistics',
      desc: 'Shopee Express, J&T, Kerry, Flash',
      viewTypes: {
        EVENT_STORMING: TYPES.EXTERNAL,
        SWIMLANES: TYPES.EXTERNAL,
      },
    },
    'tracking': {
      title: 'ติดตามพัสดุ',
      desc: 'Tracking Number อัพเดทสถานะ Real-time',
      viewTypes: {
        EVENT_STORMING: TYPES.DATA_OBJECT,
        SWIMLANES: TYPES.DATA_OBJECT,
      },
    },
    'receive': {
      title: 'รับสินค้า',
      desc: 'ลูกค้ารับพัสดุ ตรวจสอบสินค้า',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SWIMLANES: TYPES.PROCESS,
      },
    },
    'review': {
      title: 'รีวิว (Review & Rating)',
      desc: 'ให้คะแนน 1-5 ดาว เขียนรีวิว อัปโหลดรูป',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SWIMLANES: TYPES.PROCESS,
      },
    },
    'evt_discovered': {
      title: 'พบสินค้าแล้ว',
      desc: 'ระบบแสดงรายการสินค้าที่เกี่ยวข้อง',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_evaluated': {
      title: 'ตัดสินใจเลือก',
      desc: 'ลูกค้าเลือกสินค้าจากผู้ขายที่ต้องการ',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_in_cart': {
      title: 'ลงตะกร้าสำเร็จ',
      desc: 'สินค้าอยู่ในตะกร้า พร้อม Checkout',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_paid': {
      title: 'ชำระเงินสำเร็จ',
      desc: 'เงินเข้าระบบ (ShopeePay/PromptPay) หรือรอ COD',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_shipped': {
      title: 'สินค้าออกเดินทาง',
      desc: 'Courier รับพัสดุ เริ่มจัดส่ง',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_delivered': {
      title: 'ส่งถึงมือ',
      desc: 'พัสดุถึงที่อยู่ลูกค้า',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_reviewed': {
      title: 'รีวิวสำเร็จ',
      desc: 'คะแนนและรีวิวถูกเผยแพร่บนหน้าสินค้า',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'decision_satisfied': {
      title: 'พอใจสินค้า?',
      desc: 'ตรวจสอบคุณภาพ ตรงตามรายละเอียดไหม',
      viewTypes: { EVENT_STORMING: TYPES.DECISION },
    },
    'pol_return': {
      title: 'นโยบายคืนสินค้า',
      desc: 'Shopee Guarantee คืนสินค้าได้ภายใน 7 วัน',
      viewTypes: { EVENT_STORMING: TYPES.POLICY },
    },
  },
  relations: [
    // Event Storming flow
    { id: 'r1', from: 'buyer', to: 'search', views: ['EVENT_STORMING'] },
    { id: 'r2', from: 'search', to: 'evt_discovered', views: ['EVENT_STORMING'] },
    { id: 'r3', from: 'evt_discovered', to: 'product-detail', views: ['EVENT_STORMING'] },
    { id: 'r4', from: 'product-detail', to: 'compare', views: ['EVENT_STORMING'] },
    { id: 'r5', from: 'compare', to: 'evt_evaluated', views: ['EVENT_STORMING'] },
    { id: 'r6', from: 'evt_evaluated', to: 'cart', views: ['EVENT_STORMING'] },
    { id: 'r7', from: 'cart', to: 'evt_in_cart', views: ['EVENT_STORMING'] },
    { id: 'r8', from: 'evt_in_cart', to: 'checkout', views: ['EVENT_STORMING'] },
    { id: 'r9', from: 'checkout', to: 'payment-gateway', views: ['EVENT_STORMING'] },
    { id: 'r10', from: 'payment-gateway', to: 'evt_paid', views: ['EVENT_STORMING'] },
    { id: 'r11', from: 'evt_paid', to: 'order-confirmed', views: ['EVENT_STORMING'] },
    { id: 'r12', from: 'order-confirmed', to: 'seller-pack', views: ['EVENT_STORMING'] },
    { id: 'r13', from: 'seller-pack', to: 'evt_shipped', views: ['EVENT_STORMING'] },
    { id: 'r14', from: 'evt_shipped', to: 'courier', views: ['EVENT_STORMING'] },
    { id: 'r15', from: 'courier', to: 'tracking', views: ['EVENT_STORMING'] },
    { id: 'r16', from: 'tracking', to: 'evt_delivered', views: ['EVENT_STORMING'] },
    { id: 'r17', from: 'evt_delivered', to: 'receive', views: ['EVENT_STORMING'] },
    { id: 'r18', from: 'receive', to: 'decision_satisfied', views: ['EVENT_STORMING'] },
    { id: 'r19', from: 'decision_satisfied', to: 'review', views: ['EVENT_STORMING'] },
    { id: 'r20', from: 'review', to: 'evt_reviewed', views: ['EVENT_STORMING'] },
    { id: 'r21', from: 'decision_satisfied', to: 'pol_return', views: ['EVENT_STORMING'] },
    // Swimlanes flow
    { id: 's1', from: 'buyer', to: 'search', views: ['SWIMLANES'] },
    { id: 's2', from: 'search', to: 'product-detail', views: ['SWIMLANES'] },
    { id: 's3', from: 'product-detail', to: 'compare', views: ['SWIMLANES'] },
    { id: 's4', from: 'compare', to: 'cart', views: ['SWIMLANES'] },
    { id: 's5', from: 'cart', to: 'checkout', views: ['SWIMLANES'] },
    { id: 's6', from: 'checkout', to: 'payment-gateway', views: ['SWIMLANES'] },
    { id: 's7', from: 'payment-gateway', to: 'order-confirmed', views: ['SWIMLANES'] },
    { id: 's8', from: 'order-confirmed', to: 'seller-pack', views: ['SWIMLANES'] },
    { id: 's9', from: 'seller-pack', to: 'courier', views: ['SWIMLANES'] },
    { id: 's10', from: 'courier', to: 'tracking', views: ['SWIMLANES'] },
    { id: 's11', from: 'tracking', to: 'receive', views: ['SWIMLANES'] },
    { id: 's12', from: 'receive', to: 'review', views: ['SWIMLANES'] },
  ],
  views: {
    EVENT_STORMING: {
      name: 'เส้นทางการช้อป',
      icon: 'Component',
      nodes: [
        { id: 'buyer', x: 60, y: 250 },
        { id: 'search', x: 180, y: 180 },
        { id: 'evt_discovered', x: 320, y: 250 },
        { id: 'product-detail', x: 460, y: 250 },
        { id: 'compare', x: 600, y: 180 },
        { id: 'evt_evaluated', x: 740, y: 250 },
        { id: 'cart', x: 880, y: 250 },
        { id: 'evt_in_cart', x: 1020, y: 250 },
        { id: 'checkout', x: 1160, y: 250 },
        { id: 'payment-gateway', x: 1300, y: 180 },
        { id: 'evt_paid', x: 1440, y: 250 },
        { id: 'order-confirmed', x: 1580, y: 250 },
        { id: 'seller-pack', x: 1720, y: 250 },
        { id: 'evt_shipped', x: 1860, y: 250 },
        { id: 'courier', x: 2000, y: 250 },
        { id: 'tracking', x: 2000, y: 140 },
        { id: 'evt_delivered', x: 2140, y: 250 },
        { id: 'receive', x: 2280, y: 250 },
        { id: 'decision_satisfied', x: 2420, y: 250 },
        { id: 'review', x: 2560, y: 180 },
        { id: 'evt_reviewed', x: 2700, y: 180 },
        { id: 'pol_return', x: 2560, y: 320 },
      ],
      groups: [
        {
          id: 'g1',
          title: 'ค้นหาและเลือก',
          desc: 'ค้นหาสินค้า ดูรายละเอียด เปรียบเทียบ และลงตะกร้า',
          nodeIds: ['buyer', 'search', 'evt_discovered', 'product-detail', 'compare', 'evt_evaluated', 'cart', 'evt_in_cart'],
          color: 'rgba(96, 165, 250, 0.08)',
          borderColor: '#93c5fd',
          textColor: '#1e40af',
        },
        {
          id: 'g2',
          title: 'Checkout และชำระเงิน',
          desc: 'สั่งซื้อและชำระผ่าน Payment Gateway',
          nodeIds: ['checkout', 'payment-gateway', 'evt_paid', 'order-confirmed'],
          color: 'rgba(244, 114, 182, 0.08)',
          borderColor: '#f9a8d4',
          textColor: '#9d174d',
        },
        {
          id: 'g3',
          title: 'การจัดส่ง',
          desc: 'ผู้ขายแพ็กสินค้า Courier จัดส่ง ติดตามพัสดุ',
          nodeIds: ['seller-pack', 'evt_shipped', 'courier', 'tracking', 'evt_delivered'],
          color: 'rgba(250, 204, 21, 0.08)',
          borderColor: '#fde047',
          textColor: '#854d0e',
        },
        {
          id: 'g4',
          title: 'รับสินค้าและรีวิว',
          desc: 'ตรวจสอบสินค้า ให้คะแนน หรือคืนสินค้า',
          nodeIds: ['receive', 'decision_satisfied', 'review', 'evt_reviewed', 'pol_return'],
          color: 'rgba(52, 211, 153, 0.08)',
          borderColor: '#6ee7b7',
          textColor: '#065f46',
        },
      ],
    },
    SWIMLANES: {
      name: 'Swimlanes (บทบาท)',
      icon: 'Layers',
      nodes: [
        { id: 'buyer', x: 100, y: 80 },
        { id: 'search', x: 260, y: 80 },
        { id: 'product-detail', x: 420, y: 80 },
        { id: 'compare', x: 580, y: 80 },
        { id: 'cart', x: 740, y: 80 },
        { id: 'checkout', x: 900, y: 80 },
        { id: 'payment-gateway', x: 500, y: 250 },
        { id: 'order-confirmed', x: 700, y: 250 },
        { id: 'seller-pack', x: 900, y: 250 },
        { id: 'courier', x: 1100, y: 250 },
        { id: 'tracking', x: 1100, y: 170 },
        { id: 'receive', x: 900, y: 80 },
        { id: 'review', x: 1100, y: 80 },
      ],
      groups: [
        {
          id: 'lane-buyer',
          isLane: true,
          title: 'ผู้ซื้อ (Buyer)',
          desc: 'ค้นหา เปรียบเทียบ สั่งซื้อ รับสินค้า รีวิว',
          y: 30,
          h: 120,
          color: '#fef08a',
        },
        {
          id: 'lane-platform',
          isLane: true,
          title: 'Shopee Platform',
          desc: 'Payment Gateway ออเดอร์ และระบบติดตาม',
          y: 150,
          h: 160,
          color: '#bae6fd',
        },
        {
          id: 'lane-seller',
          isLane: true,
          title: 'ผู้ขาย + Courier',
          desc: 'แพ็กสินค้า จัดส่ง',
          y: 230,
          h: 120,
          color: '#cbd5e1',
        },
      ],
    },
  },
  journeys: [
    {
      id: 'happy-path',
      label: 'เส้นทางการช้อป (Happy Path)',
      description: 'ตามขั้นตอนตั้งแต่ผู้ซื้อค้นหาสินค้าจนรีวิว',
      steps: [
        { nodeId: 'buyer', description: 'ผู้ซื้อเปิด Shopee App หรือ Website' },
        { nodeId: 'search', description: 'พิมพ์คำค้นหา หรือเลือกหมวดหมู่' },
        { nodeId: 'evt_discovered', description: 'ระบบแสดงรายการสินค้าที่เกี่ยวข้อง' },
        { nodeId: 'product-detail', description: 'เข้าดูหน้าสินค้า: รูปภาพ รายละเอียด ราคา' },
        { nodeId: 'compare', description: 'เปรียบเทียบผู้ขาย ดูรีวิว ดูคะแนนร้าน' },
        { nodeId: 'evt_evaluated', description: 'ตัดสินใจเลือกสินค้าและผู้ขาย' },
        { nodeId: 'cart', description: 'เพิ่มลงตะกร้า เลือกจำนวน สี ขนาด' },
        { nodeId: 'evt_in_cart', description: 'สินค้าพร้อม Checkout' },
        { nodeId: 'checkout', description: 'เลือกที่อยู่จัดส่ง วิธีส่ง และวิธีชำระ' },
        { nodeId: 'payment-gateway', description: 'ชำระผ่าน ShopeePay, PromptPay, COD หรือ Card' },
        { nodeId: 'evt_paid', description: 'ชำระเงินสำเร็จ' },
        { nodeId: 'order-confirmed', description: 'ผู้ขายเห็นออเดอร์ พร้อมแพ็กสินค้า' },
        { nodeId: 'seller-pack', description: 'ผู้ขายพิมพ์ Label แพ็กของ เรียก Courier' },
        { nodeId: 'evt_shipped', description: 'Courier รับพัสดุ สินค้าเริ่มเดินทาง' },
        { nodeId: 'courier', description: 'ขนส่งผ่าน Shopee Express, J&T หรือ Kerry' },
        { nodeId: 'tracking', description: 'ผู้ซื้อติดตามพัสดุผ่าน Tracking Number' },
        { nodeId: 'evt_delivered', description: 'พัสดุถึงที่อยู่' },
        { nodeId: 'receive', description: 'ผู้ซื้อรับพัสดุ ตรวจสอบสินค้า' },
        { nodeId: 'decision_satisfied', description: 'พอใจ → ให้รีวิว / ไม่พอใจ → คืนสินค้า' },
        { nodeId: 'review', description: 'ให้คะแนน 1-5 ดาว เขียนรีวิว อัปโหลดรูป' },
        { nodeId: 'evt_reviewed', description: 'รีวิวเผยแพร่ ช่วยผู้ซื้อคนอื่นตัดสินใจ' },
      ],
    },
  ],
}

// ─── Tradeoff: Payment methods (Section-TradeoffSandbox.md) ──────────────────

export const paymentScenarios: TradeoffScenario[] = [
  {
    id: 'thai-payment',
    title: 'เลือกวิธีชำระเงินบน Shopee',
    description: 'เปรียบเทียบช่องทางชำระเงินยอดนิยมในไทย แต่ละวิธีมีข้อดีต่างกัน',
    metrics: [
      { id: 'speed', label: 'ความรวดเร็ว', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'benefits', label: 'สิทธิประโยชน์', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'ease', label: 'ความง่าย', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'trust', label: 'ความมั่นใจ', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    ],
    steps: [
      {
        id: 'payment-choice',
        title: 'ช่องทางชำระเงิน',
        description: 'เลือกวิธีที่ตรงกับความสะดวกของคุณ',
        recommended: 'shopeepay',
        choices: [
          {
            id: 'shopeepay',
            label: 'ShopeePay',
            description: 'Digital Wallet ของ Shopee เติมเงินผ่านธนาคาร แล้วชำระทันที',
            metrics: { speed: 15, benefits: 20, ease: 10, trust: 5 },
            pros: [
              { title: 'ชำระทันที', description: 'ไม่ต้องรอโอนเงินออเดอร์ล็อคทันที' },
              { title: 'Cashback & Voucher', description: 'ได้ส่วนลดพิเศษที่ช่องทางอื่นไม่มี' },
              { title: 'SPayLater', description: 'จ่ายทีหลัง 3 เดือน ไม่คิดดอกเบี้ย' },
            ],
            cons: [
              { title: 'ต้องเติมเงิน', description: 'ต้องมี Balance ใน Wallet ก่อนใช้' },
            ],
            whyThisFits: 'ShopeePay ให้ประสบการณ์ที่เร็วที่สุดภายในแพลตฟอร์ม พร้อม Cashback และ Voucher ที่ช่วยลดราคาได้มาก',
          },
          {
            id: 'promptpay',
            label: 'PromptPay',
            description: 'สแกน QR Code โอนผ่าน Mobile Banking ของธนาคาร',
            metrics: { speed: 0, benefits: -5, ease: 5, trust: 15 },
            pros: [
              { title: 'ใช้เงินจากบัญชีธนาคาร', description: 'ไม่ต้องเติมเงินเพิ่ม' },
              { title: 'ปลอดภัย', description: 'ระบบมาตรฐานธนาคารแห่งประเทศไทย' },
              { title: 'ไม่มีค่าธรรมเนียม', description: 'ไม่ถูกหักค่าใช้จ่าย' },
            ],
            cons: [
              { title: 'ต้องโอนเอง', description: 'ต้องสแกน QR แล้วโอนผ่าน App ธนาคาร' },
              { title: 'ไม่มี Cashback', description: 'ไม่ได้ส่วนลดพิเศษ' },
            ],
            whenToUse: 'เหมาะกับผู้ที่ไม่ต้องการเติมเงินใน Wallet และไว้วางใจระบบธนาคาร',
          },
          {
            id: 'cod',
            label: 'COD (เก็บเงินปลายทาง)',
            description: 'ชำระตอนรับสินค้า ไม่ต้องจ่ายล่วงหน้า',
            metrics: { speed: -15, benefits: -10, ease: 15, trust: 10 },
            pros: [
              { title: 'ไม่ต้องจ่ายล่วงหน้า', description: 'จ่ายตอนรับของ ไม่ต้องกังวลเรื่องเงินหาย' },
              { title: 'คนส่วนมากยังชอบ', description: 'ประมาณ 40% ของออเดอร์ในไทยใช้ COD' },
            ],
            cons: [
              { title: 'ค่าส่งแพงขึ้น', description: 'ผู้ขายมักบวก 10-20 บาทสำหรับ COD' },
              { title: 'ต้องเตรียมเงินสด', description: 'ต้องมีเงินพอดีตอนรับพัสดุ' },
            ],
            whenToUse: 'เหมาะกับการซื้อครั้งแรกที่ยังไม่ไว้วางใจการชำระออนไลน์',
          },
        ],
      },
    ],
  },
]

// ─── Bullets: Key takeaways (Section-Bullets.md) ─────────────────────────────

export const takeawayBullets: BulletItem[] = [
  {
    text: 'ขั้นตอนการช้อปบน Shopee',
    children: [
      { text: 'ค้นหา → ดูรายละเอียด → เปรียบเทียบ → ลงตะกร้า → Checkout → ชำระเงิน', checkable: true },
      { text: 'ผู้ขายแพ็ก → Courier จัดส่ง → ติดตามพัสดุ → รับของ → รีวิว', checkable: true },
    ],
  },
  {
    text: 'เคล็ดลับการช้อปให้ได้ของดี',
    children: [
      { text: 'ใช้ ShopeePay ได้ Cashback และ Voucher พิเศษ' },
      { text: 'ดูรีวิวที่มีรูปภาพก่อนตัดสินใจซื้อ' },
      { text: 'เปรียบเทียบราคาผู้ขายหลายร้าน' },
      { text: 'ติดตาม Flash Sale วันศุกร์-เสาร์ เวลา 0:00 และ 20:00' },
    ],
  },
  {
    text: 'ความปลอดภัย',
    children: [
      { text: 'Shopee Guarantee คุ้มครองเงินคืนหากไม่ได้รับสินค้า' },
      { text: 'คืนสินค้าได้ภายใน 7 วัน หากสินค้าไม่ตรงตามรายละเอียด' },
    ],
  },
]
