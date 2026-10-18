# AUDIT.md — KittensGame : vérification de l'analyse initiale

Date : 2026-10-18. Branche : `master` @ `781e379f`. Aucun code modifié — seul ce rapport a été ajouté.

## 0. Baseline (exécuté sur cette machine)

| Commande | Résultat |
|---|---|
| `corepack yarn install --frozen-lockfile` | OK (30 s) |
| `corepack yarn lint` (eslint `--quiet` + `tsc -p jsconfig.json`) | **VERT** |
| `corepack yarn test` (jest) | **VERT** — 3 suites, 56 tests, 21 s |

Notes d'environnement :
- `yarn` absent du PATH ici → passer par `corepack yarn` (Node 24 local, CI = Node 20).
- `yarn audit` : **638 vulnérabilités devDeps** — 34 Critical, 334 High, 235 Moderate, 35 Low. Aucune dépendance runtime (package.json n'en a aucune) → surface d'attaque = outillage uniquement.

## 1. Confirmé

| Affirmation | Preuve |
|---|---|
| ES5 strict dans le code livré | 5 hits grep `const\|let\|=>` hors lib = 3 dans des strings HTML (`workshop.js:3116`) + 2 dans du JSDoc. 0 dans l'exécutable. ESLint `ecmaVersion: 5` |
| god objects : `game.js`, `village.js` gigantesques | `game.js` 5 694 l., `js/village.js` 5 325 l., `buildings.js` 3 485, `workshop.js` 3 362, `religion.js` 3 062, `core.js` 2 440 |
| `innerHTML` massif | **230** occurrences (doc disait ~150 → sous-estimé) : village 60, core 29, diplomacy 21, challenges 20, achievements 19, ui 15, time 13, workshop 11, religion 10 |
| Dojo partout | **830** occurrences `dojo.` : village 154, core 122, diplomacy 68, ui 67, time 52, workshop 42, game 44 |
| README Node 10+ vs CI Node 20 | `README.md:29` dit « nodejs v10+ », `.github/workflows/main.yml` = Node 20. Pas de champ `engines` |
| README chemin i18n faux | `README.md:122` dit `i18n/en.json` ; la racine `i18n/` **n'existe pas**. Vrai chemin : `res/i18n/` (11 locales + `crowdin/`) |
| Roadmap Trello morte | `README.md:81` → lien Trello |
| DevDeps anciens | eslint ^7.4, jest ^26.1, husky ^4.2, http-server ^0.12, typescript ^5 — + 638 vulns (ci-dessus) |
| `migrateSave()` ~290 l. | `game.js:3304` → ~`3597` (≈ 293 l.), if-blocks enchaînés, `saveVersion` atteint 15 |
| `Math.random` multi-fichiers | game 4, village 6, math 6, calendar 4, diplomacy 1 (+ simulate-combat 2) |
| TODO/FIXME/HACK | **182** (doc disait ~155) |
| Chaînes visibles en dur | exemples : `village.js:3145` (`"Currently exploring: ["`), `village.js:3173` (`"Explorers:<br>HP:"`) via `innerHTML` |
| Husky 4 + config dans package.json | hooks `pre-commit: yarn lint` uniquement (pas de test) ; `commit-msg` echo `commitlint` mais **commitlint absent des devDeps** → ligne inerte |

## 2. Infirmé

| Affirmation | Réalité |
|---|---|
| « eval / new Function / setTimeout(string) à vérifier » | **0 occurrence** dans tout le code hors `lib/` |
| « Worker construit à partir d'une chaîne, à réécrire avec un Blob » | **déjà un Blob** : `game.js:5260-5266` (`new Blob([onmessage=...])` + `URL.createObjectURL`). Seul `dojo.hitch` dans le listener → couvert par le P1 Dojo |
| « certaines libs inutilisées probablement » | **toutes utilisées** : React (JSX UI, ~120 refs), jQuery (sélecteurs ui/toolbar/preview/time), `system.js` = **SystemJS, loader de modules** (`System.import` dans `index.html:102` et `tests.html`), md5 (gravatar `toolbar.jsx.js:338`), babel (`systemjs-babel`), dojo, lz-string. **Ne rien supprimer dans `lib/`** |
| P3 « versionner le format de sauvegarde s'il n'existe pas » | **déjà versionné** : champ `saveVersion: 15` (`game.js:2345`), testé à `game.js:3093` avant migration |
| P5 « synchroniser package.json / version.json / changelog » | Deux schémas distincts **volontaires** : `version.json` = 1.6.1.6 = `changelog.txt` ✓ synchro ; `package.json` 14.8.0 = semver npm ; `build.version.json` = compteur `{buildRevision:3}` généré par `tools/generate-buildver.js`. Seul point réel : fallback `version = "1.6.1.0"` dans `index.html:69` (cache-buster, non bloquant) |
| « ~13 fichiers theme_*.css » | **27** fichiers `res/theme_*.css` |
| « timers mal nettoyés » | Surface minime : 4 sites réels (`clearInterval` `game.js:5285`, worker interval, `gatherTimeoutHandler` `buildings.js:3220` avec `clearTimeout`). Fuite ? non démontrée |
| Comptes de lignes du doc | surévalués ~10 % : game 5 694 (pas 6 400), village 5 325 (pas 6 000). Total hors lib/node_modules mesuré : 44 803 l. (`Measure-Object -Line`) |

## 3. Nouveaux points (absents du doc)

1. **`lint` rate des fichiers** : script = `eslint *.js js/*.js` → `js/jsx/*.jsx.js` **jamais linté**. Vérifié : `eslint js/jsx/*.js` → **44 erreurs** (semi, keyword-spacing, `no-undef` WToolbarFPS/WBLS/WLogin). `test/` non linté non plus (override ESLint `test/*.js` = config morte).
2. **Warnings invisibles en CI** : `--quiet` + pas de `--max-warnings 0` → les ~règles en `warn` (quotes, no-unused-vars) ne bloquent jamais.
3. **`tests.html` cassé** : charge `lib/jasmine-2.5.2/` → **dossier absent**. Remplacé par Jest ; soit supprimer, soit documenter mort.
4. **Feedback local limité** : pas de `yarn` sur PATH (corepack requis), Node 24 local vs Node 20 CI.
5. Hooks inertes : `commit-msg` → commitlint non installé ; pre-commit ne lance pas les tests.

## 4. Non vérifié / réserves

- Chemin actif des JSX : fichiers `js/jsx/*.jsx.js` versionnés + plugin SystemJS-babel configuré → compilation runtime ou build figé ? Non tranché.
- `math.js` : 6 `Math.random` — PRNG seedable présent ou non, non vérifié (à faire avant le P4 déterminisme).
- XSS : audit complet des 230 `innerHTML` **non fait** ici (C'est le PR P0-4). Seuls 2 cas en dur relevés.
- Clés i18n orphelines/manquantes : non calculées (P6, script dédié à écrire).
- `yarn audit` : 638 vulns = chaînes babel/jest anciennes ; réduction réelle à mesurer paquet par paquet.

## 5. Liste de PR (ordre recommandé)

> Réorganisation vs le doc : **les tests P4-1/P4-2 passent AVANT le cache P2-1** — un cache invalidé faux casse le balance en silence, sans test d'équivalence on ne le verra pas.

### P0 — Sécurité / stabilité

| PR | Objectif | Fichiers | Risque | Test |
|---|---|---|---|---|
| **P0-1** | DevDeps audit, **un paquet par PR**, ordre : http-server → typescript → jest 26→29 → eslint 7→8 (maintenir `ecmaVersion: 5`) → husky 4→9 (migrer config package.json → `.husky/`, supprimer ligne commitlint inerte) | `package.json`, `yarn.lock`, `.husky/*` | tooling only, 0 runtime ; risque = règle eslint qui change entre majors | `yarn lint` + `yarn test` verts après chaque ; compte `yarn audit` avant/après |
| **P0-2** | Docs : README Node 20+, champ `engines`, chemin `res/i18n/`, marquer Trello mort, mention `tests.html` cassé | `README.md`, `package.json` | zéro | relecture |
| **P0-3** | Couverture lint : corriger les 44 erreurs `js/jsx/*` (mécanique : semi, espaces, globals), ajouter `js/jsx/*.js` et `test/*.js` au script lint, passer `--quiet` → `--max-warnings 0` après nettoyage | `package.json`, `js/jsx/*.js` | faible — mécanique, 0 comportement | `yarn lint` ; jeu inchangé (fichiers JSX non exécutés différemment) |
| **P0-4** | Audit XSS : inventaire des 230 `innerHTML` → classer sûr (données statiques) / risqué (save importée, URL, saisie) ; corriger les sinks risqués un fichier par PR, `textContent` ou échappement | `js/village.js`, `core.js`, `js/diplomacy.js`, `js/challenges.js`, `js/achievements.js`, `js/ui.js` | moyen — ciblé, aucun refactoring | fixtures de save avec `<img onerror>` dans les champs affichés ; tests manuels import/export |
| **P0-5** | Sauvegarde : vérifier chemin « storage bloqué » (nav privée) au démarrage + backup avant migration destructive | `game.js` (load/save ~L2890-3100) | moyen — toucher au load | test unit : mock `localStorage` jetable, migration sur fixture |

### P1 — Architecture (aucun changement de comportement)

| PR | Objectif | Fichiers | Risque | Test |
|---|---|---|---|---|
| **P1-1** | Extraire sauvegarde+migration de `game.js` → namespace global (ex. `KG.Save`), même ordre de chargement SystemJS | nouveau `js/save.js` (ou `game.save.js`), `index.html`, `game.js` | moyen — cœur sensible | fixtures multi-`saveVersion` (voir P3-2), round-trip identique |
| **P1-2** | Dojo → ES5 natif, fichier par fichier, ordre croissant d'usage : `math.js`(1), `resources.js`(2), `void.js`(5), `calendar.js`(6), `stats.js`(8)… adapter `dojo.hitch`→`.bind`, `dojo.byId`→`getElementById`, `dojo.connect`→`addEventListener` | 1 fichier/PR + shim tant que non migré | faible par PR | `yarn lint`+`yarn test`+manuel |
| **P1-3** | Découpage `game.js` domaines (temps/boucle, calcul par tick, effets, UI) — **après** P1-1, une extraction par PR | `game.js` | moyen | équilibre identique : snapshot tests ressources |
| **P1-4** | Découpage `village.js` (chasse, commerce, catnip…) | `js/village.js` | moyen | idem |
| ~~P1-5~~ | ~~supprimer libs inutilisées~~ | — | — | **annulée : tout est utilisé** (voir §2) |

### P2 — Performance (après P4-1/P4-2)

| PR | Objectif | Fichiers | Risque | Test |
|---|---|---|---|---|
| **P2-1** | Cache dirty par ressource pour `calcResourcePerTick`/`getResourcePerTickStack` (`game.js` ~L2678/L3666/L3873), invalidation sur changement bâtiment/effet/saison | `game.js` | **élevé** — invalidation faux = balance fausse silencieusement | test d'équivalence : N ticks sans cache vs avec cache, mêmes nombres (exigé avant merge) |
| **P2-2** | DOM : cache refs éléments au démarrage, ne maj que nœuds changés | `js/ui.js`, `js/village.js` | moyen — visuel | manuel : `yarn start`, rendu tick-by-tick |
| **P2-3** | `effectMeta` (~`game.js:2678`) → table de lookup indexée | `game.js` | moyen | golden test titres/effects identiques |
| **P2-4** | Timers : cleanup reset/preview (`gatherTimeoutHandler`, `_mainTimer`) | `game.js`, `js/buildings.js` | faible | test : reset 2× pas de double-tick |

### P3 — Sauvegarde

| PR | Objectif | Fichiers | Risque | Test |
|---|---|---|---|---|
| **P3-1** | Round-trip test : save→load→state identique | `test/game.test.js` | zéro | jest |
| **P3-2** | Fixtures de saves anciennes (v1…v15) + un test par migration | `test/res/save.js` + fixtures | zéro | jest |
| **P3-3** | Split `migrateSave()` en fonctions `migrate_N_to_N+1` chaînées (format inchangé, `saveVersion` reste 15) | `game.js:3304-3597` | moyen | P3-2 obligatoire au vert |
| **P3-4** | Doc + tests du `JSONreplacer` | `game.js` | faible | round-trip |

### P4 — Tests / qualité

| PR | Objectif | Fichiers | Risque | Test |
|---|---|---|---|---|
| **P4-1** | PRNG seedé ES5 injecté là où `Math.random` est utilisé dans la logique (game/village/calendar/diplomacy/math) | 5-6 fichiers | faible si injection optionnelle, défaut = `Math.random` | tests existants verts + run déterministe 2× identique |
| **P4-2** | Couverture : calcul par tick, effets, migration, challenges (ordre du doc) | `test/*` | zéro | jest |
| **P4-3** | `// @ts-check` aux petits modules (`js/math.js`, `js/time.js`…), 0 `strict` global | petits modules | faible | `yarn typecheck` |
| **P4-4** | Classifier les 182 TODO/FIXME/HACK (bug > perf > cosmo > supprimer), fix bugs d'abord | — | faible | — |

### P5 — Hygiène

| PR | Objectif | Fichiers | Risque | Test |
|---|---|---|---|---|
| **P5-1** | `.gitignore` + artefacts versionnés | `.gitignore` | faible | `git status` propre |
| **P5-2** | README : i18n, versions (2 schémas expliqués), `emulator.html`/`simulate-combat.js`/`server.json`, Trello mort | `README.md` | zéro | relecture |
| **P5-3** | `tests.html` : supprimer ou documenter (jasmine absent) — **demande explicite requise** avant suppression | `tests.html` | — | — |

### P6 — i18n

| PR | Objectif | Fichiers | Risque | Test |
|---|---|---|---|---|
| **P6-1** | Script d'audit : clés `res/i18n/en.json` vs `$I()` utilisées → rapport manquantes / orphelines (signaler, ne pas supprimer) | `tools/` (nouveau script) | zéro | sortie du script |
| **P6-2** | Fixer les `innerHTML` en dur identifiés (post P0-4) via `$I()`, clés ajoutées dans `res/i18n/en.json` uniquement | `js/village.js` + `res/i18n/en.json` | faible | jeu FR/EN |

### P7 — CSS : reporté, ne pas commencer (27 thèmes, pas 13).

---

**Validation requise avant tout code métier** : ordre final P0-1 → P0-2 → P0-3 → P3-2 → P4-1 → P4-2 → P0-4 → P0-5 → P1-1 … (fixtures et tests d'équivalence d'abord).
