# Fix: Pagination Issue - Server-Side Pagination Strategy

## Vấn Đề Gốc

**Hiện tượng:**
- Có 14 records nhưng chỉ hiển thị 10 records
- Không thể chuyển sang page 2

**Nguyên nhân:**
1. Server trả về 10 records/page (page 1)
2. Client cố gắng làm pagination trên 10 records đó
3. Client không có 4 records còn lại → Không thể next page

**Logic cũ (SAI):**
```
Load data → Server trả 10/14 records (page 1)
Client filter → Filter trong 10 records
Client paginate → Paginate trong 10 records đã filter
❌ Result: Mất 4 records, không next được
```

## Giải Pháp Mới

### Chiến Lược: Server-Side Pagination as Default

**Logic mới (ĐÚNG):**
```
1. Default: Server-side pagination
   - Load page 1 → hiển thị 10 records
   - Next page → load page 2 từ server → hiển thị 4 records còn lại
   
2. Search có kết quả client-side: Client-side filter + pagination
   - Search "John" → filter trong data đã load
   - Paginate kết quả filter
   
3. Search KHÔNG có kết quả client-side: Fallback to server
   - Search "XYZ" → không tìm thấy trong client
   - Gọi API search → server trả kết quả
```

## Các Thay Đổi Chi Tiết

### 1. Load Data Functions

**Thay đổi:**
```typescript
// Trước: Luôn gửi SearchTerm (kể cả rỗng)
SearchTerm: searchTerm ?? newRegServerSearch

// Sau: Chỉ gửi SearchTerm khi có giá trị
SearchTerm: currentSearchTerm || undefined
```

**Lý do:**
- Server phân biệt giữa "không search" và "search rỗng"
- `undefined` → server trả ALL data với pagination
- `""` → server có thể nghĩ là search rỗng

### 2. Filter Logic

**Trước:**
```typescript
// Luôn filter, trừ khi search từ server
if (newRegServerSearch) {
    return newRegistrations;
}
return newRegistrations.filter(...);
```

**Sau:**
```typescript
// Chỉ filter khi search client-side
if (newRegSearch.trim() && !newRegServerSearch) {
    return newRegistrations.filter(...);
}
return newRegistrations; // Server đã handle
```

**Lý do:**
- Default là server pagination → không filter
- Chỉ filter khi user search VÀ tìm thấy ở client

### 3. Pagination Logic

**Trước:**
```typescript
// Client paginate, trừ khi search từ server
if (newRegServerSearch) {
    return newRegistrations;
}
const startIndex = newRegPage * rowsPerPage;
return filteredNewRegistrations.slice(startIndex, startIndex + rowsPerPage);
```

**Sau:**
```typescript
// Chỉ paginate khi search client-side
if (newRegSearch.trim() && !newRegServerSearch) {
    const startIndex = newRegPage * rowsPerPage;
    return filteredNewRegistrations.slice(startIndex, startIndex + rowsPerPage);
}
return newRegistrations; // Server đã paginate
```

**Lý do:**
- Server đã paginate → không cần slice
- Chỉ slice khi filter ở client

### 4. TablePagination Component

**Count:**
```typescript
// Client-side search: dùng filtered length
// Server-side: dùng totalRecords từ server
count={newRegSearch.trim() && !newRegServerSearch 
    ? filteredNewRegistrations.length 
    : newRegTotalRecords}
```

**onPageChange:**
```typescript
onPageChange={(_, newPage) => {
    setNewRegPage(newPage);
    // Load từ server nếu KHÔNG phải client-side search
    if (!newRegSearch.trim() || newRegServerSearch) {
        loadNewRegistrations(newRegServerSearch, newPage, rowsPerPage);
    }
}}
```

**Lý do:**
- Khi chuyển page trong mode server → gọi API
- Khi chuyển page trong mode client → chỉ update state

## Flow Chart

