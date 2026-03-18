'use strict';

const QUOTA_MANTENIMENTO_PERC = 35;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateModel(input) {
  const incomeMode = String(input.incomeMode || 'monthly');
  const incomeDivisor = incomeMode === 'annual' ? 12 : 1;

  const r1Raw = toNumber(input.r1Raw);
  const r2Raw = toNumber(input.r2Raw);
  const r1 = r1Raw / incomeDivisor;
  const r2 = r2Raw / incomeDivisor;

  const figli = Math.max(1, Math.round(toNumber(input.figli)));
  const perm1 = clamp(toNumber(input.perm1), 0, 100);
  const perm2 = 100 - perm1;
  const mode = String(input.mode || 'legal');
  const simplePerc = clamp(toNumber(input.simplePerc), 0, 100);

  const aPerc1 = toNumber(input.aPerc1);
  const aPag1 = toNumber(input.aPag1);
  const aPerc2 = toNumber(input.aPerc2);
  const aPag2 = toNumber(input.aPag2);
  const aFam1 = toNumber(input.aFam1);
  const aFam2 = toNumber(input.aFam2);
  const primaCasaMutuoEnabled = toNumber(input.primaCasaMutuoEnabled) > 0;
  const primaCasaValoreLocativo = Math.max(0, toNumber(input.primaCasaValoreLocativo));
  const primaCasaMutuoImporto = Math.max(0, toNumber(input.primaCasaMutuoImporto));
  const primaCasaMutuoScadenzaRaw = String(input.primaCasaMutuoScadenza || '').trim();
  const primaCasaMutuoScadenza = /^\d{4}-\d{2}-\d{2}$/.test(primaCasaMutuoScadenzaRaw) ? primaCasaMutuoScadenzaRaw : '';
  const primaCasaAssegnataA = String(input.primaCasaAssegnataA || '');
  const rawMutuoPerc1 = input.primaCasaMutuoPerc1 === undefined ? 50 : input.primaCasaMutuoPerc1;
  const primaCasaMutuoPerc1 = clamp(toNumber(rawMutuoPerc1), 0, 100);
  const primaCasaMutuoPerc2 = 100 - primaCasaMutuoPerc1;
  const quotaMutuoSpese1 = primaCasaMutuoEnabled ? (primaCasaMutuoImporto * (primaCasaMutuoPerc1 / 100)) : 0;
  const quotaMutuoSpese2 = primaCasaMutuoEnabled ? (primaCasaMutuoImporto - quotaMutuoSpese1) : 0;

  const match12 = Math.min(aPag1, aPerc2);
  const match21 = Math.min(aPag2, aPerc1);
  const esternoPag1 = Math.max(0, aPag1 - match12);
  const esternoPag2 = Math.max(0, aPag2 - match21);

  const c1Spese = Array.isArray(input.c1Spese) ? input.c1Spese : [];
  const c2Spese = Array.isArray(input.c2Spese) ? input.c2Spese : [];
  const speseBase1 = c1Spese.reduce((acc, n) => acc + toNumber(n), 0);
  const speseBase2 = c2Spese.reduce((acc, n) => acc + toNumber(n), 0);
  const spese1 = speseBase1 + quotaMutuoSpese1;
  const spese2 = speseBase2 + quotaMutuoSpese2;
  const speseTot = spese1 + spese2;

  const disp1 = r1 + aPerc1 + aFam1 - spese1;
  const disp2 = r2 + aPerc2 + aFam2 - spese2;

  const dispPos1 = Math.max(0, disp1);
  const dispPos2 = Math.max(0, disp2);
  const dispPosTot = dispPos1 + dispPos2;

  const peso1 = dispPosTot > 0 ? dispPos1 / dispPosTot : 0.5;
  const peso2 = 1 - peso1;

  const fabbisognoFigli = speseTot * (QUOTA_MANTENIMENTO_PERC / 100);

  const quotaTeorica1 = fabbisognoFigli * peso1;
  const quotaTeorica2 = fabbisognoFigli * peso2;

  const quotaDiretta1 = fabbisognoFigli * (perm1 / 100);
  const quotaDiretta2 = fabbisognoFigli * (perm2 / 100);

  const saldo1 = quotaTeorica1 - quotaDiretta1;
  const saldo2 = quotaTeorica2 - quotaDiretta2;
  const costoGiornalieroFiglio = fabbisognoFigli / 30;
  const collocatario = perm1 >= perm2 ? 1 : 2;

  let assegnoDa1a2 = Math.max(0, saldo1);
  let assegnoDa2a1 = Math.max(0, saldo2);

  if (mode === 'simple') {
    const diffNetti = Math.abs(disp1 - disp2);
    const assegnoSemplificato = diffNetti * (simplePerc / 100);
    assegnoDa1a2 = disp1 > disp2 ? assegnoSemplificato : 0;
    assegnoDa2a1 = disp2 > disp1 ? assegnoSemplificato : 0;
  } else if (mode === 'genova') {
    const nonCollocatario = collocatario === 1 ? 2 : 1;
    const quotaTeoricaNonColl = nonCollocatario === 1 ? quotaTeorica1 : quotaTeorica2;
    const giorniPermanenzaNonColl = nonCollocatario === 1 ? (perm1 / 100) * 30 : (perm2 / 100) * 30;
    const quotaDirettaNonColl = costoGiornalieroFiglio * giorniPermanenzaNonColl;
    const contributoIndiretto = Math.max(0, quotaTeoricaNonColl - quotaDirettaNonColl);
    assegnoDa1a2 = nonCollocatario === 1 ? contributoIndiretto : 0;
    assegnoDa2a1 = nonCollocatario === 2 ? contributoIndiretto : 0;
  }

  const assegnoBaseDa1a2 = assegnoDa1a2;
  const assegnoBaseDa2a1 = assegnoDa2a1;

  const assigned = primaCasaAssegnataA === '1' || primaCasaAssegnataA === '2' ? primaCasaAssegnataA : '';
  const primaCasaConsidered = primaCasaMutuoEnabled
    && primaCasaMutuoImporto > 0
    && assigned !== ''
    && Number(assigned) === collocatario;
  let primaCasaTransfer1to2 = 0;
  let primaCasaTransfer2to1 = 0;
  if (primaCasaConsidered) {
    if (assigned === '1') {
      primaCasaTransfer2to1 = Math.max(0, quotaMutuoSpese2);
    } else if (assigned === '2') {
      primaCasaTransfer1to2 = Math.max(0, quotaMutuoSpese1);
    }
  }

  assegnoDa1a2 = Math.max(0, assegnoDa1a2 - primaCasaTransfer1to2);
  assegnoDa2a1 = Math.max(0, assegnoDa2a1 - primaCasaTransfer2to1);

  const compensativeBenefits = [];
  if (aFam1 > 0.005) compensativeBenefits.push({ type: 'family', to: 1, amount: aFam1 });
  if (aFam2 > 0.005) compensativeBenefits.push({ type: 'family', to: 2, amount: aFam2 });
  if (primaCasaTransfer1to2 > 0.005) compensativeBenefits.push({ type: 'primary-home-mortgage', from: 1, to: 2, amount: primaCasaTransfer1to2 });
  if (primaCasaTransfer2to1 > 0.005) compensativeBenefits.push({ type: 'primary-home-mortgage', from: 2, to: 1, amount: primaCasaTransfer2to1 });
  if (primaCasaValoreLocativo > 0.005 && assigned !== '') compensativeBenefits.push({ type: 'primary-home-assignment', to: Number(assigned), amount: primaCasaValoreLocativo });

  const post1 = disp1 - assegnoDa1a2 + assegnoDa2a1;
  const post2 = disp2 - assegnoDa2a1 + assegnoDa1a2;

  // Separation cost analysis (only active when speseConvivenza > 0)
  const speseConvivenza = Math.max(0, toNumber(input.speseConvivenza));
  const housingIdx = new Set([0, 1, 6]); // Affitto, utenze, condominio
  const housingUtility1 = c1Spese.reduce((acc, n, idx) => acc + (housingIdx.has(idx) ? toNumber(n) : 0), 0) + quotaMutuoSpese1;
  const housingUtility2 = c2Spese.reduce((acc, n, idx) => acc + (housingIdx.has(idx) ? toNumber(n) : 0), 0) + quotaMutuoSpese2;
  const housingUtilityNonColl = collocatario === 1 ? housingUtility2 : housingUtility1;
  const baseDuplicazione = speseConvivenza > 0 ? (speseTot - speseConvivenza) : null;
  const HOUSING_UTILITY_ADJ_FACTOR = 0.35;
  const separationAdjustmentHousingUtilities = baseDuplicazione !== null && baseDuplicazione <= 0.005
    ? Math.max(0, housingUtilityNonColl * HOUSING_UTILITY_ADJ_FACTOR)
    : 0;
  const speseConvivenzaEffettive = speseConvivenza > 0 ? speseConvivenza : null;
  const costoSeparazioneMensile = baseDuplicazione !== null
    ? Math.max(0, baseDuplicazione + separationAdjustmentHousingUtilities)
    : null;
  const nettoInsiemeCombinato = speseConvivenzaEffettive !== null ? (r1 + r2 - speseConvivenzaEffettive) : null;
  const nettoSeparatoTotale = (post1 + post2) - separationAdjustmentHousingUtilities;
  const perditaMensile = nettoInsiemeCombinato !== null ? nettoInsiemeCombinato - nettoSeparatoTotale : null;
  const perditaAnnua = perditaMensile !== null ? perditaMensile * 12 : null;
  const totReddito = Math.max(0.001, r1 + r2);
  const perditaSpouse1 = perditaMensile !== null ? perditaMensile * (r1 / totReddito) : null;
  const perditaSpouse2 = perditaMensile !== null ? perditaMensile * (r2 / totReddito) : null;

  return {
    r1, r2, r1Raw, r2Raw, incomeMode, figli, perm1, perm2,
    aPerc1, aPag1, aPerc2, aPag2, aFam1, aFam2,
    match12, match21, esternoPag1, esternoPag2,
    speseBase1, speseBase2, quotaMutuoSpese1, quotaMutuoSpese2,
    spese1, spese2, speseTot,
    disp1, disp2, peso1, peso2,
    mode, simplePerc,
    collocatario, costoGiornalieroFiglio,
    fabbisognoFigli, quotaTeorica1, quotaTeorica2,
    quotaDiretta1, quotaDiretta2,
    saldo1, saldo2,
    assegnoBaseDa1a2, assegnoBaseDa2a1,
    primaCasaMutuoEnabled, primaCasaValoreLocativo, primaCasaMutuoImporto, primaCasaMutuoScadenza,
    primaCasaAssegnataA: assigned,
    primaCasaMutuoPerc1, primaCasaMutuoPerc2,
    primaCasaConsidered, primaCasaTransfer1to2, primaCasaTransfer2to1,
    compensativeBenefits,
    assegnoDa1a2, assegnoDa2a1,
    post1, post2,
    speseConvivenza, speseConvivenzaEffettive, costoSeparazioneMensile,
    separationAdjustmentHousingUtilities,
    nettoInsiemeCombinato, nettoSeparatoTotale,
    perditaMensile, perditaAnnua,
    perditaSpouse1, perditaSpouse2
  };
}

module.exports = {
  calculateModel
};
