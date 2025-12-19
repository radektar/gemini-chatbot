## Use Cases — Gemini + Monday Chatbot (MVP → 1.1)

Ten dokument opisuje kluczowe scenariusze użycia (use cases) dla systemu opisanego w `docs/PROJECT_SPEC.md`. Celem jest ujednolicenie oczekiwań biznesowych, kryteriów akceptacji i wymagań technicznych (w tym skalowania kontekstu i bezpieczeństwa) przed implementacją.

### Zakres i założenia

- **Kanał**: webowy chat (Next.js) z opcjonalnym trybem „guided” (Live navigator).
- **Integracje**: Monday.com przez MCP (preferencyjnie read‑only), lokalny/hostowany ImpactLog, opcjonalnie Slack/HubSpot i web search w iteracjach późniejszych.
- **Zasada jakości**: system nie może „wymyślać” faktów — wszystkie kluczowe liczby/tezy muszą mieć wskazane źródło (rekord/link) lub zostać oznaczone jako „do potwierdzenia”.
- **Skalowanie kontekstu**: jeśli materiał jest za duży, system stosuje politykę z `PROJECT_SPEC.md` (budżet tokenów, selekcja, RAG, kompresja; brak „dumpowania” dużych tabel do promptu).

### Definicje (skrót)

- **Projekt**: rekord w Monday (item) reprezentujący inicjatywę/program.
- **Deal/Donor/Partner**: rekord (np. Monday/HubSpot) opisujący relację fundraising/sprzedaż/partnerstwo.
- **ImpactLog**: źródło insightów/wniosków (np. notatki, transkrypcje, manualnie wydobyte fakty), które powinny linkować do źródeł lub mieć status weryfikacji.

### Wspólne wymagania niefunkcjonalne (dla wszystkich use case’ów)

- **Bezpieczeństwo i uprawnienia**:
  - Integracje **read‑only** tam, gdzie to możliwe (szczególnie Monday/MCP).
  - Whitelist narzędzi + blokada operacji write (create/update/delete) na kilku warstwach.
  - Ograniczenie do dozwolonych boardów (sandbox/test w pilocie), jeśli wymagane.
- **Audytowalność i źródła**:
  - Każdy output typu „liczba/metryka/istotne twierdzenie” ma mieć **źródło**: link/ID rekordu/kolumny.
  - Jeśli źródeł brak: output ma zawierać sekcję „Braki danych / do potwierdzenia”.
- **Skalowanie kontekstu**:
  - Duże tabele/listy: paginacja + agregacja + selekcja pól przed wstrzyknięciem do promptu.
  - RAG/Top‑K: do promptu trafiają wyłącznie najbardziej relewantne fragmenty.
- **Jakość i halucynacje**:
  - Rozdzielenie: „co wiemy z danych” vs „proponowana narracja”.
  - Mechanizm „stop & ask”: jeśli brakuje krytycznych pól, system dopytuje użytkownika zamiast dopowiadać.
- **Observability (MVP)**:
  - Logowanie: zapytanie → plan → użyte narzędzia → liczba wyników → token budget decisions → output.
  - Metryki: skuteczność wyszukiwania (hit rate), „brak danych”, czas do odpowiedzi, odsetek elementów „do potwierdzenia”.

## UC‑01 — Szybkie znalezienie i przygotowanie historii projektu (deal enablement)

### Opis

Użytkownik (np. account manager / osoba prowadząca deal) ma spotkanie z potencjalnym partnerem/donorem i potrzebuje szybko znaleźć projekt(y) z bazy (Monday/ImpactLog) odpowiadające danej geografii i tematyce oraz wygenerować angażującą narrację (3–5 akapitów) do maila/pitchu.

### Cel

Dostarczyć gotowy, spójny, atrakcyjny opis projektu, który pomoże „dopchnąć” deal.

### Aktorzy

- **Primary**: account manager / fundraiser.
- **Secondary**: PM/impact owner (weryfikacja danych), admin (konfiguracja pól).

### Źródła danych

- **Monday**: projekty, tablice, deals (read‑only).
- **ImpactLog**: wydobyte insighty, cytaty, osiągnięcia, learnings.
- **Materiały zapisane**: case studies, wideo (opcjonalnie).
- **Zewnętrzne źródła rynku**: opcjonalnie w późniejszych iteracjach.

### Ograniczenia / ryzyka

