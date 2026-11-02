# equipe

Mod Claude Code qui fait parler tes sessions entre elles : annonce de ce que fait chaque session, messages de l'une à l'autre, répartition des tâches sans doublon. Toutes les sessions (PC, cloud) partagent un tableau stocké dans un dépôt GitHub privé (par défaut `timasb00/claude-equipe`), lu et écrit avec git.

Commandes : `/equipe` (état), `/equipe tache <texte>`, `/equipe prends`, `/equipe fini <id> <résultat>`, `/equipe dis <session|tous> <texte>`, `/equipe lis`, `/equipe nom <nom>`, `/equipe depot <owner/repo>`, `/equipe off`.

Prérequis : git installé et accès au dépôt du tableau. Un message reçu est une information ajoutée au contexte de la session, jamais un ordre. Une session silencieuse depuis 30 minutes est considérée partie et ses tâches redeviennent libres.
