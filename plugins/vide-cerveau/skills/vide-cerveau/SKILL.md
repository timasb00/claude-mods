---
name: vide-cerveau
description: Transformer une dictée libre et désordonnée (vide-cerveau, brain dump, « je parle en vrac », transcription vocale) en document structuré et sauvegardé (thèmes, décisions, actions, questions ouvertes). À utiliser aussi quand Fatim demande de relire ou retrouver un ancien vide-cerveau.
---

# Vide-cerveau

Fatim parle plusieurs minutes sans structure (dictée vocale iPhone ou Windows, notes en vrac). Ton travail : en tirer un document propre, fidèle, organisé, sauvegardé, que toi ou une autre session Claude pourrez réutiliser plus tard.

## 1. Récupérer l'entrée

- Texte collé dans le message : c'est l'entrée.
- Chemin d'un fichier `.txt` ou `.md` : lis-le.
- Fichier audio : tu ne peux pas l'écouter. Dis-le en une ligne et propose la dictée (micro du clavier iPhone, ou `Win + H` sur Windows dans n'importe quel champ de texte), ou la transcription des Mémos vocaux iPhone copiée-collée.
- Rien du tout : demande-lui de dicter, puis attends.
- `liste` : montre l'index (section 5) et arrête-toi là.
- `relis <sujet>` : cherche dans l'index et les fichiers sauvegardés, résume ce qui a été dit sur ce sujet, avec la date de chaque vide-cerveau cité.

## 2. Nettoyer (sans trahir)

Retire : hésitations (« euh », « bah », « tu vois », « en fait », « du coup » en boucle), faux départs, répétitions, phrases abandonnées, digressions sans contenu.

Corrige : les mots mal transcrits par la dictée quand le sens est évident (ex. « la sait l'hyène » → « La Sahélienne », « à bac » → « ABAC »). Si tu hésites sur un mot, garde ta meilleure lecture suivie de `[?]` et liste-la à la fin.

Interdits :
- Inventer une idée, une décision, une date ou un chiffre absent de la dictée.
- Transformer une hypothèse en décision. « Je pense que peut-être on devrait » reste une idée, pas une décision.
- Lisser ses opinions ou retirer une hésitation qui porte du sens (« je ne suis pas sûre de vouloir… » est une information).
- Les tics d'écriture IA, en particulier les formules « ce n'est pas X, c'est Y » et les définitions par contraste.

Garde son vocabulaire et ses noms propres. Écris toujours « La Sahélienne » avec L et S majuscules.

## 3. Organiser

Classe chaque élément dans une seule catégorie :

- **Décision** : elle a tranché (« on fait », « j'ai décidé », « c'est validé »).
- **Action** : une chose concrète à faire. Note qui (si dit), quand (si dit), sinon rien. Formule avec un verbe à l'infinitif.
- **Question ouverte** : un doute, un choix pas encore fait, une info à trouver.
- **Idée** : le reste, regroupé par thème.

Les thèmes viennent du contenu (ex. « Chantier villa R2 », « Réseaux sociaux », « Devis »), 2 à 7 thèmes, nommés avec ses mots. Si une même idée revient trois fois dans la dictée, c'est souvent ce qui compte le plus pour elle : mets-la en tête de son thème.

## 4. Produire le document

Format exact :

```markdown
---
type: vide-cerveau
date: AAAA-MM-JJ HH:MM
titre: <titre court, 3 à 8 mots>
themes: [<thème 1>, <thème 2>]
---

# <titre>

## En bref
<3 phrases maximum : de quoi elle a parlé et ce qui en ressort>

## Décisions
- <décision>

## Actions
- [ ] <action> (qui, quand si dits)

## Questions ouvertes
- <question>

## Idées par thème
### <thème>
- <idée reformulée proprement, une par ligne>

## À vérifier
- <mot ou passage incertain de la dictée, et ta lecture>

<details><summary>Dictée brute</summary>

<texte original intégral, non modifié>

</details>
```

Une section vide s'écrit `- Aucune`. Garde toujours la dictée brute en bas : elle permet de revenir à la source.

## 5. Sauvegarder

Dossier, dans cet ordre de préférence :
1. `/mnt/project-files/vide-cerveau/` s'il existe `/mnt/project-files/` (fil de projet Claude).
2. `CLAUDE ZONE/vide-cerveau/` si le dossier de travail est ou contient `CLAUDE ZONE`.
3. Sinon `vide-cerveau/` dans le dossier de travail courant.

Nom du fichier : `AAAA-MM-JJ-HHMM-<titre-en-minuscules-avec-tirets>.md`.

Puis mets à jour `INDEX.md` dans le même dossier (crée-le s'il n'existe pas), une ligne par vide-cerveau, le plus récent en haut :

```markdown
- AAAA-MM-JJ — [<titre>](<nom-du-fichier>.md) — thèmes : <thèmes> — <n> actions, <n> questions
```

Sans accès aux fichiers (simple conversation), donne le document dans la réponse et dis-lui qu'il n'a pas été sauvegardé.

## 6. Répondre

Dans la conversation, montre seulement : En bref, Décisions, Actions, Questions ouvertes, et le chemin du fichier sauvegardé. Pas les idées détaillées ni la dictée brute (elles sont dans le fichier). Termine par une seule question si quelque chose bloque vraiment (ex. un mot `[?]` qui change le sens d'une décision), sinon rien.

## Réutilisation

Quand Fatim parle plus tard d'un sujet déjà traité (« ce que j'avais dit sur… », « mes idées pour… »), lis `INDEX.md` puis les fichiers concernés avant de répondre.
