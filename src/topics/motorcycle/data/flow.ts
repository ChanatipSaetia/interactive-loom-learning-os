import type { AbstractFlow } from '../../../sections/flowchart/abstract-flow/types';
import { ref } from '../../../sections/flowchart/abstract-flow/types';

/**
 * Engine 4-Stroke Cycle + Transmission
 * Independent flow: throttle → 4-stroke → transmission → wheel spin
 */
export const engineFlow: AbstractFlow = {
  actors: {
    rider: {
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์',
    },
  },
  systems: {
    carburetor: {
      title: 'คาร์บูเรเตอร์ (Carburetor)',
      desc: 'ระบบผสมน้ำมันและอากาศด้วยกลไก (รถรุ่นเก่า)',
      type: 'aggregate',
    },
    engine: {
      title: 'กระบอกสูบ (Cylinder / Engine)',
      desc: 'เครื่องยนต์',
      type: 'aggregate',
    },
    transmission: {
      title: 'เกียร์และโซ่ (Transmission)',
      desc: 'ระบบส่งกำลังสู่ล้อ',
      type: 'aggregate',
    },
  },
  steps: [
    {
      type: 'linear',
      id: 'throttle',
      initiatedBy: ref('rider'),
      command: 'บิดคันเร่ง',
      policy: 'เริ่มวัฏจักรดูด (Start Intake)',
      handledBy: ref('carburetor'),
      resultEvents: [
        { id: 'fuel_mix', title: 'จ่ายน้ำมันและอากาศ', desc: 'ผสมเชื้อเพลิงเข้าเครื่อง' },
      ],
      continuesAs: 'intake',
    },
    {
      type: 'linear',
      id: 'intake',
      policy: 'เริ่มวัฏจักรดูด (Start Intake)',
      command: 'ดูดไอดี (Intake)',
      handledBy: ref('engine'),
      resultEvents: [
        { id: 'intake', title: 'ไอดีเต็มกระบอกสูบ', desc: 'ดูดไอดีเสร็จสิ้น' },
      ],
      continuesAs: 'compression',
    },
    {
      type: 'linear',
      id: 'compression',
      policy: 'เริ่มวัฏจักรอัด (Start Comp)',
      command: 'อัดไอดี (Compression)',
      handledBy: ref('engine'),
      resultEvents: [
        { id: 'comp', title: 'แรงดันถึงจุดสูงสุด', desc: 'อัดไอดีเสร็จสิ้น' },
      ],
      continuesAs: 'combustion',
    },
    {
      type: 'linear',
      id: 'combustion',
      policy: 'สั่งจุดระเบิด (Start Comb)',
      command: 'จุดระเบิด (Combustion)',
      handledBy: ref('engine'),
      resultEvents: [
        { id: 'comb', title: 'แรงระเบิดดันลูกสูบ', desc: 'การระเบิดเสร็จสิ้น' },
      ],
      continuesAs: 'exhaust',
    },
    {
      type: 'linear',
      id: 'exhaust',
      policy: 'เริ่มวัฏจักรคาย (Start Exh)',
      command: 'คายไอเสีย (Exhaust)',
      handledBy: ref('engine'),
      resultEvents: [
        { id: 'power_transfer', title: 'ส่งกำลังลงข้อเหวี่ยง', desc: 'สร้างแรงบิด (Power Transfer)' },
      ],
      continuesAs: 'transmission',
    },
    {
      type: 'linear',
      id: 'transmission',
      policy: 'เริ่มส่งกำลัง (Start Transmission)',
      command: 'ส่งกำลังทดรอบ (Shift Gear)',
      handledBy: ref('transmission'),
      resultEvents: [
        { id: 'wheel_spin', title: 'ล้อหมุนขับเคลื่อน', desc: 'รถเคลื่อนที่' },
      ],
    },
  ],
  journeys: [
    {
      id: '4-stroke-cycle',
      label: 'วัฏจักรเครื่องยนต์ 4 จังหวะ และการส่งกำลัง',
      description: 'ขั้นตอนการทำงานตั้งแต่บิดคันเร่งจนถึงการส่งกำลังไปที่ล้อ',
      steps: [
        { nodeId: 'throttle', description: 'ผู้ขับขี่บิดคันเร่งเพื่อเพิ่มความเร็ว' },
        { nodeId: 'fuel_mix', description: 'คาร์บูเรเตอร์ผสมน้ำมันและอากาศ' },
        { nodeId: 'intake', description: '1. ดูด: วาล์วไอดีเปิด ลูกสูบเลื่อนลง ดูดไอดีเข้ากระบอกสูบ' },
        { nodeId: 'comp', description: '2. อัด: ลูกสูบเลื่อนขึ้น อัดไอดีให้มีความหนาแน่นเตรียมจุดระเบิด' },
        { nodeId: 'comb', description: '3. ระเบิด: หัวเทียนจุดประกายไฟ ดันลูกสูบลงอย่างแรง สร้างกำลัง' },
        { nodeId: 'power_transfer', description: '4. คาย: วาล์วไอเสียเปิด ลูกสูบเลื่อนขึ้นดันไอเสียออก' },
        { nodeId: 'power_transfer', description: 'กำลังจากการจุดระเบิดส่งผ่านก้านสูบลงสู่เพลาข้อเหวี่ยง' },
        { nodeId: 'transmission', description: 'เกียร์ทดรอบและส่งกำลังผ่านโซ่/สายพาน' },
        { nodeId: 'wheel_spin', description: 'ส่งกำลังไปที่ล้อหลัง ทำให้มอเตอร์ไซค์ขับเคลื่อนไปข้างหน้า' },
      ],
    },
  ],
};

