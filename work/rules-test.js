const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("script.js", "utf8").replace(/renderApp\(\);\s*$/, "");
const element = { addEventListener() {}, textContent: "", value: "", append() {}, click() {}, classList: { toggle() {} } };
const store = new Map();
const context = {
  console,
  setTimeout: () => 0,
  clearTimeout() {},
  localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
  document: { querySelectorAll: () => [], querySelector: () => null, getElementById: () => element, addEventListener() {}, createElement: () => ({ ...element }) },
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  Blob: class {}, Intl,
};
context.window = { addEventListener() {} };
vm.createContext(context);
vm.runInContext(source, context);
const R = context.window.NightmareRules;
let assertions = 0;
const eq = (actual, expected, message) => { assertions++; assert.equal(actual, expected, message); };
const ok = (value, message) => { assertions++; assert.ok(value, message); };
const deep = (actual, expected, message) => { assertions++; assert.deepEqual(actual, expected, message); };

function sheet({ className="Combatente", existence="Desperto", race="Golem", attributes={}, progression, abilities=[], spells=[], modifications=[], equipment=[], anomalies=[], skills, status, combatState }={}) {
  return R.hydrate({
    schemaVersion: 9,
    identity: { className, existence, race },
    racialConfig: { primary: "forca", secondary: "destreza", hybridRaces: ["Humano", "Receptáculo"] },
    attributes: { forca:0, destreza:0, constituicao:0, inteligencia:0, arcanismo:0, carisma:0, ...attributes },
    progression: progression || { className, currentTier:R.tierIndex(existence), hpSnapshots:[], manaSnapshots:[], inferred:false },
    abilities, spells, modifications, anomalies,
    inventory: { equipment }, skills, status, combatState,
  });
}

const patamares = [
  ["Desperto",5,5,9], ["Super-Humano",7,7,12], ["Catástrofe",10,10,16],
  ["Ascendente",15,15,24], ["Entidade",20,20,32], ["Entidade Verdadeira",25,25,40],
];
patamares.forEach(([name,max,prof,movement],i)=>{
  eq(R.patamares[i].name,name,`nome oficial ${i}`);
  eq(R.patamares[i].max,max,`limite de ${name}`);
  eq(R.patamares[i].prof,prof,`proficiência de ${name}`);
  eq(R.movementBaseFormula(name),movement,`deslocamento de ${name}`);
});

const combatente = sheet({attributes:{constituicao:5}});
eq(R.derivedStatusFor(combatente).hpMax,30,"Combatente Desperto CON 5");
R.applyPatamarChange(combatente,"Super-Humano");
eq(combatente.progression.hpSnapshots[0],5,"ascensão captura Constituição anterior");
eq(R.derivedStatusFor(combatente).hpMax,60,"Combatente ascendido mantendo CON 5");
combatente.attributes.constituicao=7;
eq(R.derivedStatusFor(combatente).hpMax,64,"Combatente aumenta CON só no Patamar atual");
const combatenteReload=R.hydrate(JSON.parse(JSON.stringify(combatente)));
eq(R.derivedStatusFor(combatenteReload).hpMax,64,"recarregar não duplica Vida");
eq(combatenteReload.progression.hpSnapshots.length,1,"snapshot não duplica");

const arcanista = sheet({className:"Arcanista",attributes:{constituicao:5,arcanismo:5}});
eq(R.derivedStatusFor(arcanista).hpMax,15,"Arcanista Desperto CON 5");
eq(R.derivedStatusFor(arcanista).manaMax,20,"Arcanista Desperto Arcanismo 5");
R.applyPatamarChange(arcanista,"Super-Humano");
eq(R.derivedStatusFor(arcanista).hpMax,30,"Arcanista ascendido mantendo CON 5");
eq(R.derivedStatusFor(arcanista).manaMax,40,"Arcanista ascendido mantendo Arcanismo 5");
arcanista.attributes.constituicao=7;
arcanista.attributes.arcanismo=7;
eq(R.derivedStatusFor(arcanista).hpMax,32,"Arcanista aumenta CON só no Patamar atual");
eq(R.derivedStatusFor(arcanista).manaMax,44,"Arcanista aumenta Arcanismo só no Patamar atual");

