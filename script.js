"use strict";

const SCHEMA_VERSION = 1;
const STORAGE_KEY = "nightmare.sheet.v1";
const ATTRS = ["forca","destreza","constituicao","inteligencia","arcanismo","carisma"];
const ATTR_LABEL = {forca:"Força",destreza:"Destreza",constituicao:"Constituição",inteligencia:"Inteligência",arcanismo:"Arcanismo",carisma:"Carisma"};
const EXISTENCE = {
  "Pessoa Normal":{prof:5,max:5},"Super-Humano":{prof:7,max:7},"Catástrofe":{prof:10,max:10},
  "Ser Impossível":{prof:12,max:15},"Entidade":{prof:15,max:20},"Entidade Verdadeira":{prof:20,max:25}
};
const SKILLS = [
  ["Acrobacia","destreza"],["Furtividade","destreza"],["História","inteligencia"],["Intimidação","carisma"],["Intuição","inteligencia"],
  ["Investigação","inteligencia"],["Medicina","inteligencia"],["Adestrar Animais","carisma"],["Arcanismo","arcanismo"],["Atletismo","forca"],
  ["Atuação","carisma"],["Enganação","carisma"],["Percepção","inteligencia"],["Prestidigitação","destreza"],["Religião","inteligencia"],
  ["Sobrevivência","inteligencia"],["Natureza","inteligencia"],["Persuasão","carisma"],["Vontade","carisma"]
];
const ORIGINS=["Única","Racial","Descendência","Intrínseca","Adquirida","Evolutiva","Profissão"];
const ACTIONS=["Ação Padrão","Ação Bônus","Reação","Movimento","Ação Livre","Sustentação"];
const DAMAGE_TYPES=["Ácido","Cortante","Elétrico","Energia/Força","Fogo","Frio","Impacto/Concussão","Necrótico","Perfurante","Psíquico","Radiante","Trovão","Veneno","Corrupto","Físico","Mágico"];
const RECHARGE=["Rodada","Cena","Sessão","Dia","Descanso Curto","Descanso Longo"];
const BASE_CLASSES={
  Combatente:{id:"class-combatente",name:"Olhar de Combate",description:"Leitura treinada do ritmo, ameaças e oportunidades de um confronto.",type:"Passiva",origins:["Intrínseca"]},
  Arcanista:{id:"class-arcanista",name:"Olhar Arcano",description:"Percepção treinada para reconhecer fenômenos, fluxos e ameaças arcanas.",type:"Passiva",origins:["Intrínseca"]}
};

