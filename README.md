# A11Y & UX Checker

Extension WordPress (**dossier du plugin** : `adn-a11y-ux-checker` ; fichier principal : `adn-a11y-checker.php`) qui propose des **audits d’accessibilité et d’expérience utilisateur** côté navigateur. Les contrôles s’exécutent en JavaScript (jQuery) sur le DOM de la page courante ; les résultats sont surtout visibles dans la **console développeur** du navigateur.

## Prérequis

- WordPress avec barre d’administration visible.
- Utilisateur **connecté** (les scripts ne sont chargés que dans ce cas).
- jQuery (fourni par WordPress).

## Utilisation

1. Connectez-vous au site.
2. Sur le front-office ou le back-office, ouvrez la barre d’administration WordPress.
3. Cliquez sur **« Analyse a11y & UX »**.
4. Ouvrez la console du navigateur (**F12** → onglet *Console*) pour lire les rapports groupés.

Pour tester la **fermeture d’une modale au clavier** : ouvrez d’abord une modale sur la page, puis lancez l’analyse. Un groupe console dédié envoie une touche **Échap** synthétique (les modales ouvertes peuvent se fermer).

## Architecture du code

| Élément | Rôle |
|--------|------|
| `adn-a11y-checker.php` | Point d’entrée : constantes, autoloader, `Plugin` et `Plugin_Updater`. |
| `autoload.php` | Autoload minimal pour l’espace de noms `AdnA11yChecker`. |
| `includes/class-plugin.php` | Singleton : textdomain `adn-a11y-checker`, nœud de la barre d’admin, enqueue des scripts. |
| `includes/class-plugin-updater.php` | Mises à jour via **Plugin Update Checker** (même bibliothèque que `wp-core`), dépôt **GitHub**. |
| `includes/plugin-update-checker.php` | Bootstrap PUC (`ADN\PluginUpdateChecker\v5`). |
| `includes/plugin-update-checker/` | Sources PUC (v5p0). |
| `assets/js/admin-bar-audit.js` | Au clic : enchaîne les quatre audits sur `body`, puis un **test asynchrone Échap** sur les modales visibles. |
| `assets/js/structure-audit.js` | Plugin jQuery `a11yStructureAudit`. |
| `assets/js/contrast.js` | Plugin jQuery `a11yContrastReport`. |
| `assets/js/forms.js` | Plugin jQuery `a11yFormsReport`. |
| `assets/js/ux-audit.js` | Plugin jQuery `uxAudit`. |

## Liste des fonctionnalités

### Intégration WordPress (PHP)

- Lien **« Analyse a11y & UX »** dans la barre d’administration (`#wpadminbar`, id du nœud : `adn-a11y-audit`).
- Chargement conditionnel des scripts pour les utilisateurs connectés (front et admin).
- Textdomain **`adn-a11y-checker`** pour les chaînes traduisibles.

### Mises à jour depuis GitHub (comme wp-core)

Le plugin embarque **Plugin Update Checker** (PUC, espace de noms `ADN\PluginUpdateChecker`, copie alignée sur `wp-core`). Tant qu’une URL de dépôt est définie, WordPress peut afficher les mises à jour lorsque vous publiez des **releases** (ou tags) sur GitHub.

1. **En-tête du plugin** : champ `GitHub URI` pointant vers le dépôt, par ex. `https://github.com/ORGANISATION/adn-a11y-ux-checker` (déjà présent comme modèle dans `adn-a11y-checker.php`).
2. **Surcharge optionnelle** dans `wp-config.php` : `define( 'ADN_A11Y_CHECKER_GITHUB_REPO', 'https://github.com/ORG/REPO' );`
3. **Dépôt privé** : `define( 'ADN_A11Y_CHECKER_GITHUB_TOKEN', 'ghp_…' );` (jeton avec au minimum lecture du dépôt / releases).
4. **Désactiver** les mises à jour GitHub : `define( 'ADN_A11Y_CHECKER_GITHUB_REPO', '' );` (chaîne vide).

Le slug utilisé côté WordPress est le **nom du dossier** du plugin (`adn-a11y-ux-checker`). Les ZIP de release GitHub doivent décompresser vers un répertoire compatible (voir la doc PUC / structure des releases).

**Hook** : `adn_a11y_checker_update_checker_ready` reçoit l’instance PUC pour appels avancés (`setBranch`, etc.).
**Filtre** : `adn_a11y_checker_github_repository_url` pour remplacer l’URL du dépôt.

### Audit de structure (`a11yStructureAudit`)

