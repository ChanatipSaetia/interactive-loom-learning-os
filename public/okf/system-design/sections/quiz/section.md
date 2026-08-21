---
type: quiz
title: "System Design Knowledge Check"
heading: "Test Your Understanding"
questionCount: 5
---

# Knowledge Check

Answer these questions to test your understanding of system design fundamentals.

---

## Question 1

What does CAP theorem state?

- A distributed system can guarantee all three: consistency, availability, and partition tolerance
- A distributed system can only guarantee two of three: consistency, availability, and partition tolerance
- A distributed system must sacrifice partition tolerance
- A distributed system prioritizes availability over all else

Correct answer: 1
Explanation: The CAP theorem states that a distributed system can only guarantee two of three properties: consistency, availability, and partition tolerance.

---

## Question 2

Which scaling approach adds more machines to handle increased load?

- Vertical scaling
- Horizontal scaling
- Functional scaling
- Linear scaling

Correct answer: 1
Explanation: Horizontal scaling involves adding more machines/servers to distribute the load, while vertical scaling adds more power to existing machines.

---

## Question 3

What is the primary benefit of redundancy in system design?

- Reduced costs
- Improved reliability and fault tolerance
- Faster response times
- Simpler architecture

Correct answer: 1
Explanation: Redundancy provides backup components that can take over in case of failures, improving overall system reliability.

---

## Question 4

Which is NOT a characteristic of good maintainability?

- Modularity
- Lack of documentation
- Comprehensive testing
- Clear interfaces

Correct answer: 1
Explanation: Good maintainability requires documentation, not lack of it. Documentation helps developers understand and modify the system.

---

## Question 5

In a distributed database, which choice prioritizes data accuracy over response speed?

- AP (Availability + Partition Tolerance)
- CP (Consistency + Partition Tolerance)
- AC (Availability + Consistency)
- PC (Partition tolerance + Consistency without availability)

Correct answer: 1
Explanation: CP systems prioritize consistency and partition tolerance, meaning they may sacrifice availability to ensure data accuracy.
