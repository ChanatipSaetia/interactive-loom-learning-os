import { TYPES } from '../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../sections/flowchart'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'
import type { TaxonomyCategory } from '../../sections/taxonomy-browser'
import type { BulletItem } from '../../sections/bullets'
import type { ComponentType } from 'react'
import { ShoppingCart, Truck, CreditCard, Megaphone } from 'lucide-react'

export const introParagraphs: string[] = [
  'การขายของออนไลน์ไม่ใช่แค่การตั้งร้านในแพลตฟอร์ม แต่เป็นการสร้าง **ระบบธุรกิจดิจิทัล** ที่เชื่อมโยงระหว่างสินค้า การตลาด การชำระเงิน และการจัดส่งเข้าด้วยกัน',
  'สำหรับผู้ขายระดับ Intermediate ที่พร้อมขยายผล สำคัญต้องเข้าใจ **โครงสร้างระบบ** ตั้งแต่ต้นน้ำจนปลายน้ำ และรู้จักเลือกเครื่องมือที่เหมาะสมกับสินค้าและกลุ่มลูกค้า',
  'บทเรียนนี้จะพาออกแบบระบบขายของออนไลน์แบบครบวงจร: เลือกแพลตฟอร์ม วางแผนโลจิสติกส์ จัดการเงินการ และสร้างแบรนด์ให้เติบโตอย่างยั่งยืน',
]

export const ecosystemParagraphs: string[] = [
  `## องค์ประกอบระบบขายของออนไลน์

1. **Seller (ผู้ขาย)** — ผู้จัดการสินค้า ราคา โปรโมชั่น และบริการลูกค้า
2. **Platform (แพลตฟอร์ม)** — ช่องทางขาย เช่น Shopee, Lazada, TikTok Shop, Line Mall
3. **Payment Gateway (ระบบชำระเงิน)** — โอนเงิน, COD, e-Wallet, TrueMoney
4. **Logistics (การจัดส่ง)** — Kerry, Flash, JNE, Local Delivery, Pick-up Point
5. **Customer (ลูกค้า)** — ผู้สั่งซื้อ ติดตามสถานะ และรีวิวสินค้า`,

  `## แนวคิดสำคัญ

- **Platform Diversification** — อย่าพึ่งแพลตฟอร์มเดียว ควรกระจายความเสี่ยง
- **Data-Driven Decisions** — ใช้ข้อมูลยอดขาย รีวิว และพฤติกรรมลูกค้าในการตัดสินใจ
- **Customer Lifetime Value** — การรักษาลูกค้าเก่าคุ้มกว่าหาลูกค้าใหม่ 5 เท่า`,
]

