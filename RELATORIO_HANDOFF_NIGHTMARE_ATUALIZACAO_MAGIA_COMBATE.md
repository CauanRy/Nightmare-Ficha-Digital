# RELATÓRIO DE HANDOFF — NIGHTMARE: MAGIA E COMBATE

## 1. ESTADO INICIAL ENCONTRADO

O projeto local estava funcional, em schema v9, com ficha e Modo Combate, persistência em `localStorage`, importação/exportação, temas de Combatente e Arcanista, barras de Vida/Mana/Sanidade, rolagens, ataques, progressão e 122 verificações automatizadas. Não existiam ainda economia de ações, Rodada/Turno, Morrendo, Consciência, Truques, PA/OM/DA, modelo moderno de Magia ou sustentação consolidada.

## 2. O QUE FOI IMPLEMENTADO

- schema v10 e migração compatível;
- Rodada, turno próprio e cinco recursos de ação;
- Ação Completa consumindo todas as ações, inclusive Reação;
- Morrendo, Consciência, três Marcadores de Morte, morte e estabilização;
- dano massivo, cura comum, cura extrema e `Remove Morrendo`;
- crítico natural com margem e multiplicador configurável apenas nos dados;
- Sustentação, bloqueio de ações, exceções e teste de Arcanismo com DT manual;
- Truques separados de Magias;
- PA, ciclos narrativos, limite de Magias Conhecidas, OM, DA e tempo de aprendizado;
- Reação mágica, Recitação, Transcrição e motor central de custo;
- modelo moderno de Magia e resistência estruturada;
- validação especial de Ressurreição;
- histórico ampliado e controles rápidos no Modo Combate.

## 3. O QUE JÁ EXISTIA E FOI PRESERVADO

Foram preservados o design atual, os temas vermelho/azul, as fichas existentes, a identidade, atributos, perícias, habilidades, anomalias, modificações, inventário, progressão por snapshots, defesas, foto, importação/exportação, barras com recursos temporários, dados, histórico e funcionamento offline.

## 4. MIGRAÇÃO

O schema passou de v9 para v10. A hidratação continua usando composição por `spread`, preservando campos desconhecidos na raiz e dentro dos objetos existentes. Magias antigas recebem padrões não destrutivos e continuam utilizáveis sem preencher o auditor de OM. Foram adicionados valores seguros para Truques, progressão mágica, ações, Rodada/Turno, Morrendo, Consciência, Sustentação e multiplicador crítico.

## 5. MORRENDO

Vida em 0 ativa Morrendo com três marcadores, sem consumir marcador no ataque que causou o estado. Cada início de turno próprio remove um marcador; zero marcadores causa morte. Consciência é independente e usa Sobrevivência + Constituição contra DT manual. Agir consciente em Morrendo repete esse teste; falha remove marcador adicional, mas a ação continua. Medicina treinada usa somente Proficiência + Extra da perícia; sem treino usa 1d20 puro. Sucesso estabiliza, sai de Morrendo, recupera três marcadores e retorna com 1 Vida.

Cura comum não remove Morrendo. Um efeito estruturado `Remove Morrendo` aplica normalmente a cura indicada. Cura única de pelo menos 50% da Vida máxima sem essa propriedade remove Morrendo, mas retorna com exatamente 1 Vida.

## 6. CRÍTICO

Críticos de ataque dependem apenas do resultado natural e da margem configurada. O multiplicador padrão é ×2. O motor multiplica somente os termos de dados, mantendo bônus fixos uma única vez. Exemplo validado no navegador: `1d6 + 5`, crítico ×3, tornou-se `3d6 + 5`.

## 7. SUSTENTAÇÃO

Existe uma única Sustentação severa. Por padrão ela bloqueia ações normais. Uma habilidade/override pode permitir ações, mas o teste de Arcanismo ainda é exigido, salvo dispensa explícita. A DT é preenchida pelo mestre. Dano registra uma perturbação sem inventar teste automático. Falha encerra a Sustentação. O valor +3 OM permanece marcado como referência configurável de playtest.

## 8. MAGIAS

- PA = Inteligência efetiva + Arcanismo efetivo + bônus permanentes de PA;
- Magias Conhecidas máximas = PA; queda de PA não apaga Magias;
- ciclos desbloqueados são narrativos e independentes de PA/DA;
- OM Base segue 4, 5, 6, 7, 9, 11, 13, 15 e 17;
- graus de componente: N/A 0, Fraco 1, Referência 2, Forte 3, Limite 4;
- OM disponível = OM Base + OM extra permitido por restrições;
- DA = base do Ciclo + OM realmente utilizado + Complexidade;
- aprendizado segue a tabela de dias e multiplicadores por `DA - PA`;
- magia normal elegível pode ser usada como Reação por Mana ×2;
- Reação nativa aplica ×2 uma única vez;
- Recitação usa ×1,5 com arredondamento para baixo;
- Transcrição exige preparação com Ação Completa e reduz o custo pela metade, mínimo 1;
- a ordem central é Reação → Recitação → Transcrição;
- resistência registra perícia, atributo opcional, DT usada, sucesso e falha;
- Ressurreição é bloqueada fora do 9º Ciclo ou sem autorização do mestre.

