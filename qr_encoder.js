// Small QR Code encoder (ISO/IEC 18004), following Nayuki's QR Code generator (MIT).
// The caller gives the data as a list of parts; each part becomes one segment whose mode
// (numeric / alphanumeric / byte) is chosen from that part alone, like a check-in app that
// builds its QR string piece by piece. The smallest version that fits is used, and the mask
// with the lowest penalty is chosen.
// Option unmaskedRemainder leaves the remainder bits (modules after the last codeword) light
// instead of masking them, as the Vietjet check-in QR codes do. Readers ignore those bits.
"use strict"

var QrEncoder = (function() {

var MODULE_PX = 10
var QUIET_ZONE = 4

var ECL = { L: { ordinal: 0, bits: 1 }, M: { ordinal: 1, bits: 0 }, Q: { ordinal: 2, bits: 3 }, H: { ordinal: 3, bits: 2 } }

var ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
]
var NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
]

// ---------------- segments ----------------

var ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"
var MODE = {
    NUMERIC:      { bits: 0x1, cc: [10, 12, 14] },
    ALPHANUMERIC: { bits: 0x2, cc: [9, 11, 13] },
    BYTE:         { bits: 0x4, cc: [8, 16, 16] }
}

function appendBits(val, len, bb) {
    for (var i = len - 1; i >= 0; i--)
        bb.push((val >>> i) & 1)
}

function utf8Bytes(s) {
    var out = [], str = unescape(encodeURIComponent(s))
    for (var i = 0; i < str.length; i++)
        out.push(str.charCodeAt(i))
    return out
}

// one segment for the whole part, in the most compact mode that can hold all of it
function makeSegment(text) {
    var bb = []
    if (/^[0-9]*$/.test(text)) {
        for (var i = 0; i < text.length; ) {
            var n = Math.min(text.length - i, 3)
            appendBits(parseInt(text.substr(i, n), 10), n * 3 + 1, bb)
            i += n
        }
        return { mode: MODE.NUMERIC, numChars: text.length, data: bb }
    }
    var isAlnum = true
    for (var k = 0; k < text.length; k++)
        if (ALPHANUMERIC_CHARSET.indexOf(text.charAt(k)) < 0) isAlnum = false
    if (isAlnum) {
        var j
        for (j = 0; j + 2 <= text.length; j += 2)
            appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(j)) * 45 + ALPHANUMERIC_CHARSET.indexOf(text.charAt(j + 1)), 11, bb)
        if (j < text.length)
            appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(j)), 6, bb)
        return { mode: MODE.ALPHANUMERIC, numChars: text.length, data: bb }
    }
    var bytes = utf8Bytes(text)
    bytes.forEach(function(b) { appendBits(b, 8, bb) })
    return { mode: MODE.BYTE, numChars: bytes.length, data: bb }
}

function ccBits(mode, ver) {
    return mode.cc[Math.floor((ver + 7) / 17)]
}

function totalBits(segs, ver) {
    var result = 0
    for (var i = 0; i < segs.length; i++) {
        var cc = ccBits(segs[i].mode, ver)
        if (segs[i].numChars >= (1 << cc))
            return Infinity
        result += 4 + cc + segs[i].data.length
    }
    return result
}

// ---------------- error correction ----------------

function numRawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64
    if (ver >= 2) {
        var numAlign = Math.floor(ver / 7) + 2
        result -= (25 * numAlign - 10) * numAlign - 55
        if (ver >= 7)
            result -= 36
    }
    return result
}

function numDataCodewords(ver, ecl) {
    return Math.floor(numRawDataModules(ver) / 8)
        - ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
}

function rsMultiply(x, y) {
    var z = 0
    for (var i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11D)
        z ^= ((y >>> i) & 1) * x
    }
    return z
}

function rsDivisor(degree) {
    var result = []
    for (var i = 0; i < degree - 1; i++)
        result.push(0)
    result.push(1)
    var root = 1
    for (var i = 0; i < degree; i++) {
        for (var j = 0; j < result.length; j++) {
            result[j] = rsMultiply(result[j], root)
            if (j + 1 < result.length)
                result[j] ^= result[j + 1]
        }
        root = rsMultiply(root, 0x02)
    }
    return result
}

function rsRemainder(data, divisor) {
    var result = divisor.map(function() { return 0 })
    data.forEach(function(b) {
        var factor = b ^ result.shift()
        result.push(0)
        divisor.forEach(function(coef, i) { result[i] ^= rsMultiply(coef, factor) })
    })
    return result
}

function addEccAndInterleave(data, ver, ecl) {
    var numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
    var blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver]
    var rawCodewords = Math.floor(numRawDataModules(ver) / 8)
    var numShortBlocks = numBlocks - rawCodewords % numBlocks
    var shortBlockLen = Math.floor(rawCodewords / numBlocks)

    var blocks = [], divisor = rsDivisor(blockEccLen)
    for (var i = 0, k = 0; i < numBlocks; i++) {
        var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1))
        k += dat.length
        var ecc = rsRemainder(dat, divisor)
        if (i < numShortBlocks)
            dat.push(0)
        blocks.push(dat.concat(ecc))
    }
    var result = []
    for (var i = 0; i < blocks[0].length; i++)
        blocks.forEach(function(block, j) {
            if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
                result.push(block[i])
        })
    return result
}