### Flow 1: Load Page Ban Đầu
```
User mở page
    ↓
loadNewRegistrations() (no params)
    ↓
Server: GET page=1, pageSize=10, SearchTerm=undefined
    ↓
Server trả: { data: [10 records], totalRecords: 14 }
    ↓
Hiển thị 10 records, pagination shows "1-10 of 14"
    ↓
User click next page
    ↓
loadNewRegistrations('', 1, 10)
    ↓
Server: GET page=2, pageSize=10
    ↓
Server trả: { data: [4 records], totalRecords: 14 }
    ↓
Hiển thị 4 records, pagination shows "11-14 of 14"
✅ SUCCESS
```

### Flow 2: Search - Client-side có kết quả
```
User search "John"
    ↓
newRegSearch = "John"
    ↓
Filter client-side: 10 records → 3 records có "John"
    ↓
Hiển thị 3 records
    ↓
Count = 3 (filtered length)
✅ No API call
```

### Flow 3: Search - Client-side KHÔNG có kết quả
```
User search "XYZ"
    ↓
newRegSearch = "XYZ"
    ↓
Filter client-side: 10 records → 0 records
    ↓
useEffect detect: clientFiltered.length === 0
    ↓
setNewRegServerSearch("XYZ")
    ↓
loadNewRegistrations("XYZ", 0, 10)
    ↓
Server: GET page=1, pageSize=10, SearchTerm="XYZ"
    ↓
Server trả kết quả tìm được
    ↓
Hiển thị kết quả từ server
✅ Fallback to server
```

### Flow 4: Clear Search
```
User clear search (empty string)
    ↓
newRegSearch = ""
    ↓
useEffect detect: newRegSearch.trim() === ''
    ↓
setNewRegServerSearch('')
    ↓
loadNewRegistrations('', 0, 10)
    ↓
Back to Flow 1
✅ Reset to default
```

## Testing Checklist

### ✅ Scenario 1: Default Pagination
- [ ] Load page → hiển thị 10 records
- [ ] Click next → load page 2 → hiển thị 4 records
- [ ] Click previous → back to page 1
- [ ] Change rows per page → reload với page size mới

### ✅ Scenario 2: Client-side Search
- [ ] Search term tìm thấy trong 10 records hiện tại
- [ ] Hiển thị kết quả ngay (không gọi API)
- [ ] Pagination dựa trên filtered results

### ✅ Scenario 3: Server-side Search
- [ ] Search term KHÔNG tìm thấy trong client
- [ ] Tự động gọi API
- [ ] Hiển thị kết quả từ server
- [ ] Pagination từ server

### ✅ Scenario 4: Clear Search
- [ ] Clear search term
- [ ] Reset về default pagination
- [ ] Load lại page 1

### ✅ Scenario 5: Refresh
- [ ] Click refresh button
- [ ] Reload current page
- [ ] Maintain current pagination state

## Performance Metrics

**Before (❌):**
- Initial load: 1 API call → 10 records
- Cannot access remaining 4 records
- Total records accessible: 10/14 (71%)

**After (✅):**
- Initial load: 1 API call → 10 records
- Page 2: 1 API call → 4 records
- Total records accessible: 14/14 (100%)
- Client search: 0 API calls (if found in current page)
- Server search: 1 API call (fallback)

## Summary

### Các Cải Tiến Chính:

1. **✅ Fixed Pagination**: Có thể truy cập tất cả records qua pagination
2. **✅ Smart Search**: Client-first, fallback to server
3. **✅ Better Performance**: Giảm API calls khi search client-side
4. **✅ Correct Total Count**: Hiển thị đúng tổng số records
5. **✅ Proper Page Navigation**: Next/Previous hoạt động đúng

### Key Points:

- **Server-side pagination là default**
- **Client-side search khi có kết quả**
- **Fallback to server khi không tìm thấy**
- **Always load from server when changing pages** (nếu không search client-side)
