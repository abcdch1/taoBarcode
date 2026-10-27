/**
 * Trình tạo mã vạch thẻ lên máy bay cho Google Trang tính.
 * Index.html được tạo bằng apps-script/build.py từ index.html, pdf417.js và qr_encoder.js.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Mã vạch')
    .addItem('Mở trình tạo mã', 'showSidebar')
    .addToUi();
}

function page_(mode, title) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.mode = mode;
  return template.evaluate().setTitle(title);
}

function showSidebar() {
  SpreadsheetApp.getUi().showSidebar(page_('sidebar', 'Tạo mã vạch'));
}

// Ứng dụng web (Triển khai > Ứng dụng web): trang tạo mã có link riêng
function doGet() {
  return page_('web', 'Tạo mã vạch thẻ lên máy bay')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Raw data của các ô đang chọn (cột đầu tiên của vùng chọn)
function getSelectedRaw() {
  var range = SpreadsheetApp.getActiveRange();
  return {
    sheet: range.getSheet().getName(),
    row: range.getRow(),
    col: range.getColumn(),
    values: range.getDisplayValues().map(function(r) { return r[0].trim(); })
  };
}

function putImageInActiveCell(pngDataUrl, alt) {
  var cell = SpreadsheetApp.getActiveRange().getCell(1, 1);
  putImage(cell.getSheet().getName(), cell.getRow(), cell.getColumn(), pngDataUrl, alt);
  return cell.getA1Notation();
}

// Ảnh nằm trong ô; nếu không được thì chèn ảnh nổi đặt tại ô đó
function putImage(sheetName, row, col, pngDataUrl, alt) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  try {
    var image = SpreadsheetApp.newCellImage()
      .setSourceUrl(pngDataUrl)
      .setAltTextDescription(alt || '')
      .build();
    sheet.getRange(row, col).setValue(image);
  } catch (e) {
    var bytes = Utilities.base64Decode(pngDataUrl.split(',')[1]);
    var img = sheet.insertImage(Utilities.newBlob(bytes, 'image/png', 'barcode.png'), col, row);
    var width = 300;
    img.setHeight(Math.round(img.getHeight() * width / img.getWidth())).setWidth(width);
  }
}
