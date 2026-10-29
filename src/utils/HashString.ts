 export default function hashString(str: string): number {
  const safe = str ?? '';
  let hash = 0;
  for (let i = 0; i < safe.length; i += 1) {
    hash = (hash << 5) - hash + safe.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}