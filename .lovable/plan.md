## Tavoite

Tuoda puuttuvat Mailchimp-asiakkaat Airtableen oikealla myyjällä ja puhelinnumerolla, käyttämällä olemassa olevaa `import-mailchimp` -edge functionia. Ei koodimuutoksia.

## Datan tila (varmistettu lataamillasi tiedostoilla)

- Pipedrive: 7 755 riviä, 7 400 unique sähköpostia
- Mailchimp: 3 176 tilaajaa
- 3 135 sähköpostia löytyy molemmista (98,7 % matchaa)
- 41 Mailchimpin tilaajaa puuttuu Pipedrivestä → menevät Sales Teamille
- Kaikki neljä Pasin mainitsemaa asiakasta löytyivät Pipedrivestä omistajatietoineen

## Vaiheet

### Vaihe 1 — Yhdistä CSV:t (kertaluonteinen Python-skripti)

Skripti `/tmp/merge.py`:
1. Lukee `pipedrive.csv` ja `mailchimp.csv`
2. Indeksoi Pipedriven rivit kaikkien kolmen email-sarakkeen perusteella (case-insensitive)
3. Käy läpi jokaisen Mailchimp-rivin ja lisää:
   - `Phone Number` ← Pipedriven mobiili → koti → työ (ensimmäinen löytyvä), siivottuna ('+'-merkki säilytetään, etu-`'` poistetaan)
   - `Sales_Rep` ← Pipedriven `Person - Owner` (jos löytyy match)
   - `Match_Method` ← `no_match` (jotta `onlyNewLeads=true` tuo rivin)
4. Tallentaa `/mnt/documents/mailchimp_merged.csv`
5. Tulostaa raportin: kuinka moni sai Sales_Repin, jakauma myyjittäin, kuinka monta menee Sales Teamille

### Vaihe 2 — Sinä lataat CSV:n importista

Settings → Import Clients (Mailchimp) -näkymässä:
- Lataa `mailchimp_merged.csv`
- `skipDuplicates=true` (oletus) → 3 135 jo Airtablessa olevaa skipataan
- `onlyNewLeads=true` (oletus) → vain uudet tuodaan

Tulos: ainoastaan ne Mailchimp-tilaajat joita ei vielä ole Airtablessa lisätään, ja ne saavat Pipedriven mukaisen myyjän (tai Sales Teamin jos myyjä ei ole `SALES_REP_MAP`-taulussa tai puuttuu kokonaan).

### Vaihe 3 — Jatkotoimet importin jälkeen

- Tarkista Customers-näkymästä että neljä mainittua asiakasta (Mika Palmu, Jukka Kilpi, Karoliina Konola, Soili Lehtiniemi) ovat tulleet
- Sales Teamille päätyneet voi jakaa myöhemmin käsin tarpeen mukaan

## Tekninen yhteenveto

```text
pipedrive.csv (7755)  ─┐
                       ├──> merge.py ──> mailchimp_merged.csv (3176 riviä)
mailchimp.csv (3176)  ─┘                  - Sales_Rep + Phone Pipedrivestä
                                          - Match_Method = no_match
                                          
                              ────> import-mailchimp edge function
                                    - skipDuplicates → vain uudet tuodaan
                                    - oikea myyjä SALES_REP_MAP:n mukaan
                                    - tuntemattomat omistajat → Sales Team
```

`SALES_REP_MAP`-taulua ei muuteta: Kari Hakuli, Päivi Siggberg, Joonas Nurmela ym. menevät Sales Teamille (sinun päätös).

## Mitä tapahtuu hyväksynnän jälkeen

Ajan skriptin, tuotan `mailchimp_merged.csv`-tiedoston `presentation-artifact`-tagina ladattavaksi, ja annan tarkan raportin: montako uutta asiakasta löytyy, jakauma myyjittäin, ja vahvistus että neljä mainittua asiakasta ovat mukana oikealla myyjällä.
