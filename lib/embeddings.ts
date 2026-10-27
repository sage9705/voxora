const CONCEPT_DICTIONARY: Record<number, string[]> = {
  0: ['revenue', 'earnings', 'profit', 'margin', 'ebitda', 'financial', 'fiscal', 'valuation', 'cashflow', 'debt', 'dividends', 'capital', 'expenditure', 'income', 'sales', 'budget', 'roi', 'balance', 'sheet', 'finances', 'profitable', 'monetary'],
  1: ['risk', 'headwind', 'threat', 'decline', 'vulnerability', 'exposure', 'loss', 'volatility', 'uncertainty', 'downturn', 'slump', 'drawback', 'adverse', 'impairment', 'deficit', 'danger', 'hazard', 'peril', 'risky', 'drop', 'fall'],
  2: ['growth', 'expansion', 'strategic', 'trajectory', 'milestone', 'roadmap', 'scaling', 'target', 'objective', 'opportunity', 'pipeline', 'potential', 'momentum', 'gain', 'initiative', 'grow', 'increase', 'progress', 'future'],
  3: ['obligation', 'obligations', 'duty', 'duties', 'responsibility', 'covenant', 'requirement', 'binding', 'mandate', 'compliance', 'statutory', 'regulation', 'regulatory', 'audit', 'standard', 'obligated', 'agreed', 'committed', 'must', 'shall'],
  4: ['liability', 'indemnity', 'indemnification', 'breach', 'damages', 'warranty', 'claim', 'claims', 'dispute', 'lawsuit', 'arbitration', 'litigation', 'penalty', 'default', 'loss', 'sue', 'sued', 'suing', 'liable', 'hold', 'harmless', 'guarantee'],
  5: ['term', 'terms', 'duration', 'renewal', 'termination', 'expiration', 'effective', 'date', 'clause', 'agreement', 'contract', 'provision', 'party', 'parties', 'amendment', 'period', 'expiry', 'validity', 'cancel'],
  6: ['payment', 'fee', 'fees', 'invoice', 'compensation', 'cost', 'costs', 'pricing', 'price', 'billing', 'rate', 'expense', 'expenses', 'salary', 'remuneration', 'consideration', 'charge', 'dues', 'amount', 'pay', 'paid'],
  7: ['procedure', 'step', 'steps', 'instructions', 'setup', 'installation', 'priming', 'configuration', 'startup', 'workflow', 'guideline', 'process', 'operational', 'deploy', 'how', 'operate', 'run', 'execute', 'initiate'],
  8: ['troubleshoot', 'fault', 'faults', 'symptom', 'diagnostic', 'repair', 'repairs', 'fix', 'fixing', 'error', 'errors', 'issue', 'issues', 'malfunction', 'leak', 'broken', 'failure', 'defect', 'solve', 'corrective', 'remedy', 'resolve'],
  9: ['specification', 'spec', 'specs', 'tolerance', 'parameter', 'rating', 'pressure', 'voltage', 'dimension', 'capacity', 'temperature', 'bar', 'psi', 'wattage', 'frequency', 'rpm', 'flow', 'size', 'output', 'power', 'limit'],
  10: ['warning', 'caution', 'hazard', 'danger', 'safe', 'safety', 'protective', 'emergency', 'shutoff', 'limit', 'precaution', 'alert', 'poison', 'shock', 'combustible', 'harm', 'secure'],
  11: ['motor', 'pump', 'engine', 'component', 'valve', 'assembly', 'sensor', 'chassis', 'mechanical', 'gear', 'cylinder', 'pipe', 'seal', 'bearing', 'hardware', 'unit', 'equipment', 'device', 'machine', 'parts'],
  12: ['experience', 'history', 'background', 'career', 'track', 'tenure', 'progression', 'role', 'position', 'employed', 'employer', 'industry', 'previous', 'years', 'work', 'working', 'resume', 'cv', 'employment'],
  13: ['skills', 'proficient', 'expertise', 'languages', 'frameworks', 'developer', 'stack', 'architecture', 'engineer', 'software', 'tools', 'competencies', 'adept', 'technical', 'abilities', 'capable', 'technologies', 'proficiencies'],
  14: ['degree', 'university', 'bachelor', 'master', 'phd', 'certification', 'diploma', 'academic', 'alumni', 'college', 'gpa', 'honors', 'credential', 'certified', 'education', 'graduate', 'school', 'qualifications', 'qualification'],
  15: ['lead', 'leader', 'managed', 'management', 'director', 'head', 'oversaw', 'coordinated', 'stakeholder', 'executive', 'team', 'supervised', 'mentor', 'principal', 'vp', 'manager', 'leadership', 'orchestrated'],
  16: ['table', 'row', 'rows', 'column', 'columns', 'cell', 'dataset', 'spreadsheet', 'csv', 'excel', 'metric', 'record', 'chart', 'entry', 'sheet', 'tabular', 'statistics', 'figure', 'value', 'data', 'grid'],
  17: ['schedule', 'timeline', 'deadline', 'phase', 'quarterly', 'annual', 'date', 'duration', 'frequency', 'monthly', 'weekly', 'period', 'milestone', 'calendar', 'time', 'q1', 'q2', 'q3', 'q4', 'year'],
  18: ['compare', 'difference', 'versus', 'vs', 'change', 'modification', 'update', 'variance', 'contrast', 'alternative', 'revision', 'relative', 'distinguish', 'differ', 'comparison', 'diff', 'between', 'delta'],
  19: ['summary', 'overview', 'executive', 'abstract', 'conclusion', 'takeaway', 'objective', 'highlight', 'synopsis', 'gist', 'essence', 'core', 'recap', 'brief', 'summarize', 'key', 'main'],
  20: ['api', 'code', 'algorithm', 'function', 'database', 'system', 'cloud', 'backend', 'frontend', 'react', 'node', 'python', 'typescript', 'endpoint', 'query', 'service', 'git', 'sql', 'rest'],
  21: ['feature', 'capability', 'version', 'model', 'release', 'edition', 'package', 'offering', 'product', 'line', 'tier', 'generation', 'standard', 'pro', 'variant', 'v1', 'v2'],
  22: ['customer', 'client', 'market', 'user', 'audience', 'demographic', 'segment', 'demand', 'consumer', 'buyer', 'satisfaction', 'retention', 'churn', 'clients'],
  23: ['policy', 'standard', 'governance', 'privacy', 'security', 'gdpr', 'confidential', 'proprietary', 'disclosure', 'secret', 'nda', 'authorization', 'permission', 'confidentiality', 'protection'],
  24: ['meeting', 'minutes', 'notes', 'discussion', 'action', 'memo', 'agenda', 'decision', 'presentation', 'call', 'alignment', 'feedback', 'summary', 'minutes', 'transcript'],
  25: ['jurisdiction', 'governing', 'law', 'venue', 'court', 'territory', 'international', 'domestic', 'enforceability', 'state', 'federal', 'legal', 'laws'],
  26: ['efficiency', 'throughput', 'latency', 'performance', 'benchmark', 'optimization', 'speed', 'fast', 'quick', 'response', 'bandwidth', 'load', 'scale'],
  27: ['testing', 'qa', 'quality', 'verification', 'validation', 'inspection', 'audit', 'test', 'reliable', 'robustness', 'pass', 'fail', 'criteria', 'verify'],
  28: ['employee', 'candidate', 'staff', 'contractor', 'founder', 'consultant', 'talent', 'workforce', 'resource', 'hiring', 'human', 'personnel', 'applicant'],
  29: ['company', 'enterprise', 'corporation', 'firm', 'agency', 'department', 'organization', 'division', 'subsidiary', 'partner', 'vendor', 'entity', 'business'],
  30: ['number', 'amount', 'total', 'sum', 'average', 'percentage', 'ratio', 'count', 'maximum', 'minimum', 'threshold', 'peak', 'limit', 'range', 'highest', 'lowest'],
  31: ['location', 'facility', 'office', 'site', 'headquarters', 'region', 'address', 'plant', 'factory', 'warehouse', 'hub', 'zone', 'place', 'city', 'country'],
};

