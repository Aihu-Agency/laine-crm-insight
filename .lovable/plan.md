
## Korjaussuunnitelma: Asiakkaan arkistointi + Asuntoehdotusten poisto

### 1. Asiakkaan arkistointi (ei kovaa poistoa)

**Nykytilanne:**
- `CustomerView`-sivulla on **Archive/Restore**-painike, joka vaihtaa Airtablen `Archived`-checkboxia.
- Arkistoidut suodatetaan pois Customers-, Sales Funnel- ja Tasks-näkymistä.

**Ongelma:**
Käyttäjä raportoi että "ei toimi". Mahdolliset syyt:
- Painikkeen klikkaus ei päivitä UI:ta välittömästi (cache-ongelma)
- Airtable-kutsu epäonnistuu hiljaa ilman näkyvää virheilmoitusta
- Lista-näkymä ei refreshaa arkistointitoiminnon jälkeen

**Korjaukset:**
1. Lisää näkyvä toast-ilmoitus onnistuneelle/epäonnistuneelle arkistoinnille.
2. Invalidate React Query cache laajemmin (`['customer', id]`, `['customers-funnel']`, `['customers-page']`, `['customers-all']`, `['customers-all-navigation']`) jotta asiakas katoaa listalta heti.
3. Navigoi takaisin asiakaslistaan onnistuneen arkistoinnin jälkeen.
4. Lokita virheet konsoliin debuggausta varten.

**Ei lisätä Delete-painiketta** — arkistointi on ainoa poistotapa, jotta asiakkaan historia ja linkitykset säilyvät.

### 2. Asuntoehdotusten poisto — vain UI-tekstien selvennys

**Nykytilanne:**
- Roskakori-painike ehdotuslistassa **ei poista** Property-tietuetta Airtablesta — se vain poistaa property ID:n asiakkaan `Properties`-linkkikentästä (unlink).

**Tuleeko uusia tilalle?**
Kyllä — n8n-scraperit (Laine Homes + Idealista) luovat uusia Property-tietueita ja linkittävät ne automaattisesti sopiviin asiakkaisiin areas of interest + active search date -matchillä. Sama asunto ei palaa unlinkkauksen jälkeen, mutta uusia eri asuntoja tulee scraperien löytäessä niitä.

**UI-selvennykset:**
1. Vaihda hover-tooltip roskakori-napissa: "Poista ehdotus tältä asiakkaalta (asunto säilyy tietokannassa)".
2. Päivitä confirm-dialogin teksti: "Poistetaanko tämä asunto asiakkaan ehdotuksista? Asunto säilyy järjestelmässä, ei näy enää tällä asiakkaalla. Uusia ehdotuksia tulee automaattisesti kun n8n-scraper löytää uusia kohteita."

### 3. Yhteenveto Tommille

- **Arkistointi** → korjataan toast + cache-invalidointi + auto-navigaatio listalle.
- **Ehdotusten roskakori** → unlinkkaa vain (ei poista tietuetta). Sama asunto ei palaa, mutta uusia kohteita tulee automaattisesti scraperin kautta. UI-tekstit selvennetään.

### Muutettavat tiedostot

- `src/pages/CustomerView.tsx` — toast-ilmoitukset arkistoinnille, parempi cache-invalidointi, auto-navigaatio, selvennä unlink-confirm-teksti ja tooltip.
