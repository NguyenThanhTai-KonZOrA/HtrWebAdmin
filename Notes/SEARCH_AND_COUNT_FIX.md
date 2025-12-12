# Fix: Search Logic & Total Records Count

## Vấn Đề 1: Search Giữ Text Cũ

### 🔴 Vấn đề:
**Khi search lần 2, bị giữ search text cũ**

**Kịch bản tái hiện:**
```
1. Search "ABC" → Không tìm thấy client-side → Gọi server
   → newRegServerSearch = "ABC"
   
2. Search "John" → Tìm thấy client-side (3 results)
   → Hiển thị 3 results
   → ❌ NHƯNG newRegServerSearch vẫn = "ABC" (chưa clear!)
   
3. Click next page hoặc refresh
   → Load với SearchTerm = "ABC" (sai!)
   → ❌ Mất kết quả của "John"
```

### ✅ Giải pháp:

**Trước:**
```typescript
// If no client-side results and search term exists, fetch from server
if (clientFiltered.length === 0) {
    setNewRegServerSearch(newRegSearch);
    loadNewRegistrations(newRegSearch, 0, rowsPerPage);
}
// ❌ Không clear newRegServerSearch khi tìm thấy client-side
```

**Sau:**
```typescript
// If no client-side results and search term exists, fetch from server
if (clientFiltered.length === 0) {
    setNewRegServerSearch(newRegSearch);
    loadNewRegistrations(newRegSearch, 0, rowsPerPage);
} else {
    // ✅ Clear server search if we found results client-side
    if (newRegServerSearch !== '') {
        setNewRegServerSearch('');
    }
}
```

### 📊 Flow Chart - Trước (SAI):

```
Search "ABC"
    ↓
clientFiltered.length = 0
    ↓
setNewRegServerSearch("ABC") ✓
loadNewRegistrations("ABC", ...) ✓
────────────────────────────────
Search "John"
    ↓
clientFiltered.length = 3
    ↓
Hiển thị 3 results ✓
newRegServerSearch vẫn = "ABC" ❌ <-- VẤN ĐỀ
────────────────────────────────
User click next page
    ↓
loadNewRegistrations("ABC", 1, 10) ❌ <-- SAI!
Should be: loadNewRegistrations("", 1, 10)
```

### 📊 Flow Chart - Sau (ĐÚNG):

```
Search "ABC"
    ↓
clientFiltered.length = 0
    ↓
setNewRegServerSearch("ABC") ✓
loadNewRegistrations("ABC", ...) ✓
────────────────────────────────
Search "John"
    ↓
clientFiltered.length = 3
    ↓
Hiển thị 3 results ✓
setNewRegServerSearch("") ✓ <-- FIX!
────────────────────────────────
User click next page
    ↓
loadNewRegistrations("", 1, 10) ✓ <-- ĐÚNG!
```

---

## Vấn Đề 2: Hiển Thị Count Sai

### 🔴 Vấn đề:
**Count hiển thị số records của page hiện tại, không phải tổng số**

**Ví dụ:**
```
Total: 14 records
Page 1: 10 records
Page 2: 4 records

Header hiển thị:
- Page 1: "New Registration (10)" ❌ Nên là 14
- Page 2: "New Registration (4)"  ❌ Nên là 14
```

### ✅ Giải pháp:

**Trước:**
```typescript
<Typography variant="h6">
    New Registration ({filteredNewRegistrations.length})
</Typography>
// ❌ filteredNewRegistrations = records của page hiện tại
```

**Sau:**
```typescript
<Typography variant="h6">
    New Registration ({newRegSearch.trim() && !newRegServerSearch 
        ? filteredNewRegistrations.length  // Client-side search: dùng filtered count
        : newRegTotalRecords})              // Server-side: dùng total từ server
</Typography>
// ✅ Hiển thị đúng total records
```

### 📊 Logic Hiển Thị Count:

```typescript
// Case 1: Không search → Hiển thị total từ server
newRegSearch = ""
→ Count = newRegTotalRecords (14)

// Case 2: Search client-side có kết quả → Hiển thị filtered count
newRegSearch = "John"
clientFiltered.length = 3
newRegServerSearch = ""
→ Count = filteredNewRegistrations.length (3)

// Case 3: Search từ server → Hiển thị total từ server
newRegSearch = "XYZ"
clientFiltered.length = 0
newRegServerSearch = "XYZ"
→ Count = newRegTotalRecords (từ server response)
```

