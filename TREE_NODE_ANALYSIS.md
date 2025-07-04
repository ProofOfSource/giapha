# Phân tích Tree Node

Tài liệu này phân tích chi tiết về cấu trúc, thành phần dữ liệu, và cách hiển thị thông tin của một `TreeNode` trong cây gia phả, cập nhật theo thiết kế mới nhất.

## 1. Cấu trúc Component

Component `TreeNode` trong `PublicTreeView.jsx` là một hàm React nhận vào một object `props` chứa các thông tin cần thiết để render một "thẻ" (card) đại diện cho một người trong cây.

```javascript
const TreeNode = ({ nodeDatum, onNodeClick, isExpanded }) => {
  // ... logic ...
}
```

- **`nodeDatum`**: Đây là prop quan trọng nhất, chứa toàn bộ dữ liệu về người cần hiển thị.
- **`onNodeClick`**: Hàm callback được gọi khi người dùng nhấp vào node.
- **`isExpanded`**: Một boolean cho biết node này có đang ở trạng thái "mở rộng" hay không, quyết định chế độ hiển thị.

## 2. Thành phần Dữ liệu (Data Components)

Dữ liệu cho mỗi node (`nodeDatum`) được lấy từ collection `persons` và được bổ sung trong quá trình xây dựng cây.

| Tên trường | Kiểu dữ liệu | Nguồn | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Firestore | Định danh duy nhất. |
| `name` | `string` | Firestore | Tên chính. |
| `nickname` | `string` | Firestore | Tên húy, hiển thị trong dấu ngoặc đơn. |
| `profilePictureUrl` | `string` | Firestore | URL của ảnh đại diện. |
| `birthDate` | `string` | Firestore | Hiển thị ngày sinh, viết tắt là "NS". |
| `deathDate` | `string` | Firestore | Hiển thị ngày mất ("NM"), đồng thời quyết định trạng thái "đã mất". |
| `generation` | `number` | Tính toán đệ quy | Hiển thị số Đời và quyết định màu viền trên. |
| `spouses` | `array` | Tính toán | Mảng chứa thông tin về vợ/chồng. |

## 3. Cách Trình bày Thông tin (Visual Presentation)

`TreeNode` có hai chế độ hiển thị chính, được quyết định bởi prop `isExpanded`.

### a. Chế độ Thu gọn (Compact View - `isExpanded: false`)

Đây là chế độ hiển thị mặc định, tối ưu cho việc hiển thị nhiều thông tin trong không gian hẹp.

**Layout & Kích thước:**
- **Tổng thể Node:** `width: 208px` (52).
- **Layout chính:** Flexbox, sắp xếp theo chiều ngang (`flex items-center`).
- **Avatar:**
    - Kích thước: `width: 48px`, `height: 48px` (w-12 h-12).
    - Hình dạng: Tròn (`rounded-full`).
- **Khối thông tin:**
    - Sắp xếp dọc, nằm bên phải avatar.
    - `Họ và Tên (Tên húy)`: Font in đậm, kích thước `text-sm`.
    - `NS` / `NM` / `Đời`: Font thường, kích thước `text-xs`.
- **Khu vực vợ/chồng:**
    - Nằm bên dưới, ngăn cách bằng đường viền đứt nét.
    - Avatar vợ/chồng: `width: 20px`, `height: 20px` (w-5 h-5).

**Mockup:**
```
+------------------------------------------------------+
| [Avatar]  |  Họ và Tên (Tên húy)                     |
| (48x48px) |  NS: yyyy-mm-dd                          |
|           |  NM: yyyy-mm-dd                          |
|           |  Đời: X                                  |
|------------------------------------------------------|
| [Avatar V/C] | Tên Vợ/Chồng                          |
+------------------------------------------------------+
```

### b. Chế độ Mở rộng (Expanded View - `isExpanded: true`)

Khi được chọn, node sẽ chuyển sang chế độ hiển thị tập trung vào hình ảnh và định danh.

**Layout & Kích thước:**
- **Tổng thể Node:** Hình vuông, `width: 144px`, `height: 144px` (w-36 h-36).
- **Layout chính:** Flexbox, sắp xếp dọc (`flex flex-col items-center justify-center`).
- **Avatar:**
    - Được sử dụng làm ảnh nền cho toàn bộ node (`backgroundImage`, `backgroundSize: 'cover'`).
    - Nếu không có ảnh, một icon người dùng lớn (`w-16 h-16`) sẽ được hiển thị trên nền xám.
- **Khối thông tin (Tên):**
    - Là một lớp phủ (overlay) nằm ở góc dưới bên phải.
    - Nền: Đen, mờ (`bg-black bg-opacity-50`).
    - Chữ: Màu trắng, `text-xs`, bo góc trên bên trái.

**Mockup:**
```
+--------------------------------+
|                                |
|                                |
|      (Avatar làm nền)          |
|                                |
|                                |
|              +-----------------+
|              | Tên (Tên húy)   |
+--------------+-----------------+
```

## 4. Hiệu ứng và Màu sắc

- **Viền trên (Top Border):**
    - Luôn hiển thị, dày `4px`.
    - Màu sắc được quyết định bởi `generation` (sử dụng `branchColorMap`), giúp phân biệt các thế hệ.
- **Highlight khi được chọn (`isExpanded: true`):**
    - Thêm viền dưới (`border-bottom`) và viền phải (`border-right`) dày `3px`, màu cam (`#f59e0b`).
    - Thêm hiệu ứng đổ bóng (`boxShadow`) màu cam để làm nổi bật hơn nữa.
- **Tối ưu hóa ảnh:**
    - Vẫn sử dụng hàm `getResizedImageUrl` để tải ảnh với kích thước phù hợp cho từng chế độ xem, giúp tối ưu tốc độ.
