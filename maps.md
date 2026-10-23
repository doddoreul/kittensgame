# 🐾 La Carte — mini wiki du joueur

*Anciennement « la feature de chasse/exploration », accessible dans l'onglet **Village**, sous la section « Carte ». Fork doddoreul — branche `hunting`/`master`.*

---

## 1. Activer la carte

Rien ne se passe avant ton **arc** : la carte apparaît quand la recherche **Tir à l'arc (Archery)** est terminée — les technologies côte-à-côte t'ouvrent le monde jusqu'à 10 biomes + ton village.

---

## 2. Le panneau Carte à l'écran

Sur la Carte tu trouveras :

- **La liste des biomes** connus (Village, Plains, Forest, Hills…). Chaque biome a son propre bouton.
- **Un bouton « Améliorer le QG »** (la caserne du village).
- **Votre escouade d'exploration**, avec sa santé **PV**, son **XP / niveau**, la jauge **endurance** (stamina).
- L'état courant : *« En cours d'exploration : [biome], ETA : X »* (progression vers le niveau suivant).

Le tooltip au survol d'un biome montre : la **description**, le **coût d'exploration** en chaptitude par jour, les **niveaux actifs** (ex. 1/3), le rappel `+ / − sont gratuits`, et la **faune** en patrouille (nom + PV).

---

## 3. Les niveaux de biome et les boutons `+ / −`

Chaque biome possède un système de **paliers** :

- **`val` — niveau max jamais exploré** : ne redescend jamais, c'est la mémoire de ton progrès.
- **`on` — niveaux activés** (les ±) : combien de niveaux *fonctionnent* pour toi en ce moment.
- **La barre de progression CP** : quand elle atteint 100 % pour le niveau actif, **tu gagnes un niveau** (val monte, récompense !), puis tu recommences pour le suivant.

**Les règles des `+ / −` :**