const combatHpReference=[30,64,104,154,214,284];
const arcaneHpReference=[15,32,52,77,107,142];
const arcaneManaReference=[20,44,74,114,164,224];
patamares.forEach(([existence,max],i)=>{
  const previous=patamares.slice(0,i).map(x=>x[1]);
  const c=sheet({existence,attributes:{constituicao:max},progression:{className:"Combatente",currentTier:i,hpSnapshots:previous,manaSnapshots:[],inferred:false}});
  const a=sheet({className:"Arcanista",existence,attributes:{constituicao:max,arcanismo:max},progression:{className:"Arcanista",currentTier:i,hpSnapshots:previous,manaSnapshots:previous,inferred:false}});
  eq(R.derivedStatusFor(c).hpMax,combatHpReference[i],`Vida Combatente ${existence}`);
  eq(R.derivedStatusFor(a).hpMax,arcaneHpReference[i],`Vida Arcanista ${existence}`);
  eq(R.derivedStatusFor(a).manaMax,arcaneManaReference[i],`Mana Arcanista ${existence}`);
  eq(R.derivedStatusFor(c).manaMax,10*(i+1),`Mana Combatente ${existence}`);
});

const migrated=R.hydrate({schemaVersion:8,identity:{className:"Arcanista",race:"Humano",existence:"Pessoa Normal"},abilities:[{id:"old-a",type:"Ataque"}],spells:[{id:"old-s",type:"Ataque",cycle:"1º Ciclo"}],inventory:{equipment:[{id:"old-e"}]}});
eq(migrated.schemaVersion,9,"schema migra para v9");
eq(migrated.identity.existence,"Desperto","Pessoa Normal migra para Desperto");
eq(migrated.abilities[0].type,"Técnica","habilidade Ataque migra para Técnica");
eq(migrated.spells[0].type,"Técnica","magia Ataque migra para Técnica");
eq(migrated.spells[0].magicNature,"Arcana","magia antiga recebe Arcana");
ok(Array.isArray(migrated.inventory.equipment[0].immunities),"equipamento antigo recebe imunidades");
const impossible=R.hydrate({schemaVersion:8,identity:{className:"Combatente",race:"Golem",existence:"Ser Impossível"},attributes:{constituicao:10}});
eq(impossible.identity.existence,"Ascendente","Ser Impossível migra para Ascendente");
ok(impossible.progression.inferred,"snapshot migrado é marcado como inferido");
ok(impossible.progression.migrationNote.length>0,"migração guarda nota interna");

const defenseSheet=sheet({attributes:{destreza:5,arcanismo:5,inteligencia:4},equipment:[{id:"armor",equipped:true,statusBonuses:[{target:"CA",value:3}],resistances:[{type:"Arcana",value:4}],immunities:[{type:"Veneno"}]}]});
let derived=R.derivedStatusFor(defenseSheet);
eq(derived.acBase,15,"CA base = 10 + Destreza");
eq(derived.ac,18,"CA recebe +3 de armadura");
eq(derived.dt,18,"DT = 8 + Arcanismo + Proficiência");
eq(derived.initiative,5,"Iniciativa base = Destreza");
eq(derived.sanityMax,14,"Sanidade = 10 + Inteligência");
eq(derived.traumaMax,3,"Trauma base permanece 3");
deep(derived.resistances.map(x=>[x.type,x.value]),[["Arcana",4]],"resistência explícita");
deep(derived.immunities,["Veneno"],"imunidade explícita");

const skillSheet=sheet({attributes:{destreza:4,constituicao:3,arcanismo:5},skills:{Acrobacia:{attribute:"destreza",proficient:true,extra:2},Atletismo:{attribute:"constituicao",proficient:true,extra:0}}});
eq(R.skillBonusFor(skillSheet,"Acrobacia",false).total,7,"perícia normal só Proficiência + Extra");
eq(R.skillBonusFor(skillSheet,"Acrobacia",true).total,11,"resistência inclui atributo selecionado");
eq(R.skillBonusFor(skillSheet,"Atletismo",true).total,8,"Atletismo pode usar Constituição");
eq(R.attackModifierFor(skillSheet,{attribute:"destreza",bonus:2},false).total,11,"ataque físico soma atributo + Proficiência");
const magical=R.attackModifierFor(skillSheet,{attribute:"forca",bonus:0},true);
eq(magical.attribute,"arcanismo","ataque mágico usa Arcanismo");
eq(magical.total,10,"ataque mágico soma Proficiência");

