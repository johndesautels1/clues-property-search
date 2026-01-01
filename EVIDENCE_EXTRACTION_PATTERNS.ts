/**
 * Evidence Extraction Patterns
 * Extracts sentence fragments from MLS text to create fieldCandidates
 * Pattern: LLM receives ONLY these snippets, not full text
 */

export interface EvidencePattern {
  fieldId: number;
  fieldName: string;
  keywords: string[];
  regex: RegExp;
  extractionRule: string;
}

export const EVIDENCE_PATTERNS: EvidencePattern[] = [
  // GARAGE TYPE (Field 44)
  {
    fieldId: 44,
    fieldName: 'Garage Type',
    keywords: ['garage', 'parking', 'carport'],
    regex: /(attached|detached|built-in|carport|oversized|tandem|converted|2-car|3-car|one-car|two-car|three-car).*?(garage|parking)/gi,
    extractionRule: 'Extract sentences containing garage type descriptors'
  },

  // FIREPLACE COUNT (Field 53)
  {
    fieldId: 53,
    fieldName: 'Fireplace Count',
    keywords: ['fireplace', 'fire place', 'wood burning', 'gas fireplace'],
    regex: /(\d+|one|two|three|multiple|dual).*?(fireplace|fire place)|fireplace.*?(living room|master|bedroom|family room)/gi,
    extractionRule: 'Extract sentences mentioning fireplace count or locations'
  },

  // RECENT RENOVATIONS (Field 59)
  {
    fieldId: 59,
    fieldName: 'Recent Renovations',
    keywords: ['renovated', 'remodeled', 'updated', 'new', 'replaced', 'installed', 'upgraded'],
    regex: /(renovated|remodeled|updated|new|replaced|installed|upgraded|refreshed).*?(kitchen|bathroom|roof|flooring|hvac|ac|countertops|appliances|windows|doors|paint|carpet|tile|fixtures).*?(\d{4}|\d{1,2}\s*(?:year|yr|month|mo))/gi,
    extractionRule: 'Extract sentences with renovation keywords + room/feature + date/timeframe'
  },

  // SMART HOME FEATURES (Field 134)
  {
    fieldId: 134,
    fieldName: 'Smart Home Features',
    keywords: ['smart', 'nest', 'ring', 'alexa', 'automated', 'home automation', 'wi-fi', 'app-controlled'],
    regex: /(smart|nest|ring|ecobee|alexa|automated|app-controlled|wi-fi|wireless|remote).*?(thermostat|doorbell|lock|camera|lighting|security|system|hub|speaker)/gi,
    extractionRule: 'Extract sentences mentioning smart home technology'
  },

  // PET POLICY (Field 136)
  {
    fieldId: 136,
    fieldName: 'Pet Policy',
    keywords: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'animal', 'animals'],
    regex: /(pets?|dogs?|cats?|animals?).*?(allowed|welcome|ok|friendly|permitted|accepted|no|not allowed|restricted|prohibited|case-by-case)/gi,
    extractionRule: 'Extract sentences about pet permissions'
  },

  // PET SIZE LIMIT (Field 163)
  {
    fieldId: 163,
    fieldName: 'Pet Size Limit',
    keywords: ['pet', 'dog', 'cat', 'small', 'large', 'weight', 'lb', 'lbs', 'pound'],
    regex: /(small|medium|large|extra large|toy|miniature|max|maximum|up to|limit|under).*?(pet|dog|cat)|(\d+)\s*(lb|lbs|pound).*?(pet|dog|cat|weight|limit)/gi,
    extractionRule: 'Extract sentences with pet size or weight restrictions'
  },

  // MAX PET WEIGHT (Field 164)
  {
    fieldId: 164,
    fieldName: 'Max Pet Weight',
    keywords: ['pet', 'dog', 'weight', 'lb', 'lbs', 'pound', 'max', 'maximum', 'limit'],
    regex: /(\d+)\s*(lb|lbs|pound|kg).*?(pet|dog|cat|weight|limit|max|maximum)/gi,
    extractionRule: 'Extract numeric pet weight limits'
  },

  // VIEW TYPE (Field 131)
  {
    fieldId: 131,
    fieldName: 'View Type',
    keywords: ['view', 'views', 'overlook', 'overlooking', 'facing'],
    regex: /(water|ocean|lake|river|canal|bay|gulf|pond|pool|golf|mountain|city|skyline|garden|park|greenbelt|nature|wooded|preserve|sunset).*?(view|views|overlook|facing)|view.*?(water|ocean|lake|golf|city|mountain)/gi,
    extractionRule: 'Extract sentences describing property views'
  },

  // LOT FEATURES (Field 132)
  {
    fieldId: 132,
    fieldName: 'Lot Features',
    keywords: ['lot', 'yard', 'landscaping', 'fenced', 'sprinkler', 'irrigation', 'mature trees'],
    regex: /(corner lot|cul-de-sac|oversized lot|large lot|fenced|privacy fence|mature trees|landscaped|sprinkler|irrigation|flat|sloped|cleared|wooded|preserve|conservation)/gi,
    extractionRule: 'Extract sentences describing lot characteristics'
  },

  // ACCESSIBILITY MODIFICATIONS (Field 135)
  {
    fieldId: 135,
    fieldName: 'Accessibility Modifications',
    keywords: ['wheelchair', 'accessible', 'ada', 'ramp', 'grab bars', 'wide doorways', 'roll-in shower'],
    regex: /(wheelchair|accessible|ada|handicap|ramp|grab bars|wide doorway|roll-in shower|no-step|step-free|barrier-free|elevator)/gi,
    extractionRule: 'Extract sentences mentioning accessibility features'
  },

  // LEASE RESTRICTIONS (Field 162)
  {
    fieldId: 162,
    fieldName: 'Lease Restrictions Y/N',
    keywords: ['lease', 'rent', 'rental', 'tenant', 'restriction', 'minimum lease'],
    regex: /(lease|rental|rent).*?(allowed|permitted|restrictions?|minimum|prohibited|not allowed|no rental|owner-occupied|must occupy)/gi,
    extractionRule: 'Extract sentences about rental/lease policies'
  },

  // MINIMUM LEASE PERIOD (Field 161)
  {
    fieldId: 161,
    fieldName: 'Minimum Lease Period',
    keywords: ['minimum lease', 'lease term', 'rental term', 'months', 'year lease'],
    regex: /(minimum|min|at least).*?(lease|rental|rent).*?(\d+).*?(month|year|day)|(lease|rental).*?(\d+).*?(month|year)/gi,
    extractionRule: 'Extract sentences with minimum lease duration'
  },

  // SPECIAL ASSESSMENTS (Field 138)
  {
    fieldId: 138,
    fieldName: 'Special Assessments',
    keywords: ['assessment', 'special assessment', 'pending assessment', 'additional fee', 'surcharge'],
    regex: /(special assessment|assessment pending|additional.*?fee|surcharge|levy|capital improvement|one-time|lump sum).*?(\$[\d,]+|\d+\s*dollars?)/gi,
    extractionRule: 'Extract sentences about special assessments or unusual fees'
  },

  // AGE RESTRICTIONS (Field 137)
  {
    fieldId: 137,
    fieldName: 'Age Restrictions',
    keywords: ['55+', '55 plus', 'age restricted', 'active adult', 'senior', '62+'],
    regex: /(55\+|55 plus|55-plus|62\+|age restricted|age qualification|active adult|senior living|retirement community|all ages|no age)/gi,
    extractionRule: 'Extract sentences about age restrictions or active adult communities'
  },

  // WATERFRONT FEET (Field 156)
  {
    fieldId: 156,
    fieldName: 'Waterfront Feet',
    keywords: ['waterfront', 'water frontage', 'feet of water', 'linear feet'],
    regex: /(\d+)\s*(feet|ft|linear feet|foot).*?(water|waterfront|frontage|shoreline)|waterfront.*?(\d+)\s*(feet|ft)/gi,
    extractionRule: 'Extract numeric waterfront measurements'
  },

  // ASSOCIATION APPROVAL (Field 165)
  {
    fieldId: 165,
    fieldName: 'Association Approval Required',
    keywords: ['association approval', 'hoa approval', 'board approval', 'approval required'],
    regex: /(association|hoa|board|condo association).*?(approval|must approve|requires approval|subject to approval|right of first refusal)/gi,
    extractionRule: 'Extract sentences about HOA/association approval requirements'
  }
];

