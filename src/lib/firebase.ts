import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  query,
  limit,
  addDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SynthesizedDocument } from '../types/video';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
  }
}

export function normalizeDossier(raw: any): SynthesizedDocument {
  const meta = raw.meta || {
    title: raw.title || 'Synthesized Video Dossier',
    originalVideoUrl: raw.videoUrl || '',
    videoLengthMinutes: raw.durationMinutes || 45,
    readingTimeMinutes: raw.readingTimeMinutes || 3,
    wordCountOriginal: 6000,
    wordCountSynthesized: 900,
    compressionRatio: raw.compressionRatio || 93,
    zeroLossFidelityIndex: raw.zeroLossFidelityIndex || 99.4,
    speaker: raw.speaker || 'Subject Matter Expert',
    primaryDomain: 'Technical Intelligence',
    analyzedAt: raw.createdAt || new Date().toISOString(),
  };

  return {
    id: raw.id || `doc-${Date.now()}`,
    meta,
    executiveBriefing: raw.executiveBriefing || {
      oneSentenceCrux: 'Synthesized video briefing.',
      paradigmShift: '',
      highStakesTakeaway: '',
      targetAudienceActionItem: '',
      keyMetricHighlights: [],
    },
    cognitiveArchitectureAudit: raw.cognitiveArchitectureAudit || {
      discardedNoiseCategories: [],
      preservedKnowledgeVectors: [],
      epistemicUncertaintyNotes: [],
    },
    diagrams: Array.isArray(raw.diagrams) ? raw.diagrams : [],
    quantitativeGraphs: Array.isArray(raw.quantitativeGraphs) ? raw.quantitativeGraphs : [],
    illustrationsAndMentalModels: Array.isArray(raw.illustrationsAndMentalModels)
      ? raw.illustrationsAndMentalModels
      : [],
    chronologicalChapters: Array.isArray(raw.chronologicalChapters)
      ? raw.chronologicalChapters
      : [],
    forensicMasterMatrix: raw.forensicMasterMatrix ||
      raw.forensicMatrix || {
        coreTheoremsAndFormulas: [],
        tradeoffAnalysis: [],
        zeroWatchChecklist: [],
      },
    actionablePlaybook: Array.isArray(raw.actionablePlaybook) ? raw.actionablePlaybook : [],
    transcriptSegments: Array.isArray(raw.transcriptSegments) ? raw.transcriptSegments : [],
  };
}

const LOCAL_VAULT_KEY = 'vidmash_local_monograph_vault_v1';

function getLocalVaultDossiers(): SynthesizedDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((d) => normalizeDossier(d)) : [];
  } catch {
    return [];
  }
}

function saveToLocalVault(dossier: SynthesizedDocument): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalVaultDossiers().filter((d) => d.id !== dossier.id);
    const updated = [dossier, ...existing].slice(0, 15);
    window.localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota warnings
  }
}

export async function saveDossierToFirestore(dossier: SynthesizedDocument, userId?: string) {
  saveToLocalVault(dossier);

  const activeUid = userId || auth.currentUser?.uid;
  if (!activeUid) {
    // Guest session: persisted to local vault above; skip cloud write to respect security rules
    return;
  }

  const safeId = (dossier.id || `doc-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
  const path = `dossiers/${safeId}`;
  try {
    const docRef = doc(db, 'dossiers', safeId);
    await setDoc(
      docRef,
      {
        id: safeId,
        userId: activeUid,
        title: (dossier.meta?.title || 'Untitled Dossier').slice(0, 490),
        videoUrl: (dossier.meta?.originalVideoUrl || '').slice(0, 990),
        speaker: (dossier.meta?.speaker || 'Unknown').slice(0, 190),
        durationMinutes: dossier.meta?.videoLengthMinutes || 0,
        readingTimeMinutes: dossier.meta?.readingTimeMinutes || 0,
        compressionRatio: dossier.meta?.compressionRatio || 0,
        zeroLossFidelityIndex: dossier.meta?.zeroLossFidelityIndex || 99.4,
        meta: dossier.meta,
        executiveBriefing: dossier.executiveBriefing || {},
        cognitiveArchitectureAudit: dossier.cognitiveArchitectureAudit || {},
        diagrams: dossier.diagrams || [],
        quantitativeGraphs: dossier.quantitativeGraphs || [],
        illustrationsAndMentalModels: dossier.illustrationsAndMentalModels || [],
        chronologicalChapters: dossier.chronologicalChapters || [],
        forensicMasterMatrix: dossier.forensicMasterMatrix || {},
        forensicMatrix: dossier.forensicMasterMatrix || {},
        actionablePlaybook: dossier.actionablePlaybook || [],
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchRecentDossiers(maxCount = 15): Promise<SynthesizedDocument[]> {
  const localDocs = getLocalVaultDossiers();
  const path = 'dossiers';
  try {
    const q = query(collection(db, 'dossiers'), limit(maxCount));
    const snapshot = await getDocs(q);
    const cloudDocs = snapshot.docs.map((d) => normalizeDossier(d.data()));
    const seenIds = new Set<string>();
    const merged: SynthesizedDocument[] = [];
    for (const item of [...localDocs, ...cloudDocs]) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        merged.push(item);
      }
    }
    return merged.slice(0, maxCount);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return localDocs.slice(0, maxCount);
  }
}

export async function saveChatQuery(
  dossierId: string,
  question: string,
  reply: string,
  timestampCitation?: string
) {
  if (!auth.currentUser) {
    return;
  }
  const safeId = (dossierId || 'default').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100);
  const path = `dossiers/${safeId}/queries`;
  try {
    await addDoc(collection(db, 'dossiers', safeId, 'queries'), {
      question: question.slice(0, 990),
      reply,
      timestampCitation: timestampCitation || '00:00',
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
