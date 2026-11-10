# vide-cerveau

Tu parles plusieurs minutes sans structure, Claude nettoie (hésitations, répétitions, mots mal dictés), classe en décisions, actions, questions ouvertes et idées par thème, puis sauvegarde un fichier Markdown réutilisable avec un index.

## Utilisation

- `/vide-cerveau <texte dicté>` : colle ta dictée après la commande.
- `/vide-cerveau chemin/vers/notes.txt` : traite un fichier texte.
- `/vide-cerveau liste` : liste les vide-cerveaux sauvegardés.
- `/vide-cerveau relis <sujet>` : retrouve ce que tu avais dit sur un sujet.

Dans l'app Claude (fil de projet), où les commandes `/` ne s'exécutent pas, écris simplement « vide-cerveau : » suivi de ta dictée : le skill se déclenche.

## Dicter

- iPhone : touche micro du clavier, dans le champ de message de l'app Claude.
- Windows : `Win + H` dans le champ de texte, parle, `Win + H` pour arrêter.

Les fichiers audio ne sont pas transcrits par le mod : passe par la dictée.

## Où vont les fichiers

`/mnt/project-files/vide-cerveau/` dans un fil de projet, sinon `CLAUDE ZONE/vide-cerveau/`, sinon `vide-cerveau/` dans le dossier courant. Chaque fichier : `AAAA-MM-JJ-HHMM-titre.md`, plus `INDEX.md`.
