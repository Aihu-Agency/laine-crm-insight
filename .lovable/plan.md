
# Plan — 4 päivitystä

## 1. Sähköpostit tuotantoon (DNS verifioitu)

**Tiedosto:** `supabase/functions/send-daily-task-emails/index.ts`

Muutokset:
- `TEST_MODE = false`
- `FROM_ADDRESS = "Laine Homes CRM <noreply@lainehomes.es>"` (tai mikä lähetysosoite haluat — vahvistetaan kysymyksellä)
- Poistetaan `[TESTI → ...]` -etuliite aiheesta ja `⚠️ TESTITILA` -banneri (logiikka jää koodiin TEST_MODE-flagilla, mutta tuotannossa pois käytöstä)
- `email_send_log.error_message` ei enää sisällä "TEST_MODE: redirected to..." -merkintää onnistuneille lähetyksille

Verifioidaan domain edge function deploy:n jälkeen lähettämällä yksi testimeili Settings-sivun napilla → menee oikealle myyjälle.

## 2. "Enable marketing" -asiakkaiden vienti Mailchimpiin

**Tarkennus tarvitaan** — koodissa ei tällä hetkellä ole **mitään** push-synkronointia Airtablesta Mailchimpiin. Olemassa on vain:
- `import-mailchimp` edge function: lukee CSV:n Mailchimpistä → vie Airtableen
- `Marketing permission` -kenttä Airtablen Customers-taulussa (asetetaan `true` Mailchimp-importissa)

Eli tällä hetkellä asiakkaat, joilla on `Marketing permission = true` Airtablessa, **eivät** päivity automaattisesti Mailchimpin listalle.

Mahdolliset tulkinnat siitä mitä haluat:
- **A)** Rakennetaan **uusi sync**: Airtable → Mailchimp audience (kun Customer luodaan/päivitetään ja `Marketing permission = true`, lisätään/päivitetään Mailchimp subscriber)
- **B)** Vain **manuaalinen export-nappi** Settings-sivulle: "Vie kaikki Marketing permission = true asiakkaat Mailchimpiin" (yksi kertaluonteinen synkka)
- **C)** Tarkoitatko että haluat vain **tarkistaa raportin** nykyisistä asiakkaista joilla lippu on päällä (esim. listanäkymä admin-sivulle), ilman varsinaista Mailchimp-pushia

→ Kysytään tämä `ask_questions`-työkalulla ennen toteutusta. Vaatii myös Mailchimp API -avaimen + audience ID:n setupin.

## 3. Etunimi+sukunimi -haku ei toimi

**Tiedosto:** `src/components/CustomerList.tsx` (rivi `buildFilterFormula`)

**Ongelma:** nykyinen formula etsii hakusanaa **erikseen** `{First name}`- ja `{Last name}` -kentistä. Haku "Pasi Laine" ei löydä mitään koska kumpikaan kenttä yksin ei sisällä koko merkkijonoa.

**Korjaus:** Lisätään yhdistettyyn nimeen kohdistuva haku:
```
OR(
  FIND(LOWER("x"), LOWER({First name})),
  FIND(LOWER("x"), LOWER({Last name})),
  FIND(LOWER("x"), LOWER({First name} & " " & {Last name}))
)
```
Tämä mätsää sekä erilliset nimet että koko nimen.

## 4. Total count "Customers"-näkymään

**Tiedosto:** `src/pages/Customers.tsx`

Nykyään näytetään vain `{resultsCount} customers shown` (= **nykyisen sivun** määrä, max 100). Käyttäjä haluaa **kokonaismäärän** koko tietokannasta.

**Toteutus:** Hyödynnetään olemassa olevaa `customers-all-navigation`-prefetch-queryä (joka hakee jo kaikki asiakkaat navigointia varten):

```tsx
const { data: allCustomers } = useQuery({
  queryKey: ['customers-all-navigation'],
  queryFn: () => airtableApi.getAllCustomers(),
  staleTime: 5 * 60 * 1000,
});

// otsikon viereen pieni teksti:
<h1>Customers <span className="text-sm font-normal text-gray-500">
  ({allCustomers?.length ?? '...'} total)
</span></h1>
```

Ei lisäkutsuja Airtableen — käyttää jo cachetettua dataa.

---

## Tekninen yhteenveto muutoksista

| # | Tiedosto | Muutos |
|---|----------|--------|
| 1 | `supabase/functions/send-daily-task-emails/index.ts` | `TEST_MODE = false`, päivitä `FROM_ADDRESS` |
| 3 | `src/components/CustomerList.tsx` | Lisää koko-nimi-haku `buildFilterFormula`-funktioon |
| 4 | `src/pages/Customers.tsx` | Näytä total count otsikon vieressä |
| 2 | (odottaa selvennystä) | Mailchimp-sync — riippuu valinnasta A/B/C |

---

## Avoimet kysymykset

Ennen toteutusta tarvitaan vastaukset:

1. **Lähetysosoite tuotannossa** — `noreply@lainehomes.es`, `crm@lainehomes.es` vai joku muu?
2. **Mailchimp-toiminto** — tulkinta A, B vai C yllä?