function uid(prefix="id"){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function defaultState(){return {
  schemaVersion:SCHEMA_VERSION, mode:"sheet", collapsed:{}, itemCollapsed:{},
  identity:{name:"",player:"",age:"",profession:"",race:"Humano",className:"Combatente",existence:"Pessoa Normal",xpCurrent:0,xpMax:0},
  attributes:Object.fromEntries(ATTRS.map(a=>[a,0])), racialConfig:{primary:"forca",secondary:"destreza",element:"",resistance:"Fogo",corruption:1,blessing:"Julgamento"},
  status:{hpCurrent:20,hpBaseMax:20,manaCurrent:10,manaBaseMax:10,traumaCurrent:0,traumaBaseMax:0,acBase:10,initiative:0,movement:9},
  skills:Object.fromEntries(SKILLS.map(([n,a])=>[n,{attribute:a,proficient:false,extra:0}])),
  abilities:[], spells:[], modifications:[], anomalies:[],
  inventory:{traits:"",equipment:[],moneyPocket:0,moneyAccount:0,weeklySalary:0},
  rollHistory:[]
}}

let state=loadState(); let saveTimer=null;
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return defaultState();return hydrate(JSON.parse(raw))}catch(e){console.warn(e);return defaultState()}}
function hydrate(data){const base=defaultState();const s={...base,...data};s.identity={...base.identity,...data.identity};s.attributes={...base.attributes,...data.attributes};s.racialConfig={...base.racialConfig,...data.racialConfig};s.status={...base.status,...data.status};s.inventory={...base.inventory,...data.inventory};s.skills={...base.skills,...data.skills};["abilities","spells","modifications","anomalies","rollHistory"].forEach(k=>s[k]=Array.isArray(data[k])?data[k]:base[k]);return s}
function save(){clearTimeout(saveTimer);document.getElementById("saveStatus").textContent="Salvando…";saveTimer=setTimeout(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));document.getElementById("saveStatus").textContent="Salvo"},180)}
function commit(render=true){state.schemaVersion=SCHEMA_VERSION;save();if(render)renderApp()}
function esc(v){return String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function clamp(n,min,max){return Math.min(max,Math.max(min,num(n)))}
function options(list,current){return list.map(x=>`<option ${x===current?"selected":""}>${esc(x)}</option>`).join("")}
function attrOptions(current){return ATTRS.map(a=>`<option value="${a}" ${a===current?"selected":""}>${ATTR_LABEL[a]}</option>`).join("")}
function toast(msg,error=false){const el=document.createElement("div");el.className=`toast ${error?"error":""}`;el.textContent=msg;document.getElementById("toastRegion").append(el);setTimeout(()=>el.remove(),3200)}

function racialBonuses(){const b=Object.fromEntries(ATTRS.map(a=>[a,0]));const r=state.identity.race,c=state.racialConfig;
  if(r==="Dragão"){b.constituicao+=2;b.destreza+=2} if(["Corrupto","Celestial"].includes(r))ATTRS.forEach(a=>b[a]++);
  if(["Humano","Receptáculo"].includes(r))b[c.primary]+=2; if(r==="Golem")b[c.primary]+=5;
  if(r==="Vampiro"||r==="Abissal"){b[c.primary]+=2;if(c.secondary!==c.primary)b[c.secondary]+=2}
  return b
}
function effectiveAttributes(){const bonus=racialBonuses(),limit=EXISTENCE[state.identity.existence].max;return Object.fromEntries(ATTRS.map(a=>[a,clamp(num(state.attributes[a])+bonus[a],0,limit)]))}
function proficiency(){return EXISTENCE[state.identity.existence].prof}
function proficiencyLimit(){return (state.identity.className==="Arcanista"?4:2)+effectiveAttributes().inteligencia}
function derivedStatus(){const a=effectiveAttributes();const cls=state.identity.className;const classHp=cls==="Arcanista"?10+a.constituicao:20+a.constituicao*2;const classMana=cls==="Arcanista"?10+a.arcanismo*3:10;const pct=activeEffects();return {
  hpMax:Math.floor((state.status.hpBaseMax||classHp)*(1+pct.Vida/100)),manaMax:Math.floor((state.status.manaBaseMax||classMana)*(1+pct.Mana/100)),
  traumaMax:Math.floor(state.status.traumaBaseMax*(1+pct.Trauma/100)),ac:Math.floor(state.status.acBase*(1+pct.CA/100)),classHp,classMana
}}
function activeEffects(){const total={Vida:0,Mana:0,Trauma:0,CA:0,Acertos:0,Danos:0};state.anomalies.filter(a=>a.active).forEach(a=>(a.effects||[]).forEach(e=>{if(e.target in total)total[e.target]+=num(e.percent)}));return total}

function baseAbility(id,name,description,extra={}){return {id,name,description,level:"Comum",type:"Passiva",origins:["Racial"],action:"Ação Livre",cost:"",uses:null,attack:null,locked:true,baseSource:`race:${state.identity.race}`,...extra}}
function raceAbilities(){const r=state.identity.race,c=state.racialConfig;const list=[];
  if(r==="Dragão"){list.push(baseAbility("race-dragon-scales","Pele de Escamas",`Concede +5 Resistência a ${c.resistance}.`,{special:`Resistência: ${c.resistance}`}));list.push(baseAbility("race-dragon-element","Elemento Dracônico","O elemento que caracteriza sua natureza dracônica e define que tipo de dragão você é.",{special:`Elemento: ${c.element||"não definido"}`}))}
  if(r==="Golem"){list.push(baseAbility("race-golem-adaptation","Adaptação",`Adiciona 5 pontos ao atributo ${ATTR_LABEL[c.primary]}.`));list.push(baseAbility("race-golem-flex","Adaptabilidade","Permite reorganizar/trocar manualmente valores entre atributos."))}
  if(["Humano","Receptáculo"].includes(r)){list.push(baseAbility(`race-${r}-versatile`,"Versátil",`Concede +2 em ${ATTR_LABEL[c.primary]}.`));list.push(baseAbility(`race-${r}-instinct`,"Instinto de Sobrevivência","Em momentos de perigo, um instinto te encontra uma maneira de sair.",{uses:{current:1,max:1,every:1,type:"Sessão"}}));if(r==="Receptáculo")list.push(baseAbility("race-vessel-awaken","Despertar","O indivíduo está adormecido, podendo passar por um Despertar."))}
  if(r==="Vampiro"){list.push(baseAbility("race-vamp-minor","Vampiro Menor",`+2 em ${ATTR_LABEL[c.primary]} e +2 em ${ATTR_LABEL[c.secondary]}.`,{origins:["Racial","Evolutiva"]}));list.push(baseAbility("race-vamp-blood","Manipular Sangue","O Vampiro consegue manipular e criar sangue com facilidade, podendo desenvolver habilidades derivadas desse poder."));list.push(baseAbility("race-vamp-regen","Regeneração Vampírica","Regenera 2d10 de Vida por turno.",{origins:["Racial","Evolutiva"]}))}
  if(r==="Corrupto"){list.push(baseAbility("race-corrupt-being","Ser Corrompido","Concede +1 em todos os atributos."));list.push(baseAbility("race-corruption","Corrupção","Imunidade a Dano Corrupto.",{origins:["Racial","Evolutiva"],special:`Corrupção: ${c.corruption}%`}));if(c.corruption>=5)list.push(baseAbility("race-corrupt-regen","Regeneração Corrupta","Regenera 5% da Vida por turno."));if(c.corruption>=10)list.push(baseAbility("race-corrupt-blade","Lâmina Corrupta","Ataque de acerto automático.",{type:"Ataque",attack:{damage:"3d10",attribute:["forca","destreza","arcanismo"].includes(c.primary)?c.primary:"forca",bonus:0,damageType:"Corrupto",autoHit:true,canCrit:false}}));if(c.corruption>=15)list.push(baseAbility("race-corrupt-skin","Pele Corrompida",`Concede 10 de Resistência a ${c.resistance==="Mágico"?"Dano Mágico":"Dano Físico"}.`));if(c.corruption>=20)list.push(baseAbility("race-corrupt-evolution","Evolução Corporal","Concede uma Anomalia de Status: Vida +10%, Acertos +10%, Danos +10%."))}
  if(r==="Celestial"){list.push(baseAbility("race-celestial-being","Ser Celeste","Concede +1 em todos os atributos."));list.push(baseAbility("race-celestial-blessing","Bênção",`Bênção da ${c.blessing}.`,{origins:["Racial","Evolutiva"]}));const desc={Julgamento:["Todo alvo marcado recupera Vida igual ao dano efetivamente causado.","Marcados compartilham buffs e efeitos positivos."],Caça:["Golpe de acerto automático usado como Ação Bônus.","O alvo deve permanecer em corpo a corpo; ao atacar outro, testa Atletismo."],Vingança:["Devolve o dano recebido do alvo marcado durante uma rodada; cálculo manual.","O alvo marcado recebe metade do dano que causa ao Celestial."]};list.push(baseAbility(`race-celestial-cut-${c.blessing}`,`Corte da ${c.blessing}`,desc[c.blessing][0],c.blessing==="Vingança"?{}:{type:"Ataque",action:c.blessing==="Caça"?"Ação Bônus":"Ação Padrão",attack:{damage:"1d8",attribute:"forca",bonus:5,damageType:"Radiante",autoHit:true,canCrit:false}}));list.push(baseAbility(`race-celestial-mark-${c.blessing}`,`Marca da ${c.blessing}`,desc[c.blessing][1],{special:"Alvos marcáveis: 1"}))}
  if(r==="Abissal"){list.push(baseAbility("race-abyssal-being","Ser Abissal",`+2 em ${ATTR_LABEL[c.primary]} e +2 em ${ATTR_LABEL[c.secondary]}.`));list.push(baseAbility("race-abyssal-symbiosis","Simbiose","Uma entidade vive em simbiose junto ao corpo, capaz de originar novas habilidades e poderes."));list.push(baseAbility("race-abyssal-skin","Pele Abissal","Concede +5 Resistência a Dano Físico."))}
  return list
}
function allAbilities(){const cls=BASE_CLASSES[state.identity.className];return [{...cls,locked:true,baseSource:`class:${state.identity.className}`,level:"Comum",action:"Ação Livre",uses:null,attack:null},...raceAbilities(),...state.abilities]}

function card(id,title,body,span="span-12",count=""){const open=state.collapsed[id]!==true;return `<section class="card ${open?"open":""} ${span}" data-card="${id}"><button class="card-head" data-action="toggle-card" data-id="${id}"><span class="ornament">✦</span><h3>${title}</h3>${count?`<span class="count">${count}</span>`:""}<span class="chev">›</span></button><div class="card-body">${body}</div></section>`}
function field(label,path,value,type="text",extra=""){return `<label class="field"><span>${label}</span><input type="${type}" data-path="${path}" value="${esc(value)}" ${extra}></label>`}
function selectField(label,path,current,list,extra=""){return `<label class="field"><span>${label}</span><select data-path="${path}" ${extra}>${options(list,current)}</select></label>`}

function renderApp(){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===state.mode));document.getElementById("app").innerHTML=state.mode==="combat"?renderCombat():renderSheet();bindDynamic()}
function renderSheet(){const a=effectiveAttributes(),d=derivedStatus(),profs=Object.values(state.skills).filter(s=>s.proficient).length;return `<div class="hero"><div><h2>${esc(state.identity.name||"Personagem sem nome")}</h2><p>${esc(state.identity.race)} · ${esc(state.identity.className)} · ${esc(state.identity.existence)}</p></div><span class="badge">schema v${state.schemaVersion}</span></div><div class="grid">
${card("identity","Identidade",`<div class="fields">${field("Nome","identity.name",state.identity.name)}${field("Jogador","identity.player",state.identity.player)}${field("Idade","identity.age",state.identity.age)}${field("Profissão","identity.profession",state.identity.profession)}${selectField("Raça","identity.race",state.identity.race,["Humano","Receptáculo","Dragão","Golem","Vampiro","Corrupto","Celestial","Abissal"])}${selectField("Classe","identity.className",state.identity.className,["Combatente","Arcanista"])}${selectField("Nível de Existência","identity.existence",state.identity.existence,Object.keys(EXISTENCE))}${field("XP Atual","identity.xpCurrent",state.identity.xpCurrent,"number")}${field("XP Máximo","identity.xpMax",state.identity.xpMax,"number")}</div>`,"span-8")}
${card("existence","Existência",`<div class="stats"><div class="stat"><label>Proficiência</label><strong>+${proficiency()}</strong></div><div class="stat"><label>Máximo / atributo</label><strong>${EXISTENCE[state.identity.existence].max}</strong></div><div class="stat"><label>Perícias</label><strong>${profs}/${proficiencyLimit()}</strong></div></div>${renderRaceConfig()}`,"span-4")}
${card("attributes","Atributos",`<div class="attribute-grid">${ATTRS.map(x=>`<div class="attribute"><label>${ATTR_LABEL[x]}</label><input type="number" min="0" max="${EXISTENCE[state.identity.existence].max}" data-path="attributes.${x}" value="${state.attributes[x]}"><small>Efetivo ${a[x]} ${racialBonuses()[x]?`(${racialBonuses()[x]>0?"+":""}${racialBonuses()[x]} racial)`:""}</small></div>`).join("")}</div><p class="hint">O limite é aplicado ao valor efetivo; bônus raciais são derivados e não alteram o valor manual.</p>`,"span-5")}
${card("status","Status",renderStatus(d),"span-7")}
${card("skills","Perícias",renderSkills(),"span-12",`${profs} / ${proficiencyLimit()} proficientes`)}
${card("abilities","Habilidades",renderAbilitySection(),"span-12",`${allAbilities().length}`)}
${card("spells","Magias",renderSpells(),"span-6",`${state.spells.length}`)}
${card("anomalies","Anomalias de Status",renderAnomalies(),"span-6",`${state.anomalies.filter(x=>x.active).length} ativas`)}
${card("modifications","Modificações",renderModifications(),"span-6",`${state.modifications.length}`)}
${card("inventory","Inventário",renderInventory(),"span-6",`${state.inventory.equipment.length} equipamentos`)}
</div>`}

