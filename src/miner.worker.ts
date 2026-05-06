// Web Worker for Real SHA-256 Mining (TS-Friendly)

function sha256(ascii: string): string {
    const rightRotate = (value: number, amount: number) => {
        return (value >>> amount) | (value << (32 - amount));
    };
    
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j;
    let result = '';

    const words: number[] = [];
    const asciiLength = ascii.length;
    const h: number[] = [];
    const k: number[] = [];
    let primeCounter = 0;

    const isComposite: { [key: number]: number } = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            h[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return ''; // ASCII check
        words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words.length] = ((asciiLength * 8) / maxWord) | 0;
    words[words.length] = (asciiLength * 8) | 0;

    let hash = h.slice(0);
    for (j = 0; j < words.length; j += 16) {
        const w = words.slice(j, j + 16);
        const oldHash = hash.slice(0);
        
        for (i = 0; i < 64; i++) {
            if (i >= 16) {
                const a = w[i - 15], b = w[i - 2];
                w[i] = (w[i - 16] +
                    (rightRotate(a, 7) ^ rightRotate(a, 18) ^ (a >>> 3)) +
                    w[i - 7] +
                    (rightRotate(b, 17) ^ rightRotate(b, 19) ^ (b >>> 10))) | 0;
            }

            const temp1 = hash[7] +
                (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
                ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) +
                k[i] +
                w[i];
            const temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
                ((hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]));

            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
            hash.pop();
        }

        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            const byte = (hash[i] >> (j * 8)) & 255;
            result += (byte < 16 ? '0' : '') + byte.toString(16);
        }
    }
    return result;
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'START_MINING') {
    const { difficulty, minerWallet, blockData } = payload;
    const prefix = '0'.repeat(difficulty);
    
    let nonce = 0;
    const found = false;
    let lastReportTime = Date.now();
    let hashesSinceLastReport = 0;

    const batchSize = 500; 

    while (!found) {
      for (let i = 0; i < batchSize; i++) {
        nonce++;
        hashesSinceLastReport++;

        const dataToHash = `${blockData}${nonce}${minerWallet}`;
        const hash = sha256(dataToHash);

        if (hash.startsWith(prefix)) {
          self.postMessage({
            type: 'BLOCK_FOUND',
            payload: { nonce, hash, minerWallet, difficulty }
          });
          return; // Stop worker after finding block, App.tsx will restart it
        }
      }

      const now = Date.now();
      if (now - lastReportTime >= 1000) {
        self.postMessage({
          type: 'HASHRATE_UPDATE',
          payload: { hashRate: hashesSinceLastReport }
        });
        hashesSinceLastReport = 0;
        lastReportTime = now;
      }

      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
};