// ---------------- matrix ----------------

function Matrix(ver) {
    this.size = ver * 4 + 17
    this.modules = []
    this.isFunction = []
    for (var i = 0; i < this.size; i++) {
        this.modules.push(new Array(this.size).fill(false))
        this.isFunction.push(new Array(this.size).fill(false))
    }
    this.isRemainder = {}  // "x,y" of modules not covered by codewords
}
Matrix.prototype.setFunction = function(x, y, dark) {
    this.modules[y][x] = dark
    this.isFunction[y][x] = true
}

function getBit(x, i) {
    return ((x >>> i) & 1) != 0
}

function alignmentPositions(ver, size) {
    if (ver == 1)
        return []
    var numAlign = Math.floor(ver / 7) + 2
    var step = Math.floor((ver * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2
    var result = [6]
    for (var pos = size - 7; result.length < numAlign; pos -= step)
        result.splice(1, 0, pos)
    return result
}

function drawFormatBits(m, ecl, mask) {
    var data = ecl.bits << 3 | mask
    var rem = data
    for (var i = 0; i < 10; i++)
        rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    var bits = (data << 10 | rem) ^ 0x5412
    for (var i = 0; i <= 5; i++)
        m.setFunction(8, i, getBit(bits, i))
    m.setFunction(8, 7, getBit(bits, 6))
    m.setFunction(8, 8, getBit(bits, 7))
    m.setFunction(7, 8, getBit(bits, 8))
    for (var i = 9; i < 15; i++)
        m.setFunction(14 - i, 8, getBit(bits, i))
    for (var i = 0; i < 8; i++)
        m.setFunction(m.size - 1 - i, 8, getBit(bits, i))
    for (var i = 8; i < 15; i++)
        m.setFunction(8, m.size - 15 + i, getBit(bits, i))
    m.setFunction(8, m.size - 8, true)  // always dark
}

function drawFunctionPatterns(m, ver, ecl) {
    var size = m.size
    for (var i = 0; i < size; i++) {
        m.setFunction(6, i, i % 2 == 0)
        m.setFunction(i, 6, i % 2 == 0)
    }
    ;[[3, 3], [size - 4, 3], [3, size - 4]].forEach(function(c) {
        for (var dy = -4; dy <= 4; dy++)
            for (var dx = -4; dx <= 4; dx++) {
                var dist = Math.max(Math.abs(dx), Math.abs(dy)), xx = c[0] + dx, yy = c[1] + dy
                if (xx >= 0 && xx < size && yy >= 0 && yy < size)
                    m.setFunction(xx, yy, dist != 2 && dist != 4)
            }
    })
    var pos = alignmentPositions(ver, size), n = pos.length
    for (var i = 0; i < n; i++)
        for (var j = 0; j < n; j++) {
            if ((i == 0 && j == 0) || (i == 0 && j == n - 1) || (i == n - 1 && j == 0))
                continue
            for (var dy = -2; dy <= 2; dy++)
                for (var dx = -2; dx <= 2; dx++)
                    m.setFunction(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1)
        }
    drawFormatBits(m, ecl, 0)  // placeholder, redrawn after choosing the mask
    if (ver >= 7) {
        var rem = ver
        for (var i = 0; i < 12; i++)
            rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25)
        var bits = ver << 12 | rem
        for (var i = 0; i < 18; i++) {
            var a = size - 11 + i % 3, b = Math.floor(i / 3)
            m.setFunction(a, b, getBit(bits, i))
            m.setFunction(b, a, getBit(bits, i))
        }
    }
}

function drawCodewords(m, data) {
    var i = 0, size = m.size
    for (var right = size - 1; right >= 1; right -= 2) {
        if (right == 6)
            right = 5
        for (var vert = 0; vert < size; vert++)
            for (var j = 0; j < 2; j++) {
                var x = right - j
                var upward = ((right + 1) & 2) == 0
                var y = upward ? size - 1 - vert : vert
                if (m.isFunction[y][x])
                    continue
                if (i < data.length * 8) {
                    m.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7))
                    i++
                }
                else
                    m.isRemainder[x + ',' + y] = true
            }
    }
}

function maskInvert(mask, x, y) {
    switch (mask) {
        case 0: return (x + y) % 2 == 0
        case 1: return y % 2 == 0
        case 2: return x % 3 == 0
        case 3: return (x + y) % 3 == 0
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0
        case 5: return x * y % 2 + x * y % 3 == 0
        case 6: return (x * y % 2 + x * y % 3) % 2 == 0
        default: return ((x + y) % 2 + x * y % 3) % 2 == 0
    }
}

function applyMask(m, mask, unmaskedRemainder) {
    for (var y = 0; y < m.size; y++)
        for (var x = 0; x < m.size; x++)
            if (!m.isFunction[y][x] && maskInvert(mask, x, y) && !(unmaskedRemainder && m.isRemainder[x + ',' + y]))
                m.modules[y][x] = !m.modules[y][x]
}