function renderRaceConfig(){const r=state.identity.race,c=state.racialConfig;let fields="";if(["Humano","Receptáculo","Golem"].includes(r))fields=selectField("Atributo racial","racialConfig.primary",c.primary,ATTRS.map(a=>ATTR_LABEL[a])).replace(/<option/g,(m=>m)).replace(`>${ATTR_LABEL[c.primary]}<`,` value="${c.primary}">${ATTR_LABEL[c.primary]}<`); // replaced below by explicit helper
  const attrSel=(label,path,current)=>`<label class="field"><span>${label}</span><select data-path="${path}">${ATTRS.map(a=>`<option value="${a}" ${a===current?"selected":""}>${ATTR_LABEL[a]}</option>`).join("")}</select></label>`;
  if(["Humano","Receptáculo","Golem"].includes(r))fields=attrSel("Atributo racial","racialConfig.primary",c.primary);
  if(["Vampiro","Abissal"].includes(r))fields=attrSel("Primeiro atributo","racialConfig.primary",c.primary)+attrSel("Segundo atributo","racialConfig.secondary",c.secondary)+(c.primary===c.secondary?`<p class="warning">Escolha atributos diferentes.</p>`:"");
  if(r==="Dragão")fields=selectField("Resistência","racialConfig.resistance",c.resistance,DAMAGE_TYPES)+field("Elemento","racialConfig.element",c.element);
  if(r==="Corrupto")fields=field("Corrupção %","racialConfig.corruption",c.corruption,"number",'min="1" max="100"')+selectField("Resistência da Pele","racialConfig.resistance",c.resistance,["Físico","Mágico"])+attrSel("Atributo da Lâmina","racialConfig.primary",c.primary);
  if(r==="Celestial")fields=selectField("Bênção","racialConfig.blessing",c.blessing,["Julgamento","Caça","Vingança"]);
  return fields?`<div class="fields cols-2" style="margin-top:14px">${fields}</div>`:""
}
function renderStatus(d){const bar=(cur,max)=>Math.max(0,Math.min(100,max?cur/max*100:0));return `<div class="stats">
${statusPair("Vida","hp",state.status.hpCurrent,d.hpMax,bar(state.status.hpCurrent,d.hpMax))}${statusPair("Mana","mana",state.status.manaCurrent,d.manaMax,bar(state.status.manaCurrent,d.manaMax))}${statusPair("Trauma","trauma",state.status.traumaCurrent,d.traumaMax,bar(state.status.traumaCurrent,d.traumaMax))}
<div class="stat"><label>CA Efetiva</label><strong>${d.ac}</strong>${field("Base","status.acBase",state.status.acBase,"number")}</div><div class="stat"><label>Iniciativa</label><strong>${state.status.initiative>=0?"+":""}${state.status.initiative}</strong>${field("Base","status.initiative",state.status.initiative,"number")}</div><div class="stat"><label>Deslocamento</label><strong>${state.status.movement}m</strong>${field("Base","status.movement",state.status.movement,"number")}</div></div><p class="hint">Sugestão da classe: Vida ${d.classHp}, Mana ${d.classMana}. Os máximos permanecem editáveis.</p>`}
function statusPair(label,key,cur,max,pc…2209 tokens truncated…turn Number.isFinite(n)?(x.action==="Reação"?n*2:n):x.manaCost||"Especial"}

