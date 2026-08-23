const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("script.js", "utf8").replace(/renderApp\(\);\s*$/, "");
const element = { addEventListener() {}, textContent: "", value: "", append() {}, click() {} };
const store = new Map();
const context = {
  console,
  setTimeout: () => 0,
  clearTimeout() {},
  localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
  document: { querySelectorAll: () => [], querySelector: () => null, getElementById: () => element, addEventListener() {}, createElement: () => ({ ...element, classList: { toggle() {} } }) },
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  Blob: class {},
  Intl,
};
context.window = { addEventListener() {} };
vm.createContext(context);
vm.runInContext(source, context);
const R = context.window.NightmareRules;

const sheet = {
  identity: { race: "Humano", className: "Arcanista", existence: "Pessoa Normal" },
  racialConfig: { primary: "forca", secondary: "destreza" },
  attributes: { forca: 3, destreza: 0, constituicao: 0, inteligencia: 3, arcanismo: 5, carisma: 0 },
  abilities: [
    { type: "Ativa", enabled: true, effectMode: "whenEnabled", attributeBonuses: [{ attribute: "destreza", value: 3 }] },
    { type: "Passiva", enabled: false, effectMode: "always", attributeBonuses: [{ attribute: "forca", value: 1 }] },
  ],
  modifications: [{ enabled: true, attributeBonuses: [{ attribute: "destreza", value: 2 }] }],
  anomalies: [],
  inventory: { equipment: [] },
};

let attrs = R.effectiveAttributesFor(sheet);
assert.equal(attrs.forca, 6, "bônus racial + passiva devem somar");
assert.equal(attrs.destreza, 5, "duas fontes simultâneas devem somar");
assert.equal(R.classManaFormula("Arcanista", "Pessoa Normal", attrs), 25);
assert.equal(R.classManaFormula("Arcanista", "Super-Humano", attrs), 35);
assert.equal(8 + attrs.arcanismo + 5, 18, "DP do primeiro patamar");
assert.equal(10 + attrs.inteligencia, 13, "Sanidade base");

sheet.abilities[0].enabled = false;
attrs = R.effectiveAttributesFor(sheet);
assert.equal(attrs.destreza, 2, "desligar deve remover somente a habilidade ativa");

sheet.anomalies = [{ active: true, effects: [{ target: "Sanidade", mode: "percent", value: -50 }] }];
assert.equal(R.calculateEffectValue(sheet, "Sanidade", 13), 6, "percentual deve arredondar para baixo");

const reaction = { cycle: "4º Ciclo", action: "Reação", type: "Reação", manaCostOverride: null };
assert.equal(R.spellCost(reaction), 16, "reação deve dobrar custo de 4º ciclo");
assert.equal(R.spellCost({ cycle: "6º Ciclo", action: "Ação Padrão", type: "Técnica", manaCostOverride: null }, { transcribed: true }), 7, "Transcrição de 15 deve custar 7");
assert.equal(R.roundDown(3 * 1.5), 4, "Recitação de duração deve arredondar para baixo");

const migrated = R.hydrate({ schemaVersion: 1, identity: { className: "Combatente", race: "Humano", existence: "Pessoa Normal" }, status: { hpBaseMax: 20, manaBaseMax: 10 }, abilities: [{ id: "old", type: "Ativa" }] });
assert.equal(migrated.schemaVersion, 7);
assert.equal(migrated.abilities[0].type, "Técnica", "Ativa v1 deve migrar para Técnica");
assert.ok(Array.isArray(migrated.abilities[0].attributeBonuses));
assert.ok(Array.isArray(migrated.abilities[0].statusBonuses));
assert.equal(migrated.status.hpBonus, 0);
assert.equal(migrated.status.manaBonus, 0);

const vampire = R.hydrate({
  schemaVersion: 6,
  identity: { race: "Vampiro", className: "Combatente", existence: "Pessoa Normal" },
  racialConfig: { abilityBonuses: { "race-vamp-minor": [{ attribute: "destreza", value: 2 }, { attribute: "carisma", value: 3 }] } },
  attributes: { forca: 0, destreza: 1, constituicao: 0, inteligencia: 0, arcanismo: 0, carisma: 1 },
  abilities: [], modifications: [], anomalies: [], inventory: { equipment: [] }
});
assert.equal(R.effectiveAttributesFor(vampire).destreza, 3, "bônus racial configurável deve usar o atributo salvo");
assert.equal(R.effectiveAttributesFor(vampire).carisma, 4, "cada entrada racial deve preservar seu próprio valor");
const vampireRoundTrip = R.hydrate(JSON.parse(JSON.stringify(vampire)));
assert.equal(R.racialAbilityBonusesFor(vampireRoundTrip, "race-vamp-minor")[1].attribute, "carisma", "configuração racial deve persistir em JSON");