/**
 * Extract evidence snippets from MLS text
 */
export function extractEvidenceSnippets(mlsText: string): Record<number, string[]> {
  const fieldCandidates: Record<number, string[]> = {};

  if (!mlsText) return fieldCandidates;

  // Split into sentences
  const sentences = mlsText.match(/[^.!?]+[.!?]+/g) || [];

  for (const pattern of EVIDENCE_PATTERNS) {
    const matches: string[] = [];

    // Check each sentence for matches
    for (const sentence of sentences) {
      // Check if sentence contains any keywords
      const hasKeyword = pattern.keywords.some(keyword =>
        sentence.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        // If regex matches, extract the sentence
        if (pattern.regex.test(sentence)) {
          matches.push(sentence.trim());
        }
      }
    }

    if (matches.length > 0) {
      fieldCandidates[pattern.fieldId] = matches;
    }
  }

  return fieldCandidates;
}

/**
 * Example usage:
 *
 * const mlsRemarks = "Beautiful home with attached 2-car garage. Kitchen fully remodeled in 2022 with quartz counters. Smart thermostat and Ring doorbell included. Pets welcome, 50 lb limit.";
 *
 * const evidence = extractEvidenceSnippets(mlsRemarks);
 * // Returns:
 * // {
 * //   44: ["Beautiful home with attached 2-car garage."],
 * //   59: ["Kitchen fully remodeled in 2022 with quartz counters."],
 * //   134: ["Smart thermostat and Ring doorbell included."],
 * //   136: ["Pets welcome, 50 lb limit."],
 * //   163: ["Pets welcome, 50 lb limit."]
 * // }
 *
 * // Then pass to LLM:
 * const llmPayload = {
 *   fieldCandidates: evidence,
 *   fields: [
 *     {id: 44, name: "Garage Type", backend_only: false},
 *     {id: 59, name: "Recent Renovations", backend_only: false},
 *     ...
 *   ]
 * };
 */
