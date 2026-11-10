# claude-mods

Mods Claude Code de Fatim.

Installation (une fois par machine) :

    claude plugin marketplace add timasb00/claude-mods
    claude plugin install model-router@claude-mods

Mise à jour : `claude plugin marketplace update claude-mods`.

## equipe

Les sessions se parlent et se répartissent les tâches (tableau partagé dans un dépôt GitHub privé `timasb00/claude-equipe`) :

    claude plugin install equipe@claude-mods

Détails et commandes : `plugins/equipe/README.md`. Test de la logique : `bun plugins/equipe/tests/core.test.ts`.

## vide-cerveau

Tu dictes en vrac, Claude nettoie, organise (décisions, actions, questions, idées) et sauvegarde un fichier réutilisable :

    claude plugin install vide-cerveau@claude-mods

Puis `/vide-cerveau <ta dictée>`. Détails : `plugins/vide-cerveau/README.md`.
