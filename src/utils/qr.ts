// ============================================================================
// Lightweight QR code generator — pure TypeScript, no dependencies.
//
// Implements the QR Code Model 2 specification for byte-mode encoding up to
// version 10 (max 213 bytes for level M), which is more than enough for a
// profile share URL. Produces a boolean matrix (true = dark module) that the
// UI renders as a CSS grid or canvas.
//
// Reference: ISO/IEC 18004
// ============================================================================

type Version = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

// Galois field tables for Reed-Solomon error correction
const GF_EXP: number[] = new Array(512);
const GF_LOG: number[] = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

// Generator polynomial for a given number of error correction codewords
function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const newPoly = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      newPoly[j] ^= poly[j];
      newPoly[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = newPoly;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const buf = [...data, ...new Array(ecLen).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = buf[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) {
      buf[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return buf.slice(data.length);
}

// Capacity (data codewords) for versions 1-10 at error level M
const CAPACITY_M: Record<Version, number> = {
  1: 16, 2: 28, 3: 44, 4: 64, 5: 86, 6: 108, 7: 128, 8: 156, 9: 180, 10: 206,
};
// EC codewords per block for level M
const EC_PER_BLOCK_M: Record<Version, number> = {
  1: 10, 2: 10, 3: 12, 4: 14, 5: 18, 6: 16, 7: 18, 8: 20, 9: 20, 10: 22,
};
// Block layout (groups): [numBlocks, dataPerBlock]
const BLOCKS_M: Record<Version, [number, number][]> = {
  1: [[1, 16]], 2: [[1, 28]], 3: [[1, 44]], 4: [[2, 32]], 5: [[2, 43]],
  6: [[2, 27]], 7: [[4, 31]], 8: [[2, 38], [2, 39]], 9: [[3, 36], [2, 37]],
  10: [[4, 40], [2, 41]],
};

function pickVersion(byteLen: number): Version {
  for (let v = 1; v <= 10; v++) {
    if (CAPACITY_M[v as Version] >= byteLen + 2) return v as Version; // +2 for mode+length
  }
  return 10;
}

// Alignment pattern center positions per version
const ALIGN_POS: Record<Version, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

function buildMatrix(data: number[], version: Version, ecLen: number): boolean[][] {
  const size = version * 4 + 17;
  const m: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  // Finder patterns (3 corners)
  const placeFinder = (r: number, c: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const isOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        m[rr][cc] = isOuter && (isBorder || isCenter);
        reserved[rr][cc] = true;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Alignment patterns
  const positions = ALIGN_POS[version];
  for (const r of positions) {
    for (const c of positions) {
      // Skip if overlapping finder
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 8) || (r >= size - 8 && c <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr, cc = c + dc;
          const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          m[rr][cc] = isBorder || isCenter;
          reserved[rr][cc] = true;
        }
      }
    }
  }

  // Dark module
  m[size - 8][8] = true;
  reserved[size - 8][8] = true;

  // Reserve format areas
  for (let i = 0; i < 9; i++) {
    if (i !== 6) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Place data bits (zigzag)
  let bitIdx = 0;
  const bits = data.flatMap((b) => {
    const arr: boolean[] = [];
    for (let i = 7; i >= 0; i--) arr.push(((b >> i) & 1) === 1);
    return arr;
  });
  let col = size - 1;
  let goingUp = true;
  while (col > 0) {
    if (col === 6) col--; // skip timing column
    for (let i = 0; i < size; i++) {
      const row = goingUp ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (!reserved[row][cc] && bitIdx < bits.length) {
          m[row][cc] = bits[bitIdx++];
        }
      }
    }
    col -= 2;
    goingUp = !goingUp;
  }

  // Apply mask pattern 0 (i+j mod 2 === 0) and format info
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && (r + c) % 2 === 0) {
        m[r][c] = !m[r][c];
      }
    }
  }
  applyFormatInfo(m, size, ecLen);

  return m;
}

