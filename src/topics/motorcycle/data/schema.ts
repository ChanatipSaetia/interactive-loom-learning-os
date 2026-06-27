import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

export const engineSchema: UnifiedFlowchartSchema = {
  entities: {
    'rider': {
      type: TYPES.USER,
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์'
    },
    'throttle': {
      type: TYPES.COMMAND,
      title: 'บิดคันเร่ง',
      desc: 'การสั่งงานเพิ่มความเร็ว',
      root: true
    },
    'ecu': {
      type: TYPES.AGGREGATE,
      title: 'คาร์บูเรเตอร์/หัวฉีด',
      desc: 'ระบบสั่งจ่ายเชื้อเพลิง'
    },
    'fuel_mix': {
      type: TYPES.EVENT,
      title: 'จ่ายน้ำมันและอากาศ',
      desc: 'ผสมเชื้อเพลิงเข้าเครื่อง'
    },
    'policy_start': {
      type: TYPES.POLICY,
      title: 'เริ่มวัฏจักรดูด (Start Intake)',
      desc: 'ระบบเตรียมดูดไอดี'
    },
    'intake': {
      type: TYPES.COMMAND,
      title: 'ดูดไอดี (Intake)',
      desc: 'วาล์วเปิด ลูกสูบดูด'
    },
    'engine': {
      type: TYPES.AGGREGATE,
      title: 'กระบอกสูบ (Cylinder / Engine)',
      desc: 'เครื่องยนต์'
    },
    'evt_intake': {
      type: TYPES.EVENT,
      title: 'ไอดีเต็มกระบอกสูบ',
      desc: 'ดูดไอดีเสร็จสิ้น'
    },
    'policy_comp': {
      type: TYPES.POLICY,
      title: 'เริ่มวัฏจักรอัด (Start Comp)',
      desc: 'วาล์วปิดเตรียมอัด'
    },
    'compression': {
      type: TYPES.COMMAND,
      title: 'อัดไอดี (Compression)',
      desc: 'ลูกสูบดันขึ้น'
    },
    'evt_comp': {
      type: TYPES.EVENT,
      title: 'แรงดันถึงจุดสูงสุด',
      desc: 'อัดไอดีเสร็จสิ้น'
    },
    'policy_comb': {
      type: TYPES.POLICY,
      title: 'สั่งจุดระเบิด (Start Comb)',
      desc: 'ส่งสัญญาณจุดระเบิด'
    },
    'combustion': {
      type: TYPES.COMMAND,
      title: 'จุดระเบิด (Combustion)',
      desc: 'หัวเทียนจุดประกายไฟ'
    },
    'evt_comb': {
      type: TYPES.EVENT,
      title: 'แรงระเบิดดันลูกสูบ',
      desc: 'การระเบิดเสร็จสิ้น'
    },
    'policy_exh': {
      type: TYPES.POLICY,
      title: 'เริ่มวัฏจักรคาย (Start Exh)',
      desc: 'วาล์วไอเสียเปิด'
    },
    'exhaust': {
      type: TYPES.COMMAND,
      title: 'คายไอเสีย (Exhaust)',
      desc: 'ลูกสูบดันไอเสียออก'
    },
    'power_transfer': {
      type: TYPES.EVENT,
      title: 'ส่งกำลังลงข้อเหวี่ยง',
      desc: 'สร้างแรงบิด (Power Transfer)'
    },
    'transmission': {
      type: TYPES.AGGREGATE,
      title: 'เกียร์และโซ่ (Transmission)',
      desc: 'ระบบส่งกำลังสู่ล้อ'
    },
    'wheel_spin': {
      type: TYPES.EVENT,
      title: 'ล้อหมุนขับเคลื่อน',
      desc: 'รถเคลื่อนที่'
    }
  },
  relations: [
    { id: 'rel_throttle', from: 'rider', to: 'throttle' },
    { id: 'rel_throttle_ecu', from: 'throttle', to: 'ecu', handledBy: true },
    { id: 'rel_ecu_fuel', from: 'ecu', to: 'fuel_mix' },
    
    // Intake
    { id: 'rel_fuel_p1', from: 'fuel_mix', to: 'policy_start' },
    { id: 'rel_p1_in', from: 'policy_start', to: 'intake' },
    { id: 'rel_in_eng', from: 'intake', to: 'engine', handledBy: true },
    { id: 'rel_eng_ein', from: 'engine', to: 'evt_intake' },
    
    // Compression
    { id: 'rel_ein_p2', from: 'evt_intake', to: 'policy_comp' },
    { id: 'rel_p2_cmp', from: 'policy_comp', to: 'compression' },
    { id: 'rel_cmp_eng', from: 'compression', to: 'engine', handledBy: true },
    { id: 'rel_eng_ecmp', from: 'engine', to: 'evt_comp' },
    
    // Combustion
    { id: 'rel_ecmp_p3', from: 'evt_comp', to: 'policy_comb' },
    { id: 'rel_p3_cmb', from: 'policy_comb', to: 'combustion' },
    { id: 'rel_cmb_eng', from: 'combustion', to: 'engine', handledBy: true },
    { id: 'rel_eng_ecmb', from: 'engine', to: 'evt_comb' },
    
    // Exhaust
    { id: 'rel_ecmb_p4', from: 'evt_comb', to: 'policy_exh' },
    { id: 'rel_p4_exh', from: 'policy_exh', to: 'exhaust' },
    { id: 'rel_exh_eng', from: 'exhaust', to: 'engine', handledBy: true },
    { id: 'rel_eng_power', from: 'engine', to: 'power_transfer' },
    
    // Transmission
    { id: 'rel_power_trans', from: 'power_transfer', to: 'transmission' },
    { id: 'rel_trans_wheel', from: 'transmission', to: 'wheel_spin' }
  ],
  journeys: [
    {
      id: '4-stroke-cycle',
      label: 'วัฏจักรเครื่องยนต์ 4 จังหวะ และการส่งกำลัง',
      description: 'ขั้นตอนการทำงานตั้งแต่บิดคันเร่งจนถึงการส่งกำลังไปที่ล้อ',
      steps: [
        { nodeId: 'throttle', description: 'ผู้ขับขี่บิดคันเร่งเพื่อเพิ่มความเร็ว' },
        { nodeId: 'ecu', description: 'ระบบสั่งจ่ายน้ำมันและอากาศเข้าสู่ห้องเผาไหม้' },
        { nodeId: 'intake', description: '1. ดูด: วาล์วไอดีเปิด ลูกสูบเลื่อนลง ดูดไอดีเข้ากระบอกสูบ' },
        { nodeId: 'compression', description: '2. อัด: ลูกสูบเลื่อนขึ้น อัดไอดีให้มีความหนาแน่นเตรียมจุดระเบิด' },
        { nodeId: 'combustion', description: '3. ระเบิด: หัวเทียนจุดประกายไฟ ดันลูกสูบลงอย่างแรง สร้างกำลัง' },
        { nodeId: 'exhaust', description: '4. คาย: วาล์วไอเสียเปิด ลูกสูบเลื่อนขึ้นดันไอเสียออก' },
        { nodeId: 'power_transfer', description: 'กำลังจากการจุดระเบิดส่งผ่านก้านสูบลงสู่เพลาข้อเหวี่ยง' },
        { nodeId: 'transmission', description: 'ระบบเกียร์และโซ่/สายพาน รับกำลังมาเพื่อทดรอบ' },
        { nodeId: 'wheel_spin', description: 'ส่งกำลังไปที่ล้อหลัง ทำให้มอเตอร์ไซค์ขับเคลื่อนไปข้างหน้า' },
      ]
    }
  ]
}