// ---------------- mask penalty ----------------

function penaltyScore(m) {
    var size = m.size, result = 0

    function addHistory(runLength, history) {
        if (history[0] == 0)
            runLength += size  // light border before the first run
        history.pop()
        history.unshift(runLength)
    }
    function countPatterns(h) {
        var n = h[1]
        var core = n > 0 && h[2] == n && h[3] == n * 3 && h[4] == n && h[5] == n
        return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0)
    }
    function terminateAndCount(color, runLength, history) {
        if (color) {
            addHistory(runLength, history)
            runLength = 0
        }
        runLength += size
        addHistory(runLength, history)
        return countPatterns(history)
    }
    function scanLine(get) {
        var color = false, run = 0, history = [0, 0, 0, 0, 0, 0, 0]
        for (var i = 0; i < size; i++) {
            if (get(i) == color) {
                run++
                if (run == 5) result += 3
                else if (run > 5) result++
            } else {
                addHistory(run, history)
                if (!color)
                    result += countPatterns(history) * 40
                color = get(i)
                run = 1
            }
        }
        result += terminateAndCount(color, run, history) * 40
    }

    for (var y = 0; y < size; y++)
        scanLine(function(x) { return m.modules[y][x] })
    for (var x = 0; x < size; x++)
        scanLine(function(y) { return m.modules[y][x] })

    for (var y = 0; y < size - 1; y++)
        for (var x = 0; x < size - 1; x++) {
            var c = m.modules[y][x]
            if (c == m.modules[y][x + 1] && c == m.modules[y + 1][x] && c == m.modules[y + 1][x + 1])
                result += 3
        }

    var dark = 0
    m.modules.forEach(function(row) { row.forEach(function(c) { if (c) dark++ }) })
    var total = size * size
    var k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1
    return result + k * 10
}

// ---------------- encode ----------------

// parts: array of strings, one segment each. Returns { version, ecl, mask, size, modules }
function encode(parts, eclName, opts) {
    var unmaskedRemainder = !!(opts && opts.unmaskedRemainder)
    var ecl = ECL[eclName]
    var segs = parts.filter(function(p) { return p.length > 0 }).map(makeSegment)
    var ver, used
    for (ver = 1; ; ver++) {
        if (ver > 40)
            throw new Error("Dữ liệu quá dài cho mã QR")
        used = totalBits(segs, ver)
        if (used <= numDataCodewords(ver, ecl) * 8)
            break
    }

    var bb = []
    segs.forEach(function(seg) {
        appendBits(seg.mode.bits, 4, bb)
        appendBits(seg.numChars, ccBits(seg.mode, ver), bb)
        bb.push.apply(bb, seg.data)
    })
    var capacity = numDataCodewords(ver, ecl) * 8
    appendBits(0, Math.min(4, capacity - bb.length), bb)
    appendBits(0, (8 - bb.length % 8) % 8, bb)
    for (var pad = 0xEC; bb.length < capacity; pad ^= 0xEC ^ 0x11)
        appendBits(pad, 8, bb)
    var data = []
    for (var i = 0; i < bb.length; i += 8) {
        var b = 0
        for (var j = 0; j < 8; j++)
            b = (b << 1) | bb[i + j]
        data.push(b)
    }

    var m = new Matrix(ver)
    drawFunctionPatterns(m, ver, ecl)
    drawCodewords(m, addEccAndInterleave(data, ver, ecl))

    var best = 0, minPenalty = Infinity
    for (var i = 0; i < 8; i++) {
        applyMask(m, i, unmaskedRemainder)
        drawFormatBits(m, ecl, i)
        var p = penaltyScore(m)
        if (p < minPenalty) {
            best = i
            minPenalty = p
        }
        applyMask(m, i, unmaskedRemainder)  // undo
    }
    applyMask(m, best, unmaskedRemainder)
    drawFormatBits(m, ecl, best)
    return { version: ver, ecl: eclName, mask: best, size: m.size, modules: m.modules }
}

function svg(parts, eclName, opts) {
    var q = encode(parts, eclName, opts)
    var n = q.size + QUIET_ZONE * 2, w = n * MODULE_PX
    var s = '<svg width="' + w + '" height="' + w + '" version="1.1" xmlns="http://www.w3.org/2000/svg">\n'
          + '<g id="barcode" fill="#000000">\n'
          + '<rect x="0" y="0" width="' + w + '" height="' + w + '" fill="#FFFFFF" />\n'
    q.modules.forEach(function(row, y) {
        for (var x = 0; x < q.size; ) {
            if (!row[x]) { x++; continue }
            var x0 = x
            while (x < q.size && row[x])
                x++
            s += '<rect x="' + (x0 + QUIET_ZONE) * MODULE_PX + '" y="' + (y + QUIET_ZONE) * MODULE_PX
               + '" width="' + (x - x0) * MODULE_PX + '" height="' + MODULE_PX + '" />\n'
        }
    })
    return s + '</g>\n</svg>\n'
}

return { encode: encode, svg: svg }
})()