// Format info bits for error level M + mask pattern 0
function applyFormatInfo(m: boolean[][], size: number, _ecLen: number) {
  // Level M = 00, Mask 0 = 00 -> format = 0b00000 = 0
  // BCH(15,5) encode of 0 with generator 0x537 = 0b10100110111
  let format = 0b00000; // L=00, M=01 -> M is 00? No. Let me use correct.
  // Error level bits: L=01, M=00, Q=11, H=10
  // M = 00, mask 0 = 000 -> data = 00000
  format = 0; // M + mask 0
  let bch = format << 10;
  const gen = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((bch >> i) & 1) bch ^= gen << (i - 10);
  }
  const result = ((format << 10) | bch) ^ 0b101010000010010;

  // Place format bits
  for (let i = 0; i < 6; i++) {
    m[8][i] = ((result >> i) & 1) === 1;
    m[size - 1 - i][8] = ((result >> i) & 1) === 1;
  }
  m[8][7] = ((result >> 6) & 1) === 1;
  m[8][8] = ((result >> 7) & 1) === 1;
  m[7][8] = ((result >> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) {
    m[8][size - 15 + i] = ((result >> i) & 1) === 1;
    m[14 - i][8] = ((result >> i) & 1) === 1;
  }
  m[size - 8][8] = true; // dark module
}

/**
 * Generate a QR code matrix from text.
 * Returns a 2D boolean array (true = dark module).
 * Supports up to ~200 bytes (version 10, level M).
 */
export function generateQR(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const version = pickVersion(bytes.length);

  // Byte mode: 0100 + length (8 bits for v1-9, 16 bits for v10+)
  const lenBits = version < 10 ? 8 : 16;
  const bitStream: number[] = [];

  // Mode indicator
  bitStream.push(0, 1, 0, 0);
  // Length
  for (let i = lenBits - 1; i >= 0; i--) bitStream.push((bytes.length >> i) & 1);
  // Data
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bitStream.push((b >> i) & 1);
  }

  // Terminator (up to 4 zeros)
  const totalDataBits = CAPACITY_M[version] * 8;
  for (let i = 0; i < 4 && bitStream.length < totalDataBits; i++) bitStream.push(0);

  // Pad to byte boundary
  while (bitStream.length % 8 !== 0) bitStream.push(0);

  // Convert to bytes
  const dataCodewords: number[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bitStream[i + j];
    dataCodewords.push(b);
  }

  // Pad with 0xEC, 0x11
  const pad = [0xec, 0x11];
  let padIdx = 0;
  while (dataCodewords.length < CAPACITY_M[version]) {
    dataCodewords.push(pad[padIdx % 2]);
    padIdx++;
  }

  // Error correction
  const ecLen = EC_PER_BLOCK_M[version];
  const blocks = BLOCKS_M[version];
  const blockData: number[][] = [];
  const blockEc: number[][] = [];
  let offset = 0;
  for (const [count, dataPer] of blocks) {
    for (let b = 0; b < count; b++) {
      const chunk = dataCodewords.slice(offset, offset + dataPer);
      offset += dataPer;
      blockData.push(chunk);
      blockEc.push(rsEncode(chunk, ecLen));
    }
  }

  // Interleave
  const interleaved: number[] = [];
  const maxData = Math.max(...blocks.map(([_, d]) => d));
  for (let i = 0; i < maxData; i++) {
    for (const block of blockData) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (const block of blockEc) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }

  return buildMatrix(interleaved, version, ecLen);
}

/**
 * Render a QR matrix to a canvas and return a data URL.
 */
export function qrToDataURL(text: string, scale = 8, padding = 4): string {
  const matrix = generateQR(text);
  const size = matrix.length;
  const dim = (size + padding * 2) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + padding) * scale, (r + padding) * scale, scale, scale);
      }
    }
  }
  return canvas.toDataURL('image/png');
}