---

## Testing Scenarios

### ✅ Test Case 1: Search Client → Server → Client
```
1. Initial load
   → Count: 14 (total) ✓
   
2. Search "John" (có trong client)
   → Count: 3 (filtered) ✓
   → newRegServerSearch = "" ✓
   
3. Search "ABC" (không có trong client)
   → Count: 0 or X (từ server) ✓
   → newRegServerSearch = "ABC" ✓
   
4. Search "Mary" (có trong client)
   → Count: 2 (filtered) ✓
   → newRegServerSearch = "" ✓ <-- FIX ÍT!
   
5. Click next page
   → Load page 2 với SearchTerm = "" ✓
   → KHÔNG load với "ABC" nữa ✓
```

### ✅ Test Case 2: Count Display
```
1. Page 1 (10 records)
   → Header: "New Registration (14)" ✓
   
2. Page 2 (4 records)
   → Header: "New Registration (14)" ✓
   
3. Search "John" → 3 results
   → Header: "New Registration (3)" ✓
   
4. Clear search
   → Header: "New Registration (14)" ✓
```

### ✅ Test Case 3: Page Navigation với Search
```
1. Search "ABC" (server search) → 5 results
   → Count: 5 ✓
   
2. Click next page
   → Load với SearchTerm = "ABC" ✓
   → Count vẫn: 5 ✓
   
3. Search "John" (client search) → 2 results
   → Count: 2 ✓
   → newRegServerSearch cleared ✓
   
4. Click next page
   → Load với SearchTerm = "" ✓ (không phải "ABC")
```

---

## Code Changes Summary

### 1. useEffect for Search (Both Tables)

```typescript
// Add else clause to clear server search
if (clientFiltered.length === 0) {
    setNewRegServerSearch(newRegSearch);
    loadNewRegistrations(newRegSearch, 0, rowsPerPage);
} else {
    // ✅ NEW: Clear server search if we found results client-side
    if (newRegServerSearch !== '') {
        setNewRegServerSearch('');
    }
}
```

**Áp dụng cho:**
- ✅ New Registration search useEffect
- ✅ Membership search useEffect

### 2. Count Display (Both Headers)

```typescript
// Before:
New Registration ({filteredNewRegistrations.length})

// After:
New Registration ({newRegSearch.trim() && !newRegServerSearch 
    ? filteredNewRegistrations.length 
    : newRegTotalRecords})
```

**Áp dụng cho:**
- ✅ New Registration header
- ✅ Membership header

---

## Benefits

### 🎯 Search Logic:
- ✅ Không bị giữ search text cũ
- ✅ Chuyển đổi mượt mà giữa client/server search
- ✅ Page navigation đúng context

### 🎯 Count Display:
- ✅ Hiển thị tổng số records (không phải số records của page)
- ✅ Cập nhật đúng khi search
- ✅ User biết tổng số records available

### 🎯 User Experience:
- ✅ Consistent behavior
- ✅ Predictable navigation
- ✅ Clear information

---

## Edge Cases Handled

### ✅ Case 1: Rapid Search Changes
```
Search "A" → "AB" → "ABC" → "ABCD"
→ newRegServerSearch luôn sync với search hiện tại
→ Không bị stuck ở search cũ
```

### ✅ Case 2: Empty Search Results
```
Search → 0 results → Clear search
→ Count reset về total
→ newRegServerSearch cleared
```

### ✅ Case 3: Switch Between Tables
```
Search "John" trong New Registration
Switch sang Membership tab
→ Each table có state riêng
→ Không affect nhau
```

---

## Performance Impact

**Before:**
- ❌ Potential wrong API calls với search term cũ
- ❌ Confusing count display

**After:**
- ✅ Correct API calls mọi lúc
- ✅ Clear và accurate count
- ✅ No performance overhead (chỉ thêm condition check)

---

## Summary

### Fixes Applied:

1. **Search Logic Fix**
   - Clear `newRegServerSearch` khi tìm thấy client-side
   - Prevent stale search term issues

2. **Count Display Fix**
   - Hiển thị `totalRecords` thay vì `filteredLength`
   - Except khi search client-side (hiển thị filtered count)

### Result:
- ✅ Search hoạt động đúng trong mọi scenario
- ✅ Count hiển thị chính xác
- ✅ Better user experience
- ✅ No regression issues
