# taoBarcode – Tạo mã vạch thẻ lên máy bay

Trang web tạo mã vạch thẻ lên máy bay (boarding pass) theo chuẩn IATA BCBP, hỗ trợ mã **Aztec** và **PDF417**.
Toàn bộ chạy trong trình duyệt, không cần server.

Dự án được phát triển tiếp từ [shooshx/BoardingBarcode](https://github.com/shooshx/BoardingBarcode).

## Tính năng

- **Nhập theo ô**: họ, tên, mã đặt chỗ, sân bay đi/đến, hãng bay, số hiệu chuyến bay, ngày bay, hạng ghế, số ghế, số thứ tự check-in.
- **Nhập Raw data**: dán chuỗi BCBP, dữ liệu được kiểm tra theo mẫu và tự đẩy về các ô.
  Nếu sai mẫu, trang báo lỗi rõ vị trí và trường bị sai.
- **Hai chiều**: sửa ở các ô thì Raw data cập nhật theo, và ngược lại.
- **Xuất ảnh** mã vạch ra file PNG hoặc SVG.
- Giao diện tiếng Việt, dùng được trên điện thoại.

## Cách dùng

Mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari).

## Mẫu Raw data

Chỉ hỗ trợ 1 chặng bay. Phần bắt buộc dài 60 ký tự:

```
M1DOE/JOHN            EXYZ123 ZRHSFOBA 1234 301Y035A0001 100
```

| Vị trí | Độ dài | Trường | Ghi chú |
|---|---|---|---|
| 1 | 1 | Mã định dạng | luôn là `M` |
| 2 | 1 | Số chặng bay | luôn là `1` |
| 3–22 | 20 | Tên hành khách | `HỌ/TÊN`, chữ IN HOA, thêm dấu cách cho đủ 20 |
| 23 | 1 | Chỉ báo vé điện tử | luôn là `E` |
| 24–30 | 7 | Mã đặt chỗ (PNR) | đúng 6 ký tự + 1 dấu cách |
| 31–33 | 3 | Sân bay đi | mã IATA 3 chữ cái |
| 34–36 | 3 | Sân bay đến | mã IATA 3 chữ cái |
| 37–39 | 3 | Hãng bay | đúng 2 ký tự + 1 dấu cách |
| 40–44 | 5 | Số hiệu chuyến bay | ví dụ `1234 ` |
| 45–47 | 3 | Ngày bay | ngày thứ mấy trong năm, `001`–`366` |
| 48 | 1 | Hạng ghế | ví dụ `F`, `C`, `Y` |
| 49–52 | 4 | Số ghế | ví dụ `035A` |
| 53–57 | 5 | Số thứ tự check-in | ví dụ `0001 ` |
| 58 | 1 | Trạng thái hành khách | |
| 59–60 | 2 | Độ dài dữ liệu bổ sung | số hex; dữ liệu bổ sung (nếu có) nằm sau vị trí 60 |

## Biên dịch lại thư viện mã vạch

Phần tạo mã vạch (`js_qr_brd.js`) được biên dịch từ mã C trong thư mục `src/` (dựa trên [zint](https://github.com/zint/zint)) bằng Emscripten.
Xem lệnh trong `em_rel_build.bat`.

## Lưu ý

Công cụ chỉ dùng cho mục đích học tập và tìm hiểu. Bạn tự chịu trách nhiệm khi sử dụng.

## Tài liệu tham khảo

- Chuẩn BCBP: http://www.iata.org/whatwedo/stb/documents/bcbp_implementation_guidev4_jun2009.pdf
- Giải thích dữ liệu trong mã vạch thẻ lên máy bay: https://shaun.net/whats-contained-in-a-boarding-pass-barcode/
- Mã Aztec: https://en.wikipedia.org/wiki/Aztec_Code
- Mã hãng bay: http://www.airlineandairportlinks.com/frameset_linecode.html
- Mã sân bay IATA: http://www.airportcodes.org/