function newAnomaly(){return {id:uid("anomaly"),name:"Nova Anomalia",description:"",active:true,effects:[{id:uid("effect"),target:"Vida",percent:10}]}}
function renderAnomalies(){return `<div class="section-tools"><button class="btn" data-action="add" data-kind="anomalies">+ Nova anomalia</button></div><div class="item-list">${state.anomalies.length?state.anomalies.map(x=>`<article class="item"><div class="item-head"><button class="toggle">${esc(x.name)}</button><label><input type="checkbox" data-path="item.anomalies.${x.id}.active" ${x.active?"checked":""}> Ativa</label><button class="btn small danger" data-action="delete" data-kind="anomalies" data-id="${x.id}">Excluir</button></div><div class="item-body"><div class="fields cols-2">${field("Nome",`item.anomalies.${x.id}.name`,x.name)}<label class="field"><span>Descrição</span><textarea data-path="item.anomalies.${x.id}.description">${esc(x.description)}</textarea></label></div><div class="item-list">${(x.effects||[]).map(e=>`<div class="fields cols-3">${selectField("Alvo",`effect.${x.id}.${e.id}.target`,e.target,["Vida","Mana","Trauma","CA","Acertos","Danos"])}${field("Percentual",`effect.${x.id}.${e.id}.percent`,e.percent,"number")}<button class="btn small danger" data-action="delete-effect" data-id="${x.id}" data-effect="${e.id}">Remover</button></div>`).join("")}</div><button class="btn small" data-action="add-effect" data-id="${x.id}">+ Efeito</button></div></article>`).join(""):'<div class="empty">Nenhuma anomalia registrada.</div>'}</div>`}

