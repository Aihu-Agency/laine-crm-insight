## Tavoite

Joka arkiaamu klo 07:00 (Suomen aikaa) jokaiselle myyjälle lähtee sähköposti, joka listaa **sen päivän tehtävät** (Airtable Customer Actions, joiden Action Date = tänään ja Completed ≠ Done). Jos myyjällä ei ole tehtäviä, meiliä ei lähetetä — turhaa kohinaa ei tule.

## Lähettäjä

Käytetään Resend-konnektoria osoitteella `Laine Homes CRM <onboarding@resend.dev>`. Toimii välittömästi ilman DNS-säätöä. Voidaan myöhemmin vaihtaa omaan domainiin (esim. `crm@lainehomes.es`) yhdellä rivin muutoksella, jos halutaan ammattimaisempi lähettäjä.

## Toteutus

### 1. Resend-konnektorin liittäminen
Liitetään Resend-konnektori projektiin → tuo `RESEND_API_KEY`-secretin automaattisesti edge functioneille.

### 2. Uusi edge function: `send-daily-task-emails`

Funktio tekee seuraavaa joka kerta kun se ajetaan:

1. Hakee Supabasesta kaikki myyjät (`profiles` + `auth.users` → nimi + sähköposti). Tällä hetkellä 9 käyttäjää, joista oikeasti aktiivisia 5 myyjää (Minna, Pasi, Janne, Sakari, Alisa) + Sales Team -jaettu osoite.
2. Hakee Airtablesta kaikki Customer Actions joissa:
   - `Action Date` = tänään (Europe/Helsinki -aikavyöhyke)
   - `Completed` ≠ "Done"
   - Liitetty asiakkaaseen jonka `Sales person` mätsää myyjän täydellisellä nimellä (case-insensitive, kuten muuallakin järjestelmässä)
3. Ryhmittelee tehtävät myyjittäin
4. Jokaiselle myyjälle joilla on ≥1 tehtävä → lähettää meilin Resendin kautta
5. Logittaa yhteenvedon (kenelle lähti, montako tehtävää, mahdolliset virheet)

**Suojaus:**
- Manuaalinen JWT-tarkistus + admin-rooli (kuten muissa funktioissa) → vain admin voi laukaista käsin
- Cron-kutsut tunnistetaan headerista `x-cron-secret` (uusi secret `CRON_SECRET`), joka ohittaa JWT-vaatimuksen

### 3. Sähköpostin sisältö

Suomenkielinen, brändin värit (deep navy + Mediterranean accent):

```text
Aihe: Päivän tehtävät — keskiviikko 29.4.2026 (5 tehtävää)

Hei Minna,

Sinulla on tänään 5 tehtävää CRM:ssä:

• Soita: Matti Meikäläinen (asiakas #1234)
  → "Sovittu seuraava puhelu — kysy tarjouksen tilannetta"
  
• Lähetä esitys: Anna Virtanen (asiakas #1245)
  → "Costa del Sol -kohteet, 3mh"

[... muut tehtävät ...]

[Avaa CRM →] (linkki https://laine-crm-insight.lovable.app)

---
Tämä on automaattinen aamumuistutus.
```

Linkit asiakkaisiin: jokainen tehtävä klikattavissa suoraan asiakkaan näkymään (`/customer/:id`).

### 4. Cron-aikataulu

Käytetään Supabasen `pg_cron` + `pg_net` -laajennuksia:

- **Aikataulu:** ma–pe klo 07:00 Suomen aikaa
- Postgresin cron toimii UTC:ssä → Suomessa kesäaikaan (EEST, UTC+3) tämä on **04:00 UTC**, talviaikaan (EET, UTC+2) **05:00 UTC**
- Ratkaisu: ajetaan cron klo 04:00 **JA** 05:00 UTC, ja funktio itse tarkistaa Helsinki-ajan — jos kello on jo > 07:30 Helsingissä, ohitetaan (estää tuplasuorituksen aikavyöhykkeenvaihdoksen jälkeen)
- Vaihtoehto: käytetään Suomen tunnin "07:00" lähellä olevaa cronia ja annetaan funktion idempotenssin (tarkistaa onko meili jo lähetetty tänään) hoitaa tuplaesto

**Suositeltu toteutus:** lokitetaan jokainen lähetys uuteen `email_send_log` -tauluun (myyjä, päivä, tila) → estää tuplameilien lähettämisen jos cron triggeröityy kahdesti.

### 5. Uusi tietokantataulu: `email_send_log`

```text
- id (uuid, PK)
- email_type (text, esim. 'daily_tasks')
- recipient_email (text)
- send_date (date)  -- Europe/Helsinki päivä
- task_count (int)
- status (text: 'sent' | 'failed' | 'skipped')
- error_message (text, nullable)
- created_at (timestamptz)
- UNIQUE (email_type, recipient_email, send_date)  -- estää tuplat
```

RLS: vain admin näkee.

### 6. Admin-näkymä Settings-sivulle (kevyt)

Lisätään Settings-sivulle pieni osio "Sähköpostimuistutukset":
- Näyttää viimeisten 7 päivän lähetyshistorian taulukkona
- "Lähetä testimeili nyt" -nappi (laukaisee funktion käsin → lähettää vain itselle, näkyy heti tuleeko meili perille)

## Tekniset yksityiskohdat

**Tiedostot:**
- `supabase/functions/send-daily-task-emails/index.ts` (uusi)
- `supabase/migrations/...` — `email_send_log`-taulu + cron-job
- `src/pages/Settings.tsx` — uusi osio admin-käyttäjille
- Mahdollisesti `src/components/EmailLogTable.tsx` (uusi)

**Secretit:**
- `RESEND_API_KEY` (tulee Resend-konnektorista automaattisesti)
- `CRON_SECRET` (uusi, satunnainen merkkijono cron-kutsujen tunnistukseen)
- Olemassa olevat: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `SUPABASE_*`

**Cron SQL** (lisätään insert-tooliin, ei migraatioon, koska sisältää projektikohtaisia URL/key-arvoja):

```sql
select cron.schedule(
  'daily-task-emails',
  '0 4,5 * * 1-5',  -- 04:00 ja 05:00 UTC, ma-pe
  $$
  select net.http_post(
    url := 'https://lgyapmkpkumydtufsmne.supabase.co/functions/v1/send-daily-task-emails',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Funktion idempotenssi:** ennen jokaista lähetystä tarkistetaan `email_send_log` — jos tämän myyjän daily_tasks-meili on jo lähetetty tänään (Helsinki-päivä), ohitetaan.

## Mitä EI tehdä tässä vaiheessa

- Ei lähetetä myöhästyneitä tai huomisen tehtäviä (vain päivän, sinun toiveen mukaan)
- Ei lähetetä viikonloppuisin
- Ei lähetetä myyjille joilla 0 tehtävää sinä päivänä
- Ei vielä omaa domainia — `onboarding@resend.dev` riittää aluksi
- Ei käyttäjäkohtaista on/off-asetusta (voidaan lisätä myöhemmin tarpeen mukaan)

## Hyväksynnän jälkeen

1. Liitän Resend-konnektorin (sinä saat valita olemassa olevan tai luoda uuden)
2. Luon `email_send_log`-taulun migraatiolla
3. Kirjoitan edge functionin + Settings-näkymän
4. Lisään `CRON_SECRET`-secretin
5. Skeduloin cron-jobin
6. Ajamme yhdessä testimeilin Settings-sivulta varmistaaksemme että meili tulee perille ja näyttää hyvältä