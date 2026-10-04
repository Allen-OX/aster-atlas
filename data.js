// A deliberately small, reviewed demo graph. Every biomedical edge names its source.
// This prototype does not infer a diagnosis, treatment, or trial eligibility.
export const checkedAt = "2026-10-04";

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
    updated: "2026-09-01",
    kind: "study registry"
  },
  {
    id: "fara",
    title: "Friedreich’s Ataxia Research Alliance: Research",
    publisher: "FARA",
    url: "https://www.curefa.org/research/",
    updated: "Check live site",
    kind: "patient and research organization"
  },
  {
    id: "fara-resources",
    title: "Research Resources",
    publisher: "Friedreich’s Ataxia Research Alliance",
    url: "https://www.curefa.org/research/research-resources/",
    updated: "Check live site",
    kind: "research asset directory"
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
    id: "fara", type: "organization", label: "FARA", short: "FARA",
    x: -0.88, y: 0.55, z: -0.16,
    summary: "A patient and research organization for Friedreich ataxia.",
    detail: "FARA connects the FRDA community with research resources and participation information. This is a resource link, not an endorsement or a care recommendation.",
    sourceIds: ["fara"]
  },
  {
    id: "fxn-gaa", type: "variant", label: "FXN GAA repeat expansion", short: "GAA",
    x: -0.63, y: -0.12, z: -0.36,
    summary: "The most common pathogenic variant class reported in Friedreich ataxia.",
    detail: "GeneReviews reports that a pathogenic GAA repeat expansion in FXN can silence transcription. This record describes a variant class, not an individual result.",
    sourceIds: ["gr-frda"]
  },
  {
    id: "fes-mechanism", type: "mechanism", label: "Frataxin and iron–sulfur cluster dysfunction", short: "Fe–S",
    x: -0.18, y: 0.63, z: -0.31,
    summary: "A reviewed molecular route from reduced frataxin to impaired mitochondrial iron–sulfur cluster function.",
    detail: "GeneReviews describes frataxin as required for iron–sulfur cluster synthesis and links frataxin deficiency to impaired mitochondrial respiratory function. This is a disease-mechanism summary, not a treatment claim.",
    sourceIds: ["gr-frda"]
  },
  {
    id: "fara-assets", type: "asset", label: "FARA shared research resources", short: "Assets",
    x: -0.72, y: 0.76, z: 0.24,
    summary: "Models, repositories, assays, biomarkers, clinical assessments, and datasets made discoverable for FRDA research.",
    detail: "FARA's public resource directory describes tools intended to support collaboration and reduce duplicated setup work. Reuse still requires direct review with the resource owner.",
    sourceIds: ["fara-resources"]
  },
  {
    id: "lynch", type: "investigator", label: "David Lynch, MD, PhD", short: "Lynch",
    x: 0.26, y: -0.69, z: -0.2,
    summary: "A principal investigator listed on the UNIFIED natural-history study record.",
    detail: "ClinicalTrials.gov lists David Lynch of Children's Hospital of Philadelphia as a principal investigator. Contact and study status must be checked on the live registry record.",
    sourceIds: ["ct-unified"]
  }
];

