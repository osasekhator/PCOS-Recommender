export function giColor(gi) {
  if (gi <= 55) return 'gi-low';
  if (gi <= 69) return 'gi-med';
  return 'gi-high';
}

export function giLabel(gi) {
  if (gi <= 55) return 'Low';
  if (gi <= 69) return 'Medium';
  return 'High';
}

export function pcosColor(score) {
  if (score >= 4) return '#2d9c6e';
  if (score >= 1) return '#e6a817';
  return '#d94f4f';
}