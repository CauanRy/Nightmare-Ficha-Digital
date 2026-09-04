# NIGHTMARE — Relatório de handoff da simplificação v11

## 1. O QUE FOI REVERTIDO

A expansão editorial da versão anterior foi revertida seletivamente na interface e no fluxo de jogo. A área de Magias voltou a priorizar cadastro, leitura e execução. O gerenciamento automático de rodada/turno, os testes automáticos de Morrendo, os bloqueios automáticos de Sustentação e os controles de aplicar dano/cura deixaram de participar do uso cotidiano.

## 2. O QUE FOI REMOVIDO DA UI

- construtor e auditor de OM;
- OM disponível, OM gasto, componentes, graus e orçamento por restrição;
- DA, Complexidade, aprendizado detalhado e classificações editoriais de força/função/origem;
- campos de exceção e autorização do Mestre dentro de cada Magia;
- contador e avanço de rodada/turno;
- testes automáticos de consciência, ação em Morrendo, Medicina e Sustentação;
- aplicação automática de dano e cura;
- bloqueios automáticos de ações por Morrendo ou Sustentação.

## 3. O QUE FOI PRESERVADO

Foram preservados os dados existentes, importação/exportação, progressão, recursos, barras de Vida/Mana/Sanidade, Habilidades, ataques, dano, crítico, Magias antigas, custo de Mana, Recitação, Transcrição, Reação, Sustentação como indicação manual, Truques, Inventário, Anomalias e histórico.

## 4. PA

PA permanece como característica do personagem: `Inteligência + Arcanismo + bônus permanente de PA`. A área mágica mostra apenas PA, `Magias Conhecidas: X / PA` e um campo compacto de bônus permanente. Truques não contam. Exceder o limite não apaga Magias; apenas gera aviso discreto e bloqueia novo cadastro.

## 5. REFLEXO

Acrobacia foi substituída por Reflexo. A migração copia atributo opcional, proficiência e bônus extra de `skills.Acrobacia` para `skills.Reflexo` e remove a chave antiga para impedir duplicação. Referências antigas de Testes de Magia também são convertidas.

## 6. TECNOLOGIA

Tecnologia foi adicionada como Perícia normal. Seu atributo sugerido é Inteligência, mas o bônus não entra automaticamente: a inclusão continua sendo uma escolha explícita antes da rolagem.

## 7. PROFISSÃO

O texto livre de Profissão gera uma Perícia visual com o mesmo nome. Seus dados ficam em `professionSkill`, uma origem estável e independente do rótulo. Renomear Médico para Cirurgião preserva proficiência, extra e atributo; deixar Profissão vazia apenas esconde a Perícia.

## 8. INICIATIVA

Iniciativa continua fora da lista de Perícias. O valor permanece Destreza efetiva mais bônus específicos de Iniciativa, sem Proficiência automática. O botão Rolar iniciativa foi mantido.

## 9. AÇÕES

Padrão, Movimento, Livre, Bônus e Reação formam um guia manual. Cada marcador pode ser alternado pelo jogador. Ação Completa marca todos como gastos e Restaurar todas os repõe. Executar Habilidade/Magia não altera nem bloqueia o guia, e não há avanço de turnos ou rodadas.

## 10. MORRENDO

Morrendo virou um estado manual simples. O toggle mostra três marcadores, que podem ser removidos e restaurados por clique. Consciente/Inconsciente também é manual. Não há morte, perda de marcador, DT ou teste disparado automaticamente.

## 11. RESULTADO DE EXECUÇÃO

O resultado imediato foi restaurado para Perícias, iniciativa, dados, Habilidades, ataques e Magias. O modal mostra total e detalhes; ataques mostram natural, modificadores, crítico e dano. O mesmo registro permanece no histórico e no destaque do Modo Combate.

## 12. DANO/CURA

Os botões redundantes Aplicar dano e Aplicar cura foram removidos. Vida, Mana, Sanidade e Trauma são editados diretamente nos controles dos recursos. Nenhum alvo externo recebe dano automaticamente.

## 13. INVENTÁRIO

Inventário/Equipamentos permanece como a última seção da ficha e agora ocupa as 12 colunas disponíveis, eliminando o vazio lateral.

## 14. SCROLL

Histórico usa altura máxima de 420 px com scroll vertical. A lista de Magias usa até 560 px e a de Truques até 360 px; no mobile o limite geral cai para 480 px. Os cards permanecem acessíveis sem transformar a ficha em página infinita.

## 15. MAGIAS

O editor voltou ao fluxo simples: Nome, Ciclo, Tipo de Magia, Tipo, Mana, Ação, Alcance, Duração, Teste/Resistência, custo adicional, Transcrição, Recitação, Sustentação, descrição, efeitos e ataque. Cards mostram resumo compacto e detalhes sob demanda. OM, DA e Complexidade não são exigidos para cadastrar nem executar.

## 16. TESTES

- `node --check script.js`: aprovado;
- `node work/rules-test.js`: 174 asserções aprovadas;
- migração Acrobacia → Reflexo: aprovada;
- Tecnologia sem Inteligência automática: aprovada;
- Profissão estável após renomear e recarregar: aprovada;
- Magia antiga, custo de Mana, Reação e Recitação: aprovados no navegador;
- resultado imediato e histórico: aprovados no navegador;
- Morrendo e marcadores manuais: aprovados no navegador;
- console: sem erros ou avisos.

## 17. MIGRAÇÃO/SCHEMA

O schema avançou para v11. Dados editoriais recentes de OM/DA/Complexidade permanecem no JSON por compatibilidade, mas ficam invisíveis e não bloqueiam o jogo. Campos desconhecidos continuam preservados. Fichas antigas e v10 são hidratadas sem migração destrutiva.

## 18. MOBILE

Validado em viewport de 375 × 812 px. `innerWidth` ficou em 375 px e `document.scrollWidth` em 360 px, sem overflow horizontal. Barras, ações e cards empilham corretamente. O Inventário mediu a mesma largura da grade da ficha.

## 19. ARQUIVOS ALTERADOS

- `index.html`;
- `script.js`;
- `style.css`;
- `theme.css`;
- `work/rules-test.js`;
- `RELATORIO_HANDOFF_NIGHTMARE_SIMPLIFICACAO_V11.md`.

## 20. PUBLICAÇÃO

Versão v11 publicada na branch principal de `CauanRy/Nightmare-Ficha-Digital` e validada no GitHub Pages em `https://cauanry.github.io/Nightmare-Ficha-Digital/`. A implementação foi publicada inicialmente no commit remoto `0aa946da55d61f10b7cd13bfd997bae5052a62b9`.

## 21. PENDÊNCIAS REAIS

Não há pendência técnica bloqueante nesta revisão. Regras narrativas e decisões do Mestre permanecem deliberadamente fora da automação da ficha.

## 22. RESUMO PARA O CHAT PLANEJADOR

A v10 havia sobrecarregado a ficha com construção editorial de Magias e automações de combate. A v11 esconde esses dados, remove bloqueios e devolve Magias ao fluxo curto de cadastro/execução. Reflexo migra Acrobacia, Tecnologia funciona sem atributo automático, Profissão gera uma Perícia estável e o resultado imediato voltou. A interface novamente se comporta como ficha individual de personagem; publicação oficial é registrada na seção anterior.
