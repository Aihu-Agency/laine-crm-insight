## Tavoite

Joka arkiaamu klo 07:00 (Suomen aikaa) jokaiselle myyjälle lähtee meili, joka listaa **sen päivän tehtävät** (Customer Actions joiden `Action Date` = tänään ja `Completed` ≠ "Done"). Jos myyjällä ei ole tehtäviä, meiliä ei lähetetä.

## Lähetystapa

**Lovable Emails** — sisäänrakennettu Lovable-alustan transaktiomeili-infra:
- Ei vaadi erillistä Resend-tiliä, konnektoria tai API-avainta
- Toimii heti Lovablen testidomainilla
- Oma domain (esim. `crm@lainehomes.es`) voidaan lisätä myöhemmin DNS-verifioinnilla yhdellä klikkauksella

## Toteutusvaiheet

### 1. Lovable Emails -infran scaffoldaus
Käytetään `scaffold_transactional_email`-työkalua, joka:
- Luo valmiin transaktiomeili-edge-functionin pohjan (lähetyslogiikka + secretit)
- Konfiguroi Lovable Emails -infrastruktuurin projektille

### 2. Tietokantataulu `email_send_log` (idempotenssi)

```text
- id (uuid, PK)
- email_type (text, esim. 'daily_tasks')
- recipient_email (text)
- send_date (date, Europe/Helsinki päivä)
- task_count (int)
- status (text: 'sent' | 'failed' | 'skipped')
- error_message (text, nullable)
- created_at (timestamptz)
- UNIQUE (email_type, recipient_email, send_date)
```

RLS: vain admin näkee. Estää tuplameilien lähetyksen jos cron triggeröityy kahdesti aikavyöhykevaihdoksen takia.

### 3. Edge function: `send-daily-task-emails`

Logiikka:
1. Tunnistaa kutsun: cron (header `x-cron-secret`) tai admin-käyttäjä (JWT + `has_role('admin')`)
2. Hakee myyjät Supabasesta (`profiles` + `auth.users` → nimi + sähköposti)
3. Hakee Airtablesta Customer Actions joissa `Action Date` = tänään (Helsinki) ja `Completed` ≠ "Done"
4. Ryhmittelee tehtävät myyjittäin (case-insensitive nimimätsäys, kuten muuallakin järjestelmässä)
5. Tarkistaa `email_send_log` → ohittaa jos tämän päivän meili jo lähetetty
6. Lähettää meilin Lovable Emailsin kautta jokaiselle myyjälle ≥1 tehtävällä
7. Logittaa jokaisen lähetyksen `email_send_log`-tauluun

Tukee myös `?test=true&recipient=email@example.com` -parametria → lähettää vain testimeilin admin-käyttäjälle.

### 4. Sähköpostin sisältö (suomeksi, brändi: deep navy + Mediterranean accent)

```text
Aihe: Päivän tehtävät — keskiviikko 29.4.2026 (5 tehtävää)

Hei Minna,

Sinulla on tänään 5 tehtävää CRM:ssä:

• Soita: Matti Meikäläinen
  → "Sovittu seuraava puhelu — kysy tarjouksen tilannetta"

• Lähetä esitys: Anna Virtanen
  → "Costa del Sol -kohteet, 3mh"

[Avaa CRM →]

---
Tämä on automaattinen aamumuistutus.
```

Jokainen tehtävärivi on klikattava linkki suoraan asiakkaan näkymään (`/customer/:id`).

### 5. Cron-aikataulu (pg_cron + pg_net)

- Ajetaan klo **04:00 ja 05:00 UTC, ma–pe** (kattaa kesä- ja talviajan → Helsinki-aikaan 07:00)
- `email_send_log`-taulun UNIQUE-rajoite estää tuplalähetykset
- Cron-kutsu lähettää `x-cron-secret`-headerin (uusi secret `CRON_SECRET`), jolla edge function tunnistaa cronin

Cron-SQL ajetaan insert-toolilla (sisältää projektikohtaisen URL:n + secretin).

### 6. Settings-näkymän laajennus (admin)

Lisätään Settings-sivulle uusi osio "Sähköpostimuistutukset":
- Viimeisten 7 päivän lähetyshistoria taulukkona (vastaanottaja, päivä, tehtävämäärä, tila)
- "Lähetä testimeili itselleni nyt" -nappi → kutsuu edge functionia testitilassa, vahvistaa että meili tulee perille ja näyttää oikealta

## Mitä EI tehdä

- Ei myöhästyneitä tai tulevia tehtäviä — vain päivän
- Ei viikonloppuisin
- Ei myyjille joilla 0 tehtävää
- Ei vielä omaa domainia — Lovable Emails -testidomain riittää aluksi
- Ei käyttäjäkohtaista on/off-asetusta (lisätään myöhemmin tarpeen mukaan)

## Tekniset yksityiskohdat

**Uudet/muokatut tiedostot:**
- `supabase/functions/send-daily-task-emails/index.ts` (uusi)
- `supabase/migrations/...` — `email_send_log`-taulu + RLS
- `src/pages/Settings.tsx` — uusi "Sähköpostimuistutukset"-osio
- `src/components/EmailLogTable.tsx` (uusi)

**Uudet secretit:**
- `CRON_SECRET` (satunnainen merkkijono cron-tunnistukseen)
- Lovable Emails -secretit tulevat scaffoldista automaattisesti

**Tarkistus käyttöönoton jälkeen:**
Lähetät testimeilin Settings-sivulta → varmistamme että meili tulee perille ja sisältö näyttää hyvältä. Sen jälkeen cron hoitaa loput automaattisesti seuraavasta arkiaamusta alkaen.