function newModification(){return {id:uid("mod"),name:"Nova Modificação",description:"",type:"Implante",action:"Ação Livre",cost:"",uses:null,attributeBonuses:{},effects:"",derivedAbilities:[]}}
function renderModifications(){return `<div class="section-tools"><button class="btn" data-action="add" data-kind="modifications">+ Nova modificação</button></div><div class="item-list">${state.modifications.length?state.modifications.map(x=>`<article class="item"><div class="item-head"><button class="toggle">${esc(x.name)}</button><span class="badge">${esc(x.type)}</span><button class="btn small danger" data-action="delete" data-kind="modifications" data-id="${x.id}">Excluir</button></div><div class="item-body"><div class="fields cols-2">${field("Nome",`item.modifications.${x.id}.name`,x.name)}${field("Tipo",`item.modifications.${x.id}.type`,x.type)}${selectField("Ação",`item.modifications.${x.id}.action`,x.action,ACTIONS)}${field("Custo",`item.modifications.${x.id}.cost`,x.cost)}${field("Bônus de atributos",`item.modifications.${x.id}.attributeBonusesText`,x.attributeBonusesText||"")} ${field("Efeitos",`item.modifications.${x.id}.effects`,x.effects||"")}<label class="field"><span>Descrição</span><textarea data-path="item.modifications.${x.id}.description">${esc(x.description)}</textarea></label><label class="field"><span>Habilidades derivadas</span><textarea data-path="item.modifications.${x.id}.derivedAbilitiesText">${esc(x.derivedAbilitiesText||"")}</textarea></label></div>${renderUses(x,"modifications")}</div></article>`).join(""):'<div class="empty">Nenhuma modificação registrada.</div>'}</div>`}

