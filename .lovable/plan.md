## Tavoite

Päivittää Airtableen juuri importoiduille Mailchimp-asiakkaille puuttuvat sukunimet (ja samalla siistiä etunimet) käyttämällä Pipedrive-CSV:tä lähteenä emailin perusteella. Ei kosketa muita Airtable-kenttiä eikä muita asiakkaita.

## Lähtötilanne

- Pipedrive-CSV: 7 755 riviä, 7 395 emailia, **5 091 riviä joissa on sekä email että sukunimi** → tämä on korjauspotentiaali
- Juuri importatuissa Mailchimp-asiakkaissa ~94 % puuttui sukunimi (esim. Jukka Kilpi tuli muodossa "Jukka")
- Asiakas on löydettävissä Airtablesta emailin perusteella

## Toteutus

### Vaihe 1 — Kertaluonteinen Node-skripti (ajetaan sandboxissa, ei lisätä koodikantaan)

Skripti tekee:

1. Lukee Pipedrive-CSV:n ja rakentaa hakemiston:
   `email (lowercase) → { firstName, lastName }` kaikille Pipedrive-riveille joilla on sekä email että sukunimi
2. Hakee Airtablesta kaikki Customers-rivit jotka täyttävät:
   - On email
   - **Last name on tyhjä** (eli vain ne joita pitää korjata)
3. Jokaiselle riville:
   - Etsii emailin Pipedrive-hakemistosta
   - Jos löytyy → päivittää Airtable-rivin: `First name` ja `Last name` Pipedriven mukaisiksi
   - Jos ei löydy → ohitetaan (jää käsin korjattavaksi tai myöhempään)
4. Käyttää Airtablen batch-PATCH-rajapintaa (10 riviä / pyyntö, 200 ms tauko)
5. Tulostaa raportin: kuinka moni päivitettiin, kuinka moni jäi ilman matchia, lista käsin korjattavista

Skripti käyttää sandboxissa olevia secrettejä `AIRTABLE_API_KEY` ja `AIRTABLE_BASE_ID` (jo konfiguroitu).

### Vaihe 2 — Raportti

Tuotan `/mnt/documents/lastname_fix_report.csv`:n jossa kaikki ne emailit joille **ei** löytynyt sukunimeä Pipedrivestä → voit käydä ne läpi käsin (ne ovat puhtaita Mailchimp-tilaajia ilman Pipedrive-historiaa).

## Turvallisuus

- Päivitetään VAIN niitä rivejä joilla `Last name` on tyhjä → ei voi rikkoa olemassa olevia oikeita sukunimiä
- Päivitetään VAIN `First name` ja `Last name` -kentät → muut tiedot (myyjä, puhelin, notes) pysyvät koskemattomina
- Ei luoda tai poisteta yhtään riviä

## Mitä tapahtuu hyväksynnän jälkeen

1. Ajan skriptin sandboxissa
2. Annan raportin: X päivitettyä, Y ilman matchia
3. Toimitan käsin-korjattavien CSV:n `presentation-artifact`-tagina

Ei koodimuutoksia projektiin. Ei migraatioita. Ei edge function -muutoksia.
