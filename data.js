// A deliberately small, reviewed demo graph. Every biomedical edge names its source.
// This prototype does not infer a diagnosis, treatment, or trial eligibility.
export const checkedAt = "2026-10-03";

export const sources = [
  {
    id: "gr-frda",
    title: "Friedreich Ataxia",
    publisher: "GeneReviews / NCBI Bookshelf",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK1281/",
    updated: "2025-06-26",
    kind: "clinical reference"
  },
  {
    id: "gr-at",
    title: "Ataxia-Telangiectasia",
    publisher: "GeneReviews / NCBI Bookshelf",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK26468/",
    updated: "2026-09-22",
    kind: "clinical reference"
  },
  {
    id: "ct-unified",
    title: "UNIFIED Natural History Study · NCT06016946",
    publisher: "ClinicalTrials.gov",
    url: "https://clinicaltrials.gov/study/NCT06016946",
    updated: "Check live record",
    kind: "study registry"
  },
  {
    id: "fara",
    title: "Friedreich’s Ataxia Research Alliance: Research",
    publisher: "FARA",
    url: "https://www.curefa.org/research/",
    updated: "Check live site",
    kind: "patient and research organization"
  }
];

export const nodes = [
  {
    id: "frda", type: "disease", label: "Friedreich ataxia", short: "FRDA",
    x: -0.46, y: 0.1, z: 0.36,
    summary: "An inherited neurologic condition with progressive ataxia and possible effects beyond the nervous system.",
    detail: "This demo traces the FXN association, two documented manifestations, a natural-history study, and a research community. It does not assess an individual person.",
    sourceIds: ["gr-frda"]
  },
  {
    id: "at", type: "disease", label: "Ataxia-telangiectasia", short: "A-T",
    x: 0.56, y: -0.17, z: -0.02,
    summary: "A distinct inherited multisystem condition; ataxia is one of its manifestations.",
    detail: "A-T enters this graph because it shares an ataxia phenotype with FRDA. Its genetic basis differs. A shared symptom is not evidence of shared treatment.",
    sourceIds: ["gr-at"]
  },
  {
    id: "fxn", type: "gene", label: "FXN", short: "FXN",
    x: -0.8, y: -0.42, z: 0.02,
    summary: "The gene implicated in Friedreich ataxia.",
    detail: "GeneReviews describes FRDA in association with biallelic pathogenic FXN variants, most often GAA-repeat expansions.",
    sourceIds: ["gr-frda"]
  },
  {
    id: "atm", type: "gene", label: "ATM", short: "ATM",
    x: 0.84, y: 0.34, z: -0.13,
    summary: "The gene implicated in ataxia-telangiectasia.",
    detail: "GeneReviews describes A-T in association with biallelic pathogenic ATM variants.",
    sourceIds: ["gr-at"]
  },
  {
    id: "ataxia", type: "phenotype", label: "Ataxia", short: "Ataxia",
    x: 0.06, y: 0.4, z: 0.22,
    summary: "A movement and coordination phenotype reported in both example conditions.",
    detail: "This is a phenotype-level bridge only. The two diseases have different genetic mechanisms and broader clinical profiles.",
    sourceIds: ["gr-frda", "gr-at"]
  },
  {
    id: "cardio", type: "phenotype", label: "Cardiomyopathy", short: "Cardiac",
    x: -0.31, y: -0.7, z: -0.27,
    summary: "A cardiac manifestation reported in Friedreich ataxia.",
    detail: "GeneReviews describes hypertrophic cardiomyopathy among possible FRDA findings. This graph does not estimate a person's risk.",
    sourceIds: ["gr-frda"]
  },
  {
    id: "unified", type: "study", label: "UNIFIED study", short: "Study",
    x: -0.01, y: -0.48, z: 0.3,
    summary: "A registered natural-history study focused on Friedreich ataxia.",
    detail: "The registry record describes a longitudinal observational study. Open the live record for current status, sites, and eligibility; this snapshot makes no eligibility claim.",
    sourceIds: ["ct-unified"]
  },
  {
    id: "fara", type: "community", label: "FARA", short: "FARA",
    x: -0.88, y: 0.55, z: -0.16,
    summary: "A patient and research organization for Friedreich ataxia.",
    detail: "FARA connects the FRDA community with research resources and participation information. This is a resource link, not an endorsement or a care recommendation.",
    sourceIds: ["fara"]
  }
];

export const edges = [
  { id: "frda-fxn", from: "frda", to: "fxn", relation: "genetic basis", strength: "documented", sourceIds: ["gr-frda"], note: "GeneReviews links FRDA with biallelic pathogenic variants in FXN." },
  { id: "at-atm", from: "at", to: "atm", relation: "genetic basis", strength: "documented", sourceIds: ["gr-at"], note: "GeneReviews links A-T with biallelic pathogenic variants in ATM." },
  { id: "frda-ataxia", from: "frda", to: "ataxia", relation: "reported phenotype", strength: "documented", sourceIds: ["gr-frda"], note: "Progressive ataxia is described in the FRDA clinical reference." },
  { id: "at-ataxia", from: "at", to: "ataxia", relation: "reported phenotype", strength: "documented", sourceIds: ["gr-at"], note: "Ataxia is described in the A-T clinical reference." },
  { id: "frda-cardio", from: "frda", to: "cardio", relation: "reported phenotype", strength: "documented", sourceIds: ["gr-frda"], note: "Cardiomyopathy is listed among possible FRDA findings." },
  { id: "frda-unified", from: "frda", to: "unified", relation: "study focus", strength: "registry", sourceIds: ["ct-unified"], note: "The registry identifies FRDA as the focus of the UNIFIED natural-history study." },
  { id: "frda-fara", from: "frda", to: "fara", relation: "community resource", strength: "organization", sourceIds: ["fara"], note: "FARA describes its FRDA research and community work." },
  { id: "frda-at", from: "frda", to: "at", relation: "shared phenotype: ataxia", strength: "cross-source inference", sourceIds: ["gr-frda", "gr-at"], note: "Both references describe ataxia. The conditions have different implicated genes; no shared treatment is inferred." }
];

export const journeys = {
  family: [
    { title: "Understand the evidence", body: "Open the clinical reference behind a disease or connection, then bring questions to a qualified care team.", nodeId: "frda" },
    { title: "Find community", body: "Review FARA's public research and support resources directly.", nodeId: "fara" },
    { title: "Check a live study record", body: "Read the current registry page before discussing any study with a clinician; this app does not determine eligibility.", nodeId: "unified" }
  ],
  researcher: [
    { title: "Trace the genetic claim", body: "Inspect the FRDA–FXN edge and its cited clinical reference.", edgeId: "frda-fxn" },
    { title: "Compare without overclaiming", body: "Follow the shared-ataxia bridge to A-T, then inspect the distinct FXN and ATM links.", edgeId: "frda-at" },
    { title: "Explore study context", body: "Open the natural-history registry and the patient organization's research program.", nodeId: "unified" }
  ]
};
