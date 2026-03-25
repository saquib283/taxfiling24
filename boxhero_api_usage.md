# BoxHero API Usage with Mock Response Data

This document provides examples of interacting with the [boxHeroService.js](file:///c:/Development/Inventory_System/backend/src/services/boxHeroService.js) along with placeholders and structures of the **data returned** by the service.

---

## 1. Syncing Products

### Code Usage
```javascript
const { syncProductsFromBoxHero } = require('./services/boxHeroService');

const result = await syncProductsFromBoxHero();
console.log(result);
```

### Data Returned (`result`)
```json
{
  "success": true,
  "message": "Successfully synced 142 products",
  "syncedProducts": 142,
  "totalProducts": 142,
  "errors": 0,
  "pages": 2
}
```

---

## 2. Updating Stock Levels

### Code Usage
```javascript
const { updateBoxHeroStock } = require('./services/boxHeroService');

const itemsToDeduct = [
  { itemId: '10293847', quantityToDeduct: 5 }
];

const result = await updateBoxHeroStock(itemsToDeduct);
console.log(result);
```

### Data Returned (`result`)
```json
{
  "success": true,
  "message": "Stock levels updated successfully in BoxHero",
  "updatedItems": 1
}
```

---

## 3. Fetching Current Stock

### Code Usage
```javascript
const { getBoxHeroStockLevels } = require('./services/boxHeroService');

const result = await getBoxHeroStockLevels();
console.log(result);
```

### Data Returned (`result`)
*💡 Note: The exact structure depends on BoxHero's API response setup.*
```json
{
  "success": true,
  "message": "Stock levels retrieved successfully",
  "stockLevels": [
    {
      "itemId": "10293847",
      "sku": "SKU-WL-01",
      "name": "White Board Marker",
      "currentStock": 42
    },
    {
      "itemId": "10293848",
      "sku": "SKU-BK-02",
      "name": "Black Ink Pen",
      "currentStock": 115
    }
  ]
}
```

---

## 4. Fetching Categories

### Code Usage
```javascript
const { getBoxHeroCategories } = require('./services/boxHeroService');

const result = await getBoxHeroCategories();
console.log(result);
```

### Data Returned (`result`)
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "categories": [
    {
      "id": 101,
      "name": "Stationery",
      "itemCount": 54
    },
    {
      "id": 102,
      "name": "Electronic Accessories",
      "itemCount": 21
    }
  ]
}
```

---

### 🚨 Error Response Structure
If an operation fails, the structure is standardized with a descriptive error message:

```json
{
  "success": false,
  "message": "Failed to sync products from BoxHero",
  "error": "API request failed: 401 Unauthorized - Invalid Token Configuration"
}
```