/**
 * Choke / Cold Start System
 * Independent flow: choke on → rich mix → cold start → engine warm → choke off
 */
export const chokeFlow: AbstractFlow = {
  actors: {
    rider: {
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์',
    },
  },
  systems: {
    choke_valve: {
      title: 'วาล์วโช้ค (Choke Valve)',
      desc: 'ควบคุมปริมาณอากาศที่เข้าสู่คาร์บูเรเตอร์',
      type: 'aggregate',
    },
    engine_warm: {
      title: 'เครื่องยนต์อุ่นตัว (Engine Warms Up)',
      desc: 'อุณหภูมิเครื่องยนต์สูงขึ้นเรื่อยๆ',
      type: 'aggregate',
    },
  },
  steps: [
    {
      type: 'linear',
      id: 'choke_on',
      initiatedBy: ref('rider'),
      command: 'เปิดโช้ค (Turn Choke On)',
      policy: 'ใช้ส่วนผสมรวยน้ำมัน (Rich Mix Decision)',
      handledBy: ref('choke_valve'),
      resultEvents: [
        { id: 'rich_mix', title: 'ส่วนผสมรวยน้ำมัน (Rich Mixture)', desc: 'อัตราส่วนน้ำมัน:อากาศสูงกว่าปกติ' },
      ],
      continuesAs: 'rich-mix-branch',
    },
    {
      type: 'branch',
      id: 'rich-mix-branch',
      event: 'rich_mix',
      branches: [
        {
          id: 'cold_start',
          label: 'สตาร์ทเครื่อง',
          policy: 'เลือกสตาร์ทเครื่อง (Choose Cold Start)',
          command: 'สตาร์ทเครื่องเย็น (Cold Start Engine)',
          handledBy: ref('engine_warm'),
          resultEvents: [
            { id: 'engine_warm', title: 'เครื่องอุ่นแล้ว (Engine Warm)', desc: 'อุณหภูมิเครื่องยนต์ถึงระดับทำงานปกติ' },
          ],
          continuesAs: 'choke_off',
        },
        {
          id: 'ride_choke',
          label: 'ลืมปิดโช้ค',
          dashed: true,
          policy: 'ลืมปิดโช้ค (Forgot Choke)',
          command: 'ขี่รถโดยลืมปิดโช้ค (Ride With Choke)',
          handledBy: ref('choke_valve'),
          resultEvents: [
            { id: 'choke_forget', title: 'วิ่ง โช้คค้าง (Riding With Choke On)', desc: 'ส่วนผสมรวยน้ำมันเกินไป ทำให้หัวเทียนสกปรกและกินน้ำมัน' },
          ],
        },
      ],
    },
    {
      type: 'linear',
      id: 'choke_off',
      policy: 'ปิดโช้ค (Turn Choke Off)',
      command: 'ปิดโช้ค (Choke Off)',
      handledBy: ref('choke_valve'),
      resultEvents: [
        { id: 'normal_mix', title: 'ส่วนผสมปกติ (Normal Mixture)', desc: 'อัตราส่วนน้ำมัน:อากาศกลับสู่ค่ามาตรฐาน' },
      ],
    },
  ],
  journeys: [
    {
      id: 'choke-cold-start',
      label: 'สตาร์ทเครื่องเย็น (Cold Start)',
      description: 'เปิดโช้ค → สตาร์ท → เครื่องอุ่น → ปิดโช้ค → ผสมส่วนปกติ',
      steps: [
        { nodeId: 'choke_on', description: 'ผู้ขับขี่เปิดโช้คก่อนสตาร์ทเครื่องเย็น' },
        { nodeId: 'rich_mix', description: 'วาล์วโช้คปิดช่องอากาศบางส่วน จำกัดอากาศเข้าคาร์บู' },
        { nodeId: 'rich_mix', description: 'ส่วนผสมรวยน้ำมัน (น้ำมัน:อากาศสูงกว่าปกติ)' },
        { nodeId: 'cold_start', description: 'เครื่องยนต์เริ่มทำงานด้วยส่วนผสมรวยน้ำมัน' },
        { nodeId: 'engine_warm', description: 'เครื่องยนต์ค่อยๆ อุ่นตัว อุณหภูมิสูงขึ้น' },
        { nodeId: 'engine_warm', description: 'เครื่องอุ่นถึงอุณหภูมิทำงานปกติแล้ว' },
        { nodeId: 'choke_off', description: 'ปิดโช้ค เปิดช่องอากาศกลับสู่ปกติ' },
        { nodeId: 'normal_mix', description: 'ส่วนผสมกลับสู่มาตรฐาน เครื่องทำงานเรียบ' },
      ],
    },
    {
      id: 'choke-forgot-off',
      label: 'ลืมปิดโช้ค (Forgot to Turn Off Choke)',
      description: 'เปิดโช้ค → ลืมปิด → วิ่งโช้คค้าง → รถเร่งไม่ขึ้น',
      steps: [
        { nodeId: 'choke_on', description: 'ผู้ขับขี่เปิดโช้คก่อนสตาร์ทเครื่องเย็น' },
        { nodeId: 'rich_mix', description: 'วาล์วโช้คปิดช่องอากาศบางส่วน' },
        { nodeId: 'rich_mix', description: 'ส่วนผสมรวยน้ำมัน' },
        { nodeId: 'ride_choke', description: 'บิดคันเร่งขณะที่โช้คยังเปิดอยู่' },
        { nodeId: 'choke_forget', description: 'หัวเทียนสกปรก กินน้ำมัน รถเร่งไม่ขึ้น' },
      ],
    },
  ],
};

