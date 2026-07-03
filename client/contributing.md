# 🤝 Guia de Contribuição — Frontend

Ficamos muito felizes que você deseja contribuir com o desenvolvimento do frontend do **PDF Library**! Este documento descreve as diretrizes de desenvolvimento, padrões e o fluxo de trabalho do projeto.

---

## 🛠️ Configuração do Ambiente de Desenvolvimento

### 1. Clonar e Instalar Dependências
Certifique-se de estar no diretório `/client` e instale as dependências:
```bash
npm install
```
> O comando acima configura automaticamente as ferramentas de qualidade através do **Husky**.

### 2. Executar em Desenvolvimento
Inicie o servidor local:
```bash
npm run dev
```

---

## 📐 Padrões de Código e Qualidade

O projeto utiliza ferramentas automatizadas para garantir a padronização e evitar problemas de build no repositório.

### 1. Linting & Formatação
* **ESLint:** Enforça regras estritas do TypeScript e React, além de restringir importações inválidas entre as camadas da Clean Architecture.
* **Prettier:** Mantém o estilo de formatação de código unificado.
* **Verificação Manual:**
  ```bash
  npm run lint
  ```
* **Automatização:** Ao tentar realizar um commit, o **lint-staged** executará o ESLint e o Prettier apenas nos arquivos modificados. Se houver algum erro, o commit será bloqueado até que seja corrigido.

### 2. Padrão de Commits (Conventional Commits)
Os commits no projeto seguem as especificações do **Conventional Commits**. Exemplos de prefixos aceitos:
* `feat:` Uma nova funcionalidade (ex: `feat: add document search input`)
* `fix:` Correção de um bug (ex: `fix: boundary crash on invalid token`)
* `docs:` Alterações na documentação (ex: `docs: update contributing guidelines`)
* `style:` Mudanças de formatação ou estilo que não afetam o código (ex: `style: format button css`)
* `refactor:` Código alterado que não corrige erro nem adiciona funcionalidade (ex: `refactor: simplify useDeps hook`)
* `test:` Adição ou correção de testes (ex: `test: add login usecase unit tests`)
* `chore:` Tarefas de manutenção do build/configurações (ex: `chore: update package lock`)

---

## 🧪 Testes

Adotamos o **Vitest** em conjunto com a **React Testing Library** para testes unitários e de componentes.
* Os testes devem ser criados no mesmo diretório do arquivo testado, utilizando a extensão `.spec.ts` ou `.spec.tsx`.
* **Rodar os testes uma vez:**
  ```bash
  npm run test
  ```
* **Rodar em modo Watch (desenvolvimento ativo):**
  ```bash
  npm run test:watch
  ```

---

## 📥 Fluxo para Pull Request (PR)

1. **Crie uma Branch:** Crie sua branch a partir da `main`. Escolha nomes descritivos, por exemplo:
   * `feat/nome-da-feature`
   * `fix/nome-do-bug`
2. **Desenvolva e Respeite a Clean Architecture:**
   * Escreva códigos desacoplados.
   * Não adicione dependências de framework (como hooks ou components de UI) dentro da pasta `core/`.
   * Mantenha os estilos escopados com CSS Modules.
3. **Escreva Testes:** Sempre escreva testes unitários correspondentes para novos Use Cases ou hooks complexos.
4. **Valide Localmente:** Rode `npm run lint` e `npm run test` para certificar-se de que nada foi quebrado.
5. **Realize o Commit:** Faça o commit das modificações utilizando commits convencionais.
6. **Abra o PR:** Descreva claramente no PR o que foi alterado, por que foi feito e como testar.