| Action | Effet |
|---|---|
| `+` | Active **un niveau supplémentaire** (s'il en existe un de plus déjà exploré). Bonus montés avec le niveau actif. La faune plus forte spawn. |
| `+ max` | Tous les niveaux exploités deviennent actifs. |
| `−` / `− max` | Désactive des niveaux actifs, **sans jamais perdre le niveau exploré**. |
| Toggle quoi qu'il soit | **Reset la progression CP** du biome et fait fuir la faune. Les toggles sont **gratuits** en chaptitude. |

⚠️ **Un biome jamais exploré ne peut pas être activé** — il faut explorer les niveaux un par un (un biome au niveau 0 affiche « Niveaux actifs : 0/0 » dans son tooltip).

---

## 4. Les effets de production

Chaque niveau actif apporte un **multiplicateur** sur la production de tes ressources :

- **Plains → +1% de catnip par niveau actif** ; Forest du bois, etc. (voir description de chaque biome — écrites en anglais dans le jeu pour l'instant).
- **Le Village est unique** : chaque niveau actif **au-delà du premier** accélère toute l'exploration de +10% (le 1er niveau actif ne donne rien).

Table complète des bonus (par niveau actif) :

| Biome | Bonus |
|---|---|
| Village | +10% vitesse d'exploration (dès le 2e niveau actif) |
| Plains | +1% catnip |
| Forest | +1% bois |
| Hills | +1% fer |
| Desert | +1% efficacité des panneaux solaires |
| Mountain | +1% minéraux |
| Rain Forest | +1% chaptitude |
| Swamp | +1% pétrole |
| Bone Forest | +1% or |
| Volcano | +1% charbon |
| Crimson Desert | +1% uranium |

Le bonus en cours de chaque biome (bonus × niveaux actifs) est affiché dans son tooltip : **Bonus actifs : fer +3%** etc.

### Comment débloquer les biomes

| Biome | Condition de déblocage |
|---|---|
| Plains, Forest | Disponibles dès le début |
| Hills | Plains **ou** Forest ≥ 5 |
| Mountain | Hills ≥ 10 |
| Desert | Plains ≥ 15 |
| Rain Forest | Forest ≥ 15 **et** Desert ≥ 10 |
| Bone Forest | Forest ≥ 25 **et** Rain Forest ≥ 5 |
| Swamp | Rain Forest ≥ 10 |
| Volcano | Mountain ≥ 25 |
| Crimson Desert | Volcano ≥ 10 **et** Swamp ≥ 10 |
| Redmoon | Programme spatial **Mission lunaire** lancé |

Les conditions sont vérifiées en continu dès qu'elles sont réunies — pas besoin d'explorer le biome parent un niveau de plus. *Ce fork est désormais la version de référence : le dev d'origine a abandonné le projet.*

---

## 5. Explorer — la mécanique centrale

1. **Cliquer sur le bouton biome** envoie l'escouade dans ce biome.
2. À chaque tick (10 ticks = 1 jour de jeu), l'escouade :
   - **draine ta chaptitude** (production des chasseurs : 0.15 × (niveau du QG)^1.7 par tick, affiché ×10/jour dans le tooltip),
   - **consomme l'endurance** (~70 jours d'excursion max, puis l'escouade **rentre au village** automatiquement),
   - **se bat** toutes les 8 ticks si une créature bloque la route,
   - **remplit la barre CP** du biome (si la faune sur place est trop forte, la progression peut tomber à **zéro** — le niveau est impossible tant que la faune tient).
3. L'escouade s'arrête automatiquement si elle est **K.O.**, si son endurance tombe à 0, ou si sa santé passe sous 20% — il faut la laisser se soigner (régénération ~5% des PV max par jour, dite basée sur les PV max de l'escouade).

**Le vrai prix d'un niveau** : ce n'est pas un achat, c'est le **cumul de chaptitude dépensée** le temps que la barre CP se remplisse.

- Coût par tick : `0.15 × QG^1.7`
- Progression par tick : ce coût × un multiplicateur (entre 1 et 0.75 si ta faune est faible ; **0** si elle est trop forte)
- Taille de la barre du niveau suivant : `100 × (1 + 1.1 × niveauSuivant^1.18 + 0.1 × terrain) × terrain`

---

## 6. Le QG (Quartier Général)

Le bouton « Améliorer le QG » monte le **niveau du camp** :

- **Coût : 250 chaptitude × 1.25^niveau du QG** (250 → 312 → 390 → …) — visible en survolant le bouton lui-même.
- **Effet** : accélère l'exploration — le drain de chaptitude *et* la vitesse de remplissage des barres montent **ensemble** : à haut QG, tu brûles plus de chaptitude par jour mais tu finis un niveau bien plus vite.

*Combo joueur : le Village actif fait +10% par niveau actif au-delà du premier → QG haut + Village activé = progression rapide.*

---

## 7. La faune

Des créatures **patrouillent naturellement** les biomes, que tu y sois ou non (le tooltip montre la créature présente **actuellement** et ses PV).

- **Spawn raisonnable** : ~10% de chance par tick × pénalité du biome. **Le Village ne spawn jamais** de faune.
- **Le combat** : l'escouade et la bête s'échangent des coups toutes les 8 ticks ; la précision dépend de l'**agilité** de chacun.
- **Victoire** : XP pour l'escouade + **ressources aléatoires** du biome (catnip, bois…), un peu plus généreuses aux niveaux élevés.
- **Mort de la faune** : une seule bête à la fois par biome ; ce qui est mort est fauché au tick suivant.

---

## 8. Conseils joueur

- **Stock de chaptitude** avant une grosse expédition : le drain s'arrête à 0 et l'escouade rentre.
- **`+` / `−` comme un volume** : baisse les niveaux actifs si un biome devient trop dur, et re-farme un niveau bas et sûr.
- Un **biome actif** a un niveau de faune calé sur son niveau actif — plus d'actifs = plus de gains, mais plus dur.
- **Le Village est un biome sans faune** (aucune créature n'y spawn) : garder 2+ niveaux actifs accélère toute la Carte, sans risque.

---

## 9. FAQ

- **Pourquoi le `+` ne fait rien ?** → Tu es au max des niveaux activés, ou le biome n'est **jamais exploré** (visible : « Niveaux actifs : 0/0 »).
- **Pourquoi pas le prix des `+/−` ?** → Ils sont gratuits ; seul l'**exploration active** coûte (drain/jour affiché dans le tooltip).
- **Ma bête est énorme et je stagne ?** → Escouade trop faible face au niveau de la faune : améliore le QG, baisse le biome avec `−`, ou laisse se régénérer.
- **Où est le prix du QG ?** → tooltip au survol du bouton **« Améliorer le QG »** (250 → 312…).

---

## Historique (pour mémoire)

- Packs de bugs corrigés sur ce fork : faune infestante au Village (`faunaPenalty` 0 mal interprété), cadavres « 0 HP » (faune NaN sur biome jamais exploré), double régénération des PV, retour automatique de l'escouade à 0 endurance.
- La ligne « Amélioration QG : X chaptitude » avait brièvement figuré dans le tooltip des biomes — supprimée à la demande du joueur (`6adb610c`).

---

**Limites connues :** descriptions et faune de certains biomes (Forest, etc.) sont en anglais et génériques — contenu d'origine non traduit ; l'**exploration spatiale** (SPACE_EXPL) n'existe pas encore dans ce build.