export const edges = [
  { id: "frda-fxn", from: "frda", to: "fxn", relation: "genetic basis", strength: "documented", sourceIds: ["gr-frda"], note: "GeneReviews links FRDA with biallelic pathogenic variants in FXN.", claim: "FRDA is associated with biallelic pathogenic FXN variants.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "This relationship does not interpret an individual's genetic result." },
  { id: "at-atm", from: "at", to: "atm", relation: "genetic basis", strength: "documented", sourceIds: ["gr-at"], note: "GeneReviews links A-T with biallelic pathogenic variants in ATM.", claim: "A-T is associated with biallelic pathogenic ATM variants.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "This relationship does not interpret an individual's genetic result." },
  { id: "frda-ataxia", from: "frda", to: "ataxia", relation: "reported phenotype", strength: "documented", sourceIds: ["gr-frda"], note: "Progressive ataxia is described in the FRDA clinical reference.", claim: "Progressive ataxia is a reported clinical feature of FRDA.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "A reported phenotype does not predict its presence, timing, or severity for an individual." },
  { id: "at-ataxia", from: "at", to: "ataxia", relation: "reported phenotype", strength: "documented", sourceIds: ["gr-at"], note: "Ataxia is described in the A-T clinical reference.", claim: "Ataxia is a reported clinical feature of A-T.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "A reported phenotype does not predict its presence, timing, or severity for an individual." },
  { id: "frda-cardio", from: "frda", to: "cardio", relation: "reported phenotype", strength: "documented", sourceIds: ["gr-frda"], note: "Cardiomyopathy is listed among possible FRDA findings.", claim: "Cardiomyopathy is reported among possible FRDA clinical findings.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "This graph does not estimate an individual's cardiac risk, diagnosis, or course." },
  { id: "frda-unified", from: "frda", to: "unified", relation: "natural-history study", strength: "registry", sourceIds: ["ct-unified"], note: "The registry identifies FRDA as the focus of the UNIFIED natural-history study.", claim: "UNIFIED is a registered natural-history study focused on Friedreich ataxia.", evidenceType: "study registry", evidenceStatus: "registry", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "The live record controls current status, sites, and participation requirements; this atlas makes no eligibility determination." },
  { id: "frda-fara", from: "frda", to: "fara", relation: "community resource", strength: "organization", sourceIds: ["fara"], note: "FARA describes its FRDA research and community work.", claim: "FARA organizes and supports research activity for the Friedreich ataxia community.", evidenceType: "organization website", evidenceStatus: "organization", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "The link identifies a public organization and is not an endorsement or care recommendation." },
  { id: "frda-at", from: "frda", to: "at", relation: "shared phenotype: ataxia", strength: "cross-source inference", sourceIds: ["gr-frda", "gr-at"], note: "Both references describe ataxia. The conditions have different implicated genes; no shared treatment is inferred.", claim: "FRDA and A-T both include ataxia among their reported phenotypes.", evidenceType: "cross-source comparison", evidenceStatus: "inferred", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "A shared broad phenotype does not establish a shared mechanism, reusable asset, treatment, or collaboration opportunity." },
  { id: "frda-fxn-gaa", from: "frda", to: "fxn-gaa", relation: "common pathogenic variant class", strength: "documented", sourceIds: ["gr-frda"], note: "GeneReviews identifies pathogenic FXN GAA repeat expansion as the most common FRDA variant class.", claim: "Pathogenic GAA repeat expansion is the most common disease-causing FXN variant class in FRDA.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "This population-level statement does not interpret an individual's genotype." },
  { id: "fxn-gaa-fxn", from: "fxn-gaa", to: "fxn", relation: "transcriptional silencing", strength: "documented", sourceIds: ["gr-frda"], note: "The expanded GAA repeat can reduce FXN transcription.", claim: "Pathogenic FXN GAA repeat expansion can cause transcriptional silencing of FXN.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "The graph represents the reviewed mechanism generally and does not quantify expression for an individual." },
  { id: "fxn-fes", from: "fxn", to: "fes-mechanism", relation: "frataxin deficiency mechanism", strength: "documented", sourceIds: ["gr-frda"], note: "GeneReviews links reduced frataxin with impaired iron–sulfur cluster-containing enzymes and mitochondrial function.", claim: "Frataxin deficiency disrupts iron–sulfur cluster-related enzyme function and mitochondrial respiration in FRDA.", evidenceType: "clinical reference", evidenceStatus: "direct", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "The mechanism summary does not establish that a particular intervention will be effective." },
  { id: "fara-assets-fara", from: "fara-assets", to: "fara", relation: "resource steward", strength: "organization", sourceIds: ["fara-resources"], note: "FARA publishes shared research resources including models, repositories, assays, biomarkers, assessments, and datasets.", claim: "FARA makes multiple categories of FRDA research resources discoverable to researchers and industry.", evidenceType: "organization resource directory", evidenceStatus: "organization", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "Availability and reuse terms must be confirmed with each resource owner." },
  { id: "unified-fara", from: "unified", to: "fara", relation: "lead sponsor", strength: "registry", sourceIds: ["ct-unified"], note: "ClinicalTrials.gov identifies FARA as the lead sponsor of UNIFIED.", claim: "FARA is the lead sponsor listed for the UNIFIED natural-history study.", evidenceType: "study registry", evidenceStatus: "registry", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "Sponsor and study status must be verified on the live record." },
  { id: "unified-lynch", from: "unified", to: "lynch", relation: "principal investigator", strength: "registry", sourceIds: ["ct-unified"], note: "ClinicalTrials.gov lists David Lynch as a principal investigator for UNIFIED.", claim: "David Lynch is listed as a principal investigator for UNIFIED.", evidenceType: "study registry", evidenceStatus: "registry", reviewStatus: "source-checked-by-ai;expert-review-pending", limitations: "The live registry record is authoritative for current roles and contact routes." }
];

export const caseStudy = {
  id: "frda-action-journey",
  persona: {
    name: "Maria",
    role: "patient-organization leader",
    startingPoint: "A confirmed Friedreich ataxia community seeking a practical route into coordinated research."
  },
  headline: "Turn an isolated FRDA diagnosis into a sourced research coordination path.",
  opportunity: {
    title: "Reuse existing FRDA research infrastructure",
    text: "FARA already surfaces shared research tools, and it sponsors the registered UNIFIED natural-history study. The atlas connects the disease mechanism to that existing infrastructure without making a study-eligibility claim."
  },
  recommendedNodeIds: ["frda", "fxn", "fxn-gaa", "fes-mechanism", "fara", "fara-assets", "unified", "lynch"],
  evidenceEdgeIds: ["frda-fxn", "frda-fxn-gaa", "fxn-gaa-fxn", "fxn-fes", "frda-fara", "fara-assets-fara", "frda-unified", "unified-fara", "unified-lynch"],
  routes: [
    { id: "mechanism", label: "Mechanism", nodeIds: ["frda", "fxn", "fes-mechanism"], edgeIds: ["frda-fxn", "fxn-fes"] },
    { id: "variant", label: "Variant", nodeIds: ["frda", "fxn-gaa", "fxn"], edgeIds: ["frda-fxn-gaa", "fxn-gaa-fxn"] },
    { id: "assets", label: "Shared assets", nodeIds: ["frda", "fara", "fara-assets"], edgeIds: ["frda-fara", "fara-assets-fara"] },
    { id: "sponsor", label: "Study sponsor", nodeIds: ["frda", "unified", "fara"], edgeIds: ["frda-unified", "unified-fara"] },
    { id: "investigator", label: "Investigator", nodeIds: ["frda", "unified", "lynch"], edgeIds: ["frda-unified", "unified-lynch"] }
  ],
  action: {
    type: "contact-source-owner-for-research-coordination-review",
    timeframe: "this week",
    text: "Contact the official FARA or UNIFIED study team through the live source pages and request a research-coordination review: which existing natural-history measures, datasets, or tools can this group align with, and what expert validation is required first?",
    output: "A documented decision on whether to align data collection with an existing asset, plus the owner and validation questions for the next step.",
    sourceIds: ["ct-unified", "fara-resources"]
  },
  uncertainty: {
    known: "FXN variation, frataxin deficiency, the iron–sulfur mechanism, FARA resources, and the UNIFIED sponsor/investigator relationships are source-backed in this snapshot.",
    unknown: "The atlas does not know whether a particular person can participate, whether a specific resource is available, or whether alignment is scientifically appropriate for a proposed project.",
    validation: "Confirm live study status and ask the sponsor or qualified research team to review reuse, governance, and scientific fit."
  },
  rejectedCandidate: {
    nodeId: "at",
    edgeId: "frda-at",
    decision: "not-actionable",
    reason: "A-T shares the broad ataxia phenotype, but the current graph has no supported shared mechanism or reusable asset. Phenotype overlap alone is insufficient."
  },
  impact: {
    baselineWeeks: 10,
    assistedWeeks: 1,
    milestone: "Reach a sourced contact-and-review decision for existing FRDA research infrastructure.",
    label: "Illustrative coordination hypothesis — not a measured outcome",
    assumptions: [
      "The diagnosis and focal research question already exist.",
      "Public source records remain current and contacts respond.",
      "The atlas shortens discovery and coordination only; it does not accelerate biological experiments or clinical review."
    ]
  }
};

export const openAiExtractionRecords = [
  {
    id: "codex-frda-variant",
    tool: "OpenAI Codex",
    mode: "build-time structured extraction",
    sourceId: "gr-frda",
    inputExcerpt: "The pathogenic expanded GAA repeat results in transcriptional silencing of FXN.",
    output: { edgeId: "fxn-gaa-fxn", subjectId: "fxn-gaa", relation: "transcriptional silencing", objectId: "fxn" },
    reviewStatus: "source-checked-by-ai;expert-review-pending",
    reviewerNote: "Retained as a general disease-mechanism relationship; no individual interpretation."
  },
  {
    id: "codex-frda-mechanism",
    tool: "OpenAI Codex",
    mode: "build-time structured extraction",
    sourceId: "gr-frda",
    inputExcerpt: "Frataxin is required for the synthesis of iron-sulfur clusters.",
    output: { edgeId: "fxn-fes", subjectId: "fxn", relation: "frataxin deficiency mechanism", objectId: "fes-mechanism" },
    reviewStatus: "source-checked-by-ai;expert-review-pending",
    reviewerNote: "Bound to the GeneReviews mechanism summary and limited against treatment inference."
  },
  {
    id: "codex-unified-sponsor",
    tool: "OpenAI Codex",
    mode: "build-time structured extraction",
    sourceId: "ct-unified",
    inputExcerpt: "Lead sponsor: Friedreich's Ataxia Research Alliance.",
    output: { edgeId: "unified-fara", subjectId: "unified", relation: "lead sponsor", objectId: "fara" },
    reviewStatus: "source-checked-by-ai;expert-review-pending",
    reviewerNote: "Registry field copied as a sponsor relationship; live record remains authoritative."
  }
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
