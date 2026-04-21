
## Korjaussuunnitelma: arkistoinnin virheilmoitus

### Todennäköinen ongelma
Asuntoehdotusten poisto toimii, joten yleinen PATCH-polku ei ole täysin rikki. Arkistointi kulkee saman `updateCustomer`-reitin kautta, mutta juuri `Archived`-kentän päivitys näyttää kaatuvan Airtablen puolella. Lisäksi frontend näyttää nyt liian geneerisen virheen: `Edge Function returned a non-2xx status code`, joten varsinainen Airtable-syy jää piiloon.

### Mitä korjataan

#### 1) Tee virhesyystä näkyvä oikea tieto
Päivitä `src/services/airtableApi.ts` niin, että `makeRequest()` purkaa myös non-2xx edge function -vastauksen rungon ja näyttää Airtablen oikean virheen eikä pelkkää geneeristä Supabase-viestiä.

Tavoite:
- toastiin saadaan esim. `INVALID_VALUE_FOR_COLUMN`, `cannot update field`, `permission denied` tms.
- debuggaus helpottuu heti ilman arvaamista

#### 2) Lisää tarkempi lokitus edge functioniin
Päivitä `supabase/functions/airtable-proxy/index.ts` niin, että customer PATCH -haara loggaa:
- customerId
- lähetetyt kentät
- Airtablen statuskoodi
- Airtablen virherunko

Tavoite:
- nähdään varmasti hylkääkö Airtable juuri `Archived`-kentän
- varmistetaan onko kyse kentän nimestä, kenttätyypistä tai Airtable-oikeuksista

#### 3) Tee arkistoinnista oma suojattu polku
Päivitä `src/services/airtableApi.ts` lisäämällä erillinen metodi tyyliin `toggleCustomerArchived(id, archived)`.

Tässä metodissa:
- lähetetään vain `{ Archived: true/false }`
- ei lähetetä mitään muita customer-kenttiä samalla
- jos Airtable palauttaa virheen, se heitetään eteenpäin mahdollisimman sellaisenaan

Tavoite:
- rajataan ongelma vain yhteen kenttään
- vältetään sivuvaikutukset yleisestä `updateCustomer()`-mappingista

#### 4) Kytke CustomerView käyttämään erillistä arkistointimetodia
Päivitä `src/pages/CustomerView.tsx`:
- `handleArchiveToggle()` käyttää uutta dedikoitua arkistointimetodia
- säilytä jo lisätyt cache-invalidoinnit
- säilytä toastit ja navigointi takaisin listaan onnistumisessa
- virhetoast näyttää käyttäjälle oikean syyn siistityssä muodossa
- `console.error` jätetään talteen debuggausta varten

#### 5) Lisää fallback käyttäjäystävälliseen virhetekstiin
Jos Airtable palauttaa edelleen epäselvän virheen, näytä toastissa:
- otsikko: `Arkistointi epäonnistui`
- kuvaus: `Airtable hylkäsi Archived-kentän päivityksen. Tarkistan kentän oikeudet / asetukset.`

Tavoite:
- Tommi ei näe enää epämääräistä “non-2xx status code” -tekstiä

### Todennäköisin juurisyy, joka varmistetaan toteutuksessa
Näkyvän koodin perusteella todennäköisimmät vaihtoehdot ovat:
1. Airtablen `Archived`-kenttä ei hyväksy PATCHia odotetussa muodossa
2. kentän nimi/tyyppi ei vastaa oletusta
3. Airtable-tokenilla ei ole oikeutta päivittää kyseistä kenttää
4. edge function palauttaa kyllä tarkemman virheen, mutta frontend hukkaa sen

### Muutettavat tiedostot
- `src/services/airtableApi.ts` — parempi virhepurku + erillinen arkistointimetodi
- `src/pages/CustomerView.tsx` — käytä dedikoitua arkistointimetodia, pidä nykyinen UX
- `supabase/functions/airtable-proxy/index.ts` — tarkempi PATCH-lokitus ja virheen välitys

### Lopputulos
Kun tämä tehdään:
- arkistointi joko toimii oikein
- tai jos Airtable estää sen, toast kertoo oikean syyn eikä geneeristä edge function -virhettä
- samalla jää pysyvämpi, helpommin debuggattava toteutus arkistoinnille
