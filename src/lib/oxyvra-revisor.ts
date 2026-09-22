// Conta de teste para revisão da Google Play Store.
// Login por e-mail + senha (sem SMS/OTP), unidade de demonstração e dados fictícios.

import {
  addCleaning,
  getCleanings,
  getPrefeituras,
  getUnits,
  savePrefeitura,
  saveUnit,
  setAdminAuthed,
  setCurrentUnit,
  type Prefeitura,
  type Unit,
} from "./oxyvra-store";

export const REVISOR_EMAIL = "google.test@oxyvra.com";
export const REVISOR_SENHA = "TesteGooglePlay123!";
export const REVISOR_NOME = "Google Reviewer";
export const REVISOR_PIN = "0000";

const PREF_ID = "pref-demo-google";
const UNIT_ID = "unit-demo-google";

function fotoDemo(titulo: string, cor: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
    <rect width="640" height="420" fill="${cor}"/>
    <rect x="24" y="24" width="592" height="372" rx="24" fill="none" stroke="#D4AF37" stroke-width="6"/>
    <text x="320" y="196" font-family="system-ui, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle">OXYVRA · DEMO</text>
    <text x="320" y="244" font-family="system-ui, sans-serif" font-size="26" fill="#D4AF37" text-anchor="middle">${titulo}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const PREF_DEMO: Prefeitura = {
  id: PREF_ID,
  nome: "Empresa Demonstração Oxyvra",
  uf: "SP",
  vertical: "educacional",
  responsavelQa: REVISOR_NOME,
  responsavelTecnico: REVISOR_NOME,
  numeroContrato: "DEMO-GPLAY-001",
  observacoes: "Conta de demonstração para revisão da Google Play Store.",
};

const UNIT_DEMO: Unit = {
  id: UNIT_ID,
  prefeituraId: PREF_ID,
  tipo: "escola",
  nome: "Empresa Demonstração Oxyvra",
  bairro: "Centro",
  pin: REVISOR_PIN,
  responsavel: REVISOR_NOME,
  nomeCompleto: "Empresa Demonstração Oxyvra LTDA",
  endereco: "Av. Demonstração, 1000 — São Paulo/SP",
  qtdAlunos: 320,
  qtdColaboradores: 24,
  ambientes: ["banheiros", "salas", "refeitorio"],
  locais: [
    { id: "loc-demo-1", tipo: "banheiros", nome: "Banheiro Térreo", cor: "vermelho", areaM2: 18, qrToken: "DEMO-QR-1" },
    { id: "loc-demo-2", tipo: "salas", nome: "Sala de Reuniões", cor: "azul", areaM2: 42, qrToken: "DEMO-QR-2" },
    { id: "loc-demo-3", tipo: "refeitorio", nome: "Refeitório Central", cor: "verde", areaM2: 90, qrToken: "DEMO-QR-3" },
  ],
};

function horaHoje(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Cria (uma única vez) a empresa, a unidade e os dados fictícios do revisor. */
export function garantirContaRevisor(): Unit {
  if (!getPrefeituras().some((p) => p.id === PREF_ID)) savePrefeitura(PREF_DEMO);
  if (!getUnits().some((u) => u.id === UNIT_ID)) saveUnit(UNIT_DEMO);

  const jaTemDados = getCleanings().some((c) => c.unitId === UNIT_ID);
  if (!jaTemDados) {
    // 3 relatórios de sanitização concluídos (com fotos antes/depois)
    addCleaning({
      unitId: UNIT_ID,
      ambiente: "banheiros",
      localId: "loc-demo-1",
      servente: REVISOR_NOME,
      timestamp: horaHoje(7, 20),
      fotoAntes: fotoDemo("Banheiro — Antes", "#0B2238"),
      fotoDepois: fotoDemo("Banheiro — Depois", "#134E4A"),
      duracaoSeg: 420,
      itensFeitos: ["i1", "i2", "i3"],
      status: "aprovada",
      qrValidado: true,
      pinOperadora: REVISOR_PIN,
      colaboradoraNome: REVISOR_NOME,
    });
    addCleaning({
      unitId: UNIT_ID,
      ambiente: "salas",
      localId: "loc-demo-2",
      servente: REVISOR_NOME,
      timestamp: horaHoje(9, 45),
      fotoAntes: fotoDemo("Sala — Antes", "#0B2238"),
      fotoDepois: fotoDemo("Sala — Depois", "#134E4A"),
      duracaoSeg: 360,
      itensFeitos: ["i1", "i2"],
      status: "aprovada",
      qrValidado: true,
      pinOperadora: REVISOR_PIN,
      colaboradoraNome: REVISOR_NOME,
    });
    addCleaning({
      unitId: UNIT_ID,
      ambiente: "refeitorio",
      localId: "loc-demo-3",
      servente: REVISOR_NOME,
      timestamp: horaHoje(11, 10),
      fotoAntes: fotoDemo("Refeitório — Antes", "#0B2238"),
      fotoDepois: fotoDemo("Refeitório — Depois", "#134E4A"),
      duracaoSeg: 540,
      itensFeitos: ["i1", "i2", "i3", "i4"],
      status: "aprovada",
      qrValidado: true,
      pinOperadora: REVISOR_PIN,
      colaboradoraNome: REVISOR_NOME,
    });
    // 1 checklist / agendamento ativo aguardando execução e auditoria
    addCleaning({
      unitId: UNIT_ID,
      ambiente: "banheiros",
      localId: "loc-demo-1",
      servente: REVISOR_NOME,
      timestamp: horaHoje(13, 0),
      fotoAntes: fotoDemo("Checklist ativo", "#0B2238"),
      duracaoSeg: 120,
      itensFeitos: ["i1"],
      status: "pendente",
      qrValidado: true,
      pinOperadora: REVISOR_PIN,
      colaboradoraNome: REVISOR_NOME,
    });
  }

  return UNIT_DEMO;
}

export type RevisorLoginResult = { ok: true } | { ok: false; erro: string };

/** Login do revisor: e-mail + senha, sem verificação por SMS/OTP, acesso total. */
export function loginRevisor(email: string, senha: string): RevisorLoginResult {
  if (email.trim().toLowerCase() !== REVISOR_EMAIL) {
    return { ok: false, erro: "E-mail não encontrado." };
  }
  if (senha !== REVISOR_SENHA) {
    return { ok: false, erro: "Senha incorreta." };
  }
  garantirContaRevisor();
  setCurrentUnit(UNIT_ID);
  setAdminAuthed(true); // acesso completo: dashboards, relatórios, auditoria e perfil
  return { ok: true };
}