function newEquipment(){return {id:uid("equipment"),name:"Novo equipamento",description:"",quantity:1,attack:null}}
function renderInventory(){return `<div class="fields cols-3">${field("Dinheiro no bolso","inventory.moneyPocket",state.inventory.moneyPocket,"number")}${field("Dinheiro na conta","inventory.moneyAccount",state.inventory.moneyAccount,"number")}${field("Salário semanal","inventory.weeklySalary",state.inventory.weeklySalary,"number")}<label class="field" style="grid-column:1/-1"><span>Características e Traços</span><textarea data-path="inventory.traits">${esc(state.inventory.traits)}</textarea></label></div><hr><div class="section-tools"><button class="btn" data-action="add" data-kind="equipment">+ Equipamento</button></div><div class="item-list">${state.inventory.equipment.map(x=>`<article class="item"><div class="item-head"><button class="toggle">${esc(x.name)}</button><button class="btn small danger" data-action="delete" data-kind="equipment" data-id="${x.id}">Excluir</button></div><div class="item-body"><div class="fields cols-2">${field("Nome",`item.equipment.${x.id}.name`,x.name)}${field("Quantidade",`item.equipment.${x.id}.quantity`,x.quantity,"number")}<label class="field"><span>Descrição</span><textarea data-path="item.equipment.${x.id}.description">${esc(x.description)}</textarea></label></div>${renderAttack(x,"equipment")}</div></article>`).join("")}</div>`}

function renderCombat(){const d=derivedStatus(),a=effectiveAttributes(),attacks=getAttacks(),active=state.anomalies.filter(x=>x.active);return `<div class="hero"><div><h2>Modo Combate</h2><p>${esc(state.identity.name||"Personagem")} · dados sempre lidos do estado atual</p></div><button class="btn" data-roll-initiative>Rolar iniciativa</button></div><div class="combat-layout"><div class="grid">
${card("combat-status","Status Relevantes",`<div class="stats"><div class="stat"><label>Vida</label><strong>${state.status.hpCurrent}/${d.hpMax}</strong></div><div class="stat"><label>Mana</label><strong>${state.status.manaCurrent}/${d.manaMax}</strong></div><div class="stat"><label>Trauma</label><strong>${state.status.traumaCurrent}/${d.traumaMax}</strong></div><div class="stat"><label>CA</label><strong>${d.ac}</strong></div><div class="stat"><label>Iniciativa</label><strong>${state.status.initiative}</strong></div><div class="stat"><label>Proficiência</label><strong>+${proficiency()}</strong></div></div>`,"span-12")}
${card("combat-attacks","Ataques",`<div class="combat-actions">${attacks.length?attacks.map(x=>`<button class="roll-btn" data-attack-kind="${x.kind}" data-attack-id="${x.id}" data-critical="false"><strong>${esc(x.name)}</strong><small>${esc(x.attack.damage)} · ${x.attack.autoHit?"acerto automático":"teste +"+a[x.attack.attribute]+num(x.attack.bonus)}</small></button>${x.attack.canCrit?`<button class="roll-btn" data-attack-kind="${x.kind}" data-attack-id="${x.id}" data-critical="true"><strong>${esc(x.name)} — CRÍTICO</strong><small>Dobra somente os dados</small></button>`:""}`).join(""):'<div class="empty">Nenhum ataque configurado.</div>'}</div>`,"span-12")}
${card("combat-skills","Perícias",`<div class="combat-actions">${SKILLS.map(([n])=>{const s=state.skills[n],v=a[s.attribute]+(s.proficient?proficiency():0)+num(s.extra);return `<button class="roll-btn" data-roll-skill="${n}"><strong>${n}</strong><small>1d20 ${v>=0?"+":""}${v}</small></button>`}).join("")}</div>`,"span-12")}
${card("combat-anomalies","Anomalias Ativas",active.length?active.map(x=>`<div class="history-entry"><strong>${esc(x.name)}</strong><small>${(x.effects||[]).map(e=>`${e.target} ${e.percent>=0?"+":""}${e.percent}%`).join(" · ")}</small></div>`).join(""):'<div class="empty">Nenhuma anomalia ativa.</div>',"span-12")}</div>
<aside>${card("dice","Dados",`<div class="dice-row">${[4,6,8,10,12,20,100].map(d=>`<button class="btn small" data-die="d${d}">d${d}</button>`).join("")}</div><div class="dice-expression"><input class="inline-input" id="diceExpression" placeholder="2d10 + 1d6 + 5"><button class="btn" data-roll-expression>Rolar</button></div>`,"span-12")}${card("history","Histórico",`<div class="section-tools"><button class="btn small danger" data-action="clear-history">Limpar</button></div><div class="history">${state.rollHistory.length?state.rollHistory.map(renderHistory).join(""):'<div class="empty">As rolagens aparecerão aqui.</div>'}</div>`,"span-12")}</aside></div>`}
function getAttacks(){const out=[];allAbilities().forEach(x=>{if(x.attack)out.push({kind:x.locked?"base": "abilities",...x})});state.spells.forEach(x=>{if(x.attack)out.push({kind:"spells",...x})});state.inventory.equipment.forEach(x=>{if(x.attack)out.push({kind:"equipment",...x})});return out}
function renderHistory(h){return `<div class="history-entry"><strong>${esc(h.label)}: ${h.total}</strong><small>${esc(h.detail)}</small><small>${new Date(h.time).toLocaleTimeString("pt-BR")}</small></div>`}

