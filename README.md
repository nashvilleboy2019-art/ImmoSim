# ImmoSim 📱🏠

Application mobile (Android / iOS / Web) qui reprend le simulateur Excel
`simulation_achat_maison_RAV_budget_courant.xlsx` et le rend utilisable
facilement par tout le monde.

Elle calcule en temps réel, à partir de vos saisies :

1. **Capacité d'emprunt** — frais de notaire, PTZ, mensualité du prêt, capacité
   d'endettement HCSF (35 %), décote des loyers, verdict « finançable / alerte »,
   et prix maximal finançable.
2. **Reste à vivre** — salaires nets avant/après impôt sur le revenu (barème
   progressif, parts, demi-part enfant plafonnée), apport net des locations,
   reste à vivre consolidé, puis budget courant détaillé → reste réellement libre.
3. **Fiscalité location** — pour chaque bien : comparaison **location nue**
   (micro-foncier / réel) vs **LMNP micro-BIC** vs **LMNP réel simplifié**
   (charges + amortissements), IR + prélèvements sociaux, cash net mensuel, et
   suggestion du meilleur régime.
4. **Patrimoine net** — liquidités, placements, immobilier, dettes.

Toutes les données sont **enregistrées localement** sur l'appareil
(AsyncStorage) — rien n'est envoyé en ligne.

## Lancer l'application

> ⚠️ Le réseau de cette machine nécessite `--use-system-ca` pour npm/Expo.
> Si vous voyez `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, préfixez vos commandes par
> `NODE_OPTIONS="--use-system-ca"` (déjà inclus ci-dessous).

### Sur votre téléphone Android (le plus simple, sans rien installer)

1. Installez **Expo Go** depuis le Play Store sur votre téléphone.
2. Sur l'ordinateur :
   ```bash
   cd ImmoSim
   NODE_OPTIONS="--use-system-ca" npx expo start
   ```
3. Scannez le QR code affiché avec l'app Expo Go. L'app se charge sur le
   téléphone et se recharge à chaque modification du code.

### Aperçu rapide dans le navigateur

```bash
cd ImmoSim
NODE_OPTIONS="--use-system-ca" npx expo start --web
```

### Générer un APK Android installable (build cloud, gratuit)

Aucun SDK Android local n'est requis : le build se fait sur les serveurs Expo.

```bash
cd ImmoSim
npm install -g eas-cli                     # une seule fois
eas login                                  # compte Expo gratuit
eas build -p android --profile preview     # produit un .apk téléchargeable
```

(Le profil `preview` génère un APK directement installable ; `production`
génère un `.aab` pour le Play Store.)

## Architecture

```
src/
  domain/          ← moteur de calcul TypeScript PUR (aucune dépendance UI)
    types.ts          modèle de données (entrées)
    defaults.ts       valeurs par défaut (exemple repris de l'Excel)
    finance.ts        PMT et utilitaires
    loan.ts           capacité d'emprunt (onglet Synthese)
    incomeTax.ts      barème IR progressif
    rentalTax.ts      fiscalité location, 3 régimes (Hypotheses/Detail/Synthese locations)
    rav.ts            reste à vivre consolidé avant/après impôts
    budget.ts         budget courant → reste libre
    patrimoine.ts     patrimoine net
    index.ts          computeAll() — agrège tout
    __verify.ts       contrôle des résultats face aux valeurs de l'Excel
  store/           ← état global Zustand + persistance AsyncStorage
  theme/           ← design tokens (couleurs clair/sombre, formatage €/%)
  components/ui.tsx← bibliothèque de composants (Card, NumberField, Row, …)
  app/             ← écrans (expo-router) : index, emprunt, reste-a-vivre,
                     fiscalite, patrimoine, parametres
```

Le moteur de calcul a été validé : `src/domain/__verify.ts` reproduit
**à l'identique** les chiffres de l'Excel (mensualité, capacité, fiscalité par
régime, reste à vivre, reste libre final).

Pour relancer la vérification :

```bash
NODE_OPTIONS="--use-system-ca" npx esbuild src/domain/__verify.ts --bundle --platform=node --outfile=verify.cjs && node verify.cjs
```

## Avertissement

Outil d'estimation à but pédagogique. Le barème IR est une approximation
indicative et la fiscalité LMNP dépend fortement des charges/amortissements
saisis. Ne remplace pas un conseil bancaire, comptable ou fiscal.