`Remove Morrendo` é bloqueado antes do 3º Ciclo sem exceção do mestre. Seu custo permanece explicitamente como “OM pendente / moderado provisório”; nenhum número definitivo foi inventado.

## 9. TRUQUES

Truques possuem seção, CRUD, uso em combate, ação, descrição, efeito, notas e ataque opcional. O custo padrão é 0 Mana e eles não entram na contagem de Magias Conhecidas baseada em PA.

## 10. TESTES

O conjunto anterior foi mantido e ampliado de 122 para 185 verificações. Foram cobertos migração, progressão, iniciativa, PA, OM, DA, aprendizado, custos de Mana, Reação, Recitação, Transcrição, ações, Morrendo, Consciência, Medicina, cura, dano massivo, Sustentação, crítico e Ressurreição.

Validação manual no navegador:

- desktop e viewport de 375 × 812;
- ausência de overflow horizontal e de erros no console;
- carregamento/migração de ficha antiga;
- edição de personagem;
- exportação com confirmação e importação por arquivo;
- edição e execução de Magia;
- criação de Truque;
- barras de recursos, dano, cura, Morrendo e início de turno;
- crítico ×3, custo de Mana e consumo de ação.

## 11. ALTERAÇÕES DE UI

O Modo Combate recebeu cartões compactos para Rodada/Turno, economia de ações, Morrendo/Consciência, Sustentação e dano/cura. Vida, Mana e Sanidade continuam no topo. O grimório recebeu painel de PA, ciclos narrativos, Magias, Truques, editor moderno, auditor de OM e indicadores de DA/aprendizado. A identidade visual existente foi preservada.

## 12. ARQUIVOS ALTERADOS

- `index.html`;
- `script.js`;
- `style.css`;
- `work/rules-test.js`;
- `work/dev-server.cjs`;
- `RELATORIO_HANDOFF_NIGHTMARE_ATUALIZACAO_MAGIA_COMBATE.md`.

## 13. REGRESSÕES ENCONTRADAS E CORRIGIDAS

- o primeiro campo de dano/cura recriava o componente durante a digitação; foi desacoplado do binding persistente;
- a estabilização havia sido inicialmente ligada ao bônus de Sobrevivência + Constituição; foi corrigida para Medicina sem atributo automático;
- OM extra foi separado corretamente entre capacidade permitida e OM realmente gasto na DA;
- custo de Reação nativa foi protegido contra duplicação;
- crítico foi centralizado para não multiplicar valores fixos;
- ficha antiga foi validada no navegador já migrada para v10.

## 14. PENDÊNCIAS

Não há pendência técnica bloqueante. Permanecem deliberadamente sob decisão do mestre/autor:

- DTs de Consciência, ação em Morrendo, Medicina e Sustentação;
- custo definitivo de OM para `Remove Morrendo`;
- confirmação futura do +3 OM de Sustentação;
- condições narrativas de Ressurreição.

## 15. DECISÕES TÉCNICAS

As regras puras ficaram expostas em `window.NightmareRules` para testes. A migração é tolerante a campos desconhecidos. O motor de custo retorna um detalhamento intermediário. Recursos atuais continuam separados dos máximos da ficha. O histórico registra eventos mecânicos relevantes sem criar fórmulas onde o texto exige julgamento do mestre.

## 16. DIVERGÊNCIAS

Não houve redesign nem reconstrução. Magias legadas permanecem permissivas; as validações estritas são aplicadas ao uso de vantagens especiais novas. As únicas regras não automatizadas são exatamente as que o documento mantém como decisão manual.

## 17. ESTADO DA PUBLICAÇÃO

Versão oficial preparada e publicada na branch principal de `CauanRy/Nightmare-Ficha-Digital`, mantendo o fluxo de GitHub Pages do projeto. Endereço: `https://cauanry.github.io/Nightmare-Ficha-Digital/`.

## 18. RESUMO PARA O CHAT PLANEJADOR

O NIGHTMARE está em schema v10, com o núcleo consolidado de combate, Morrendo, crítico, Sustentação, Truques e construção/aprendizado de Magias. A compatibilidade com fichas antigas foi preservada. O conjunto automatizado passa com 185 verificações, e o fluxo principal foi validado em navegador desktop e mobile. Próximas decisões de regras devem se concentrar somente nos valores deliberadamente pendentes de OM/DT e nas condições narrativas de Ressurreição.
