---
type: reflection-sequence
title: "Design Reflection"
heading: "Reflect on Real-World Trade-offs"
---

# Design Reflection: Real-World Trade-offs

Reflect on these real-world system design scenarios and the trade-offs involved.

---

## Scenario 1: Social Media Feed

A social media platform needs to show personalized feeds to 100 million daily active users. The feed must be updated in near real-time when new posts are created.

**Questions to reflect on:**

1. Would you prioritize consistency or availability for the feed? Why?
2. How would you handle the load of generating personalized feeds for 100M users?
3. What caching strategies would you use?

---

## Scenario 2: Financial Transactions

A banking system must process millions of transactions per day. Each transaction must be accurately recorded and never lost.

**Questions to reflect on:**

1. Would you prioritize consistency or availability for financial transactions? Why?
2. How would you ensure no transaction is lost even during network failures?
3. What replication strategy would you use?

---

## Scenario 3: Global Content Delivery

A video streaming service needs to deliver content to users worldwide with minimal buffering.

**Questions to reflect on:**

1. How would you distribute content globally?
2. What trade-offs exist between consistency of metadata and availability of content?
3. How would you handle sudden spikes in traffic?