- **Brak ustrukturyzowanych danych o donorze** w Monday (często).
- **Halucynacje**: LLM może wygenerować nieprecyzyjne/nieprawdziwe stwierdzenia (zwłaszcza metryki).
- **Bezpieczeństwo**: ryzyko ujawnienia danych wrażliwych; konieczne scope i audyt.
- **Skala danych**: duża liczba projektów/kolumn → konieczny RAG/filtering.

### Przebieg (happy path)

- **Krok 1 (intake)**: użytkownik podaje geografie, temat, odbiorcę (donor/partner), opcjonalnie format (mail/pitch).
- **Krok 2 (retrieval)**: system wyszukuje projekty po polach (geografia/tags/status) + semantycznie (opis/ImpactLog).
- **Krok 3 (ranking)**: system zwraca shortlistę 3–5 projektów z krótkim uzasadnieniem dopasowania.
- **Krok 4 (narracja)**: po wyborze (lub auto‑wyborze top‑1) system generuje 3–5 akapitów storytellingu + 3–5 kluczowych punktów z **potwierdzonym źródłem** (link/rekord).
- **Krok 5 (review)**: system oznacza elementy „do potwierdzenia”, jeśli dane są niepełne, oraz proponuje pytania doprecyzowujące.

### Output (MVP)

- **Lista projektów**: 3–5 wyników albo „brak trafnych wyników”.
- **Storytelling**: 1–3 paragrafy (MVP) lub 3–5 akapitów (docelowo) opartych na danych.
- **Key points**: 3–5 punktów z linkiem do źródła (rekord/kolumna/ImpactLog entry).
- **Braki danych / do potwierdzenia**: lista brakujących pól lub tez wymagających weryfikacji.

### Kryteria akceptacji (MVP)

- System zwraca **3–5 trafnych projektów** dla zapytania; jeśli brak — zwraca **„brak trafnych wyników”**.
- Generuje **1–3 paragrafy** narracji opartej na danych z projektu.
- Zwraca **3–5 bulletów** z kluczowymi punktami i **potwierdzonym źródłem** (link/rekord).

### Priorytet

**WYSOKI** (bezpośrednia wartość dla sprzedaży/fundraisingu).

### Plan-first: pytania doprecyzowujące (MVP)

System buduje ukryty kontrakt wejścia i prezentuje użytkownikowi plan przed uruchomieniem wyszukiwania. Pytania zadawane są tylko dla brakujących must-have slotów (slot filling bez UI).

**Kolejność pytań:**

1. **Geografia** (must-have)
   - *Cel:* Określenie regionu/kraju dla filtrowania projektów
   - *Pytanie:* „Jaki region/kraj Cię interesuje? (np. Kenia, Uganda, Afryka Wschodnia, globalne)”
   - *Domyślne:* Jeśli użytkownik podał w promptcie → pomiń
   - *Fallback:* Jeśli brak → zapytaj; jeśli nieokreślone → „globalne”

2. **Tematyka/Tagi** (must-have)
   - *Cel:* Określenie obszaru tematycznego (edukacja, zdrowie, klimat, itp.)
   - *Pytanie:* „Jaki obszar tematyczny Cię interesuje? (np. edukacja, zdrowie, zmiany klimatu, równość płci)”
   - *Domyślne:* Jeśli użytkownik podał w promptcie → pomiń
   - *Fallback:* Jeśli brak → zapytaj; jeśli wieloznaczne → zaproponuj top‑3 opcje

3. **Typ odbiorcy** (must-have)
   - *Cel:* Dopasowanie tonu i treści do typu odbiorcy (donor vs partner vs wewnętrzny)
   - *Pytanie:* „Dla kogo przygotowujesz materiał? (donor/fundraiser, partner strategiczny, wewnętrzny raport)”
   - *Domyślne:* Jeśli użytkownik podał w promptcie → pomiń
   - *Fallback:* Jeśli brak → „donor/fundraiser”

4. **Horyzont czasowy** (optional, ale rekomendowane)
   - *Cel:* Określenie, czy interesują tylko aktywne projekty czy też historyczne
   - *Pytanie:* „Jaki okres Cię interesuje? (aktywne projekty, ostatnie 12 miesięcy, wszystkie dostępne)”
   - *Domyślne:* „aktywne projekty + ostatnie 12 miesięcy”

