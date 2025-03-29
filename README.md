# Cyber Bricks

**Cyber Bricks** je preprosta igra v slogu klasičnega **Brick breaker** stila, narejena v JavaScript, HTML in CSS. Igralec upravlja ploščico, s katero odbija žogico in podira opeke. Cilj je odstraniti vse opeke, preden žogica pade izven igralnega polja.


## Struktura projekta

- **index.html**  
  Vsebuje osnovno HTML strukturo, `<canvas>`, gumbe za začetek/pavzo igre ter elemente, kjer se prikazujejo rezultati (čas, točke, nivo, najboljši rezultat).  
- **styles.css**  
  Skrbi za slog strani: barve, animiran neon učinek, izgled gumbov in platna.  
- **game.js**  
  Glavna logika igre (risanje, trki, posodabljanje rezultatov, timer itd.).

Projektna mapa bi lahko izgledala takole:


## Navodila za uporabo

1. **Kloni ali prenesi projektne datoteke.** Lahko z ZIP prenosom.
2. **Odpri `index.html` v brskalniku.**  
   - Dvakrat kliknite na `index.html` ali pa ga povlecite v okno brskalnika.
3. Na strani boste videli platno (Canvas), gumbe in prikaz rezultatov.

### Igranje

- **Izbor težavnosti**:  
  Privzeta težavnost je *Srednje*. Lahko jo spremenite v meniju (Lahko, Srednje, Težko).  
  - Možno je spremeniti **samo**, kadar igra **ni v teku** (preden jo začnete ali po porazu).  
- **Začni igro**:  
  Kliknite gumb **Začni igro** – ta se nato skrije. Igra se začne, ploščico premikate s **←** in **→** na tipkovnici.  
- **Pavza**:  
  Gumb **Pavza** zaustavi in nadaljuje dogajanje.  
- **Konec igre (poraz)**:  
  Če žogica pade čez spodnji rob, se prikaže okno z rezultatom. Igra se nato samodejno ponastavi, gumb **Začni igro** se znova prikaže in težavnost je spet mogoče spremeniti.  
- **Nivoji**:  
  Ko očistite vse opeke, greste na naslednji nivo, ki je težji (hitrost žogice se poveča).  
- **High Score**:  
  Najvišji doseženi rezultat se shrani v brskalnik (localStorage).

## Licenca

Ta koda je lahko uporabljena po želji. Za komercialno, odprtokodno ali učno rabo.
