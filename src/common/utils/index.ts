export const urlDecodeBytes = (encoded: string) => {
  let decoded = Buffer.from('');
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === '%') {
      const charBuf = Buffer.from(`${encoded[i + 1]}${encoded[i + 2]}`, 'hex');
      decoded = Buffer.concat([decoded, charBuf]);
      i += 2;
    } else {
      const charBuf = Buffer.from(encoded[i]);
      decoded = Buffer.concat([decoded, charBuf]);
    }
  }
  return decoded;
};
