#!/usr/bin/env python3
"""Tạo apps-script/Index.html cho Google Apps Script.

Apps Script không tải được file .js riêng, nên index.html, pdf417.js và qr_encoder.js
được gộp vào một file. Chạy lại sau mỗi lần sửa trang:  python3 apps-script/build.py
"""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')

for name in ['pdf417.js', 'qr_encoder.js']:
    tag = '<script src="%s"></script>' % name
    assert tag in html, tag
    code = (root / name).read_text(encoding='utf-8')
    assert '<?' not in code, name + ' must not contain "<?" (Apps Script template tag)'
    html = html.replace(tag, '<script>\n' + code + '\n</script>')

# mode comes from Code.gs: 'sidebar' (Google Sheets) or 'web' (web app)
main = '<script type="text/javascript">'
assert main in html
html = html.replace(main, '<script>var APPS_SCRIPT_MODE = <?!= JSON.stringify(mode) ?></script>\n' + main, 1)

out = root / 'apps-script' / 'Index.html'
out.write_text(html, encoding='utf-8')
print('Đã tạo', out.relative_to(root), '(%d KB)' % (len(html.encode('utf-8')) // 1024))