function parseDice(expression,critical=false){const clean=String(expression).replace(/\s+/g,"").toLowerCase();if(!clean||!/^[+\-]?(?:\d*d\d+|\d+)(?:[+\-](?:\d*d\d+|\d+))*$/.test(clean))throw new Error("Expressão de dados inválida.");const tokens=clean.match(/[+\-]?[^+\-]+/g);let total=0;const details=[];for(const token of tokens){const sign=token.startsWith("-")?-1:1,body=token.replace(/^[+\-]/,"");if(body.includes("d")){let [count,sides]=body.split("d").map(Number);count=count||1;if(critical)count*=2;if(count>1000||sides<1||sides>1000000)throw new Error("Limites de dados excedidos.");const rolls=Array.from({length:count},()=>Math.floor(Math.random()*sides)+1);total+=sign*rolls.reduce((a,b)=>a+b,0);details.push(`${sign<0?"- ":""}${count}d${sides} [${rolls.join(", ")}]`)}else{total+=sign*Number(body);details.push(`${sign<0?"- ":"+ "}${body}`)}}return {total,detail:details.join(" ")}}
function applyPercent(value,target){const p=activeEffects()[target]||0;return Math.floor(value*(1+p/100))}
function addHistory(label,result,target){const total=target?applyPercent(result.total,target):result.total;const suffix=total!==result.total?` → ${target} ${activeEffects()[target]>=0?"+":""}${activeEffects()[target]}% = ${total}`:"";state.rollHistory.push({id:uid("roll"),label,total,detail:result.detail+suffix,time:Date.now()});if(state.rollHistory.length>100)state.rollHistory.shift();commit();return total}

function findItem(kind,id){if(kind==="equipment")return state.inventory.equipment.find(x=>x.id===id);if(kind==="base")return allAbilities().find(x=>x.id===id);return (state[kind]||[]).find(x=>x.id===id)}
function setPath(path,value){const p=path.split(".");if(p[0]==="item"){const item=findItem(p[1],p[2]);if(!item||item.locked)return;setNested(item,p.slice(3),value);return}if(p[0]==="effect"){const an=state.anomalies.find(x=>x.id===p[1]);const ef=an?.effects.find(x=>x.id===p[2]);if(ef)ef[p[3]]=value;return}setNested(state,p,value)}
function setNested(obj,parts,value){for(let i=0;i<parts.length-1;i++){if(!obj[parts[i]])obj[parts[i]]={};obj=obj[parts[i]]}obj[parts.at(-1)]=value}
function readInput(el){if(el.type==="checkbox")return el.checked;if(el.type==="number")return num(el.value);return el.value}

function bindDynamic(){document.querySelectorAll("[data-path]").forEach(el=>el.addEventListener("change",()=>{const path=el.dataset.path;let value=readInput(el);
  if(path.startsWith("attributes."))value=clamp(value,0,EXISTENCE[state.identity.existence].max);
  if(path==="racialConfig.corruption")value=clamp(value,1,100);
  if(path==="racialConfig.secondary"&&["Vampiro","Abissal"].includes(state.identity.race)&&value===state.racialConfig.primary){el.value=state.racialConfig.secondary;toast("Os dois atributos raciais devem ser diferentes.",true);return}
  if(path==="racialConfig.primary"&&["Vampiro","Abissal"].includes(state.identity.race)&&value===state.racialConfig.secondary){el.value=state.racialConfig.primary;toast("Os dois atributos raciais devem ser diferentes.",true);return}
  if(path==="identity.race"||path==="identity.className")toast(`${path.endsWith("race")?"Raça":"Classe"} alterada; conteúdo manual preservado.`);setPath(path,value);commit()}));
document.querySelectorAll("[data-skill]").forEach(el=>el.addEventListener("change",()=>{const s=state.skills[el.dataset.skill],key=el.dataset.key,val=readInput(el);if(key==="proficient"&&val&&!s.proficient&&Object.values(state.skills).filter(x=>x.proficient).length>=proficiencyLimit()){el.checked=false;toast("Limite de perícias proficientes atingido.",true);return}s[key]=val;commit()}));
document.querySelectorAll("[data-origin-kind]").forEach(el=>el.addEventListener("change",()=>{const x=findItem(el.dataset.originKind,el.dataset.id);if(!x)return;x.origins=x.origins||[];if(el.checked&&!x.origins.includes(el.value))x.origins.push(el.value);if(!el.checked)x.origins=x.origins.filter(o=>o!==el.value);commit()}));
}

