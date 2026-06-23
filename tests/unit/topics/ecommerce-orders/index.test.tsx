import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import EcommerceOrdersTopic from '../../../../src/topics/ecommerce-orders/index'
import { routes } from '../../../../src/core/routes'
import { ecommerceOrdersSections } from '../../../../src/topics/ecommerce-orders/sections'
import { orderSchema } from '../../../../src/topics/ecommerce-orders/data/order-schema'
import { autoDeriveViews } from '../../../../src/sections/flowchart/derivations'

const renderedConfigs: { type?: string }[] = []

const mockSectionRenderer = vi.fn((config: { type?: string }) => {
  renderedConfigs.push(config)
  return <div data-testid="mock-section" data-section-type={config?.type} />
})

vi.mock('../../../../src/components/layout/TopicShell', () => ({
  SectionRenderer: ({ config }: { config: { type?: string } }) => mockSectionRenderer(config),
}))

function renderEcommerceOrdersTopic(path = '/topics/ecommerce-orders') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:topicId/*" element={<EcommerceOrdersTopic />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Issue #56: E-Commerce Order Processing Topic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderedConfigs.length = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ecommerce-orders route is available at /topics/ecommerce-orders', () => {
    const route = routes.find((r) => r.id === 'ecommerce-orders')
    expect(route).toBeDefined()
    expect(route?.path).toBe('/topics/ecommerce-orders')
  })

  it('ecommerce-orders route has correct category and description', () => {
    const route = routes.find((r) => r.id === 'ecommerce-orders')
    expect(route?.category).toBe('Architecture')
    expect(route?.description).toContain('inventory lock')
    expect(route?.description).toContain('fraud detection')
  })

  it('ecommerce-orders route has all required section types', () => {
    const route = routes.find((r) => r.id === 'ecommerce-orders')
    expect(route).toBeDefined()
    const sectionTypes = route?.sections.map((s) => s.type) || []
    expect(sectionTypes).toContain('text')
    expect(sectionTypes).toContain('flowchart')
    expect(sectionTypes).toContain('bullets')
  })

  it('ecommerce-orders topic renders all sections from config in order', () => {
    renderEcommerceOrdersTopic()

    const expectedSections = ecommerceOrdersSections.length
    const renderedSections = screen.getAllByTestId('mock-section')
    expect(renderedSections.length).toBe(expectedSections)

    expect(mockSectionRenderer).toHaveBeenCalledTimes(expectedSections)
    for (let i = 0; i < expectedSections; i++) {
      expect(renderedConfigs[i]).toEqual(ecommerceOrdersSections[i])
    }
  })

  it('ecommerce-orders topic renders section types in correct sequence', () => {
    renderEcommerceOrdersTopic()

    const expectedTypes = ecommerceOrdersSections.map((s) => s.type)

    const renderedSections = screen.getAllByTestId('mock-section')
    const renderedTypes = renderedSections.map((el) => el.getAttribute('data-section-type'))

    expect(renderedTypes).toEqual(expectedTypes)
  })

  it('schema has all 5 views', () => {
    const compiledSchema = autoDeriveViews(orderSchema)
    const viewNames = Object.keys(compiledSchema.views)
    expect(viewNames).toContain('EVENT_STORMING')
    expect(viewNames).toContain('SYS_ARCH')
    expect(viewNames).toContain('DATA_FLOW')
    expect(viewNames).toContain('SWIMLANES')
    expect(viewNames).toContain('SEQUENCE')
  })

  it('schema has 2 journeys', () => {
    expect(orderSchema.journeys.length).toBe(2)
    expect(orderSchema.journeys[0].id).toBe('instant-checkout')
    expect(orderSchema.journeys[1].id).toBe('fraud-review-block')
  })

  it('instant checkout journey has 5 steps', () => {
    const instantCheckout = orderSchema.journeys.find((j) => j.id === 'instant-checkout')
    expect(instantCheckout).toBeDefined()
    expect(instantCheckout?.steps.length).toBe(5)
  })

  it('fraud review block journey has 6 steps', () => {
    const fraudReview = orderSchema.journeys.find((j) => j.id === 'fraud-review-block')
    expect(fraudReview).toBeDefined()
    expect(fraudReview?.steps.length).toBe(6)
  })

  it('order service aggregate has state machine definition', () => {
    const orderService = orderSchema.entities['order_service']
    expect(orderService.stateMachine).toBeDefined()
    expect(orderService.stateMachine?.states.length).toBe(7)
    const stateIds = orderService.stateMachine?.states.map((s) => s.id) || []
    expect(stateIds).toContain('PENDING')
    expect(stateIds).toContain('INVENTORY_LOCKED')
    expect(stateIds).toContain('PAYMENT_AUTHORIZED')
    expect(stateIds).toContain('CONFIRMED')
    expect(stateIds).toContain('FRAUD_REVIEW')
    expect(stateIds).toContain('CANCELLED')
  })

  it('order database has 4 ERD tables', () => {
    const db = orderSchema.entities['order_db']
    expect(db.erdSchema).toBeDefined()
    expect(db.erdSchema?.length).toBe(4)
    const tableNames = db.erdSchema?.map((t) => t.name) || []
    expect(tableNames).toContain('orders')
    expect(tableNames).toContain('order_items')
    expect(tableNames).toContain('payments')
    expect(tableNames).toContain('fraud_evaluations')
  })

  it('orders table has correct columns', () => {
    const db = orderSchema.entities['order_db']
    const orders = db.erdSchema?.find((t) => t.name === 'orders')
    expect(orders).toBeDefined()
    const colNames = orders?.columns.map((c) => c.name) || []
    expect(colNames).toContain('id')
    expect(colNames).toContain('customer_id')
    expect(colNames).toContain('status')
    expect(colNames).toContain('total_amount')
    expect(colNames).toContain('fraud_risk_level')
  })

  it('order_items table has product and quantity columns', () => {
    const db = orderSchema.entities['order_db']
    const items = db.erdSchema?.find((t) => t.name === 'order_items')
    expect(items).toBeDefined()
    const colNames = items?.columns.map((c) => c.name) || []
    expect(colNames).toContain('order_id')
    expect(colNames).toContain('product_id')
    expect(colNames).toContain('quantity')
    expect(colNames).toContain('unit_price')
    expect(colNames).toContain('subtotal')
  })

  it('payments table has stripe and capture columns', () => {
    const db = orderSchema.entities['order_db']
    const payments = db.erdSchema?.find((t) => t.name === 'payments')
    expect(payments).toBeDefined()
    const colNames = payments?.columns.map((c) => c.name) || []
    expect(colNames).toContain('order_id')
    expect(colNames).toContain('stripe_payment_intent_id')
    expect(colNames).toContain('amount')
    expect(colNames).toContain('status')
    expect(colNames).toContain('captured')
  })

  it('fraud_evaluations table has risk score and signals columns', () => {
    const db = orderSchema.entities['order_db']
    const fraud = db.erdSchema?.find((t) => t.name === 'fraud_evaluations')
    expect(fraud).toBeDefined()
    const colNames = fraud?.columns.map((c) => c.name) || []
    expect(colNames).toContain('order_id')
    expect(colNames).toContain('risk_score')
    expect(colNames).toContain('risk_level')
    expect(colNames).toContain('signals')
    expect(colNames).toContain('reviewed_by')
    expect(colNames).toContain('decision')
  })

  it('fraud review block step 4 triggers escalation process group', () => {
    const fraudReview = orderSchema.journeys.find((j) => j.id === 'fraud-review-block')
    const step4 = fraudReview?.steps[3]
    expect(step4).toBeDefined()
    expect(step4?.processGroup).toBe('evaluation')
    expect(step4?.description).toContain('0.87')
  })

  it('fraud review block step 5 triggers escalation process group', () => {
    const fraudReview = orderSchema.journeys.find((j) => j.id === 'fraud-review-block')
    const step5 = fraudReview?.steps[4]
    expect(step5).toBeDefined()
    expect(step5?.processGroup).toBe('escalation')
    expect(step5?.description).toContain('Risk Ops')
  })

  it('stripe external entity has payments ERD schema', () => {
    const stripe = orderSchema.entities['stripe']
    expect(stripe.erdSchema).toBeDefined()
    expect(stripe.erdSchema?.length).toBe(1)
    expect(stripe.erdSchema?.[0].name).toBe('payments')
  })

  it('fraud service has fraud_evaluations ERD schema', () => {
    const fraudService = orderSchema.entities['fraud_service']
    expect(fraudService.erdSchema).toBeDefined()
    expect(fraudService.erdSchema?.length).toBe(1)
    expect(fraudService.erdSchema?.[0].name).toBe('fraud_evaluations')
  })

  it('inventory service has inventory_locks ERD schema', () => {
    const inventoryService = orderSchema.entities['inventory_service']
    expect(inventoryService.erdSchema).toBeDefined()
    expect(inventoryService.erdSchema?.length).toBe(1)
    expect(inventoryService.erdSchema?.[0].name).toBe('inventory_locks')
  })

  it('evt_order_placed has jsonPayload with order details', () => {
    const evt = orderSchema.entities['evt_order_placed']
    expect(evt.jsonPayload).toBeDefined()
    expect(evt.jsonPayload?.payload).toHaveProperty('orderId')
    expect(evt.jsonPayload?.payload).toHaveProperty('items')
    expect(evt.jsonPayload?.payload).toHaveProperty('totalAmount')
  })

  it('evt_fraud_evaluated has jsonPayload with risk signals', () => {
    const evt = orderSchema.entities['evt_fraud_evaluated']
    expect(evt.jsonPayload).toBeDefined()
    expect(evt.jsonPayload?.payload).toHaveProperty('riskScore')
    expect(evt.jsonPayload?.payload).toHaveProperty('riskLevel')
    expect(evt.jsonPayload?.payload).toHaveProperty('signals')
  })

  it('evt_fraud_flagged has jsonPayload with failure signals', () => {
    const evt = orderSchema.entities['evt_fraud_flagged']
    expect(evt.jsonPayload).toBeDefined()
    expect(evt.jsonPayload?.payload).toHaveProperty('riskScore')
    expect(evt.jsonPayload?.payload).toHaveProperty('actionRequired')
    expect(evt.jsonPayload?.payload).toHaveProperty('actionRequired', 'manual_review')
  })

  it('renders topic container with test id', () => {
    renderEcommerceOrdersTopic()
    const container = document.querySelector('.ecommerce-orders-topic')
    expect(container).toBeInTheDocument()
    expect(container?.getAttribute('data-testid')).toBe('ecommerce-orders-topic')
  })

  it('EVENT_STORMING view has 4 groups', () => {
    const esView = orderSchema.views.EVENT_STORMING
    expect(esView.groups.length).toBe(4)
    const groupTitles = esView.groups.map((g) => g.title)
    expect(groupTitles).toContain('Checkout & Inventory')
    expect(groupTitles).toContain('Payment Authorization')
    expect(groupTitles).toContain('Fraud Evaluation & Auto-Approve')
    expect(groupTitles).toContain('Fraud Review & Decision')
  })

  it('SWIMLANES view has 3 lane groups', () => {
    const compiledSchema = autoDeriveViews(orderSchema)
    const slView = compiledSchema.views.SWIMLANES
    expect(slView).toBeDefined()
    expect(slView.groups.length).toBe(3)
    expect(slView.groups[0].isLane).toBe(true)
    expect(slView.groups[1].isLane).toBe(true)
    expect(slView.groups[2].isLane).toBe(true)
  })
})