5. **Format outputu** (optional)
   - *Cel:* Dopasowanie długości i struktury narracji
   - *Pytanie:* „Jaki format potrzebujesz? (krótki pitch 1–2 akapity, pełna historia 3–5 akapitów, lista bulletów)”
   - *Domyślne:* „pełna historia 3–5 akapitów”

6. **Kontekst spotkania** (optional, ale poprawia jakość)
   - *Cel:* Zrozumienie celu spotkania dla lepszego dopasowania treści
   - *Pytanie:* „Jaki jest cel spotkania? (pierwsze spotkanie, follow-up, pitch grantowy, raport roczny)”
   - *Domyślne:* Jeśli brak → pomiń

**Reguła pomijania:** Jeśli użytkownik podał informację w początkowym promptcie, system ekstraktuje ją i pomija odpowiednie pytanie.

### Next steps techniczne

- **Minimalny zestaw pól w Monday**: geografia, tagi tematyczne, status, owner, daty, metryki impactu, linki do materiałów.
- **Reguły filtrowania + fallback**: „jeśli brak danych, zapytaj użytkownika o X”.
- **Mechanizm evidence**: każdy bullet musi zawierać źródło lub flagę „do potwierdzenia”.

## UC‑02 — Ad‑hoc search / reporting (wyszukiwanie informacji operacyjnych w bazie)

### Opis

Użytkownik zadaje szczegółowe zapytanie („ile projektów w X, jaki był progres do celu w Y?”) i chce szybkie, tabelaryczne/wylistowane odpowiedzi bazujące na istniejących rekordach i metrykach.

### Cel

Szybkie odpowiedzi analityczne bez potrzeby pisania SQL/eksportów.

### Źródła danych

- **Monday**: rekordy projektów, pola metryczne/kategorie.
- **ImpactLog**: notatki/insighty, jeśli uzupełniają liczby.
- **Deale**: jeśli metryki i segmentacja są powiązane.

### Ograniczenia / ryzyka

- **Brak kompletnych metryk** (częste) i niespójne nazwy pól.
- **Duże tabele**: konieczność porcji/paginacji + agregacji.
- **Bezpieczeństwo**: użytkownik nie powinien dostać danych poza swoim scope.

### Output (MVP)

- **Krótki raport**: 5–10 bulletów + liczby/metryki + wskazanie rekordów źródłowych.
- **Tabela/wykaz**: top‑N rekordów (np. 10) z kluczowymi kolumnami.
- **Braki danych**: jasne wskazanie, których metryk nie da się policzyć i dlaczego.

### Kryteria akceptacji (MVP)

- Zwraca zwięzłe zestawienie z liczbami/metrykami i odniesieniem do konkretnych rekordów.
- Jeśli dane nie wystarczają — zwraca jasny komunikat o brakach + sugeruje, jakie pola trzeba uzupełnić.

### Priorytet

**ŚREDNI–WYSOKI**.

### Plan-first: pytania doprecyzowujące (MVP)

System buduje ukryty kontrakt wejścia i prezentuje użytkownikowi plan przed uruchomieniem zapytania analitycznego.

**Kolejność pytań:**

1. **Co liczymy?** (must-have)
   - *Cel:* Określenie metryki/liczby do policzenia
   - *Pytanie:* „Jaką konkretnie metrykę chcesz policzyć? (np. liczba projektów, suma budżetu, średni progres do celu, liczba beneficjentów)”
   - *Domyślne:* Jeśli użytkownik podał w promptcie → ekstraktuj; jeśli wieloznaczne → zapytaj o precyzję

2. **Filtry zakresu** (must-have)
   - *Cel:* Określenie zakresu danych (geografia, status, okres, typ projektu)
   - *Pytanie:* „Jaki zakres danych? (geografia: X, status: Y, okres: Z, typ: W)”
   - *Domyślne:* Jeśli użytkownik podał w promptcie → ekstraktuj; jeśli brak → „wszystkie dostępne”

3. **Definicja metryki** (jeśli niejednoznaczna)
   - *Cel:* Rozstrzygnięcie wieloznaczności (np. „progres” = % realizacji KPI vs liczba beneficjentów)
   - *Pytanie:* „Co dokładnie rozumiesz przez [metrykę]? (np. progres = % realizacji celu vs liczba ukończonych działań)”
   - *Fallback:* Jeśli nie można rozstrzygnąć → zapytaj; jeśli brak → użyj domyślnej definicji z słownika