document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const act=b.dataset.action;
  if(b.dataset.mode){state.mode=b.dataset.mode;commit();return}
  if(act==="toggle-card"){state.collapsed[b.dataset.id]=!state.collapsed[b.dataset.id];commit();return}
  if(act==="toggle-item"){state.itemCollapsed[b.dataset.id]=!state.itemCollapsed[b.dataset.id];commit();return}
  if(act==="add"){const k=b.dataset.kind;if(k==="abilities")state.abilities.push(newAbility());if(k==="spells")state.spells.push(newSpell());if(k==="anomalies")state.anomalies.push(newAnomaly());if(k==="modifications")state.modifications.push(newModification());if(k==="equipment")state.inventory.equipment.push(newEquipment());commit();return}
  if(act==="delete"){const k=b.dataset.kind;if(k==="equipment")state.inventory.equipment=state.inventory.equipment.filter(x=>x.id!==b.dataset.id);else state[k]=state[k].filter(x=>x.id!==b.dataset.id);commit();return}
  if(act==="enable-uses"){findItem(b.dataset.kind,b.dataset.id).uses={current:1,max:1,every:1,type:"Cena"};commit();return}
  if(act==="enable-attack"){findItem(b.dataset.kind,b.dataset.id).attack={damage:"1d6",attribute:"forca",bonus:0,damageType:"Físico",autoHit:false,canCrit:true};commit();return}
  if(act==="add-effect"){state.anomalies.find(x=>x.id===b.dataset.id).effects.push({id:uid("effect"),target:"Vida",percent:10});commit();return}
  if(act==="delete-effect"){const x=state.anomalies.find(x=>x.id===b.dataset.id);x.effects=x.effects.filter(e=>e.id!==b.dataset.effect);commit();return}
  if(act==="clear-history"){state.rollHistory=[];commit();return}
  if(b.dataset.rollSkill){rollSkill(b.dataset.rollSkill);return} if(b.dataset.die){try{addHistory(b.dataset.die,parseDice(b.dataset.die))}catch(err){toast(err.message,true)}return}
  if(b.hasAttribute("data-roll-expression")){try{addHistory(document.getElementById("diceExpression").value,parseDice(document.getElementById("diceExpression").value))}catch(err){toast(err.message,true)}return}
  if(b.hasAttribute("data-roll-initiative")){addHistory("Iniciativa",parseDice(`1d20+${state.status.initiative}`),"Acertos");return}
  if(b.dataset.attackId){rollAttack(b.dataset.attackKind,b.dataset.attackId,b.dataset.critical==="true")}
});
function rollSkill(name){const s=state.skills[name],a=effectiveAttributes(),bonus=a[s.attribute]+(s.proficient?proficiency():0)+num(s.extra);addHistory(name,parseDice(`1d20${bonus>=0?"+":""}${bonus}`),"Acertos")}
function rollAttack(kind,id,critical){const x=findItem(kind,id);if(!x?.attack)return toast("Ataque não encontrado.",true);const at=x.attack,a=effectiveAttributes();try{if(!at.autoHit){const hit=parseDice(`1d20+${a[at.attribute]+num(at.bonus)}`);const hitTotal=applyPercent(hit.total,"Acertos");state.rollHistory.push({id:uid("roll"),label:`${x.name} — Acerto`,total:hitTotal,detail:hit.detail,time:Date.now()})}const damage=parseDice(at.damage,critical);damage.total+=num(at.bonus);damage.detail+=` + bônus ${num(at.bonus)}`;addHistory(`${x.name}${critical?" — Crítico":""} (${at.damageType})`,damage,"Danos")}catch(err){toast(err.message,true)}}

document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{state.mode=b.dataset.mode;commit()}));
document.getElementById("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`nightmare-${(state.identity.name||"ficha").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.json`;a.click();URL.revokeObjectURL(a.href);toast("Ficha exportada.")});
document.getElementById("importBtn").addEventListener("click",()=>document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change",async e=>{try{const obj=JSON.parse(await e.target.files[0].text());if(!obj||typeof obj!=="object"||!obj.identity)throw new Error("JSON não parece ser uma ficha NIGHTMARE.");state=hydrate(obj);commit();toast("Ficha importada com sucesso.")}catch(err){toast(err.message,true)}finally{e.target.value=""}});
document.getElementById("resetBtn").addEventListener("click",()=>{const d=document.getElementById("confirmDialog");document.getElementById("dialogText").textContent="Isso apagará a ficha local atual. Exporte antes se quiser preservar os dados.";d.showModal();d.addEventListener("close",()=>{if(d.returnValue==="confirm"){state=defaultState();localStorage.removeItem(STORAGE_KEY);commit();toast("Ficha resetada.")}}, {once:true})});
window.addEventListener("beforeunload",()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state)));
renderApp();