function stem(word: string): string {
  if (word.length <= 3) return word;
  let w = word.toLowerCase();
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('tion') && w.length > 6) return w.slice(0, -4);
  if (w.endsWith('ment') && w.length > 6) return w.slice(0, -4);
  if (w.endsWith('able') && w.length > 6) return w.slice(0, -4);
  return w;
}

const VECTOR_DIMENSIONS = 256;
const CONCEPT_DIMS = 32;
const HASH_DIMS_START = 32;
const HASH_DIMS_COUNT = 192;
const STRUCTURAL_DIMS_START = 224;

function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function computeDenseEmbedding(text: string): number[] {
  const vector = new Float32Array(VECTOR_DIMENSIONS);
  const normalized = text.toLowerCase();
  const words = normalized.match(/[a-z0-9]+(?:[.'’-][a-z0-9]+)*/g) ?? [];

  if (words.length === 0) {
    return Array.from(vector);
  }

  const wordFrequency = new Map<string, number>();
  const stemFrequency = new Map<string, number>();
  for (const w of words) {
    wordFrequency.set(w, (wordFrequency.get(w) ?? 0) + 1);
    const s = stem(w);
    stemFrequency.set(s, (stemFrequency.get(s) ?? 0) + 1);
  }

  for (let dim = 0; dim < CONCEPT_DIMS; dim++) {
    const keywords = CONCEPT_DICTIONARY[dim];
    if (!keywords) continue;
    let conceptScore = 0;
    for (const kw of keywords) {
      const exactCount = wordFrequency.get(kw) ?? 0;
      if (exactCount > 0) {
        conceptScore += 1.5 * Math.log(1 + exactCount);
      }
      const stemmedCount = stemFrequency.get(stem(kw)) ?? 0;
      if (stemmedCount > 0 && exactCount === 0) {
        conceptScore += 1.2 * Math.log(1 + stemmedCount);
      }
      for (const [w, count] of wordFrequency) {
        if (w !== kw && (w.startsWith(kw) || kw.startsWith(w)) && Math.min(w.length, kw.length) >= 4) {
          conceptScore += 0.8 * Math.log(1 + count);
        }
      }
    }
    vector[dim] = conceptScore;
  }

  for (const [word, count] of wordFrequency) {
    const weight = Math.log(1 + count);
    const wordHash = fnv1aHash(word);
    const targetDim = HASH_DIMS_START + (wordHash % HASH_DIMS_COUNT);
    const sign = (wordHash & 1) === 0 ? 1 : -1;
    vector[targetDim] += sign * weight;

    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const triGram = word.slice(i, i + 3);
        const subHash = fnv1aHash(triGram);
        const subDim = HASH_DIMS_START + (subHash % HASH_DIMS_COUNT);
        const subSign = (subHash & 1) === 0 ? 1 : -1;
        vector[subDim] += subSign * 0.3 * weight;
      }
    }
    if (word.length >= 4) {
      for (let i = 0; i <= word.length - 4; i++) {
        const fourGram = word.slice(i, i + 4);
        const subHash = fnv1aHash(fourGram);
        const subDim = HASH_DIMS_START + (subHash % HASH_DIMS_COUNT);
        const subSign = (subHash & 1) === 0 ? 1 : -1;
        vector[subDim] += subSign * 0.45 * weight;
      }
    }
  }

  vector[STRUCTURAL_DIMS_START] = Math.log(1 + words.length) / 8.0;
  vector[STRUCTURAL_DIMS_START + 1] = Math.log(1 + (text.match(/\d+/g)?.length ?? 0));
  vector[STRUCTURAL_DIMS_START + 2] = (text.match(/[A-Z]/g)?.length ?? 0) / Math.max(text.length, 1);
  vector[STRUCTURAL_DIMS_START + 3] = /\b(what|how|why|when|where|who|which)\b/i.test(normalized) ? 1.0 : 0.0;
  vector[STRUCTURAL_DIMS_START + 4] = /\b(step|procedure|instructions|how to)\b/i.test(normalized) ? 1.0 : 0.0;
  vector[STRUCTURAL_DIMS_START + 5] = /\b(compare|difference|versus|vs)\b/i.test(normalized) ? 1.0 : 0.0;

  let sumSquares = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    sumSquares += vector[i] * vector[i];
  }

  const magnitude = Math.sqrt(sumSquares);
  if (magnitude > 1e-7) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] /= magnitude;
    }
  }

  return Array.from(vector);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(-1, Math.min(1, dotProduct));
}
