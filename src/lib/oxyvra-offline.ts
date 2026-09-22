// Fila de sincronização offline (IndexedDB) — fábricas/subsolos sem Wi-Fi/4G.
// Registros de NFC/QR, fotos, dwell-time e PIN ficam locais e sobem sozinhos.

const DB_NAME = "oxyvra-offline";
const STORE = "fila";
const DB_VERSION = 1;

export type FilaItem = {
  id: string;
  tipo: "cleaning" | "incidente" | "nc";
  payload: unknown;
  criadoEm: number;
  tentativas: number;
  erro?: string;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function enfileirar(tipo: FilaItem["tipo"], payload: unknown): Promise<FilaItem | null> {
  if (!isBrowser()) return null;
  const item: FilaItem = {
    id: `q-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    tipo,
    payload,
    criadoEm: Date.now(),
    tentativas: 0,
  };
  await tx("readwrite", (s) => s.put(item));
  notify();
  return item;
}

export async function listarFila(): Promise<FilaItem[]> {
  if (!isBrowser()) return [];
  try {
    const all = (await tx<FilaItem[]>("readonly", (s) => s.getAll() as IDBRequest<FilaItem[]>)) ?? [];
    return all.sort((a, b) => a.criadoEm - b.criadoEm);
  } catch {
    return [];
  }
}

export async function removerDaFila(id: string) {
  if (!isBrowser()) return;
  await tx("readwrite", (s) => s.delete(id) as unknown as IDBRequest<undefined>);
  notify();
}

async function marcarErro(item: FilaItem, erro: string) {
  await tx("readwrite", (s) => s.put({ ...item, tentativas: item.tentativas + 1, erro }));
  notify();
}

// --- Handlers de envio (trocáveis quando houver backend) ---
type Enviador = (item: FilaItem) => Promise<void>;

let enviador: Enviador | null = null;

/** Define como cada item é persistido definitivamente (ex.: gravar no store ou API). */
export function configurarEnviador(fn: Enviador) {
  enviador = fn;
}

export function estaOnline(): boolean {
  return !isBrowser() || navigator.onLine !== false;
}

let sincronizando = false;

export async function sincronizar(): Promise<{ enviados: number; pendentes: number }> {
  if (!isBrowser() || sincronizando || !estaOnline()) {
    const pend = await listarFila();
    return { enviados: 0, pendentes: pend.length };
  }
  sincronizando = true;
  let enviados = 0;
  try {
    const fila = await listarFila();
    for (const item of fila) {
      try {
        if (enviador) await enviador(item);
        await removerDaFila(item.id);
        enviados++;
      } catch (e) {
        await marcarErro(item, e instanceof Error ? e.message : "falha ao sincronizar");
      }
    }
  } finally {
    sincronizando = false;
  }
  const pendentes = (await listarFila()).length;
  return { enviados, pendentes };
}

// --- Observabilidade para a UI ---
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function onFilaChange(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

let iniciado = false;

/** Registra a sincronização automática em background. Chamar uma vez no root. */
export function iniciarSincronizacaoAutomatica() {
  if (!isBrowser() || iniciado) return;
  iniciado = true;
  const run = () => {
    void sincronizar();
  };
  window.addEventListener("online", run);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") run();
  });
  window.setInterval(run, 60_000);
  run();
}
