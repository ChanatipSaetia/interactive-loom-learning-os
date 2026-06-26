import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

export const orderSchema: UnifiedFlowchartSchema = {
  entities: {
    // ── Actors ────────────────────────────────────────────────────────
    'customer': {
      title: 'Customer',
      desc: 'Shopper placing orders through the e-commerce storefront.',
      type: TYPES.USER,
    },
    'risk_analyst': {
      title: 'Risk Ops Analyst',
      desc: 'Human analyst who reviews high-risk orders flagged by the fraud detection system.',
      type: TYPES.USER,
    },

    // ── Aggregates / Services ─────────────────────────────────────────
    'order_service': {
      title: 'Order Service',
      desc: 'Core orchestration service managing order lifecycle, inventory coordination, and payment flow.',
      type: TYPES.AGGREGATE,
      stateMachine: {
        states: [
          { id: 'PENDING', label: 'Pending', color: 'var(--ctp-overlay1)' },
          { id: 'INVENTORY_LOCKED', label: 'Inventory Locked', color: 'var(--ctp-blue)' },
          { id: 'PAYMENT_AUTHORIZED', label: 'Payment Auth', color: 'var(--ctp-yellow)' },
          { id: 'FRAUD_CLEARED', label: 'Fraud Cleared', color: 'var(--ctp-green)' },
          { id: 'CONFIRMED', label: 'Confirmed', color: 'var(--ctp-teal)' },
          { id: 'FRAUD_REVIEW', label: 'Fraud Review', color: 'var(--ctp-maroon)' },
          { id: 'CANCELLED', label: 'Cancelled', color: 'var(--ctp-red)' },
        ],
        initialState: 'PENDING',
      },
    },

    // Split aggregates for Event Storming detail
    'order_checkout': {
      title: 'Order Service',
      desc: 'Handles checkout: creates order record, validates cart.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'order_service'
    },

    'order_fulfill': {
      title: 'Order Service',
      desc: 'Handles fulfillment: confirms order, triggers shipping.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'order_service'
    },

    'inventory_service': {
      title: 'Inventory Service',
      viewTitles: { SEQUENCE: 'Inventory' },
      desc: 'Checks product availability and locks stock for the order duration.',
      type: TYPES.AGGREGATE,
    },

    'fraud_service': {
      title: 'Fraud Detection',
      viewTitles: { SEQUENCE: 'Fraud Engine' },
      desc: 'Evaluates order risk using ML models, velocity checks, and behavioral signals. Returns risk score and level.',
      type: TYPES.AGGREGATE,
    },

    'fraud_policy': {
      title: 'Route by Risk Level',
      desc: 'Evaluates fraud risk score against thresholds. Low-risk orders auto-approve, high-risk orders route to manual review.',
      type: TYPES.POLICY,
    },

    // ── External Systems ──────────────────────────────────────────────
    'stripe': {
      title: 'Stripe',
      desc: 'External payment processor handling card authorization, capture, and webhook callbacks.',
      type: TYPES.EXTERNAL,
    },

    // ── Database ──────────────────────────────────────────────────────
    'order_db': {
      title: 'Order Database',
      desc: 'Persistent storage for orders, line items, payments, and fraud evaluation records.',
      type: TYPES.AGGREGATE,
    },

    // ── Events ────────────────────────────────────────────────────────
    'evt_order_placed': {
      title: 'Order Placed',
      viewTitles: { DATA_FLOW: 'Order Payload' },
      desc: 'Customer submitted checkout with cart items, shipping address, and payment details.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'order_placed',
        payload: {
          orderId: 'ord_9a8b7c',
          customerId: 'cust_001',
          items: [
            { productId: 'prod_widget', quantity: 2, unitPrice: 49.99 },
            { productId: 'prod_cable', quantity: 1, unitPrice: 12.99 }
          ],
          totalAmount: 112.97,
          currency: 'USD',
          shippingAddress: { street: '123 Main St', city: 'Portland', state: 'OR', zip: '97201' },
          timestamp: '2025-06-15T14:22:00Z'
        }
      }
    },

    'evt_inventory_checked': {
      title: 'Inventory Available',
      viewTitles: { DATA_FLOW: 'Stock Check Result' },
      desc: 'Inventory service confirmed all items are in stock.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'stock_check',
        payload: {
          orderId: 'ord_9a8b7c',
          items: [
            { productId: 'prod_widget', requested: 2, available: 147, status: 'available' },
            { productId: 'prod_cable', requested: 1, available: 523, status: 'available' }
          ]
        }
      }
    },

    'evt_inventory_locked': {
      title: 'Inventory Locked',
      desc: 'Stock reserved for this order with a 15-minute expiry window.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'inventory_lock',
        payload: {
          orderId: 'ord_9a8b7c',
          locks: [
            { lockId: 'lock_001', productId: 'prod_widget', quantity: 2, expiresAt: '2025-06-15T14:37:00Z' },
            { lockId: 'lock_002', productId: 'prod_cable', quantity: 1, expiresAt: '2025-06-15T14:37:00Z' }
          ]
        }
      }
    },

    'evt_payment_authorized': {
      title: 'Payment Authorized',
      viewTitles: { DATA_FLOW: 'Auth Webhook' },
      desc: 'Stripe webhook confirms card authorization. Funds held but not yet captured.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'stripe_webhook',
        payload: {
          event: 'payment_intent.succeeded',
          paymentIntentId: 'pi_3OxK9m2eZvKYlo2C',
          orderId: 'ord_9a8b7c',
          amount: 11297,
          currency: 'usd',
          status: 'requires_capture',
          last4: '4242',
          timestamp: '2025-06-15T14:22:15Z'
        }
      }
    },

    'evt_fraud_evaluated': {
      title: 'Fraud Evaluated',
      viewTitles: { DATA_FLOW: 'Risk Assessment' },
      desc: 'Fraud engine scored the order using ML models, velocity checks, and behavioral signals.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'fraud_evaluation',
        payload: {
          orderId: 'ord_9a8b7c',
          riskScore: 0.12,
          riskLevel: 'low',
          signals: [
            { name: 'velocity_check', value: 'pass', detail: '1 order in last 24h (threshold: 5)' },
            { name: 'card_reuse', value: 'pass', detail: 'Card used 3x before with this account' },
            { name: 'address_match', value: 'pass', detail: 'Billing matches shipping address' },
            { name: 'amount_anomaly', value: 'pass', detail: '$112.97 within normal range ($20-$500)' }
          ]
        }
      }
    },

    'evt_order_approved': {
      title: 'Order Auto-Approved',
      desc: 'Low-risk order passes all gates. Payment captured, inventory committed.',
      type: TYPES.EVENT,
    },

    'evt_order_confirmed': {
      title: 'Order Confirmed',
      viewTitles: { DATA_FLOW: 'Confirmation Record' },
      desc: 'Order fully confirmed. Customer notified. Warehouse pick list generated.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'order_confirmation',
        payload: {
          orderId: 'ord_9a8b7c',
          status: 'confirmed',
          confirmationNumber: 'CNF-20250615-0042',
          estimatedShipping: '2025-06-17',
          estimatedDelivery: '2025-06-20',
          notificationSent: true
        }
      }
    },

    'evt_fraud_flagged': {
      title: 'Fraud Flagged',
      viewTitles: { DATA_FLOW: 'Fraud Alert' },
      desc: 'High-risk order flagged. Payment held. Order paused pending manual review.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'fraud_alert',
        payload: {
          orderId: 'ord_9a8b7c',
          riskScore: 0.87,
          riskLevel: 'high',
          signals: [
            { name: 'velocity_check', value: 'fail', detail: '8 orders in last 24h (threshold: 5)' },
            { name: 'new_card', value: 'fail', detail: 'Card first seen, no prior history' },
            { name: 'address_mismatch', value: 'warn', detail: 'Billing ZIP differs from shipping ZIP by 2 states' },
            { name: 'amount_anomaly', value: 'fail', detail: '$2,499.00 exceeds 3-sigma for this customer' }
          ],
          actionRequired: 'manual_review',
          flaggedAt: '2025-06-15T14:22:20Z'
        }
      }
    },

    'evt_review_decision': {
      title: 'Review Decision',
      viewTitles: { DATA_FLOW: 'Analyst Decision' },
      desc: 'Risk analyst reviewed flagged order and made an approval or cancellation decision.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'analyst_decision',
        payload: {
          orderId: 'ord_9a8b7c',
          decision: 'approve',
          reviewerId: 'analyst_003',
          notes: 'Customer called to verify; gift order for corporate event. Authorized by manager.',
          reviewedAt: '2025-06-15T14:45:00Z'
        }
      }
    },

    'evt_order_cancelled': {
      title: 'Order Cancelled',
      desc: 'Order cancelled due to fraud concern. Payment release initiated, inventory unlocked.',
      type: TYPES.EVENT,
    },

    // ── Commands (Event Storming only) ────────────────────────────────
    'cmd_checkout': {
      title: 'Process Checkout',
      desc: 'Create order record and initiate processing pipeline.',
      type: TYPES.COMMAND,
      collapsedTo: 'order_checkout'
    },

    'cmd_check_inventory': {
      title: 'Check Inventory',
      desc: 'Query inventory service for product availability.',
      type: TYPES.COMMAND,
      collapsedTo: 'inventory_service'
    },

    'cmd_lock_inventory': {
      title: 'Lock Inventory',
      desc: 'Reserve stock for the order with time-based expiry.',
      type: TYPES.COMMAND,
      collapsedTo: 'inventory_service'
    },

    'cmd_authorize_payment': {
      title: 'Authorize Payment',
      desc: 'Create Stripe PaymentIntent and authorize card. Awaits webhook callback.',
      type: TYPES.COMMAND,
      collapsedTo: 'stripe'
    },

    'cmd_evaluate_fraud': {
      title: 'Evaluate Fraud',
      desc: 'Send order details to fraud engine for risk scoring.',
      type: TYPES.COMMAND,
      collapsedTo: 'fraud_service'
    },

    'cmd_approve_order': {
      title: 'Approve & Capture',
      desc: 'Capture Stripe payment, commit inventory, and confirm order.',
      type: TYPES.COMMAND,
      collapsedTo: 'order_fulfill'
    },

    'cmd_hold_order': {
      title: 'Hold Order',
      desc: 'Hold payment and pause order processing.',
      type: TYPES.COMMAND,
      collapsedTo: 'order_checkout',
    },

    'cmd_review_order': {
      title: 'Review Order',
      desc: 'Risk analyst manually reviews flagged order and makes approve/cancel decision.',
      type: TYPES.COMMAND,
      collapsedTo: 'risk_analyst'
    },

    'cmd_confirm_order': {
      title: 'Confirm Order',
      desc: 'Approve order and capture payment.',
      type: TYPES.COMMAND,
      collapsedTo: 'order_fulfill',
    },

    'cmd_cancel_order': {
      title: 'Cancel Order',
      desc: 'Cancel order and release payment hold.',
      type: TYPES.COMMAND,
      collapsedTo: 'order_fulfill',
    },

    // ── Policies (Event Storming only) ────────────────────────────────
    'pol_process_checkout': {
      title: 'Process on Order Placed',
      desc: 'When Order Placed, create order record and initiate checkout pipeline.',
      type: TYPES.POLICY,
    },

    'pol_check_inventory': {
      title: 'Check Inventory on Checkout',
      desc: 'When checkout starts, verify all items are in stock.',
      type: TYPES.POLICY,
    },

    'pol_lock_inventory': {
      title: 'Lock on Available',
      desc: 'When Inventory Available, lock stock for order duration.',
      type: TYPES.POLICY,
    },

    'pol_authorize': {
      title: 'Authorize on Lock',
      desc: 'When Inventory Locked, authorize payment through Stripe.',
      type: TYPES.POLICY,
    },

    'pol_evaluate_fraud': {
      title: 'Evaluate Fraud on Auth',
      desc: 'When Payment Authorized, run fraud evaluation before capturing funds.',
      type: TYPES.POLICY,
    },

    'pol_route_risk': {
      title: 'Route by Risk Level',
      desc: 'When Fraud Evaluated, route based on risk score: low-risk auto-approves, high-risk flags for manual review.',
      type: TYPES.POLICY,
      collapsedTo: 'fraud_policy',
    },

    'pol_auto_approve': {
      title: 'Auto-Approve Low Risk',
      desc: 'When risk level is low, capture payment, confirm order, and trigger fulfillment.',
      type: TYPES.POLICY,
    },

    'pol_flag_review': {
      title: 'Flag for Review',
      desc: 'When risk level is high, pause order, hold payment, and dispatch to Risk Ops queue.',
      type: TYPES.POLICY,
    },

    'pol_dispatch_review': {
      title: 'Dispatch Review',
      desc: 'Dispatch review request to risk analyst.',
      type: TYPES.POLICY,
    },

    'pol_finalize_review': {
      title: 'Finalize Review Decision',
      desc: 'When analyst decides, either approve (capture payment) or cancel (release payment, unlock inventory).',
      type: TYPES.POLICY,
    },
  },

  relations: [
    // ── EVENT STORMING ────────────────────────────────────────────────
    // Phase 1: Checkout & Inventory
    { id: 'r_es_1',  from: 'customer',         to: 'evt_order_placed',      views: ['EVENT_STORMING'] },
    { id: 'r_es_2',  from: 'evt_order_placed', to: 'pol_process_checkout',  views: ['EVENT_STORMING'] },
    { id: 'r_es_3',  from: 'pol_process_checkout', to: 'cmd_checkout',      views: ['EVENT_STORMING'] },
    { id: 'r_es_4',  from: 'cmd_checkout',     to: 'order_checkout',        views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_5',  from: 'order_checkout',   to: 'order_db',              views: ['EVENT_STORMING'] },
    { id: 'r_es_6',  from: 'cmd_checkout',     to: 'pol_check_inventory',   views: ['EVENT_STORMING'] },
    { id: 'r_es_7',  from: 'pol_check_inventory', to: 'cmd_check_inventory', views: ['EVENT_STORMING'] },
    { id: 'r_es_8',  from: 'cmd_check_inventory', to: 'inventory_service',  views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_9',  from: 'inventory_service', to: 'evt_inventory_checked', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'evt_inventory_checked', to: 'pol_lock_inventory', views: ['EVENT_STORMING'] },
    { id: 'r_es_11', from: 'pol_lock_inventory', to: 'cmd_lock_inventory',  views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'cmd_lock_inventory', to: 'inventory_service',   views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_13', from: 'inventory_service', to: 'evt_inventory_locked', views: ['EVENT_STORMING'] },

    // Phase 2: Payment Authorization
    { id: 'r_es_14', from: 'evt_inventory_locked', to: 'pol_authorize',     views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'pol_authorize',        to: 'cmd_authorize_payment', views: ['EVENT_STORMING'] },
    { id: 'r_es_16', from: 'cmd_authorize_payment', to: 'stripe',           views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_17', from: 'stripe',               to: 'evt_payment_authorized', views: ['EVENT_STORMING'] },

    // Phase 3: Fraud Evaluation
    { id: 'r_es_18', from: 'evt_payment_authorized', to: 'pol_evaluate_fraud', views: ['EVENT_STORMING'] },
    { id: 'r_es_19', from: 'pol_evaluate_fraud',     to: 'cmd_evaluate_fraud', views: ['EVENT_STORMING'] },
    { id: 'r_es_20', from: 'cmd_evaluate_fraud',     to: 'fraud_service',      views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_21', from: 'fraud_service',          to: 'evt_fraud_evaluated', views: ['EVENT_STORMING'] },
    { id: 'r_es_22', from: 'evt_fraud_evaluated',    to: 'pol_route_risk',     views: ['EVENT_STORMING'] },

    // Happy path: Low risk → auto-approve → confirm
    { id: 'r_es_23', from: 'pol_route_risk',     to: 'pol_auto_approve',  views: ['EVENT_STORMING'] },
    { id: 'r_es_24', from: 'pol_auto_approve',   to: 'cmd_approve_order', views: ['EVENT_STORMING'] },
    { id: 'r_es_25', from: 'cmd_approve_order',  to: 'order_fulfill',     views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_26', from: 'order_fulfill',      to: 'stripe',            views: ['EVENT_STORMING'] },
    { id: 'r_es_27', from: 'order_fulfill',      to: 'evt_order_approved', views: ['EVENT_STORMING'] },
    { id: 'r_es_28', from: 'evt_order_approved', to: 'evt_order_confirmed', views: ['EVENT_STORMING'] },

    // High risk path: Flag → review → decision
    { id: 'r_es_29', from: 'pol_route_risk', to: 'pol_flag_review',       views: ['EVENT_STORMING'] },
    { id: 'r_es_30', from: 'pol_flag_review', to: 'cmd_hold_order',       views: ['EVENT_STORMING'] },
    { id: 'r_es_30_hb', from: 'cmd_hold_order', to: 'order_checkout', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_30b', from: 'cmd_hold_order', to: 'evt_fraud_flagged',    views: ['EVENT_STORMING'] },
    { id: 'r_es_31', from: 'evt_fraud_flagged', to: 'pol_dispatch_review', views: ['EVENT_STORMING'] },
    { id: 'r_es_31a', from: 'pol_dispatch_review', to: 'cmd_review_order', views: ['EVENT_STORMING'] },
    { id: 'r_es_32', from: 'cmd_review_order', to: 'risk_analyst',        views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_33', from: 'risk_analyst',     to: 'evt_review_decision', views: ['EVENT_STORMING'] },
    { id: 'r_es_34', from: 'evt_review_decision', to: 'pol_finalize_review', views: ['EVENT_STORMING'] },
    
    // Approve branch
    { id: 'r_es_35', from: 'pol_finalize_review', to: 'cmd_confirm_order', views: ['EVENT_STORMING'] },
    { id: 'r_es_35_hb', from: 'cmd_confirm_order', to: 'order_fulfill', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_35b', from: 'cmd_confirm_order', to: 'evt_order_confirmed', views: ['EVENT_STORMING'] },
    
    // Cancel branch
    { id: 'r_es_36', from: 'pol_finalize_review', to: 'cmd_cancel_order', views: ['EVENT_STORMING'] },
    { id: 'r_es_36_hb', from: 'cmd_cancel_order', to: 'order_fulfill', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_36b', from: 'cmd_cancel_order', to: 'evt_order_cancelled', views: ['EVENT_STORMING'] },

    // Dynamic edge helpers
    { id: 'r_es_sa_1', from: 'order_checkout', to: 'inventory_service',    views: ['EVENT_STORMING'] },
    { id: 'r_es_sa_2', from: 'order_checkout', to: 'stripe',             views: ['EVENT_STORMING'] },
    { id: 'r_es_sa_3', from: 'order_checkout', to: 'fraud_service',      views: ['EVENT_STORMING'] },
    { id: 'r_es_sl_1', from: 'order_checkout', to: 'customer',             views: ['EVENT_STORMING'] },
  ],

  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'customer', grid: [0, 2] },
        { id: 'evt_order_placed', grid: [1, 2] },
        { id: 'pol_process_checkout', grid: [2, 2] },
        { id: 'cmd_checkout', grid: [3, 2] },
        { id: 'order_checkout', grid: [3, 1] },
        { id: 'order_db', grid: [3, 0] },
        { id: 'pol_check_inventory', grid: [5, 2] },
        { id: 'cmd_check_inventory', grid: [6, 2] },
        { id: 'evt_inventory_checked', grid: [7, 2] },
        { id: 'pol_lock_inventory', grid: [8, 2] },
        { id: 'cmd_lock_inventory', grid: [9, 2] },
        { id: 'evt_inventory_locked', grid: [10, 2] },
        { id: 'inventory_service', grid: [7, 1] },
        { id: 'pol_authorize', grid: [12, 2] },
        { id: 'cmd_authorize_payment', grid: [13, 2] },
        { id: 'evt_payment_authorized', grid: [14, 2] },
        { id: 'stripe', grid: [13, 1] },
        { id: 'pol_evaluate_fraud', grid: [16, 2] },
        { id: 'cmd_evaluate_fraud', grid: [17, 2] },
        { id: 'evt_fraud_evaluated', grid: [18, 2] },
        { id: 'pol_route_risk', grid: [19, 2] },
        { id: 'fraud_policy', grid: [19, 1] },
        { id: 'fraud_service', grid: [17, 1] },
        { id: 'pol_auto_approve', grid: [20, 2] },
        { id: 'cmd_approve_order', grid: [21, 2] },
        { id: 'order_fulfill', grid: [21, 1] },
        { id: 'evt_order_approved', grid: [22, 2] },
        { id: 'pol_flag_review', grid: [20, 3] },
        { id: 'cmd_hold_order', grid: [21, 3] },
        { id: 'evt_fraud_flagged', grid: [22, 3] },
        { id: 'pol_dispatch_review', grid: [23, 3] },
        { id: 'cmd_review_order', grid: [24, 3] },
        { id: 'risk_analyst', grid: [24, 2] },
        { id: 'evt_review_decision', grid: [25, 3] },
        { id: 'pol_finalize_review', grid: [26, 3] },
        { id: 'cmd_confirm_order', grid: [27, 2] },
        { id: 'cmd_cancel_order', grid: [27, 4] },
        { id: 'evt_order_confirmed', grid: [28, 2] },
        { id: 'evt_order_cancelled', grid: [28, 4] },
      ],
      groups: [
        { id: 'es_g1', title: 'Checkout & Inventory', desc: 'Order Placed triggers checkout. Inventory checked and locked with time-based expiry.', nodeIds: ['customer','evt_order_placed','pol_process_checkout','cmd_checkout','order_checkout','order_db','pol_check_inventory','cmd_check_inventory','inventory_service','evt_inventory_checked','pol_lock_inventory','cmd_lock_inventory','evt_inventory_locked'], color: 'rgba(140,170,238,0.12)', borderColor: 'var(--ctp-blue)', textColor: 'var(--ctp-text)' },
        { id: 'es_g2', title: 'Payment Authorization', desc: 'Inventory lock triggers Stripe authorization. Webhook confirms funds held.', nodeIds: ['pol_authorize','cmd_authorize_payment','stripe','evt_payment_authorized'], color: 'rgba(244,184,228,0.12)', borderColor: 'var(--ctp-pink)', textColor: 'var(--ctp-text)' },
        { id: 'es_g3', title: 'Fraud Evaluation & Auto-Approve', desc: 'Fraud engine scores order. Low-risk auto-approved: payment captured, order confirmed.', nodeIds: ['pol_evaluate_fraud','cmd_evaluate_fraud','fraud_service','evt_fraud_evaluated','pol_route_risk','fraud_policy','pol_auto_approve','cmd_approve_order','order_fulfill','evt_order_approved','evt_order_confirmed'], color: 'rgba(229,200,144,0.12)', borderColor: 'var(--ctp-yellow)', textColor: 'var(--ctp-text)' },
        { id: 'es_g4', title: 'Fraud Review & Decision', desc: 'High-risk orders flagged for Risk Ops analyst. Manual review leads to approval or cancellation.', nodeIds: ['pol_flag_review','cmd_hold_order','evt_fraud_flagged','pol_dispatch_review','cmd_review_order','risk_analyst','evt_review_decision','pol_finalize_review','cmd_confirm_order','cmd_cancel_order','evt_order_cancelled'], color: 'rgba(231,130,132,0.12)', borderColor: 'var(--ctp-red)', textColor: 'var(--ctp-text)' },
      ]
    }
  },

  journeys: [
    {
      id: 'instant-checkout',
      label: 'Instant Checkout',
      description: 'Low-risk order flows through checkout, inventory lock, Stripe authorization, fraud clearance, and auto-confirmation.',
      steps: [
        { nodeIds: ['customer', 'evt_order_placed'], description: 'Order Placed — Customer submits checkout with 2 items totaling $112.97. Order record created in database.' },
        { nodeIds: ['pol_check_inventory', 'cmd_check_inventory', 'inventory_service', 'evt_inventory_checked', 'pol_lock_inventory', 'cmd_lock_inventory', 'evt_inventory_locked'], description: 'Inventory Lock — Inventory Service checks availability (147 widgets, 523 cables in stock). Stock locked for 15-minute window.', processGroup: 'execution' },
        { nodeIds: ['pol_authorize', 'cmd_authorize_payment', 'stripe', 'evt_payment_authorized'], description: 'Payment Authorized — Stripe creates PaymentIntent, authorizes card ending in 4242. Webhook confirms $112.97 held (requires_capture).', processGroup: 'execution' },
        { nodeIds: ['pol_evaluate_fraud', 'cmd_evaluate_fraud', 'fraud_service', 'evt_fraud_evaluated'], description: 'Fraud Evaluation — Fraud Engine scores order at 0.12 (low risk). All signals pass: velocity OK, card reused 3x, address matches, amount normal.', processGroup: 'evaluation' },
        { nodeIds: ['pol_route_risk', 'pol_auto_approve', 'cmd_approve_order', 'order_fulfill', 'evt_order_approved', 'evt_order_confirmed'], description: 'Auto-Confirm — Risk router auto-approves. Payment captured, inventory committed. Order confirmed with CNF-20250615-0042. Customer notified.', processGroup: 'evaluation' },
      ]
    },
    {
      id: 'fraud-review-block',
      label: 'Fraud Review Block',
      description: 'High-risk order flagged by fraud engine, payment held, routed to Risk Ops analyst for manual review.',
      steps: [
        { nodeIds: ['customer', 'evt_order_placed'], description: 'Order Placed — Customer submits high-value order ($2,499.00) with new payment method and mismatched billing ZIP.' },
        { nodeIds: ['pol_check_inventory', 'cmd_check_inventory', 'inventory_service', 'evt_inventory_checked', 'pol_lock_inventory', 'cmd_lock_inventory', 'evt_inventory_locked'], description: 'Inventory Lock — Items available, stock locked pending payment and fraud clearance.', processGroup: 'execution' },
        { nodeIds: ['pol_authorize', 'cmd_authorize_payment', 'stripe', 'evt_payment_authorized'], description: 'Payment Authorized — Stripe authorizes $2,499.00 on new card. Funds held pending capture decision.', processGroup: 'execution' },
        { nodeIds: ['pol_evaluate_fraud', 'cmd_evaluate_fraud', 'fraud_service', 'evt_fraud_evaluated', 'pol_route_risk'], description: 'Fraud Flagged — Fraud Engine scores 0.87 (high risk). Signals fail: 8 orders/24h, new card, address mismatch, 3-sigma amount anomaly. Risk router directs to manual review.', processGroup: 'evaluation' },
        { nodeIds: ['pol_flag_review', 'cmd_hold_order', 'evt_fraud_flagged', 'pol_dispatch_review', 'cmd_review_order', 'risk_analyst'], description: '⚠️ Risk Ops Review — Order paused with payment held. Risk Ops analyst reviews signals, contacts customer for verification.', processGroup: 'escalation' },
        { nodeIds: ['risk_analyst', 'evt_review_decision', 'pol_finalize_review', 'cmd_confirm_order', 'cmd_cancel_order'], description: 'Review Decision — Analyst makes approve/cancel decision. Approve: payment captured, order confirmed. Cancel: payment released, inventory unlocked.', processGroup: 'escalation' },
      ]
    }
  ]
}
