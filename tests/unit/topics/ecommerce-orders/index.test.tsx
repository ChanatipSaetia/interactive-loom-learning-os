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

  it('SWIMLANES view has dynamic per-entity lane groups', () => {
    const compiledSchema = autoDeriveViews(orderSchema)
    const slView = compiledSchema.views.SWIMLANES
    expect(slView).toBeDefined()
    expect(slView.groups.length).toBe(7)
    slView.groups.forEach(g => {
      expect(g.isLane).toBe(true)
    })
  })
})