const weapon = { autoHit: false, canCrit: true, criticalMargin: 17, bonus: 5 };
assert.equal(R.attackHitOutcome(weapon, 5, 16).critical, false, "natural 16 não é crítico com margem 17");
assert.equal(R.attackHitOutcome(weapon, 5, 17).critical, true, "natural 17 é crítico com margem 17");
assert.equal(R.attackHitOutcome(weapon, 5, 18).critical, true, "natural 18 é crítico com margem 17");
assert.equal(R.attackHitOutcome(weapon, 5, 19).critical, true, "natural 19 é crítico com margem 17");
assert.equal(R.attackHitOutcome(weapon, 5, 20).critical, true, "natural 20 é crítico com margem 17");
assert.equal(R.attackHitOutcome(weapon, 5, 16).total, 26, "total deve manter natural e modificadores separados");
assert.equal(R.attackHitOutcome({ ...weapon, bonus: 50 }, 5, 16).critical, false, "bônus alto não pode transformar natural 16 em crítico");
assert.equal(R.criticalMargin({}), 20, "arma antiga sem margem deve usar fallback 20");
const legacyWeapon = R.hydrate({ schemaVersion: 1, identity: { race: "Humano", className: "Combatente", existence: "Pessoa Normal" }, inventory: { equipment: [{ id: "old-sword", attack: { damage: "1d6", attribute: "forca", bonus: 0, canCrit: true } }] } });
assert.equal(R.criticalMargin(legacyWeapon.inventory.equipment[0].attack), 20, "equipamento antigo sem campo de margem deve continuar válido");

const statusSheet = R.hydrate({
  schemaVersion: 7,
  identity: { race: "Humano", className: "Combatente", existence: "Pessoa Normal" },
  racialConfig: { abilityBonuses: { "race-Humano-versatile": [{ attribute: "forca", value: 2 }] } },
  attributes: { forca: 0, destreza: 3, constituicao: 0, inteligencia: 0, arcanismo: 0, carisma: 0 },
  status: { hpCurrent: 7, manaCurrent: 4, sanityCurrent: 0, traumaCurrent: 0, movement: 9, acBonus: 0, initiativeBonus: 0 },
  abilities: [{ id: "a", type: "Ativa", enabled: true, effectMode: "whenEnabled", attributeBonuses: [], statusBonuses: [{ target: "Vida", value: 5 }, { target: "Mana", value: 5 }, { target: "CA", value: 2 }] }],
  modifications: [{ id: "m", enabled: true, statusBonuses: [{ target: "Vida", value: 3 }, { target: "Sanidade", value: 4 }] }],
  inventory: { equipment: [{ id: "e", equipped: true, statusBonuses: [{ target: "Mana", value: 2 }, { target: "Iniciativa", value: 2 }, { target: "Velocidade", value: 3 }] }] },
  anomalies: []
});
let derived = R.derivedStatusFor(statusSheet);
assert.equal(derived.acBase, 13, "C3 deve ser interpretado como Destreza efetiva na CA");
assert.equal(derived.ac, 15, "CA deve somar bônus de fonte ativa");
assert.equal(derived.hpMax, 28, "Vida deve somar fontes independentes");
assert.equal(derived.manaMax, 17, "Mana deve somar habilidade e equipamento");
assert.equal(derived.sanityMax, 14, "Sanidade deve receber bônus estruturado");
assert.equal(derived.initiative, 5, "Iniciativa deve usar Destreza + bônus");
assert.equal(derived.movement, 12, "Deslocamento deve aceitar bônus estruturado");
assert.equal(derived.traumaMax, 3, "Trauma deve possuir limite fixo 3");
assert.equal(statusSheet.status.traumaCurrent, 0, "Sanidade zero não deve conceder Trauma automaticamente");
assert.equal(statusSheet.status.hpCurrent, 7, "alterar máximo de Vida não deve restaurar Vida atual");
assert.equal(statusSheet.status.manaCurrent, 4, "alterar máximo de Mana não deve restaurar Mana atual");
statusSheet.abilities[0].enabled = false;
derived = R.derivedStatusFor(statusSheet);
assert.equal(derived.ac, 13, "desativar habilidade deve remover somente seu bônus de CA");
assert.equal(derived.hpMax, 23, "remover uma fonte deve preservar bônus de outra");
assert.equal(derived.manaMax, 12, "equipamento deve continuar concedendo Mana após habilidade desligada");
assert.equal(derived.initiative, 5, "fonte de Iniciativa independente deve permanecer");

const con5 = { constituicao: 5, arcanismo: 0 };
assert.equal(R.classHpBaseByTier("Combatente", "Pessoa Normal"), 20);
assert.equal(R.classHpBaseByTier("Combatente", "Super-Humano"), 40);
assert.equal(R.classHpBaseByTier("Combatente", "Catástrofe"), 60);
assert.equal(R.classHpFormula("Combatente", "Pessoa Normal", con5), 30, "Constituição entra uma vez na fórmula atual");
assert.equal(R.classHpFormula("Combatente", "Super-Humano", con5), 50, "base acumula sem reaplicar Constituição por ascensão");
assert.equal(R.movementBaseFormula("Super-Humano", 9), 9, "sem tabela oficial, Deslocamento-base deve ser preservado");

console.log("rules-test: 50 assertions passed");
