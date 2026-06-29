import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

/**
 * Engine 4-Stroke Cycle + Transmission
 * Independent flow: throttle → 4-stroke → transmission → wheel spin
 */
export const engineSchema: UnifiedFlowchartSchema = {
  entities: {
    // === Actors ===
    'rider': {
      type: TYPES.USER,
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์'
    },

    // === Acceleration / 4-Stroke Engine ===
    'throttle': {
      type: TYPES.COMMAND,
      title: 'บิดคันเร่ง',
      desc: 'การสั่งงานเพิ่มความเร็ว',
      root: true
    },
    'carburetor': {
      type: TYPES.AGGREGATE,
      title: 'คาร์บูเรเตอร์ (Carburetor)',
      desc: 'ระบบผสมน้ำมันและอากาศด้วยกลไก (รถรุ่นเก่า)'
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
    'engine2': {
      type: TYPES.AGGREGATE,
      title: 'กระบอกสูบ (Cylinder / Engine) 2',
      desc: 'เครื่องยนต์',
      collapsedTo: 'engine'
    },
    'engine3': {
      type: TYPES.AGGREGATE,
      title: 'กระบอกสูบ (Cylinder / Engine) 3',
      desc: 'เครื่องยนต์',
      collapsedTo: 'engine'
    },
    'engine4': {
      type: TYPES.AGGREGATE,
      title: 'กระบอกสูบ (Cylinder / Engine) 4',
      desc: 'เครื่องยนต์',
      collapsedTo: 'engine'
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
    'policy_trans': {
      type: TYPES.POLICY,
      title: 'เริ่มส่งกำลัง (Start Transmission)',
      desc: 'ระบบส่งกำลังเตรียมรับแรงบิด'
    },
    'shift_gear': {
      type: TYPES.COMMAND,
      title: 'ส่งกำลังทดรอบ (Shift Gear)',
      desc: 'เกียร์ทดรอบและส่งกำลังผ่านโซ่'
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
    },
  },
  relations: [
    // === Acceleration Flow ===
    { id: 'rel_throttle', from: 'rider', to: 'throttle' },
    { id: 'rel_throttle_carb', from: 'throttle', to: 'carburetor', handledBy: true },
    { id: 'rel_carb_fuel', from: 'carburetor', to: 'fuel_mix' },
    { id: 'rel_throttle_fuel', from: 'throttle', to: 'fuel_mix' },

    // Intake
    { id: 'rel_fuel_p1', from: 'fuel_mix', to: 'policy_start' },
    { id: 'rel_p1_in', from: 'policy_start', to: 'intake' },
    { id: 'rel_in_eng', from: 'intake', to: 'engine', handledBy: true },
    { id: 'rel_eng_ein', from: 'engine', to: 'evt_intake' },

    // Compression
    { id: 'rel_ein_p2', from: 'evt_intake', to: 'policy_comp' },
    { id: 'rel_p2_cmp', from: 'policy_comp', to: 'compression' },
    { id: 'rel_cmp_eng', from: 'compression', to: 'engine2', handledBy: true },
    { id: 'rel_eng_ecmp', from: 'engine2', to: 'evt_comp' },

     // Combustion
    { id: 'rel_ecmp_p3', from: 'evt_comp', to: 'policy_comb' },
    { id: 'rel_p3_cmb', from: 'policy_comb', to: 'combustion' },
    { id: 'rel_cmb_eng', from: 'combustion', to: 'engine3', handledBy: true },
    { id: 'rel_eng_ecmb', from: 'engine3', to: 'evt_comb' },

    // Exhaust
    { id: 'rel_ecmb_p4', from: 'evt_comb', to: 'policy_exh' },
    { id: 'rel_p4_exh', from: 'policy_exh', to: 'exhaust' },
    { id: 'rel_exh_eng', from: 'exhaust', to: 'engine4', handledBy: true },
    { id: 'rel_eng_exh', from: 'engine4', to: 'power_transfer' },

    // Transmission
    { id: 'rel_power_trans', from: 'power_transfer', to: 'policy_trans' },
    { id: 'rel_trans_shift', from: 'policy_trans', to: 'shift_gear' },
    { id: 'rel_shift_trans', from: 'shift_gear', to: 'transmission', handledBy: true },
    { id: 'rel_trans_wheel', from: 'transmission', to: 'wheel_spin' },
  ],
  journeys: [
    {
      id: '4-stroke-cycle',
      label: 'วัฏจักรเครื่องยนต์ 4 จังหวะ และการส่งกำลัง',
      description: 'ขั้นตอนการทำงานตั้งแต่บิดคันเร่งจนถึงการส่งกำลังไปที่ล้อ',
      steps: [
        { nodeId: 'throttle', description: 'ผู้ขับขี่บิดคันเร่งเพื่อเพิ่มความเร็ว' },
        { nodeId: 'carburetor', description: 'คาร์บูเรเตอร์ผสมน้ำมันและอากาศ' },
        { nodeId: 'intake', description: '1. ดูด: วาล์วไอดีเปิด ลูกสูบเลื่อนลง ดูดไอดีเข้ากระบอกสูบ' },
        { nodeId: 'compression', description: '2. อัด: ลูกสูบเลื่อนขึ้น อัดไอดีให้มีความหนาแน่นเตรียมจุดระเบิด' },
        { nodeId: 'combustion', description: '3. ระเบิด: หัวเทียนจุดประกายไฟ ดันลูกสูบลงอย่างแรง สร้างกำลัง' },
        { nodeId: 'exhaust', description: '4. คาย: วาล์วไอเสียเปิด ลูกสูบเลื่อนขึ้นดันไอเสียออก' },
        { nodeId: 'power_transfer', description: 'กำลังจากการจุดระเบิดส่งผ่านก้านสูบลงสู่เพลาข้อเหวี่ยง' },
        { nodeId: 'shift_gear', description: 'เกียร์ทดรอบและส่งกำลังผ่านโซ่/สายพาน' },
        { nodeId: 'transmission', description: 'ระบบเกียร์และโซ่/สายพาน รับกำลังมาเพื่อทดรอบ' },
        { nodeId: 'wheel_spin', description: 'ส่งกำลังไปที่ล้อหลัง ทำให้มอเตอร์ไซค์ขับเคลื่อนไปข้างหน้า' },
      ]
    },
  ]
}

/**
 * Choke / Cold Start System
 * Independent flow: choke on → rich mix → cold start → engine warm → choke off
 * Shares no COMMANDs or EVENTs with engine graph.
 */
export const chokeSchema: UnifiedFlowchartSchema = {
  entities: {
    // === Actors ===
    'rider_choke': {
      type: TYPES.USER,
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์'
    },

    // === Choke / Cold Start System ===
    'cmd_choke_on': {
      type: TYPES.COMMAND,
      title: 'เปิดโช้ค (Turn Choke On)',
      desc: 'ปิดช่องอากาศบางส่วนเพื่อเพิ่มสัดส่วนน้ำมัน',
      root: true
    },
    'choke_valve': {
      type: TYPES.AGGREGATE,
      title: 'วาล์วโช้ค (Choke Valve)',
      desc: 'ควบคุมปริมาณอากาศที่เข้าสู่คาร์บูเรเตอร์'
    },
    'choke_valve2': {
      type: TYPES.AGGREGATE,
      title: 'วาล์วโช้ค (Choke Valve) 2',
      desc: 'วาล์วโช้คในขั้นตอนปิดโช้ค',
      collapsedTo: 'choke_valve'
    },
    'choke_valve3': {
      type: TYPES.AGGREGATE,
      title: 'วาล์วโช้ค (Choke Valve) 3',
      desc: 'วาล์วโช้คในขั้นตอนลืมปิดโช้ค',
      collapsedTo: 'choke_valve'
    },
    'evt_rich_mix': {
      type: TYPES.EVENT,
      title: 'ส่วนผสมรวยน้ำมัน (Rich Mixture)',
      desc: 'อัตราส่วนน้ำมัน:อากาศสูงกว่าปกติ'
    },
    'policy_choke_use': {
      type: TYPES.POLICY,
      title: 'ใช้ส่วนผสมรวยน้ำมัน (Rich Mix Decision)',
      desc: 'เลือกเส้นทาง: สตาร์ทเครื่องหรือใช้งานต่อ'
    },
    'cmd_cold_start': {
      type: TYPES.COMMAND,
      title: 'สตาร์ทเครื่องเย็น (Cold Start Engine)',
      desc: 'เครื่องยนต์เริ่มทำงานด้วยส่วนผสมรวยน้ำมัน'
    },
    'engine_warm': {
      type: TYPES.AGGREGATE,
      title: 'เครื่องยนต์อุ่นตัว (Engine Warms Up)',
      desc: 'อุณหภูมิเครื่องยนต์สูงขึ้นเรื่อยๆ'
    },
    'evt_engine_warm': {
      type: TYPES.EVENT,
      title: 'เครื่องอุ่นแล้ว (Engine Warm)',
      desc: 'อุณหภูมิเครื่องยนต์ถึงระดับทำงานปกติ'
    },
    'policy_choke_off': {
      type: TYPES.POLICY,
      title: 'ปิดโช้ค (Turn Choke Off)',
      desc: 'เมื่อเครื่องอุ่นแล้ว ต้องปิดโช้คเพื่อกลับสู่ส่วนผสมปกติ'
    },
    'cmd_choke_off': {
      type: TYPES.COMMAND,
      title: 'ปิดโช้ค (Choke Off)',
      desc: 'เปิดช่องอากาศกลับสู่ระดับปกติ'
    },
    'evt_normal_mix': {
      type: TYPES.EVENT,
      title: 'ส่วนผสมปกติ (Normal Mixture)',
      desc: 'อัตราส่วนน้ำมัน:อากาศกลับสู่ค่ามาตรฐาน'
    },
    'evt_choke_forget': {
      type: TYPES.EVENT,
      title: 'วิ่ง โช้คค้าง (Riding With Choke On)',
      desc: 'ส่วนผสมรวยน้ำมันเกินไป ทำให้หัวเทียนสกปรกและกินน้ำมัน'
    },
    'cmd_ride_choke': {
      type: TYPES.COMMAND,
      title: 'ขี่รถโดยลืมปิดโช้ค (Ride With Choke)',
      desc: 'บิดคันเร่งขณะที่โช้คยังเปิดอยู่'
    },
  },
  relations: [
    { id: 'rel_rider_choke', from: 'rider_choke', to: 'cmd_choke_on' },
    { id: 'rel_choke_valve', from: 'cmd_choke_on', to: 'choke_valve', handledBy: true },
    { id: 'rel_choke_rich', from: 'choke_valve', to: 'evt_rich_mix' },
    { id: 'rel_rich_policy', from: 'evt_rich_mix', to: 'policy_choke_use' },
    { id: 'rel_choke_to_intake', from: 'policy_choke_use', to: 'cmd_cold_start', label: 'สตาร์ทเครื่อง' },
    { id: 'rel_cold_engine', from: 'cmd_cold_start', to: 'engine_warm', handledBy: true },
    { id: 'rel_engine_warm', from: 'engine_warm', to: 'evt_engine_warm' },
    { id: 'rel_warm_policy', from: 'evt_engine_warm', to: 'policy_choke_off' },
    { id: 'rel_choke_off_cmd', from: 'policy_choke_off', to: 'cmd_choke_off' },
    { id: 'rel_choke_off_valve', from: 'cmd_choke_off', to: 'choke_valve2', handledBy: true },
    { id: 'rel_choke_off_normal', from: 'choke_valve2', to: 'evt_normal_mix' },
    { id: 'rel_choke_forget', from: 'policy_choke_use', to: 'cmd_ride_choke', label: 'ลืมปิดโช้ค', dashed: true },
    { id: 'rel_ride_choke_valve', from: 'cmd_ride_choke', to: 'choke_valve3', handledBy: true },
    { id: 'rel_ride_choke_evt', from: 'choke_valve3', to: 'evt_choke_forget' },
  ],
  journeys: [
    {
      id: 'choke-cold-start',
      label: 'สตาร์ทเครื่องเย็น (Cold Start)',
      description: 'เปิดโช้ค → สตาร์ท → เครื่องอุ่น → ปิดโช้ค → ผสมส่วนปกติ',
      steps: [
        { nodeId: 'cmd_choke_on', description: 'ผู้ขับขี่เปิดโช้คก่อนสตาร์ทเครื่องเย็น' },
        { nodeId: 'choke_valve', description: 'วาล์วโช้คปิดช่องอากาศบางส่วน จำกัดอากาศเข้าคาร์บู' },
        { nodeId: 'evt_rich_mix', description: 'ส่วนผสมรวยน้ำมัน (น้ำมัน:อากาศสูงกว่าปกติ)' },
        { nodeId: 'cmd_cold_start', description: 'เครื่องยนต์เริ่มทำงานด้วยส่วนผสมรวยน้ำมัน' },
        { nodeId: 'engine_warm', description: 'เครื่องยนต์ค่อยๆ อุ่นตัว อุณหภูมิสูงขึ้น' },
        { nodeId: 'evt_engine_warm', description: 'เครื่องอุ่นถึงอุณหภูมิทำงานปกติแล้ว' },
        { nodeId: 'cmd_choke_off', description: 'ปิดโช้ค เปิดช่องอากาศกลับสู่ปกติ' },
        { nodeId: 'evt_normal_mix', description: 'ส่วนผสมกลับสู่มาตรฐาน เครื่องทำงานเรียบ' },
      ]
    },
    {
      id: 'choke-forgot-off',
      label: 'ลืมปิดโช้ค (Forgot to Turn Off Choke)',
      description: 'เปิดโช้ค → ลืมปิด → วิ่งโช้คค้าง → รถเร่งไม่ขึ้น',
      steps: [
        { nodeId: 'cmd_choke_on', description: 'ผู้ขับขี่เปิดโช้คก่อนสตาร์ทเครื่องเย็น' },
        { nodeId: 'choke_valve', description: 'วาล์วโช้คปิดช่องอากาศบางส่วน' },
        { nodeId: 'evt_rich_mix', description: 'ส่วนผสมรวยน้ำมัน' },
        { nodeId: 'cmd_ride_choke', description: 'บิดคันเร่งขณะที่โช้คยังเปิดอยู่' },
        { nodeId: 'evt_choke_forget', description: 'หัวเทียนสกปรก กินน้ำมัน รถเร่งไม่ขึ้น' },
      ]
    },
  ]
}

/**
 * Fuel Injection System (EFI)
 * Independent flow: throttle → ECU → injector → atomized fuel
 * Shares no COMMANDs or EVENTs with engine or choke graphs.
 */
export const fuelInjectSchema: UnifiedFlowchartSchema = {
  entities: {
    // === Actors ===
    'rider_inject': {
      type: TYPES.USER,
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์'
    },

    // === Fuel Injection System ===
    'cmd_inject_throttle': {
      type: TYPES.COMMAND,
      title: 'บิดคันเร่ง (Injector Mode)',
      desc: 'เซ็นเซอร์ส่งสัญญาณไปยัง ECU',
      root: true
    },
    'ecu_inject': {
      type: TYPES.AGGREGATE,
      title: 'กล่อง ECU (Electronic Control Unit)',
      desc: 'สมองกลคำนวณปริมาณน้ำมันที่แม่นยำ'
    },
    'evt_sensor_read': {
      type: TYPES.EVENT,
      title: 'รับค่าจากเซ็นเซอร์ (Sensor Data)',
      desc: 'ข้อมูลรอบเครื่อง ตำแหน่งคันเร่ง อุณหภูมิเครื่อง อากาศเข้า'
    },
    'policy_calc_fuel': {
      type: TYPES.POLICY,
      title: 'คำนวณอัตราส่วนผสม (Calculate Fuel Ratio)',
      desc: 'ECU คำนวณปริมาณน้ำมันที่ควรฉีด'
    },
    'cmd_inject_fuel': {
      type: TYPES.COMMAND,
      title: 'สั่งงานหัวฉีด (Activate Injector)',
      desc: 'ส่งพัลส์ไฟฟ้าเปิดหัวฉีด'
    },
    'fuel_injector': {
      type: TYPES.AGGREGATE,
      title: 'หัวฉีด (Fuel Injector)',
      desc: 'พ่นละอองน้ำมันเชื้อเพลิงเข้าสู่ท่อไอดี'
    },
    'fuel_injector2': {
      type: TYPES.AGGREGATE,
      title: 'หัวฉีด (Fuel Injector) 2',
      desc: 'หัวฉีดในขั้นตอนส่วนผสมแม่นยำ',
      collapsedTo: 'fuel_injector'
    },
    'fuel_injector3': {
      type: TYPES.AGGREGATE,
      title: 'หัวฉีด (Fuel Injector) 3',
      desc: 'หัวฉีดในขั้นตอนเพิ่มส่วนผสมอัตโนมัติ',
      collapsedTo: 'fuel_injector'
    },
    'evt_fuel_atomized': {
      type: TYPES.EVENT,
      title: 'ละอองน้ำมันเข้าสู่ท่อไอดี',
      desc: 'น้ำมันถูกทำให้เป็นละอองละเอียดผสมกับอากาศ'
    },
    'evt_precise_mix': {
      type: TYPES.EVENT,
      title: 'ส่วนผสมแม่นยำ (Precise Mixture)',
      desc: 'อัตราส่วนที่แม่นยำตามสภาวะการทำงาน'
    },
    'cmd_precise_mix': {
      type: TYPES.COMMAND,
      title: 'ใช้ส่วนผสมแม่นยำ (Use Precise Mixture)',
      desc: 'อัตราส่วนที่แม่นยำตามสภาวะการทำงาน'
    },
    'evt_inject_cold_auto': {
      type: TYPES.EVENT,
      title: 'เพิ่มส่วนผสมอัตโนมัติ (Auto Cold Enrichment)',
      desc: 'ECU เพิ่มน้ำมันอัตโนมัติเมื่อเครื่องเย็น'
    },
    'cmd_inject_cold': {
      type: TYPES.COMMAND,
      title: 'เพิ่มส่วนผสมอัตโนมัติ (Auto Cold Enrichment Action)',
      desc: 'ECU เพิ่มน้ำมันอัตโนมัติเมื่อเครื่องเย็น'
    },
  },
  relations: [
    { id: 'rel_inj_throttle', from: 'rider_inject', to: 'cmd_inject_throttle' },
    { id: 'rel_inj_ecu', from: 'cmd_inject_throttle', to: 'ecu_inject', handledBy: true },
    { id: 'rel_ecu_sensor', from: 'ecu_inject', to: 'evt_sensor_read' },
    { id: 'rel_sensor_calc', from: 'evt_sensor_read', to: 'policy_calc_fuel' },
    { id: 'rel_calc_inject', from: 'policy_calc_fuel', to: 'cmd_inject_fuel' },
    { id: 'rel_inject_fuel_act', from: 'cmd_inject_fuel', to: 'fuel_injector', handledBy: true },
    { id: 'rel_inject_atomize', from: 'fuel_injector', to: 'evt_fuel_atomized' },
    { id: 'rel_atomize_precise', from: 'evt_fuel_atomized', to: 'cmd_precise_mix' },
    { id: 'rel_precise_injector', from: 'cmd_precise_mix', to: 'fuel_injector2', handledBy: true },
    { id: 'rel_precise_evt', from: 'fuel_injector2', to: 'evt_precise_mix' },
    { id: 'rel_inject_cold', from: 'policy_calc_fuel', to: 'cmd_inject_cold', label: 'เครื่องเย็น' },
    { id: 'rel_cold_injector', from: 'cmd_inject_cold', to: 'fuel_injector3', handledBy: true },
    { id: 'rel_cold_auto_evt', from: 'fuel_injector3', to: 'evt_inject_cold_auto' },
  ],
  journeys: [
    {
      id: 'fuel-injection-normal',
      label: 'หัวฉีดปกติ (Normal Fuel Injection)',
      description: 'บิดคันเร่ง → ECU คำนวณ → หัวฉีดพ่น → ละอองน้ำมัน → ผสมส่วนแม่นยำ',
      steps: [
        { nodeId: 'cmd_inject_throttle', description: 'ผู้ขับขี่บิดคันเร่ง เซ็นเซอร์ตรวจวัดการบิด' },
        { nodeId: 'ecu_inject', description: 'กล่อง ECU รับสัญญาณจากเซ็นเซอร์หลายตัว' },
        { nodeId: 'evt_sensor_read', description: 'ข้อมูลรอบเครื่อง ตำแหน่งคันเร่ง อุณหภูมิเครื่อง อากาศเข้า' },
        { nodeId: 'policy_calc_fuel', description: 'ECU คำนวณปริมาณน้ำมันที่เหมาะสมตามสภาวะ' },
        { nodeId: 'cmd_inject_fuel', description: 'ECU ส่งพัลส์ไฟฟ้าเปิดหัวฉีด' },
        { nodeId: 'fuel_injector', description: 'หัวฉีดพ่นละอองน้ำมันเข้าสู่ท่อไอดี' },
        { nodeId: 'evt_fuel_atomized', description: 'น้ำมันเป็นละอองละเอียด ผสมกับอากาศ' },
        { nodeId: 'cmd_precise_mix', description: 'ใช้ส่วนผสมที่คำนวณแม่นยำตามสภาวะ' },
        { nodeId: 'evt_precise_mix', description: 'ได้อัตราส่วนแม่นยำ ประหยัดน้ำมันและสตาร์ทง่าย' },
      ]
    },
    {
      id: 'fuel-injection-cold',
      label: 'เพิ่มส่วนผสมอัตโนมัติ (Auto Cold Enrichment)',
      description: 'บิดคันเร่ง → ECU ตรวจเครื่องเย็น → เพิ่มน้ำมันอัตโนมัติ',
      steps: [
        { nodeId: 'cmd_inject_throttle', description: 'ผู้ขับขี่บิดคันเร่ง เซ็นเซอร์ตรวจวัดการบิด' },
        { nodeId: 'ecu_inject', description: 'กล่อง ECU รับสัญญาณจากเซ็นเซอร์หลายตัว' },
        { nodeId: 'evt_sensor_read', description: 'ข้อมูลรอบเครื่อง ตำแหน่งคันเร่ง อุณหภูมิเครื่อง อากาศเข้า' },
        { nodeId: 'policy_calc_fuel', description: 'ECU ตรวจพบเครื่องเย็น สั่งเพิ่มส่วนผสม' },
        { nodeId: 'cmd_inject_cold', description: 'ECU เพิ่มปริมาณน้ำมันอัตโนมัติ' },
        { nodeId: 'fuel_injector3', description: 'หัวฉีดพ่นน้ำมันมากขึ้นเพื่อช่วยสตาร์ทเครื่องเย็น' },
        { nodeId: 'evt_inject_cold_auto', description: 'ไม่ต้องใช้โช้ค ระบบปรับอัตโนมัติ' },
      ]
    },
  ]
}

/**
 * Brake System
 * Completely independent from all other systems.
 */
export const brakeSchema: UnifiedFlowchartSchema = {
  entities: {
    // === Actors ===
    'rider_brake': {
      type: TYPES.USER,
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์'
    },

    // === Brake System ===
    'cmd_brake': {
      type: TYPES.COMMAND,
      title: 'กดคันเบรก (Apply Brake)',
      desc: 'ผู้ขับขี่กดคันเบรกหน้าหรือหลัง',
      root: true
    },
    'brake_master': {
      type: TYPES.AGGREGATE,
      title: 'กระปุกเบรก (Brake Master Cylinder)',
      desc: 'เปลี่ยนแรงกดเป็นแรงดันไฮดรอลิก'
    },
    'evt_brake_pressure': {
      type: TYPES.EVENT,
      title: 'น้ำมันเบรกดันไปแคลิเพอร์',
      desc: 'แรงดันไฮดรอลิกส่งผ่านท่อเบรก'
    },
    'policy_brake': {
      type: TYPES.POLICY,
      title: 'แคลิเพอร์รับแรงดัน (Caliper Activates)',
      desc: 'ลูกสูบในแคลิเพอร์เลื่อนออก'
    },
    'cmd_caliper_squeeze': {
      type: TYPES.COMMAND,
      title: 'กดผ้าเบรกเข้าจานเบรก',
      desc: 'ผ้าเบรกประกบจานเบรกทั้งสองด้าน'
    },
    'brake_caliper': {
      type: TYPES.AGGREGATE,
      title: 'แคลิเพอร์และจานเบรก (Brake Caliper & Disc)',
      desc: 'ระบบสร้างแรงเสียดทานเพื่อหน่วงล้อ'
    },
    'brake_caliper2': {
      type: TYPES.AGGREGATE,
      title: 'แคลิเพอร์และจานเบรก (Brake Caliper & Disc) 2',
      desc: 'เบรกจม',
      collapsedTo: 'brake_caliper'
    },
    'brake_caliper3': {
      type: TYPES.AGGREGATE,
      title: 'แคลิเพอร์และจานเบรก (Brake Caliper & Disc) 3',
      desc: 'เบรกปกติ',
      collapsedTo: 'brake_caliper'
    },
    'evt_wheel_slowed': {
      type: TYPES.EVENT,
      title: 'ล้อช้าลง (Wheel Slowed)',
      desc: 'พลังงานจลน์เปลี่ยนเป็นความร้อน รถชะลอความเร็ว'
    },
    'evt_brake_heat': {
      type: TYPES.EVENT,
      title: 'เกิดความร้อน (Brake Heat)',
      desc: 'จานเบรกและผ้าเบรกมีความร้อนสูง'
    },
    'policy_brake_overheat': {
      type: TYPES.POLICY,
      title: 'เบรกร้อนเกินไป (Brake Overheat Check)',
      desc: 'หากเบรกใช้งานหนักเกินไป จะเกิดอาการเบรกจม'
    },
    'evt_brake_fade': {
      type: TYPES.EVENT,
      title: 'เบรกจม (Brake Fade)',
      desc: 'ประสิทธิภาพเบรกลดลงเพราะความร้อนสูง'
    },
    'cmd_brake_fade': {
      type: TYPES.COMMAND,
      title: 'เบรกจม (Brake Fade Action)',
      desc: 'ประสิทธิภาพเบรกลดลงเพราะความร้อนสูง'
    },
    'evt_brake_normal': {
      type: TYPES.EVENT,
      title: 'รถหยุดหรือช้าลงตามต้องการ',
      desc: 'เบรกทำงานปกติ'
    },
    'cmd_brake_normal': {
      type: TYPES.COMMAND,
      title: 'รถหยุดหรือช้าลงตามต้องการ (Normal Brake)',
      desc: 'เบรกทำงานปกติ'
    },
  },
  relations: [
    { id: 'rel_rider_brake', from: 'rider_brake', to: 'cmd_brake' },
    { id: 'rel_brake_master', from: 'cmd_brake', to: 'brake_master', handledBy: true },
    { id: 'rel_master_pressure', from: 'brake_master', to: 'evt_brake_pressure' },
    { id: 'rel_pressure_policy', from: 'evt_brake_pressure', to: 'policy_brake' },
    { id: 'rel_policy_caliper', from: 'policy_brake', to: 'cmd_caliper_squeeze' },
    { id: 'rel_caliper_squeeze', from: 'cmd_caliper_squeeze', to: 'brake_caliper', handledBy: true },
    { id: 'rel_caliper_slow', from: 'brake_caliper', to: 'evt_wheel_slowed' },
    { id: 'rel_caliper_heat', from: 'brake_caliper', to: 'evt_brake_heat' },
    { id: 'rel_heat_check', from: 'evt_brake_heat', to: 'policy_brake_overheat' },
    { id: 'rel_overheat_fade', from: 'policy_brake_overheat', to: 'cmd_brake_fade', label: 'ร้อนเกินไป' },
    { id: 'rel_fade_caliper', from: 'cmd_brake_fade', to: 'brake_caliper2', handledBy: true },
    { id: 'rel_fade_evt', from: 'brake_caliper2', to: 'evt_brake_fade' },
    { id: 'rel_overheat_normal', from: 'policy_brake_overheat', to: 'cmd_brake_normal', label: 'ปกติ' },
    { id: 'rel_normal_caliper', from: 'cmd_brake_normal', to: 'brake_caliper3', handledBy: true },
    { id: 'rel_normal_evt', from: 'brake_caliper3', to: 'evt_brake_normal' },
  ],
  journeys: [
    {
      id: 'brake-normal',
      label: 'เบรกปกติ (Normal Braking)',
      description: 'กดเบรก → ไฮดรอลิก → แคลิเพอร์ประกบจาน → รถช้าลง',
      steps: [
        { nodeId: 'cmd_brake', description: 'ผู้ขับขี่กดคันเบรกหน้าหรือหลัง' },
        { nodeId: 'brake_master', description: 'กระปุกเบรกเปลี่ยนแรงกดเป็นแรงดันไฮดรอลิก' },
        { nodeId: 'evt_brake_pressure', description: 'แรงดันส่งผ่านท่อเบรกไปยังแคลิเพอร์ที่ล้อ' },
        { nodeId: 'cmd_caliper_squeeze', description: 'ลูกสูบแคลิเพอร์ดันผ้าเบรกประกบจานเบรก' },
        { nodeId: 'brake_caliper', description: 'แรงเสียดทานหน่วงการหมุนของล้อ' },
        { nodeId: 'evt_wheel_slowed', description: 'พลังงานจลน์เปลี่ยนเป็นความร้อน รถช้าลง' },
        { nodeId: 'evt_brake_heat', description: 'จานเบรกและผ้าเบรกมีความร้อนสูงขึ้น' },
        { nodeId: 'cmd_brake_normal', description: 'เบรกทำงานปกติตามสภาวะ' },
        { nodeId: 'evt_brake_normal', description: 'รถหยุดหรือช้าลงตามต้องการ' },
      ]
    },
    {
      id: 'brake-fade',
      label: 'เบรกจม (Brake Fade)',
      description: 'กดเบรก → เบรกหนักต่อเนื่อง → ร้อนเกิน → ประสิทธิภาพลด',
      steps: [
        { nodeId: 'cmd_brake', description: 'ผู้ขับขี่กดคันเบรกหน้าหรือหลัง' },
        { nodeId: 'brake_master', description: 'กระปุกเบรกเปลี่ยนแรงกดเป็นแรงดันไฮดรอลิก' },
        { nodeId: 'evt_brake_pressure', description: 'แรงดันส่งผ่านท่อเบรกไปยังแคลิเพอร์' },
        { nodeId: 'cmd_caliper_squeeze', description: 'ลูกสูบแคลิเพอร์ดันผ้าเบรกประกบจานเบรก' },
        { nodeId: 'brake_caliper', description: 'แรงเสียดทานหน่วงการหมุนของล้อ' },
        { nodeId: 'evt_brake_heat', description: 'เบรกใช้งานหนักต่อเนื่อง ความร้อนสะสมสูง' },
        { nodeId: 'cmd_brake_fade', description: 'ความร้อนสูงเกินค่าจำกัด' },
        { nodeId: 'evt_brake_fade', description: 'ประสิทธิภาพเบรกลดลง (เบรกจม) ต้องหยุดพักให้เบรกเย็นลง' },
      ]
    },
  ]
}