4. **Format outputu** (optional)
   - *Cel:* Określenie, czy potrzebna tabela, lista, czy tylko liczba
   - *Pytanie:* „W jakim formacie chcesz wynik? (tylko liczba, lista top‑N rekordów, tabela z detalami)”
   - *Domyślne:* „lista top‑10 rekordów + agregacja”

5. **Poziom szczegółowości** (optional)
   - *Cel:* Określenie, czy potrzebne są źródła rekordów czy tylko agregacja
   - *Pytanie:* „Czy potrzebujesz szczegółów (linki do rekordów, nazwy projektów) czy tylko liczby?”
   - *Domyślne:* „z linkami do rekordów”

**Reguła pomijania:** Jeśli użytkownik podał informację w początkowym promptcie, system ekstraktuje ją i pomija odpowiednie pytanie.

### Next steps techniczne

- Mapowanie „metryk” i ich semantyki (słownik pól).
- Mechanizm „czy mieści się w kontekście” → porcjowanie + agregacja + selekcja pól.

## UC‑03 — Generowanie gotowego draftu maila / komunikatu spersonalizowanego dla donora

### Opis

Na podstawie danych o donorze (jeśli dostępne) i odpowiednich projektów system generuje draft maila lub komunikatu (ton, cytaty, call‑to‑action).

### Cel

Przyspieszyć tworzenie spersonalizowanej komunikacji fundraisingowej.

### Źródła danych

- **HubSpot** (jeśli dostępny): dane o donorze i historia kontaktu.
- **Monday**: relacje/projekty, kontekst deala.
- **ImpactLog**: insighty, cytaty, konkretne osiągnięcia.
- **Slack**: wzmianki/ustalenia (opcjonalnie).

### Ograniczenia / ryzyka

- HubSpot wymaga osobnej integracji i polityk dostępu.
- Ryzyko nieprawdziwych stwierdzeń o donorze → konieczna pętla review.

### Output (MVP)

- **Draft maila** (warianty tonu opcjonalnie).
- **Cytaty/odniesienia**: jawne wskazanie, skąd pochodzi dana teza (rekord/link) lub „do potwierdzenia”.
- **Checklist weryfikacyjny**: elementy wymagające ręcznej weryfikacji przed wysyłką.

### Kryteria akceptacji (MVP)

- Draft zawiera referencje do źródeł + checklistę „do potwierdzenia”.
- Możliwość eksportu do draftu (np. Gmail) jako feature późniejszy (1.1+).

### Priorytet

**ŚREDNI**.

### Plan-first: pytania doprecyzowujące (MVP)

System buduje ukryty kontrakt wejścia i prezentuje użytkownikowi plan przed generowaniem draftu.

**Kolejność pytań:**

1. **Odbiorca maila** (must-have)
   - *Cel:* Określenie, dla kogo generujemy mail (nazwa organizacji, osoba, typ relacji)
   - *Pytanie:* „Dla kogo przygotowujesz mail? (nazwa organizacji/osoby, typ: donor/partner/stakeholder)”
   - *Domyślne:* Jeśli użytkownik podał w promptcie → ekstraktuj; jeśli brak → zapytaj

2. **Cel maila** (must-have)
   - *Cel:* Określenie intencji (pierwszy kontakt, follow-up, podziękowanie, pitch grantowy)
   - *Pytanie:* „Jaki jest cel maila? (pierwszy kontakt, follow-up po spotkaniu, podziękowanie, pitch grantowy, raport)”
   - *Domyślne:* Jeśli użytkownik podał w promptcie → ekstraktuj; jeśli brak → zapytaj

3. **Projekty do wspomnienia** (must-have)
   - *Cel:* Określenie, które projekty mają być w mailu
   - *Pytanie:* „Które projekty chcesz wspomnieć? (podaj geografię/temat lub nazwy projektów, lub 'dopasuj do odbiorcy')”
   - *Domyślne:* Jeśli użytkownik podał → ekstraktuj; jeśli brak → „dopasuj do odbiorcy na podstawie historii”

4. **Ton i styl** (optional, ale rekomendowane)
   - *Cel:* Dopasowanie tonu do relacji i celu
   - *Pytanie:* „Jaki ton preferujesz? (formalny, ciepły-profesjonalny, energiczny, konserwatywny)”
   - *Domyślne:* „ciepły-profesjonalny”