/**
 * Fuel Injection System (EFI)
 * Independent flow: throttle → ECU → injector → atomized fuel
 */
export const fuelInjectFlow: AbstractFlow = {
  actors: {
    rider: {
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์',
    },
  },
  systems: {
    ecu: {
      title: 'กล่อง ECU (Electronic Control Unit)',
      desc: 'สมองกลคำนวณปริมาณน้ำมันที่แม่นยำ',
      type: 'aggregate',
    },
    fuel_injector: {
      title: 'หัวฉีด (Fuel Injector)',
      desc: 'พ่นละอองน้ำมันเชื้อเพลิงเข้าสู่ท่อไอดี',
      type: 'aggregate',
    },
  },
  steps: [
    {
      type: 'linear',
      id: 'inject_throttle',
      initiatedBy: ref('rider'),
      command: 'บิดคันเร่ง (Injector Mode)',
      policy: 'คำนวณอัตราส่วนผสม (Calculate Fuel Ratio)',
      handledBy: ref('ecu'),
      resultEvents: [
        { id: 'sensor_read', title: 'รับค่าจากเซ็นเซอร์ (Sensor Data)', desc: 'ข้อมูลรอบเครื่อง ตำแหน่งคันเร่ง อุณหภูมิเครื่อง อากาศเข้า' },
      ],
      continuesAs: 'inject_fuel',
    },
    {
      type: 'linear',
      id: 'inject_fuel',
      policy: 'คำนวณอัตราส่วนผสม (Calculate Fuel Ratio)',
      command: 'สั่งงานหัวฉีด (Activate Injector)',
      handledBy: ref('fuel_injector'),
      resultEvents: [
        { id: 'fuel_atomized', title: 'ละอองน้ำมันเข้าสู่ท่อไอดี', desc: 'น้ำมันถูกทำให้เป็นละอองละเอียดผสมกับอากาศ' },
      ],
      continuesAs: 'fuel-branch',
    },
    {
      type: 'branch',
      id: 'fuel-branch',
      event: 'fuel_atomized',
      branches: [
        {
          id: 'precise_mix',
          label: 'ปกติ',
          policy: 'ฉีดน้ำมันปกติ (Normal Injection)',
          command: 'ใช้ส่วนผสมแม่นยำ (Use Precise Mixture)',
          handledBy: ref('fuel_injector'),
          resultEvents: [
            { id: 'precise_mix', title: 'ส่วนผสมแม่นยำ (Precise Mixture)', desc: 'อัตราส่วนที่แม่นยำตามสภาวะการทำงาน' },
          ],
        },
        {
          id: 'inject_cold',
          label: 'เครื่องเย็น',
          dashed: true,
          policy: 'เพิ่มส่วนผสมอัตโนมัติ (Auto Cold Enrichment)',
          command: 'เพิ่มส่วนผสมอัตโนมัติ (Auto Cold Enrichment Action)',
          handledBy: ref('fuel_injector'),
          resultEvents: [
            { id: 'inject_cold_auto', title: 'เพิ่มส่วนผสมอัตโนมัติ (Auto Cold Enrichment)', desc: 'ECU เพิ่มน้ำมันอัตโนมัติเมื่อเครื่องเย็น' },
          ],
        },
      ],
    },
  ],
  journeys: [
    {
      id: 'fuel-injection-normal',
      label: 'หัวฉีดปกติ (Normal Fuel Injection)',
      description: 'บิดคันเร่ง → ECU คำนวณ → หัวฉีดพ่น → ละอองน้ำมัน → ผสมส่วนแม่นยำ',
      steps: [
        { nodeId: 'inject_throttle', description: 'ผู้ขับขี่บิดคันเร่ง เซ็นเซอร์ตรวจวัดการบิด' },
        { nodeId: 'sensor_read', description: 'กล่อง ECU รับสัญญาณจากเซ็นเซอร์หลายตัว' },
        { nodeId: 'sensor_read', description: 'ข้อมูลรอบเครื่อง ตำแหน่งคันเร่ง อุณหภูมิเครื่อง อากาศเข้า' },
        { nodeId: 'inject_fuel', description: 'ECU คำนวณปริมาณน้ำมันที่เหมาะสมตามสภาวะ' },
        { nodeId: 'fuel_atomized', description: 'หัวฉีดพ่นละอองน้ำมันเข้าสู่ท่อไอดี' },
        { nodeId: 'fuel_atomized', description: 'น้ำมันเป็นละอองละเอียด ผสมกับอากาศ' },
        { nodeId: 'precise_mix', description: 'ใช้ส่วนผสมที่คำนวณแม่นยำตามสภาวะ' },
        { nodeId: 'precise_mix', description: 'ได้อัตราส่วนแม่นยำ ประหยัดน้ำมันและสตาร์ทง่าย' },
      ],
    },
    {
      id: 'fuel-injection-cold',
      label: 'เพิ่มส่วนผสมอัตโนมัติ (Auto Cold Enrichment)',
      description: 'บิดคันเร่ง → ECU ตรวจเครื่องเย็น → เพิ่มน้ำมันอัตโนมัติ',
      steps: [
        { nodeId: 'inject_throttle', description: 'ผู้ขับขี่บิดคันเร่ง เซ็นเซอร์ตรวจวัดการบิด' },
        { nodeId: 'sensor_read', description: 'กล่อง ECU รับสัญญาณจากเซ็นเซอร์หลายตัว' },
        { nodeId: 'sensor_read', description: 'ข้อมูลรอบเครื่อง ตำแหน่งคันเร่ง อุณหภูมิเครื่อง อากาศเข้า' },
        { nodeId: 'inject_fuel', description: 'ECU ตรวจพบเครื่องเย็น สั่งเพิ่มส่วนผสม' },
        { nodeId: 'inject_cold', description: 'ECU เพิ่มปริมาณน้ำมันอัตโนมัติ' },
        { nodeId: 'inject_cold_auto', description: 'หัวฉีดพ่นน้ำมันมากขึ้นเพื่อช่วยสตาร์ทเครื่องเย็น' },
        { nodeId: 'inject_cold_auto', description: 'ไม่ต้องใช้โช้ค ระบบปรับอัตโนมัติ' },
      ],
    },
  ],
};