- **Document** : attribut `lang` sur `<html>`, présence d’un `<title>` non vide, `meta name="viewport"` (signal informatif).
- **Repères** : un seul `<main>` ; avertissements si `<nav>`, `<header>` ou `<footer>` manquants ; en-têtes / pieds multiples ; nom accessible des `<nav>`.
- **Titres** : absence de `<h1>`, plusieurs `<h1>`, titres vides, sauts de niveau (ex. H2 → H4).
- **Sections** : section sans nom accessible, section vide.
- **Listes** : listes sans `<li>`.
- **ARIA** : `aria-labelledby`, `aria-describedby`, `aria-controls` pointant vers des IDs absents ; `aria-label` vide ou redondant ; rôles vides ou redondants avec le HTML natif.
- **Interactifs** : gestionnaires inline (`onclick`, etc.) ; éléments non sémantiques cliquables.
- **Liens** : liens multiples vers la même URL (hors navigation / ancres).
- **Contenu** : texte direct dans des blocs ; gros liens / cartes cliquables (heuristiques).
- **IDs** : IDs dupliqués.
- **Focus** : `tabindex` positif ; éléments focalisables dans un conteneur `aria-hidden="true"`.
- **Noms accessibles** : contrôles natifs sans nom accessible visible.
- **Images** : `<img>` sans attribut `alt`.
- **SVG** : graphique potentiellement informatif sans nom accessible (`title`, `aria-label`, `aria-labelledby`, ou masqué avec `aria-hidden` / `role="presentation"`).
- **Tableaux** : absence de `<th>` ; grands tableaux sans `<caption>` (info).
- **Liens d’évitement** : ancre type « skip » — cible du fragment absente ou présente (info / avertissement).
- **Dialogues** : `role="dialog"` / `alertdialog` sans nom accessible ; absence de `aria-modal` (info).
- **Clavier** : sous-arbre `[inert]` contenant encore des contrôles visibles focalisables (heuristique).

Les options jQuery (toutes activées par défaut sauf mention) incluent notamment : `checkDocumentLang`, `checkDocumentTitle`, `checkMetaViewport`, `checkImages`, `checkSvg`, `checkTables`, `checkSkipLinks`, `checkDialogSemantics`, etc.

### Test modale × Échap (`admin-bar-audit.js`)

Après les audits synchrones, recherche des **modales visibles** (`role="dialog"`, `role="alertdialog"`, `aria-modal="true"`, classes fréquentes `.modal.show` / `.is-active` / `.is-open`). Pour chacune : focus sur un contrôle interne, envoi d’événements clavier **Escape** synthétiques, puis contrôle de la visibilité après un court délai. Les messages associés sont en **français** dans la console. **Attention** : les modales ouvertes peuvent se fermer.

### Audit de contraste (`a11yContrastReport`)

- Calcul du **rapport de contraste** texte / fond (seuils configurables : **A**, **AA**, **AAA**).
- Prise en compte de la **taille** et du **gras** du texte (grand texte vs texte normal).
- Signalement de cas limites : transparence, icônes seules, risques de visibilité au focus, etc.
- Option d’**ignorer** certains sélecteurs (`ignore`, `ignoreDescendants`).

### Audit de formulaires (`a11yFormsReport`)

- **Suivi d’exécution** (optionnel) : focus, soumission, observer sur attributs pour certains signaux.
- **Formulaire** : surcharge de champs `required`, ambiguïté des boutons d’envoi, formulaires multi-étapes peu clairs, état de chargement.
- **Champs** : `id` / `name` manquants, absence de `<label>`, label masqué, placeholder utilisé comme seul libellé, cohérence type / nom, `autocomplete`, indicateurs `required` / `aria-*`, `aria-describedby` cassé, champs invisibles mais encore focalisables.
- **Groupes** : radios / cases sans `fieldset` / `legend`.
- **Navigation clavier** : `tabindex` &gt; 0.
- **Aide** : blocs `.help`, `.error`, etc. sans `id` pour liaison.
- **Erreurs dynamiques** : champs en `aria-invalid="true"` sans zone `[aria-live]` ni `[role="alert"]` dans le formulaire (heuristique).

### Audit UX (`uxAudit`)

- **Clics** : éléments rendus cliquables sans sémantique ni rôle approprié.
- **Imbrication** : interactifs imbriqués (risque de conflit de clic).
- **Navigation** : densité des entrées de premier niveau, profondeur du menu.
- **CTA** : densité par section, surcharge d’éléments interactifs, répétition de libellés de CTA.
- **Cibles** : taille minimale des zones cliquables (réglable).
- **UI** : éléments stylés comme boutons sans être de vrais contrôles.
- **Densité** : sections / articles avec forte densité de liens (signal « pattern »).
- **Viewport** : trop d’éléments interactifs dans la zone visible initiale.
- **Hiérarchie** : sections avec beaucoup de CTA mais sans titres.
- **Liens nouvel onglet** : `target="_blank"` sans `rel` contenant `noopener`.
- **Libellés de liens** : textes génériques ambigus (FR/EN, motif « pattern »).

## Sortie des audits

Par défaut, chaque module journalise dans la console avec `console.group`. Les messages des plugins jQuery sont surtout en **anglais** ; le groupe **« MODAL × ÉCHAP »** est en **français**.

## Développement

- **Version** : voir `ADN_A11Y_CHECKER_VERSION` dans `adn-a11y-checker.php`.
- Dossier des traductions attendu : `languages/` (relatif au plugin).