5. **Język** (optional)
   - *Cel:* Określenie języka komunikatu
   - *Pytanie:* „W jakim języku? (polski, angielski, inny)”
   - *Domyślne:* „polski”

6. **Call-to-action** (optional)
   - *Cel:* Określenie, czy potrzebne jest CTA i jakie
   - *Pytanie:* „Jaki call-to-action? (spotkanie, rozmowa telefoniczna, więcej informacji, brak CTA)”
   - *Domyślne:* „propozycja spotkania”

**Reguła pomijania:** Jeśli użytkownik podał informację w początkowym promptcie, system ekstraktuje ją i pomija odpowiednie pytanie.

### Next steps techniczne

- Minimalny zestaw pól o donorze + zabezpieczenia (read‑only, filtrowanie).
- Flagi „do potwierdzenia” dla krytycznych faktów (kwoty, obietnice, daty).

## UC‑04 — Live navigator / guided prompt (kierowany interfejs pytań)

### Opis

Interfejs prowadzi użytkownika krok‑po‑kroku (seria pytań) by doprecyzować, co chce uzyskać (np. kontekst spotkania, typ odbiorcy, zakres geograficzny), co poprawia trafność wyszukiwania i outputu.

### Cel

Ułatwić formułowanie zapytań i zredukować nietrafne wyniki.

### Źródła danych

Wejście użytkownika + baza (Monday/ImpactLog).

### Kryteria akceptacji (MVP)

- Flow 4–6 pytań przed uruchomieniem wyszukiwania.
- Lepsza jakość wyników niż „wolny prompt” (mierzone np. przez user feedback lub hit rate).

### Priorytet

**WYSOKI** (redukuje błędy, poprawia pętlę weryfikacji).

### Next steps techniczne

- Zaprojektować zestaw pytań/parametrów dla 3 scenariuszy:
  - deal enablement (UC‑01),
  - ad‑hoc reporting (UC‑02),
  - generate draft mail (UC‑03).

## UC‑05 — Storytelling + enrichment (dodanie zewnętrznego kontekstu)

### Opis

System generuje narrację projektu i wzbogaca ją o 3–5 zewnętrznych statystyk/raportów (publiczne źródła), aby podkreślić wagę problemu.

### Cel

Dodać wiarygodności i kontekstu do historii, gdy dane wewnętrzne są niewystarczające.

### Źródła danych

- Publiczne raporty / web search (opcjonalnie).
- Wewnętrzne case studies / wideo.

### Ograniczenia / ryzyka

- Koszt i złożoność web-search.
- Ryzyko cytowania słabych źródeł → konieczne źródła i oznaczenia.

### Kryteria akceptacji (MVP)

- Minimum 1–3 statystyki z opisanym źródłem (link).
- Toggle „dołącz statystyki” w flow (UI/parametr).

### Priorytet

**NISKI–ŚREDNI** (kandydat do 1.1 dla efektu „wow”).

## UC‑06 — Impact Log verification loop (pętla weryfikacji danych)

### Opis

Mechanizm do szybkiego weryfikowania i oznaczania poprawności wygenerowanych insightów (feedback: dobra / do poprawy), tak by system uczył się reguł filtrowania i poprawiał jakość outputu.

### Cel

Zacieśnić pętlę iteracji: szybkie poprawki reguł i poprawa jakości outputu.

### Źródła danych

- ImpactLog, Slack (feedback), manual review przez zespół.

### Ograniczenia / ryzyka

- Wymaga osoby do review; bez tego pętla nie działa.

### Kryteria akceptacji (MVP)

- Mechanizm oznaczania wyników (good/bad) + powiadomienie do dewelopera/opiekuna.
- Rejestr zmian/reguł + prosty dashboard „poprawne vs błędne”.

### Priorytet

**WYSOKI** (krytyczne dla jakości).

### Next steps techniczne

- Format feedbacku (np. Slack message/voice → transkrypcja → tag).
- Backlog filtrów do dopisania (reguły jakości + detektory braków danych).

## Wspólne mechanizmy: Stop & ask triggers i format outputu

### Stop & ask triggers (sytuacje wymagające przerwania i doprecyzowania)

System **musi przerwać** i dopytać użytkownika w następujących sytuacjach (zamiast zgadywać lub działać na podstawie niepewnych danych):

