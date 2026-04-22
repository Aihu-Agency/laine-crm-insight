
## Korjaus: oma Archived-kenttä Airtableen

### Juurisyy
`Is Active?` on formula joka kertoo onko asiakas aktiivisesti etsimässä asuntoa (Active Search Date viim. 3 kk sisällä). Sitä ei voi kirjoittaa, eikä se semanttisesti vastaa arkistointia. Arkistointi = "piilota asiakas listoilta", joka on eri asia kuin hakuaktiivisuus.

### Ratkaisu
Lisätään Airtableen erillinen `Archived`-checkbox-kenttä ja käytetään sitä.

### Vaihe 1 — Tommi lisää Airtableen
Customers-tauluun uusi kenttä:
- **Nimi:** `Archived`
- **Tyyppi:** Checkbox
- **Oletus:** ei rastittu

(Valinnainen: jos halutaan että arkistoidut katoavat myös aktiivisten suodattimista jotka käyttävät `Is Active?`-formulaa, formula voidaan myöhemmin päivittää muotoon `IF({Archived}, "false", <nykyinen logiikka>)`. Ei pakollinen — koodissa suodatamme erikseen.)

### Vaihe 2 — Koodimuutokset

**`src/services/airtableApi.ts`**
- `toggleCustomerArchived(id, archived)` → PATCH `{ Archived: archived }`
- `createCustomer` / `updateCustomer`: poista kaikki `Is Active?` -kirjoitukset (vain luku)

**`src/types/airtable.ts`**
- `AirtableCustomer.fields`: lisää `'Archived'?: boolean`
- `transformAirtableCustomer`: `archived: record.fields['Archived'] === true` (poista nykyinen `Is Active?`-pohjainen johtaminen)

**`src/pages/CustomerView.tsx`**
- Päivitä toast-tekstit viittaamaan "arkistointiin", ei "aktiivisuuteen"
- Säilytä nykyinen UX (navigointi takaisin listaan onnistumisessa)

**Suodattavat näkymät** (Customers, SalesFunnel, Tasks, Dashboard yms.)
- Tarkista että `archived === true` -asiakkaat suodatetaan pois oletusnäkymistä — tämä logiikka on jo olemassa, varmistetaan että se lukee uutta kenttää oikein transformin kautta.

### Vaihe 3 — Verifiointi
- Arkistointi: toast "Asiakas arkistoitu", asiakas katoaa listalta, edge function -loki näyttää `status: 200` ja `sentFields: { Archived: true }`.
- Restore: asiakas palaa listalle.
- `Active Search Date` ja `Is Active?` pysyvät koskemattomina.

### Muutettavat tiedostot
- `src/services/airtableApi.ts`
- `src/types/airtable.ts`
- `src/pages/CustomerView.tsx`

### Toimintajärjestys
1. Tommi lisää `Archived`-checkbox-kentän Airtablen Customers-tauluun.
2. Lovable toteuttaa yllä olevat koodimuutokset.
