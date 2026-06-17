export const ecommerceOrdersParagraphs = [
  'Modern e-commerce platforms process orders through a pipeline of inventory validation, payment authorization, and automated fraud detection — all within seconds of checkout.',
  'The order lifecycle moves from <code>Pending</code> through <code>Inventory Locked</code>, <code>Payment Authorized</code>, and <code>Fraud Cleared</code> before reaching <code>Confirmed</code>. High-risk orders divert to manual review where a Risk Ops analyst decides whether to approve or cancel.',
  'Stripe handles payment authorization via PaymentIntents with webhook callbacks, while the fraud engine evaluates ML-based risk scores against velocity, card history, and behavioral signals.',
]

export const ecommerceOrdersLifecycleMarkdown =
  'The order state machine progresses through seven states: <code>Pending</code> → <code>Inventory Locked</code> → <code>Payment Authorized</code> → <code>Fraud Cleared</code> → <code>Confirmed</code>, with <code>Fraud Review</code> and <code>Cancelled</code> as terminal branches for high-risk orders.'

export const ecommerceOrdersCapabilityBullets = [
  { text: 'Real-time inventory lock with 15-minute expiry window', checked: false },
  { text: 'Stripe PaymentIntent authorization with webhook-driven capture', checked: false },
  { text: 'ML-based fraud scoring with velocity, card reuse, and address matching signals', checked: false },
  { text: 'Auto-approval for low-risk orders (risk score < 0.30)', checked: false },
  { text: 'Manual review gate for high-risk orders (risk score > 0.70)', checked: false },
  { text: 'Inventory release and payment reversal on cancellation', checked: false },
]
