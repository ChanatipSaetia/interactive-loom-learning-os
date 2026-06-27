import type { TradeoffScenario } from '../../../sections/tradeoff-sandbox'

export const motorcycleTradeoffs: TradeoffScenario[] = [
  {
    id: 'engine-oil',
    title: 'ประเภทของน้ำมันเครื่อง',
    description: 'เลือกน้ำมันเครื่องที่เหมาะสมกับการใช้งานและงบประมาณของคุณ ซึ่งจะส่งผลโดยตรงต่ออายุการใช้งานเครื่องยนต์',
    metrics: [
      { id: 'protection', label: 'การปกป้องเครื่องยนต์', baseValue: 0 },
      { id: 'lifespan', label: 'ระยะเวลาใช้งาน', baseValue: 0 },
      { id: 'price', label: 'ความประหยัด (ราคา)', baseValue: 0, direction: 'lower' }
    ],
    steps: [
      {
        id: 'oil-type',
        title: 'เลือกชนิดน้ำมันเครื่อง',
        description: 'ชนิดของน้ำมันเครื่องที่คุณต้องการเปลี่ยน',
        recommended: 'semi-synthetic',
        choices: [
          {
            id: 'synthetic',
            label: 'สังเคราะห์แท้ 100% (Fully Synthetic)',
            description: 'น้ำมันเครื่องที่ผ่านการสังเคราะห์ทางเคมี ทนความร้อนสูง หล่อลื่นได้ดีเยี่ยมที่สุด',
            metrics: {
              protection: 95,
              lifespan: 90,
              price: -80
            },
            pros: [
              { title: 'ปกป้องดีเยี่ยม', description: 'ทนความร้อนสูง เครื่องยนต์ไม่สึกหรอง่าย' },
              { title: 'อายุการใช้งานยาวนาน', description: 'เปลี่ยนถ่ายทุกๆ 5,000 - 10,000 กม.' }
            ],
            cons: [
              { title: 'ราคาสูง', description: 'แพงกว่าน้ำมันเครื่องธรรมดาหลายเท่า' }
            ],
            whyThisFits: 'เหมาะสำหรับรถที่ใช้งานหนัก วิ่งระยะทางไกล หรือรถบิ๊กไบค์ที่ต้องการการปกป้องสูงสุด',
            whenToUse: 'เมื่อคุณต้องการให้น้ำมันเครื่องมีอายุการใช้งานนานที่สุด'
          },
          {
            id: 'semi-synthetic',
            label: 'กึ่งสังเคราะห์ (Semi-Synthetic)',
            description: 'ส่วนผสมระหว่างน้ำมันแร่ธรรมชาติและน้ำมันสังเคราะห์ คุ้มค่าและให้การปกป้องที่ดี',
            metrics: {
              protection: 75,
              lifespan: 70,
              price: -40
            },
            pros: [
              { title: 'ราคาคุ้มค่า', description: 'ราคาไม่แพงจนเกินไป ได้คุณสมบัติที่ดีจากน้ำมันสังเคราะห์' }
            ],
            cons: [
              { title: 'อายุการใช้งานปานกลาง', description: 'เปลี่ยนถ่ายทุกๆ 3,000 - 5,000 กม.' }
            ],
            whyThisFits: 'เป็นตัวเลือกที่สมดุลที่สุดสำหรับรถใช้งานทั่วไปในชีวิตประจำวัน'
          },
          {
            id: 'mineral',
            label: 'ธรรมดา (Mineral)',
            description: 'น้ำมันเครื่องพื้นฐานที่กลั่นจากน้ำมันดิบ ราคาถูกที่สุด แต่ต้องเปลี่ยนถ่ายบ่อย',
            metrics: {
              protection: 50,
              lifespan: 40,
              price: -10
            },
            pros: [
              { title: 'ราคาถูกที่สุด', description: 'ประหยัดค่าใช้จ่ายในการเปลี่ยนถ่ายแต่ละครั้ง' }
            ],
            cons: [
              { title: 'เสื่อมสภาพเร็ว', description: 'ต้องเปลี่ยนถ่ายบ่อย (ทุกๆ 1,500 - 2,000 กม.)' },
              { title: 'ทนความร้อนต่ำ', description: 'ไม่เหมาะกับการขับขี่ทางไกลแบบแช่ยาวๆ' }
            ],
            whenToUse: 'เหมาะสำหรับรถใช้งานระยะใกล้ หรือรถรุ่นเก่าที่ไม่ต้องการการดูแลเป็นพิเศษ'
          }
        ]
      }
    ]
  },
  {
    id: 'tires',
    title: 'ประเภทยางรถมอเตอร์ไซค์',
    description: 'ประเภทยางมีผลต่อความปลอดภัยเมื่อเกิดการรั่วซึม และความสะดวกในการปะยาง',
    metrics: [
      { id: 'safety', label: 'ความปลอดภัยเมื่อยางรั่ว', baseValue: 0 },
      { id: 'convenience', label: 'ความสะดวกในการปะยาง', baseValue: 0 },
      { id: 'price', label: 'ความประหยัด (ราคายางและล้อ)', baseValue: 0, direction: 'lower' }
    ],
    steps: [
      {
        id: 'tire-type',
        title: 'เลือกประเภทยาง',
        description: 'เลือกลักษณะยางที่ใช้กับล้อรถของคุณ',
        recommended: 'tubeless',
        choices: [
          {
            id: 'tubeless',
            label: 'แบบไม่มียางใน (Tubeless)',
            description: 'ใช้ร่วมกับล้อแม็ก หากโดนตะปูตำลมจะค่อยๆ ซึมออก ไม่แบนทันที',
            metrics: {
              safety: 90,
              convenience: 95,
              price: -70
            },
            pros: [
              { title: 'ปลอดภัยสูง', description: 'ลมไม่รั่วออกทันทีเมื่อโดนตะปู รถไม่ส่ายเสียอาการ' },
              { title: 'ปะยางง่าย', description: 'สามารถแทงไหมอุดรูรั่วได้เลย ไม่ต้องถอดล้อ' }
            ],
            cons: [
              { title: 'ต้นทุนสูง', description: 'ต้องใช้ร่วมกับล้อแม็กซึ่งมีราคาแพง' }
            ],
            whyThisFits: 'เพิ่มความปลอดภัยสูงสุด ลดปัญหาจอดตายกลางทางจากยางรั่ว'
          },
          {
            id: 'tube-type',
            label: 'แบบมียางใน (Tube Type)',
            description: 'มักใช้กับล้อซี่ลวด หากโดนตะปูตำยางจะแบนทันที',
            metrics: {
              safety: 30,
              convenience: 40,
              price: -30
            },
            pros: [
              { title: 'ราคาถูก', description: 'ยางและล้อซี่ลวดมีราคาถูกกว่า' },
              { title: 'รับแรงกระแทกได้ดี', description: 'ล้อซี่ลวดมีความยืดหยุ่นสูง เหมาะกับทางวิบาก' }
            ],
            cons: [
              { title: 'อันตรายถ้ายางรั่วตอนวิ่งเร็ว', description: 'ยางจะแบนทันที รถอาจจะเสียการควบคุม' },
              { title: 'ปะยาก', description: 'ต้องถอดล้อเพื่องัดยางในออกมาปะ' }
            ],
            whenToUse: 'เหมาะสำหรับรถคลาสสิก ล้อซี่ลวด หรือรถวิบากลุยป่า'
          }
        ]
      }
    ]
  }
]
