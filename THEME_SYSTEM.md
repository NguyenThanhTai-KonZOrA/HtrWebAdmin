# 🎨 Theme System Documentation

## Tổng quan

Hệ thống theme mới hỗ trợ **3 chế độ**:
- **Light Mode**: Giao diện sáng, dễ đọc trong môi trường sáng
- **Dark Mode**: Giao diện tối, dễ chịu cho mắt trong môi trường tối
- **System Mode**: Tự động theo cài đặt hệ thống của thiết bị

## 🎯 Tính năng mới

### 1. Theme Selector trong Menu
- Click vào **Avatar** ở góc trên bên phải → Menu hiện ra
- Section đầu tiên là **Theme Appearance** với 3 options:
  - ☀️ **Light**: Giao diện sáng
  - 🌙 **Dark**: Giao diện tối
  - ⚙️ **System**: Tự động theo hệ thống

### 2. Preview màu sắc
- Mỗi option có **color preview box** để xem trước màu sắc
- Highlight option đang được chọn với:
  - ✓ Check icon
  - Border màu primary
  - Background nhẹ

### 3. Auto-detect System Theme
- Khi chọn "System", app sẽ tự động detect theme của OS
- Tự động cập nhật khi user thay đổi theme trên OS
- Hỗ trợ cả `prefers-color-scheme` media query

## 📁 Files liên quan

### 1. `ThemeContext.tsx` (Updated)
```tsx
// Hỗ trợ 3 modes
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;              // User's selected mode
  appliedTheme: AppliedTheme;   // Actual theme being used
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;      // Quick toggle (skip system)
}
```

**Features:**
- Auto-detect system theme với `window.matchMedia`
- Listen for system theme changes
- Persist user preference trong localStorage
- Backward compatible với code cũ (toggleTheme)

### 2. `ThemeSelector.tsx` (New)
Component UI cho theme selection:
- Material-UI design với smooth animations
- Color preview boxes
- Clear descriptions
- Active state indicators

### 3. `ThemeToggleButton.tsx` (Updated)
Quick toggle button (giữ cho backward compatibility):
- Show icon phù hợp với mode hiện tại
- Tooltip rõ ràng
- Click để toggle giữa light/dark (skip system)

### 4. `MainNav.tsx` (Updated)
- Tích hợp `ThemeSelector` vào dropdown menu
- Import và sử dụng component mới

## 🎨 UI/UX Improvements

### Visual Design
- **Color Preview Boxes**: 40x40px với border radius 6px
- **Split gradient** cho System mode (nửa light, nửa dark)
- **Border highlight** cho selected option
- **Smooth transitions**: 0.2s ease-in-out

### Typography
- **Bold title** cho selected option
- **Caption description** cho mỗi option
- **Section header** "Theme Appearance"

### Spacing
- Proper padding: `py: 1.5, px: 2` cho mỗi item
- Gap: `2` (16px) giữa preview box và text
- Dividers để tách sections

## 🔧 Cách sử dụng

### Basic Usage
```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { mode, appliedTheme, setThemeMode } = useTheme();
  
  // Get current mode
  console.log(mode); // 'light' | 'dark' | 'system'
  
  // Get actual theme being applied
  console.log(appliedTheme); // 'light' | 'dark'
  
  // Change theme
  setThemeMode('dark');
  
  // Quick toggle
  toggleTheme(); // Toggles between light/dark only
}
```

### Thêm ThemeSelector vào bất kỳ đâu
```tsx
import { ThemeSelector } from '../components/ThemeSelector';

<Menu>
  <ThemeSelector onClose={handleClose} />
  <Divider />
  {/* Other menu items */}
</Menu>
```

## 🚀 Migration từ code cũ

Không cần thay đổi gì! Code cũ vẫn hoạt động:

```tsx
// OLD CODE - Still works!
const { mode, toggleTheme } = useTheme();
toggleTheme(); // ✓ Vẫn chạy

// NEW CODE - More options
const { mode, appliedTheme, setThemeMode } = useTheme();
setThemeMode('system'); // ✓ More control
```

## 🎯 Best Practices

1. **Default to System**: User mới sẽ tự động dùng system theme
2. **Persist preference**: LocalStorage lưu lựa chọn của user
3. **Real-time updates**: Theme thay đổi ngay lập tức
4. **Smooth transitions**: Tất cả animations đều smooth
5. **Accessibility**: Clear labels và descriptions

## 📱 Responsive

- Desktop: Full menu với previews
- Mobile: Cũng hiển thị tốt trong MobileNav nếu cần
- Touch-friendly: MenuItem có padding đủ lớn

## 🎨 Color Palette

### Light Theme
- Background: `#f8fafc`
- Paper: `#ffffff`
- Primary: `#274549`
- Text: `#1e293b`

### Dark Theme
- Background: `#0f172a`
- Paper: `#1e293b`
- Primary: `#3d5a5f`
- Text: `#f1f5f9`

## ✨ Future Enhancements (Optional)

1. **Custom themes**: Cho phép user tạo theme riêng
2. **Theme scheduling**: Auto-switch theo giờ
3. **More presets**: Thêm color schemes khác
4. **Accent colors**: Cho phép customize accent color

---

**Created**: November 29, 2025  
**Version**: 2.0  
**Status**: ✅ Production Ready
