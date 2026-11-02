# model-router

Mod Claude Code qui classe chaque message (type : code, rédaction, analyse, question, conversation ; difficulté par score) et envoie toutes les requêtes du tour au modèle choisi : `haiku` (simple), `sonnet` (courant), `opus` (complexe).

## Mécanisme
- `turn.start` (boucle principale) : classifie le texte, mémorise le niveau pour ce tour.
- `turn.step` : réécrit `model` de chaque requête du tour. Les sous-agents ne sont pas touchés.
- Relance courte (« continue », « ok vas-y ») : garde le niveau du tour précédent.
- Au-delà de 40 messages dans le contexte, Haiku est remplacé par Sonnet.

## Commandes
- `/route` : état et raison du dernier choix.
- `/route auto | hybrid | off | haiku | sonnet | opus` : mode. `hybrid` demande à Haiku d'arbitrer les cas limites (≈ +1 s).
- `/route test <texte>` : montre la décision sans rien envoyer.
- Préfixe `@opus`, `@sonnet`, `@haiku` en début de message : force ce message seulement (le préfixe est retiré).

## Limites
- Changer de modèle entre deux tours invalide le cache de prompt (cache par modèle) : le contexte est relu au prix plein. Sur une longue session, alterner souvent peut coûter plus que rester sur un modèle.
- Heuristique par mots-clés FR/EN : se trompe sur les demandes courtes mais difficiles sans vocabulaire technique.
- Les réglages (mode) sont en mémoire du module : ils reviennent à `auto` à chaque rechargement.