const costs={"1º Ciclo":2,"2º Ciclo":3,"3º Ciclo":6,"4º Ciclo":8,"5º Ciclo":16,"6º Ciclo":32,"7º Ciclo":60,"8º Ciclo":85,"9º Ciclo":120};
Object.entries(costs).forEach(([cycle,cost])=>eq(R.baseSpellCost({cycle,manaCostOverride:null}),cost,`custo ${cycle}`));
const ninth={cycle:"9º Ciclo",action:"Ação Padrão",type:"Técnica",manaCostOverride:null,recitation:{allowed:true}};
eq(R.spellCost(ninth,{recited:true}),180,"Recitação 9º custa 180");
eq(R.spellCost(ninth,{transcribed:true}),60,"Transcrição 9º custa 60");
eq(R.spellCost({...ninth,action:"Reação"}),240,"Reação 9º custa 240");
eq(R.spellCost({cycle:"8º Ciclo",action:"Ação Padrão",type:"Técnica",manaCostOverride:null,recitation:{allowed:true}},{recited:true}),127,"Recitação 85 arredonda para 127");
eq(R.roundDown(3*1.5),4,"duração recitada arredonda para baixo");

deep(R.uniqueLevelOptions("Desperto"),["Extra"],"Única Desperto");
deep(R.uniqueLevelOptions("Super-Humano"),["Extra","Especial"],"Única Super-Humano");
deep(R.uniqueLevelOptions("Entidade Verdadeira"),["Definitiva"],"Única final");
const levelSheet=sheet({abilities:[{id:"u",name:"Única",level:"Extra",type:"Passiva",origins:["Única"]},{id:"l",name:"Exceção",level:"Lendária",type:"Técnica",origins:["Adquirida"]}]});
ok(R.abilityLevelWarning(levelSheet,levelSheet.abilities[1]).includes("Exceção narrativa"),"nível superior gera aviso não bloqueante");

deep(R.normalizeHybridRaces(["Humano","Humano","Golem"]),["Humano","Golem"],"Híbrido remove duplicata");
const hybrid=sheet({race:"Híbrido"});
hybrid.racialConfig.hybridRaces=["Humano","Golem","Vampiro"];
const hybridBonus=R.racialBonusesFor(hybrid);
eq(hybridBonus.forca,9,"Híbrido soma bônus das três raças");
eq(hybridBonus.destreza,2,"Híbrido preserva segundo bônus Vampiro");

eq(R.resourcePercent(50,50),100,"barra cheia");
eq(R.resourcePercent(25,50),50,"barra pela metade");
eq(R.resourcePercent(0,50),0,"barra vazia");
eq(R.resourcePercent(-5,50),0,"barra não fica negativa");
eq(R.resourcePercent(70,50),100,"barra não passa 100%");
const initialized=sheet();
const initializedDerived=R.derivedStatusFor(initialized);
eq(initialized.combatState.hpCurrent,initializedDerived.hpMax,"Vida inicial cheia");
eq(initialized.combatState.manaCurrent,initializedDerived.manaMax,"Mana inicial cheia");
const session=sheet({status:{hpBonus:20},combatState:{initialized:true,hpCurrent:25,manaCurrent:8,sanityCurrent:7,traumaCurrent:1,hpTemporary:10,manaTemporary:5,sanityTemporary:3}});
session.status.hpBonus=30; R.syncCombatStateFor(session);
eq(session.combatState.hpCurrent,25,"aumentar máximo não cura");
eq(session.combatState.hpTemporary,10,"Vida temporária independente");
const spend=R.manaSpendPlan(20,5,8);
deep([spend.realCurrent,spend.temporaryCurrent,spend.temporarySpent,spend.realSpent],[17,0,5,3],"Mana temporária primeiro");
eq(R.manaSpendPlan(2,3,6).canPay,false,"Mana insuficiente bloqueia");

const weapon={autoHit:false,canCrit:true,criticalMargin:17,bonus:5};
eq(R.attackHitOutcome(weapon,5,16).critical,false,"natural 16 não critica");
eq(R.attackHitOutcome(weapon,5,17).critical,true,"natural 17 critica");
eq(R.attackHitOutcome({...weapon,bonus:50},5,16).critical,false,"bônus não cria crítico");
eq(R.criticalMargin({}),20,"ataque antigo usa margem 20");
const photo="data:image/jpeg;base64,AA==";
const photoSheet=R.hydrate({schemaVersion:9,identity:{photoDataUrl:photo,photoSourceDataUrl:photo,photoCrop:{sx:0,sy:0,sw:1,sh:1}}});
eq(photoSheet.identity.photoDataUrl,photo,"foto persiste");
eq(photoSheet.identity.photoCrop.sw,1,"crop persiste");
eq(R.hydrate({schemaVersion:9,identity:{photoDataUrl:"https://example.com/x.jpg"}}).identity.photoDataUrl,"","URL externa rejeitada");

console.log(`rules-test: ${assertions} assertions passed`);