/**
 * Brake System
 * Completely independent from all other systems.
 */
export const brakeFlow: AbstractFlow = {
  actors: {
    rider: {
      title: 'ผู้ขับขี่ (Rider)',
      desc: 'ผู้ใช้งานมอเตอร์ไซค์',
    },
  },
  systems: {
    brake_master: {
      title: 'กระปุกเบรก (Brake Master Cylinder)',
      desc: 'เปลี่ยนแรงกดเป็นแรงดันไฮดรอลิก',
      type: 'aggregate',
    },
    brake_caliper: {
      title: 'แคลิเพอร์และจานเบรก (Brake Caliper & Disc)',
      desc: 'ระบบสร้างแรงเสียดทานเพื่อหน่วงล้อ',
      type: 'aggregate',
    },
  },
  steps: [
    {
      type: 'linear',
      id: 'brake',
      initiatedBy: ref('rider'),
      command: 'กดคันเบรก (Apply Brake)',
      policy: 'แคลิเพอร์รับแรงดัน (Caliper Activates)',
      handledBy: ref('brake_master'),
      resultEvents: [
        { id: 'brake_pressure', title: 'น้ำมันเบรกดันไปแคลิเพอร์', desc: 'แรงดันไฮดรอลิกส่งผ่านท่อเบรก' },
      ],
      continuesAs: 'caliper_squeeze',
    },
    {
      type: 'linear',
      id: 'caliper_squeeze',
      policy: 'แคลิเพอร์รับแรงดัน (Caliper Activates)',
      command: 'กดผ้าเบรกเข้าจานเบรก',
      handledBy: ref('brake_caliper'),
      resultEvents: [
        { id: 'wheel_slowed', title: 'ล้อช้าลง (Wheel Slowed)', desc: 'พลังงานจลน์เปลี่ยนเป็นความร้อน รถชะลอความเร็ว' },
        { id: 'brake_heat', title: 'เกิดความร้อน (Brake Heat)', desc: 'จานเบรกและผ้าเบรกมีความร้อนสูง' },
      ],
      continuesAs: 'brake-branch',
    },
    {
      type: 'branch',
      id: 'brake-branch',
      event: 'brake_heat',
      branches: [
        {
          id: 'brake_normal',
          label: 'ปกติ',
          policy: 'เบรกทำงานปกติ (Normal Brake)',
          command: 'รถหยุดหรือช้าลงตามต้องการ (Normal Brake)',
          handledBy: ref('brake_caliper'),
          resultEvents: [
            { id: 'brake_normal', title: 'รถหยุดหรือช้าลงตามต้องการ', desc: 'เบรกทำงานปกติ' },
          ],
        },
        {
          id: 'brake_fade',
          label: 'ร้อนเกินไป',
          dashed: true,
          policy: 'เบรกจม (Brake Fade)',
          command: 'เบรกจม (Brake Fade Action)',
          handledBy: ref('brake_caliper'),
          resultEvents: [
            { id: 'brake_fade', title: 'เบรกจม (Brake Fade)', desc: 'ประสิทธิภาพเบรกลดลงเพราะความร้อนสูง' },
          ],
        },
      ],
    },
  ],
  journeys: [
    {
      id: 'brake-normal',
      label: 'เบรกปกติ (Normal Braking)',
      description: 'กดเบรก → ไฮดรอลิก → แคลิเพอร์ประกบจาน → รถช้าลง',
      steps: [
        { nodeId: 'brake', description: 'ผู้ขับขี่กดคันเบรกหน้าหรือหลัง' },
        { nodeId: 'brake_pressure', description: 'กระปุกเบรกเปลี่ยนแรงกดเป็นแรงดันไฮดรอลิก' },
        { nodeId: 'brake_pressure', description: 'แรงดันส่งผ่านท่อเบรกไปยังแคลิเพอร์ที่ล้อ' },
        { nodeId: 'caliper_squeeze', description: 'ลูกสูบแคลิเพอร์ดันผ้าเบรกประกบจานเบรก' },
        { nodeId: 'wheel_slowed', description: 'แรงเสียดทานหน่วงการหมุนของล้อ' },
        { nodeId: 'wheel_slowed', description: 'พลังงานจลน์เปลี่ยนเป็นความร้อน รถช้าลง' },
        { nodeId: 'brake_heat', description: 'จานเบรกและผ้าเบรกมีความร้อนสูงขึ้น' },
        { nodeId: 'brake_normal', description: 'เบรกทำงานปกติตามสภาวะ' },
        { nodeId: 'brake_normal', description: 'รถหยุดหรือช้าลงตามต้องการ' },
      ],
    },
    {
      id: 'brake-fade',
      label: 'เบรกจม (Brake Fade)',
      description: 'กดเบรก → เบรกหนักต่อเนื่อง → ร้อนเกิน → ประสิทธิภาพลด',
      steps: [
        { nodeId: 'brake', description: 'ผู้ขับขี่กดคันเบรกหน้าหรือหลัง' },
        { nodeId: 'brake_pressure', description: 'กระปุกเบรกเปลี่ยนแรงกดเป็นแรงดันไฮดรอลิก' },
        { nodeId: 'brake_pressure', description: 'แรงดันส่งผ่านท่อเบรกไปยังแคลิเพอร์' },
        { nodeId: 'caliper_squeeze', description: 'ลูกสูบแคลิเพอร์ดันผ้าเบรกประกบจานเบรก' },
        { nodeId: 'brake_heat', description: 'แรงเสียดทานหน่วงการหมุนของล้อ' },
        { nodeId: 'brake_heat', description: 'เบรกใช้งานหนักต่อเนื่อง ความร้อนสะสมสูง' },
        { nodeId: 'brake_fade', description: 'ความร้อนสูงเกินค่าจำกัด' },
        { nodeId: 'brake_fade', description: 'ประสิทธิภาพเบรกลดลง (เบรกจม) ต้องหยุดพักให้เบรกเย็นลง' },
      ],
    },
  ],
};
