# Ultra-Detailed PRD: Advanced Distributed Inventory Ecosystem

## 1. Vision & Objectives
To build a world-class, real-time inventory ecosystem that tracks every unit of stock across the entire supply chain—from procurement to the final branch-level consumption—ensuring 100% accountability and zero shrinkage.

## 2. User Roles & Detailed Personas
### 2.1 Central Manager (CM)
- **Role**: Oversees the entire supply chain.
- **Goal**: Maintain optimal stock levels at the central warehouse and ensure branches are efficiently replenished.
- **Workflow**: Monitor low-stock alerts → Approve/Modify branch requests → Audit branch usage reports.

### 2.2 Branch Manager (BM)
- **Role**: Accountable for their branch's stock health.
- **Goal**: Ensure that everything received is accounted for and that usage is logged accurately.
- **Workflow**: Receive arrivals → Direct staff to log usage → Perform monthly stock counts.

### 2.3 Branch Staff (BS)
- **Role**: Execute daily stock movements.
- **Goal**: Quick and accurate logging of stock consumption.
- **Workflow**: "Pick" items from local stock → Log usage reasons (e.g., "Customer A Project").

## 3. The Inventory Life Cycle (State Machine)
Every item exists in one of five immutable states:
1.  **AVAILABLE (Warehouse)**: Ready to be assigned to an order.
2.  **RESERVED (Processing)**: Locked for a specific order but not yet shipped.
3.  **IN-TRANSIT (Moving)**: Deducted from the warehouse; in the hands of a dispatcher/courier.
4.  **ON-HAND (Branch)**: Legally and physically owned by the branch.
5.  **CONSUMED / DISPOSED**: The end-of-life for the item (Usage, Scrap, or Sale).

## 4. Technical Specifications - Data Model
### 4.1 `StockLedger` (Central Source of Truth)
- [id](file:///c:/Development/Inventory_System/frontend/src/app/dashboard/orders/page.tsx#295-298): UUID.
- `nodeId`: ID of the Branch or "CENTRAL".
- `itemId`: Link to the master Product SKU.
- `quantity`: Current balance.
- `status`: Enum (AVAILABLE, RESERVED, IN_TRANSIT, ON_HAND).
- `updatedAt`: Periodic sync timestamp.

### 4.2 `InventoryMovement` (Audit Log)
- `transactionId`: Unique reference.
- `sourceNodeId`: Where it came from.
- `destinationNodeId`: Where it went.
- `qty`: Magnitude of move.
- `type`: Dispatch, Receipt, Usage, Adjustment.
- `userId`: Performer of the task.

## 5. Automated Reconciliation Logic
### 5.1 The Dispatch Hook
- **Trigger**: Order status changes to `IN_TRANSIT`.
- **Logic**: Atomic Transaction [ `Warehouse.Reserved -= QTY` AND `Transit.Quantity += QTY` ].

### 5.2 The Receipt Hook
- **Trigger**: Order status changes to `ORDER_RECEIVED`.
- **Logic**: Atomic Transaction [ `Transit.Quantity -= QTY` AND `Branch.On-Hand += QTY` ].

## 6. Frontend Modules
### 6.1 Advanced Admin Control Center (Centralized Tracking)
- **Global Inventory Sum**: Real-time roll-up of all `AVAILABLE + RESERVED + IN_TRANSIT + ON_HAND` stock across the system.
- **Stock Aging Discovery**: Identify "dead stock" (SKU's sitting at branches for > 30 days) for potential reallocation.
- **Shrinkage Analytics**: Visual heatmap of stock loss at every transition point (e.g., Warehouse → Transit).
- **Velocity Tracking**: Compare "Consumption Rate" vs. "Approval Rate" per branch to detect hoarding or overuse.

### 6.2 Branch Usage & Local Health Dashboard
- "One-Click Usage": Simplified UI for branch staff.
- Branch-specific "Stock-out Probability" alerts.

## 7. Safety Stock & Auto-Replenishment
### 7.1 Threshold Management
- **Central Safety Stock**: Minimum balance required at the warehouse to prevent global shortages.
- **Branch-Specific Thresholds**: Custom "Low Stock" levels for each branch based on local demand.

### 7.2 Alerting & Visuals
- **Color-Coded Health**:
    - **Green**: Stock > 200% of safety level.
    - **Yellow**: Stock < 120% of safety level (Reorder Suggested).
    - **Red**: Stock < Safety level (Critical).

### 7.3 Auto-Replenishment Engine
- **Trigger**: When branch stock hits "Yellow" level.
- **Action**: Automatically generate a "Draft Order" for the manager with the recommended replenishment quantity.

## 7. Edge Cases & Error Handling
- **Partial Receipts**: If a branch receives 8/10 items, the system automatically creates an `Audit Discrepancy` ticket attached to the transition.
- **Transit Loss**: If an order is lost in transit, a special `Void` transaction is required to clear the "Transit" ledger.

## 8. Success Metrics
- **Inventory Variance < 0.5%**: Minimal difference between digital and physical stock.
- **Replenishment Cycle Time**: Reduce time from "Low Stock Alert" to "Order Received" by 40%.