1. **Brak must-have slotów**
   - Jeśli brakuje krytycznych parametrów (geografia, temat, typ odbiorcy dla UC‑01; metryka dla UC‑02; odbiorca dla UC‑03), system **nie może** uruchomić wyszukiwania/tool calls bez doprecyzowania.

2. **Wieloznaczność metryki/definicji**
   - Jeśli zapytanie zawiera niejednoznaczne pojęcie (np. „progres” może oznaczać % realizacji KPI, liczbę beneficjentów, lub status projektu), system **musi** zapytać o precyzję przed policzeniem.

3. **Wieloznaczność boardu/źródła**
   - Jeśli zapytanie może dotyczyć wielu boardów w Monday lub wielu źródeł w ImpactLog, system **musi** zapytać, które źródło ma być użyte (lub zaproponować top‑3 opcje).

4. **Brak evidence do kluczowej liczby/tezy**
   - Jeśli system nie może znaleźć źródła dla liczby/tezy, która jest kluczowa dla odpowiedzi (np. „projekt X osiągnął Y beneficjentów”), system **nie może** wygenerować tej liczby bez oznaczenia „do potwierdzenia” i zapytania, skąd wziąć dane.

5. **Zbyt duży zakres danych**
   - Jeśli zapytanie zwróciłoby >100 rekordów lub przekroczyłoby budżet tokenów, system **musi** zapytać o zawężenie zakresu (np. „Znaleziono 250 projektów. Zawęź do: geografia X, okres Y, status Z?”).

6. **Niska pewność interpretacji intencji**
   - Jeśli system nie jest pewien, który use case (UC‑01/02/03) ma zastosować, **musi** zapytać użytkownika o potwierdzenie intencji przed uruchomieniem narzędzi.

### Format outputu (wspólny dla wszystkich UC)

Każda odpowiedź systemu **musi** zawierać następujące sekcje:

1. **Wyniki** (główna treść)
   - Lista projektów / raport / draft maila / odpowiedź na pytanie
   - Format zależny od UC (narracja, bullets, tabela, tekst)

2. **Źródła** (obowiązkowe)
   - Każda liczba/istotna teza **musi** mieć źródło:
     - Link do Monday item (np. `https://monday.com/boards/123/items/456`)
     - ID rekordu + nazwa kolumny (np. `Item #789, kolumna "Beneficjenci"`)
     - Link do ImpactLog entry (np. `ImpactLog #12: "Notatka z Q4 2024"`)
     - Link do Slack wątku (jeśli dotyczy)
   - Format: `[Teza/Liczba]` → `[Źródło: link/ID]`

3. **Do potwierdzenia / braki danych** (jeśli dotyczy)
   - Lista elementów, które **nie mają źródła** lub wymagają weryfikacji:
     - `⚠️ Brak źródła: "Projekt X osiągnął Y beneficjentów" — proszę zweryfikować w Monday kolumnie "Beneficjenci" dla Item #123`
     - `⚠️ Brak danych: geografia dla projektu Z — proszę uzupełnić pole "Region" w Monday`
   - System **nie może** generować faktów bez źródła — jeśli brak, oznacza jako „do potwierdzenia” i proponuje, skąd wziąć dane.

**Przykład struktury outputu:**

```
## Wyniki

[Główna treść odpowiedzi — narracja/raport/draft]

## Źródła

- "Projekt Edukacja Kenia osiągnął 5000 beneficjentów" → [Monday Item #123, kolumna "Beneficjenci"](link)
- "Projekt działa od 2023" → [Monday Item #123, kolumna "Data startu"](link)
- "Kluczowy insight: wzrost frekwencji o 40%" → [ImpactLog #45: "Raport Q3 2024"](link)

## Do potwierdzenia

⚠️ Brak źródła: "Projekt współpracuje z 3 szkołami" — proszę zweryfikować w Monday kolumnie "Partnerzy" dla Item #123
⚠️ Brak danych: metryka "impact score" dla projektu — proszę uzupełnić pole "Impact Score" w Monday
```

## Minimalny zakres MVP (proponowana kolejność)

- **Podstawa**: read‑only integracje Monday (projekty/deals) + lokalny ImpactLog + prosty UI chat.
- **Live navigator** dla 3 scenariuszy (UC‑01/02/03).
- **Feedback loop** (UC‑06) z rejestrem.
- **Bezpieczeństwo**: sandbox konta + reguły blokujące zapis + testy.