export const platformComparisonScenarios: TradeoffScenario[] = [
  {
    id: 'platform-choice',
    title: 'เลือกแพลตฟอร์มขาย',
    description: 'เปรียบเทียบแพลตฟอร์มอีคอมเมิร์ซหลักในไทย แต่ละแพลตฟอร์มมีกลุ่มลูกค้าและฟีเจอร์ต่างกัน',
    metrics: [
      { id: 'reach', label: 'กลุ่มลูกค้า', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'conversion', label: 'อัตราการปิดการขาย', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'cost', label: 'ต้นทุนดำเนินการ', baseValue: 50, min: 0, max: 100, direction: 'lower' },
      { id: 'branding', label: 'การสร้างแบรนด์', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    ],
    steps: [
      {
        id: 'main-platform',
        title: 'แพลตฟอร์มหลัก',
        description: 'เลือกแพลตฟอร์มที่จะเป็นช่องทางขายหลัก',
        recommended: 'shopee',
        choices: [
          {
            id: 'shopee',
            label: 'Shopee',
            description: 'แพลตฟอร์มอีคอมเมิร์ซอันดับ 1 ของไทย มีฟีเจอร์ครบครันและผู้ใช้มากที่สุด',
            metrics: { reach: 25, conversion: 15, cost: -5, branding: 5 },
            pros: [
              { title: 'ผู้ใช้มากที่สุด', description: 'ผู้ใช้งาน 75 ล้าน+ ในอาเซียน โอกาสพบลูกค้าสูงที่สุด' },
              { title: 'ฟีเจอร์ครบ', description: 'Shopee Live, Shopee Ads, Flash Sale, Voucher ระบบครบวงจร' },
              { title: 'Shopee Logistics', description: 'มีระบบจัดส่งในตัว ลดความยุ่งยาก' },
            ],
            cons: [
              { title: 'การแข่งขันสูง', description: 'ผู้ขายมาก ต้องลงโฆษณาเพื่อให้สินค้าติดหน้าแรก' },
              { title: 'ค่าคอมมิชชั่นขึ้น', description: 'ค่าคอมมิชชั่นและค่าโฆษณาเพิ่มขึ้นทุกปี' },
            ],
            whyThisFits: 'Shopee มีกลุ่มลูกค้ากว้างที่สุดและระบบครบวงจร เหมาะสำหรับผู้ขายที่ต้องการเข้าถึงลูกค้าจำนวนมากโดยไม่ต้องลงทุนสร้างระบบเอง',
          },
          {
            id: 'tiktok-shop',
            label: 'TikTok Shop',
            description: 'แพลตฟอร์ม Social Commerce ที่ผสาน短视频และการขายสินค้าเข้าด้วยกัน',
            metrics: { reach: 20, conversion: 20, cost: 5, branding: 15 },
            pros: [
              { title: 'Viral Potential', description: 'สินค้าสามารถไวรัลได้ผ่าน短视频และ Live' },
              { title: 'Gen Z Reach', description: 'เข้าถึงกลุ่มลูกค้า Gen Z และ Millennials ได้ดีที่สุด' },
              { title: 'Content-Driven', description: 'สร้างเนื้อหาขายสินค้าได้โดยตรง ไม่ต้องพึ่ง Ads เพียงอย่างเดียว' },
            ],
            cons: [
              { title: 'ต้องสร้างคอนเทนต์', description: 'ต้องลงทุนเวลาสร้าง短视频และ Live  regularly' },
              { title: 'นโยบายเปลี่ยนบ่อย', description: 'กฎระเบียบแพลตฟอร์มยังปรับเปลี่ยนแปลงตลอดเวลา' },
            ],
            whenToUse: 'เหมาะสำหรับสินค้าที่สาธิตได้ดีผ่านวิดีโอ เช่น เสื้อผ้า อาหาร ของใช้ในชีวิตประจำวัน หรือสินค้าที่ต้องการสร้างแบรนด์ผ่านคอนเทนต์',
          },
          {
            id: 'lazada',
            label: 'Lazada',
            description: 'แพลตฟอร์มอีคอมเมิร์ซของ Alibaba มีความน่าเชื่อถือสูงและกลุ่มลูกค้าที่หลากหลาย',
            metrics: { reach: 10, conversion: 5, cost: -10, branding: 0 },
            pros: [
              { title: 'Lazada Logistics', description: 'ระบบโลจิสติกส์ของ Lazada มั่นคง' },
              { title: 'Alibaba Ecosystem', description: 'เชื่อมโยงกับ Alibaba สำหรับนำเข้าสินค้า' },
              { title: 'Lazada Mall', description: 'ความน่าเชื่อถือของ Mall badge ช่วยปิดการขาย' },
            ],
            cons: [
              { title: 'ผู้ใช้ลดลง', description: 'จำนวนผู้ใช้งานน้อยกว่า Shopee' },
              { title: 'การแข่งขันจาก Shopee', description: 'ส่วนแบ่งตลาดถูก Shopee ดึงไปมาก' },
            ],
            whenToUse: 'เหมาะสำหรับสินค้าประเภทอิเล็กทรอนิกส์ แบรนด์สินค้าที่มีชื่อแล้ว หรือผู้ที่ต้องการกระจายความเสี่ยงไม่พึ่งแพลตฟอร์มเดียว',
          },
        ],
      },
      {
        id: 'shipping-strategy',
        title: 'กลยุทธ์การจัดส่ง',
        description: 'เลือกวิธีการจัดส่งที่เหมาะสมกับสินค้าและพื้นที่',
        recommended: 'hybrid-logistics',
        choices: [
          {
            id: 'standard-courier',
            label: 'Courier มาตรฐาน (Kerry/Flash/JNE)',
            description: 'ใช้บริการบริษัทขนส่งมาตรฐาน ครอบคลุมทุกจังหวัด',
            metrics: { reach: 10, conversion: 0, cost: 10, branding: -5 },
            pros: [
              { title: 'ครอบคลุมทั่วประเทศ', description: 'ส่งได้ทุกพื้นที่ ไม่มีข้อจำกัด' },
              { title: 'ราคาชัดเจน', description: 'คิดตามน้ำหนัก มีตารางราคาชัดเจน' },
              { title: 'ติดตามได้', description: 'มี Tracking number ให้ลูกค้าติดตามได้' },
            ],
            cons: [
              { title: 'ระยะเวลาส่งนาน', description: 'ต่างจังหวัดอาจใช้เวลา 2-4 วัน' },
              { title: 'ต้นทุนต่อชิ้นสูง', description: 'ค่าส่งชิ้นละ 40-60 บาท ทำให้สินค้าถูกไม่คุ้ม' },
            ],
            whenToUse: 'เหมาะสำหรับสินค้าที่มีลูกค้าทั่วประเทศและไม่มีโกดังหลายจุด',
          },
          {
            id: 'hybrid-logistics',
            label: 'Hybrid Logistics (หลายช่องทาง)',
            description: 'ผสมผสานหลายวิธี: Courier สำหรับต่างจังหวัด, Local Delivery สำหรับ กทม./ปริมณฑล, Pick-up Point สำหรับสินค้าหนัก',
            metrics: { reach: 15, conversion: 10, cost: -5, branding: 5 },
            pros: [
              { title: 'ยืดหยุ่น', description: 'เลือกวิธีส่งที่เหมาะสมกับแต่ละออเดอร์' },
              { title: 'ลดต้นทุน', description: 'Local Delivery ใน กทม. ถูกกว่า Courier 30%' },
              { title: 'ลูกค้าเลือกได้', description: 'เพิ่ม Conversion เพราะลูกค้ามีตัวเลือก' },
            ],
            cons: [
              { title: 'จัดการ сложнее', description: 'ต้องจัดการหลายบริษัทขนส่ง' },
              { title: 'ระบบต้องรองรับ', description: 'ต้องมีระบบคำนวณค่าส่งอัตโนมัติ' },
            ],
            whyThisFits: 'ผู้ขายระดับ Intermediate ควรใช้ Hybrid Logistics เพื่อลดต้นทุนและเพิ่มประสบการณ์ลูกค้า โดยเลือกวิธีส่งที่เหมาะสมกับแต่ละออเดอร์',
          },
        ],
      },
      {
        id: 'payment-method',
        title: 'ระบบชำระเงิน',
        description: 'เลือกวิธีการชำระเงินที่เพิ่มอัตราการปิดการขาย',
        recommended: 'multi-payment',
        choices: [
          {
            id: 'cod-only',
            label: 'COD (เก็บเงินปลายทาง) เท่านั้น',
            description: 'ให้ลูกค้าชำระตอนรับสินค้า',
            metrics: { reach: 5, conversion: 15, cost: 15, branding: -10 },
            pros: [
              { title: 'เพิ่ม Conversion สูง', description: 'คนไทยยังชอบ COD ประมาณ 40% ของออเดอร์ทั้งหมด' },
              { title: 'ไม่ต้องกังวล Payment Gate', description: 'ไม่ต้องตั้งระบบชำระเงินออนไลน์' },
            ],
            cons: [
              { title: 'RTO สูง', description: 'ลูกค้าปฏิเสธรับสินค้า ทำให้เสียค่าส่ง 2 ครั้ง' },
              { title: '现金流ช้า', description: 'ได้เงินช้า 7-14 วันหลังส่งสินค้า' },
            ],
            whenToUse: 'เหมาะสำหรับผู้เริ่มขายที่ยังไม่มีระบบชำระเงินออนไลน์ และกลุ่มลูกค้าที่ไม่คุ้นเคยกับการจ่ายออนไลน์',
          },
          {
            id: 'multi-payment',
            label: 'Multi-Payment (หลายช่องทาง)',
            description: 'เปิดรับหลายวิธี: โอนเงิน, e-Wallet, COD, Credit Card, Installment',
            metrics: { reach: 15, conversion: 20, cost: 0, branding: 10 },
            pros: [
              { title: 'Conversion สูงสุด', description: 'ลูกค้าเลือกวิธีที่สะดวกที่สุด ปิดการขายได้ดี' },
              { title: 'ลด RTO', description: 'ลูกค้าที่จ่ายล่วงหน้าจะไม่ปฏิเสธรับสินค้า' },
              { title: '现金流ดี', description: 'เงินเข้าทันทีสำหรับ Online Payment' },
            ],
            cons: [
              { title: 'ตั้งค่าซับซ้อน', description: 'ต้องเชื่อมหลายระบบชำระเงิน' },
              { title: 'ค่า Transaction', description: 'แต่ละช่องทางมีค่าธรรมเนียมต่างกัน' },
            ],
            whyThisFits: 'Multi-Payment เป็นมาตรฐานสำหรับผู้ขายระดับ Intermediate ที่ต้องการปิดการขายให้ได้มากที่สุดและลดปัญหา RTO',
          },
        ],
      },
    ],
  },
]

export const sellingJourneySchema: UnifiedFlowchartSchema = {
  entities: {
    'seller': {
      title: 'ผู้ขาย (Seller)',
      desc: 'ผู้จัดการร้าน อัพเดทสินค้า จัดการออเดอร์',
      viewTypes: {
        SYS_ARCH: TYPES.USER,
        EVENT_STORMING: TYPES.USER,
      },
    },
    'product-listing': {
      title: 'จัดการสินค้า',
      desc: 'อัพโหลดรูป เขียนรายละเอียด ตั้งราคา จัดหมวดหมู่',
      viewTypes: {
        SYS_ARCH: TYPES.SERVICE,
        EVENT_STORMING: TYPES.COMMAND,
      },
    },
    'marketing': {
      title: 'การตลาด',
      desc: 'Shopee Ads, Live, Content Marketing, Affiliate',
      viewTypes: {
        SYS_ARCH: TYPES.SERVICE,
        EVENT_STORMING: TYPES.COMMAND,
      },
    },
    'platform': {
      title: 'แพลตฟอร์ม',
      desc: 'Shopee, Lazada, TikTok Shop, Line Mall',
      viewTypes: {
        SYS_ARCH: TYPES.EXTERNAL,
        EVENT_STORMING: TYPES.AGGREGATE,
      },
    },
    'customer': {
      title: 'ลูกค้า',
      desc: 'ค้นหาสินค้า เปรียบเทียบ สั่งซื้อ รับสินค้า',
      viewTypes: {
        SYS_ARCH: TYPES.USER,
        EVENT_STORMING: TYPES.USER,
      },
    },
    'order': {
      title: 'ออเดอร์',
      desc: 'ข้อมูลการสั่งซื้อ สถานะการชำระเงิน',
      viewTypes: {
        SYS_ARCH: TYPES.DATA_OBJECT,
        EVENT_STORMING: TYPES.EVENT,
      },
    },
    'payment': {
      title: 'ระบบชำระเงิน',
      desc: 'COD, โอนเงิน, e-Wallet, TrueMoney, Credit Card',
      viewTypes: {
        SYS_ARCH: TYPES.SERVICE,
        EVENT_STORMING: TYPES.COMMAND,
      },
    },
    'warehouse': {
      title: 'คลังสินค้า',
      desc: 'สต็อกสินค้า แพ็กสินค้า จัดการ Inventory',
      viewTypes: {
        SYS_ARCH: TYPES.DATABASE,
        EVENT_STORMING: TYPES.AGGREGATE,
      },
    },
    'logistics': {
      title: 'การจัดส่ง',
      desc: 'Kerry, Flash, JNE, Local Delivery, Pick-up Point',
      viewTypes: {
        SYS_ARCH: TYPES.SERVICE,
        EVENT_STORMING: TYPES.COMMAND,
      },
    },
    'tracking': {
      title: 'ติดตามพัสดุ',
      desc: 'Tracking number อัพเดทสถานะให้ลูกค้า',
      viewTypes: {
        SYS_ARCH: TYPES.DATA_OBJECT,
        EVENT_STORMING: TYPES.EVENT,
      },
    },
    'review': {
      title: 'รีวิว/คะแนน',
      desc: 'ลูกค้าให้คะแนน เขียนรีวิว สินค้าติดอันดับดีขึ้น',
      viewTypes: {
        SYS_ARCH: TYPES.DATA_OBJECT,
        EVENT_STORMING: TYPES.EVENT,
      },
    },
    'evt_browse': {
      title: 'ลูกค้าเข้าดูสินค้า',
      desc: 'ค้นหาหรือเห็นจากโฆษณา/คอนเทนต์',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_purchase': {
      title: 'ลูกค้ากดสั่งซื้อ',
      desc: 'เพิ่มลงตะกร้า เลือกวิธีส่ง เลือกวิธีชำระ',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_payment': {
      title: 'ชำระแล้ว',
      desc: 'เงินเข้าระบบ (หรือรอ COD)',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_ship': {
      title: 'แพ็กและส่งสินค้า',
      desc: 'พิมพ์ label แพ็กของ เรียก Courier',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_deliver': {
      title: 'ลูกค้ารับสินค้า',
      desc: 'รับของ ตรวจสอบสินค้า',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'evt_review': {
      title: 'รีวิวสินค้า',
      desc: 'ให้คะแนน เขียนรีวิว อัปโหลดรูป',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'pol_return': {
      title: 'นโยบายคืนสินค้า',
      desc: 'ถ้าลูกค้าไม่พอใจ สามารถคืนสินค้าได้ภายใน 7 วัน',
      viewTypes: { EVENT_STORMING: TYPES.POLICY },
    },
    'analytics': {
      title: 'Data Analytics',
      desc: 'ยอดขาย, Conversion Rate, ROI, Customer Behavior',
      viewTypes: {
        SYS_ARCH: TYPES.DATABASE,
      },
    },
  },
  relations: [
    { id: 'r_sa_1', from: 'seller', to: 'product-listing', views: ['SYS_ARCH'] },
    { id: 'r_sa_2', from: 'seller', to: 'marketing', views: ['SYS_ARCH'] },
    { id: 'r_sa_3', from: 'product-listing', to: 'platform', views: ['SYS_ARCH'] },
    { id: 'r_sa_4', from: 'marketing', to: 'platform', views: ['SYS_ARCH'] },
    { id: 'r_sa_5', from: 'platform', to: 'customer', views: ['SYS_ARCH'] },
    { id: 'r_sa_6', from: 'customer', to: 'order', views: ['SYS_ARCH'] },
    { id: 'r_sa_7', from: 'order', to: 'payment', views: ['SYS_ARCH'] },
    { id: 'r_sa_8', from: 'seller', to: 'warehouse', views: ['SYS_ARCH'] },
    { id: 'r_sa_9', from: 'warehouse', to: 'logistics', views: ['SYS_ARCH'] },
    { id: 'r_sa_10', from: 'logistics', to: 'tracking', views: ['SYS_ARCH'] },
    { id: 'r_sa_11', from: 'tracking', to: 'customer', views: ['SYS_ARCH'] },
    { id: 'r_sa_12', from: 'customer', to: 'review', views: ['SYS_ARCH'] },
    { id: 'r_sa_13', from: 'review', to: 'platform', views: ['SYS_ARCH'] },
    { id: 'r_sa_14', from: 'platform', to: 'analytics', views: ['SYS_ARCH'] },
    { id: 'r_sa_15', from: 'analytics', to: 'seller', views: ['SYS_ARCH'] },

    { id: 'r_es_1', from: 'seller', to: 'product-listing', views: ['EVENT_STORMING'] },
    { id: 'r_es_2', from: 'product-listing', to: 'marketing', views: ['EVENT_STORMING'] },
    { id: 'r_es_3', from: 'marketing', to: 'platform', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'platform', to: 'evt_browse', views: ['EVENT_STORMING'] },
    { id: 'r_es_5', from: 'evt_browse', to: 'customer', views: ['EVENT_STORMING'] },
    { id: 'r_es_6', from: 'customer', to: 'evt_purchase', views: ['EVENT_STORMING'] },
    { id: 'r_es_7', from: 'evt_purchase', to: 'order', views: ['EVENT_STORMING'] },
    { id: 'r_es_8', from: 'order', to: 'evt_payment', views: ['EVENT_STORMING'] },
    { id: 'r_es_9', from: 'evt_payment', to: 'payment', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'payment', to: 'evt_ship', views: ['EVENT_STORMING'] },
    { id: 'r_es_11', from: 'evt_ship', to: 'logistics', views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'logistics', to: 'evt_deliver', views: ['EVENT_STORMING'] },
    { id: 'r_es_13', from: 'evt_deliver', to: 'evt_review', views: ['EVENT_STORMING'] },
    { id: 'r_es_14', from: 'evt_review', to: 'review', views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'evt_deliver', to: 'pol_return', views: ['EVENT_STORMING'] },
  ],
  views: {
    SYS_ARCH: {
      name: 'ระบบขายของออนไลน์',
      icon: 'Server',
      nodes: [
        { id: 'seller', x: 100, y: 250 },
        { id: 'product-listing', x: 320, y: 100 },
        { id: 'marketing', x: 320, y: 400 },
        { id: 'platform', x: 560, y: 250 },
        { id: 'customer', x: 800, y: 250 },
        { id: 'order', x: 800, y: 100 },
        { id: 'payment', x: 1040, y: 100 },
        { id: 'warehouse', x: 560, y: 420 },
        { id: 'logistics', x: 800, y: 420 },
        { id: 'tracking', x: 1040, y: 250 },
        { id: 'review', x: 1040, y: 420 },
        { id: 'analytics', x: 1280, y: 250 },
      ],
      groups: [
        {
          id: 'sa_g1',
          title: 'ฝั่งผู้ขาย',
          desc: 'การจัดการสินค้า การตลาด และคลังสินค้า',
          nodeIds: ['seller', 'product-listing', 'marketing', 'warehouse'],
          color: 'rgba(140, 170, 238, 0.12)',
          borderColor: '#8caaee',
          textColor: '#c6d0f5',
        },
        {
          id: 'sa_g2',
          title: 'แพลตฟอร์มและลูกค้า',
          desc: 'ช่องทางขายและการโต้ตอบกับลูกค้า',
          nodeIds: ['platform', 'customer', 'order', 'review'],
          color: 'rgba(244, 184, 228, 0.12)',
          borderColor: '#f4b8e4',
          textColor: '#c6d0f5',
        },
        {
          id: 'sa_g3',
          title: 'ระบบหลังบ้าน',
          desc: 'การเงิน โลจิสติกส์ และข้อมูลวิเคราะห์',
          nodeIds: ['payment', 'logistics', 'tracking', 'analytics'],
          color: 'rgba(229, 200, 144, 0.12)',
          borderColor: '#e5c890',
          textColor: '#c6d0f5',
        },
      ],
    },
    EVENT_STORMING: {
      name: 'ขั้นตอนการขาย',
      icon: 'Component',
      nodes: [
        { id: 'seller', x: 80, y: 250 },
        { id: 'product-listing', x: 200, y: 150 },
        { id: 'marketing', x: 200, y: 350 },
        { id: 'platform', x: 380, y: 250 },
        { id: 'evt_browse', x: 520, y: 250 },
        { id: 'customer', x: 660, y: 250 },
        { id: 'evt_purchase', x: 800, y: 250 },
        { id: 'order', x: 940, y: 250 },
        { id: 'evt_payment', x: 1080, y: 250 },
        { id: 'payment', x: 1220, y: 250 },
        { id: 'evt_ship', x: 1360, y: 250 },
        { id: 'logistics', x: 1500, y: 250 },
        { id: 'evt_deliver', x: 1640, y: 250 },
        { id: 'evt_review', x: 1780, y: 180 },
        { id: 'review', x: 1900, y: 180 },
        { id: 'pol_return', x: 1780, y: 320 },
      ],
      groups: [
        {
          id: 'es_g1',
          title: 'เตรียมการขาย',
          desc: 'จัดการสินค้าและทำการตลาด',
          nodeIds: ['seller', 'product-listing', 'marketing', 'platform'],
          color: 'rgba(140, 170, 238, 0.12)',
          borderColor: '#8caaee',
          textColor: '#c6d0f5',
        },
        {
          id: 'es_g2',
          title: 'ขั้นตอนสั่งซื้อ',
          desc: 'ลูกค้าค้นหา เลือก และสั่งซื้อ',
          nodeIds: ['evt_browse', 'customer', 'evt_purchase', 'order', 'evt_payment', 'payment'],
          color: 'rgba(244, 184, 228, 0.12)',
          borderColor: '#f4b8e4',
          textColor: '#c6d0f5',
        },
        {
          id: 'es_g3',
          title: 'จัดส่งและปิดการขาย',
          desc: 'แพ็กสินค้า ส่ง ติดตาม และรับรีวิว',
          nodeIds: ['evt_ship', 'logistics', 'evt_deliver', 'evt_review', 'review', 'pol_return'],
          color: 'rgba(229, 200, 144, 0.12)',
          borderColor: '#e5c890',
          textColor: '#c6d0f5',
        },
      ],
    },
  },
  journeys: [
    {
      id: 'selling-flow',
      label: 'เส้นทางการขาย',
      description: 'ตามขั้นตอนตั้งแต่ผู้ขายจัดการสินค้าจนกว่าลูกค้าจะรีวิว',
      steps: [
        { nodeId: 'seller', description: 'ผู้ขายจัดการร้านและเตรียมสินค้า' },
        { nodeId: 'product-listing', description: 'อัพโหลดสินค้า ตั้งราคา เขียนรายละเอียด' },
        { nodeId: 'marketing', description: 'ลงโฆษณา ทำคอนเทนต์ โปรโมทสินค้า' },
        { nodeId: 'platform', description: 'สินค้าแสดงผลบนแพลตฟอร์ม' },
        { nodeId: 'evt_browse', description: 'ลูกค้าเข้ามาดูสินค้า' },
        { nodeId: 'customer', description: 'ลูกค้าพิจารณา เปรียบเทียบ' },
        { nodeId: 'evt_purchase', description: 'ลูกค้ากดสั่งซื้อ' },
        { nodeId: 'order', description: 'สร้างออเดอร์ในระบบ' },
        { nodeId: 'evt_payment', description: 'ลูกค้าชำระค่าสินค้า' },
        { nodeId: 'payment', description: 'ระบบยืนยันการชำระเงิน' },
        { nodeId: 'evt_ship', description: 'ผู้ขายแพ็กสินค้าและเรียก Courier' },
        { nodeId: 'logistics', description: 'บริษัทขนส่งรับพัสดุและจัดส่ง' },
        { nodeId: 'evt_deliver', description: 'ลูกค้าได้รับสินค้า' },
        { nodeId: 'evt_review', description: 'ลูกค้าให้คะแนนและเขียนรีวิว' },
        { nodeId: 'review', description: 'รีวิวแสดงผล ช่วยให้สินค้าขายดีขึ้น' },
      ],
    },
  ],
}

export const sellingChecklistBullets: BulletItem[] = [
  {
    text: 'ก่อนเริ่มขาย — วางแผนและเตรียมตัว',
    children: [
      { text: 'วิเคราะห์ตลาดและคู่แข่ง (Market Research)', checkable: true },
      { text: 'เลือกสินค้าที่มีกำไรและ Demand สูง', checkable: true },
      { text: 'คำนวณต้นทุน: สินค้า + แพ็กเกจจิ้ง + ค่าส่ง + ค่าคอมมิชชั่น', checkable: true },
      { text: 'กำหนดราคาขายที่มีกำไรอย่างน้อย 30% หลังหักต้นทุน', checkable: true },
    ],
  },
  {
    text: 'การจัดการร้าน — ทำให้มืออาชีพ',
    children: [
      { text: 'รูปสินค้าคุณภาพสูง ( минимум 5 รูป/สินค้า)' },
      { text: 'Title ที่มี Keyword ที่คนค้นหาบ่อย' },
      { text: 'รายละเอียดสินค้าครบ: ขนาด น้ำหนัก วิธีใช้' },
      { text: 'ตอบแชทภายใน 5 นาที (ตอบแชทเร็ว = อันดับร้านดีขึ้น)' },
    ],
  },
  {
    text: 'การตลาด — ดึงดูดลูกค้า',
    children: [
      { text: 'Shopee Ads / Lazada Ads — ลงโฆษณาในแพลตฟอร์ม' },
      { text: 'Live Selling — ออก Live 2-3 ครั้ง/สัปดาห์' },
      { text: 'Voucher และ Flash Sale — กระตุ้นการสั่งซื้อ' },
      { text: 'Affiliate Marketing — ให้ Influencer รีวิวสินค้า' },
    ],
  },
  {
    text: 'โลจิสติกส์ — จัดส่งเร็วและปลอดภัย',
    children: [
      { text: 'แพ็กสินค้าภายใน 24 ชม. หลังได้รับออเดอร์' },
      { text: 'ใช้ Tracking system อัพเดทสถานะให้ลูกค้า' },
      { text: 'มีนโยบายคืนสินค้าชัดเจน (7 วัน)' },
      { text: 'เก็บสถิติ RTO (Return to Origin) เพื่อปรับปรุง' },
    ],
  },
]

export const sellingCategories: TaxonomyCategory[] = [
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: ShoppingCart as unknown as ComponentType<any>,
    title: 'สินค้าขายดี',
    subtitle: 'Product Categories',
    description: 'หมวดหมู่สินค้าที่ขายดีในตลาดออนไลน์ไทย มี Demand สูงและหมุนเวียนเร็ว',
    details: 'สินค้าแฟชั่นและ Beauty มีอัตราการเปลี่ยนผ่านสูง (High Turnover) ส่วน Electronics มี Margin สูงแต่แข่งขันด้วยราคา ของใช้ในบ้านและ Food & Beverage เป็นหมวดที่เติบโตเร็วที่สุด',
    analogy: 'เหมือนเลือกสินค้าในห้าง — หมวดหมู่แต่ละหมวดมีกลุ่มลูกค้าและรูปแบบการขายที่ต่างกัน',
    primaryFocus: 'เลือกหมวดสินค้าที่ตรงกับ Passion และความสามารถในการจัดหา',
    inScope: ['แฟชั่นและเครื่องแต่งกาย', 'ความงามและสกินแคร์', 'ของใช้ในบ้าน', 'อาหารและเครื่องดื่ม', 'อิเล็กทรอนิกส์'],
    outOfScope: ['สินค้าต้องห้าม (ยาสูบ อาวุธ)', 'สินค้าละเมิดลิขสิทธิ์'],
    color: 'blue',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Megaphone as unknown as ComponentType<any>,
    title: 'ช่องทางการตลาด',
    subtitle: 'Marketing Channels',
    description: 'ช่องทางโปรโมทสินค้าออนไลน์ แต่ละช่องทางเหมาะกับสินค้าและกลุ่มลูกค้าต่างกัน',
    details: 'In-Platform Ads (Shopee Ads) เหมาะสำหรับการเริ่ม เพราะเข้าถึงลูกค้าที่กำลังค้นหาสินค้าอยู่แล้ว Social Media Ads (Facebook, TikTok) เหมาะกับการสร้าง Brand Awareness และ Viral Content Affiliate Marketing เหมาะกับสินค้าที่มี Commission สูง',
    analogy: 'เหมือนการเปิดป้ายร้าน — ป้ายหน้าทางด่วน (Ads), ป้ายหน้าร้าน (In-Platform), และปากต่อปาก (Affiliate)',
    primaryFocus: 'เริ่มจาก In-Platform Ads ก่อน แล้วค่อยขยายไปยัง Social Media เมื่อมีข้อมูลลูกค้า',
    inScope: ['Shopee Ads / Lazada Ads', 'Facebook Ads', 'TikTok Ads', 'Live Selling', 'Affiliate Marketing', 'SEO ในแพลตฟอร์ม'],
    outOfScope: ['การตลาดออฟไลน์ (Billboard, TV Ads)', 'Cold calling'],
    color: 'peach',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: CreditCard as unknown as ComponentType<any>,
    title: 'ระบบการเงิน',
    subtitle: 'Financial Management',
    description: 'การจัดการกระแสเงินสด ต้นทุน และกำไรสำหรับธุรกิจออนไลน์',
    details: 'ผู้ขายออนไลน์ต้องจัดการกับหลายบัญชี: ยอดขายในแพลตฟอร์ม (ปล่อยเงิน 7-15 วัน), ค่าโฆษณา, ค่าขนส่ง, และภาษี VAT 7% สำหรับยอดขายเกิน 1.8 ล้านบาท/ปี การทำ Cash Flow projection สำคัญมากเพราะเงินจากแพลตฟอร์มไม่ได้เข้าทันที',
    analogy: 'เหมือนผู้จัดการเงินในร้าน — ต้องรู้ว่าเมื่อไหร่เงินเข้า เมื่อไหร่ต้องจ่าย และเหลือกำไรเท่าไหร่',
    primaryFocus: 'Cash Flow Management และ Cost Control',
    inScope: ['Cash Flow Projection', 'Break-Even Analysis', 'ROI ของโฆษณา', 'ค่าคอมมิชชั่นแพลตฟอร์ม', 'ภาษี VAT'],
    outOfScope: ['การบัญชีระดับ Enterprise', 'IPO และการระดมทุน'],
    color: 'green',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Truck as unknown as ComponentType<any>,
    title: 'โลจิสติกส์และ Fulfillment',
    subtitle: 'Logistics & Fulfillment',
    description: 'ระบบการจัดการสต็อก แพ็กสินค้า และจัดส่งให้ลูกค้าได้รับของเร็วและปลอดภัย',
    details: 'Fulfillment มี 3 แบบหลัก: Self-Fulfill (แพ็กเอง ส่งเอง), Platform Fulfillment (ใช้คลังของแพลตฟอร์ม เช่น Shopee Fulfilled), และ 3PL (บริษัทโลจิสติกส์รับจ้าง) สำหรับผู้ขายระดับ Intermediate การใช้ Hybrid ระหว่าง Self-Fulfill สำหรับสินค้าเร่งด่วนและ 3PL สำหรับสินค้าทั่วไปให้ความยืดหยุ่นสูงสุด',
    analogy: 'เหมือนระบบคลังสินค้าในห้าง — มีสินค้าในสต็อก แพ็กเมื่อมีออเดอร์ และส่งให้ลูกค้าผ่านหลายช่องทาง',
    primaryFocus: 'ความเร็วในการจัดส่งและความปลอดภัยของสินค้า',
    inScope: ['Self-Fulfillment', 'Platform Fulfillment (Shopee Fulfilled)', '3PL Service', 'Pick-up Point', 'Local Delivery'],
    outOfScope: ['International Shipping', 'Cold Chain Logistics'],
    color: 'teal',
  },
]
