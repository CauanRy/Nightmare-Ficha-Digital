# NIGHTMARE — HANDOFF DA CORREÇÃO DE MANA DO ARCANISTA

## 1. Fórmula antiga

A parcela fixa incorreta estava em `classManaFormula` e `progressionClassMana`, ambas em `script.js`. Os dois cálculos usavam `10 + 2 × Arcanismo` por Patamar para Arcanista.

## 2. Arquivos alterados

- `script.js`;
- `work/rules-test.js`;
- `RELATORIO_HANDOFF_NIGHTMARE_MANA_ARCANISTA_V11.md`.

## 3. Fórmula nova

No Patamar Desperto, a Mana do Arcanista é `20 + 2 × Arcanismo`. Cada Ascensão acrescenta `20 + 2 × Arcanismo` registrado no snapshot do fim do Patamar anterior. Pontos adquiridos no Patamar atual continuam valendo `+2 Mana` cada.

## 4. Snapshots

O mecanismo existente foi preservado. Nenhum Patamar anterior é recalculado com o Arcanismo atual.

## 5. Migração e schema

Não houve alteração de schema nem migração destrutiva. A Mana máxima é derivada; personagens existentes recebem o cálculo corrigido ao carregar, enquanto `manaCurrent` permanece no valor salvo e só é limitado se ficar acima do novo máximo.

## 6. Testes

Foram cobertos Desperto com Arcanismo 0 e 5; toda a progressão natural `30, 64, 104, 154, 214, 284`; toda a progressão mínima `20, 40, 60, 80, 100, 120`; preservação e recarga dos snapshots; importação/exportação; e ausência de restauração automática da Mana atual quando o máximo aumenta.

## 7. Publicação

A correção foi publicada na branch principal no commit remoto `1292e4b3be3fe6bf472cc58847e67cba01d265a1` e validada no GitHub Pages. A página servida confirmou Mana máxima 30 para Arcanista Desperto com Arcanismo 5.

## 8. Divergências

Nenhuma divergência de regra foi encontrada fora das duas parcelas fixas incorretas. A Mana do Combatente permanece inalterada em `10` por Patamar.

## Resumo para o chat planejador

A base de Mana do Arcanista foi corrigida de 10 para 20 por Patamar. Snapshots históricos, schema e Mana atual foram preservados; somente a Mana máxima derivada foi corrigida.
