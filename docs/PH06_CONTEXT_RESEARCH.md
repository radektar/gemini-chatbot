# PH06-CONTEXT-003: Research - Optymalne limity rekordów dla integracji

**Data:** 2025-12-29  
**Cel:** Określenie optymalnej liczby rekordów z Monday.com i Slack dla kontekstu LLM  
**Modele docelowe:** Anthropic Claude (Haiku 4.5, Sonnet 4.5) / Google Gemini (2.5 Flash/Pro)

---

## 1. Podsumowanie wykonawcze

### Kluczowe wnioski

| Parametr | Rekomendacja | Uzasadnienie |
|----------|--------------|--------------|
| **Monday.com** | **30-50 rekordów** | Optymalny balans jakość/koszt przy ~150-300 tokenów/rekord |
| **Slack** | **15-25 wiadomości** | Dłuższe wiadomości (~100-300 tokenów) + kontekst konwersacyjny |
| **Budżet kontekstu** | **30-40K tokenów** | 70-75% efektywnego wykorzystania (nie max) |
| **Format danych** | **Kompaktowy JSON lub TOON** | 30-60% oszczędności vs pretty-printed JSON |

### Dlaczego nie więcej?

1. **"Lost in the Middle"** - badania pokazują, że modele mają U-kształtną krzywą uwagi (najlepiej rozumieją początek i koniec kontekstu)
2. **Performance degradation** - więcej dokumentów ≠ lepsze wyniki; badania pokazują spadek accuracy nawet o 20% przy zbyt dużej liczbie dokumentów
3. **Koszt** - każdy dodatkowy token to dodatkowy koszt (Claude: $1-3/MTok input)
4. **Latency** - dłuższy kontekst = wolniejsza odpowiedź

---

## 2. Context Windows - Specyfikacje modeli

### 2.1 Anthropic Claude (2025)

| Model | Context Window | Max Output | Pricing (Input/Output per MTok) |
|-------|---------------|------------|--------------------------------|
| **Claude Haiku 4.5** | 200K | 64K | $1 / $5 |
| **Claude Sonnet 4.5** | 200K (1M beta) | 64K | $3 / $15 |
| **Claude Opus 4.5** | 200K | 64K | $5 / $25 |

**Uwagi:**
- 1M context window dostępny tylko dla tier 4 i custom enterprise
- Premium pricing (2x input, 1.5x output) powyżej 200K tokenów
- Prompt caching: 90% oszczędności dla powtarzających się promptów

### 2.2 Google Gemini (2025)

| Model | Context Window | Max Output | Pricing (Input/Output per MTok) |
|-------|---------------|------------|--------------------------------|
| **Gemini 2.5 Flash** | 1M | 65K | $0.075 / $0.30 |
| **Gemini 2.5 Pro** | 1M | 65K | $1.25 / $5 (>200K: $2.50/$15) |
| **Gemini 2.5 Flash-Lite** | 1M | 65K | Ultra-low |

**Uwagi:**
- Gemini oferuje największe context windows w branży
- Premium pricing powyżej 200K tokenów
- Context caching: 4x tańsze niż standardowy input

---

## 3. Token Estimation - Dane strukturalne

### 3.1 Ogólne przeliczniki

| Jednostka | Przybliżona liczba tokenów |
|-----------|---------------------------|
| 1 token | ~4 znaki (EN), ~2-3 znaki (PL) |
| 100 tokenów | ~75 słów |
| 1000 tokenów | ~750 słów / 2-3 strony tekstu |
| 50K tokenów | ~8 krótkich powieści |

### 3.2 JSON vs alternatywne formaty

| Format | Tokeny (przykład 10 rekordów) | Oszczędność vs Pretty JSON |
|--------|------------------------------|---------------------------|
| **Pretty-printed JSON** | ~379 tokenów | baseline |
| **Compact JSON** | ~190 tokenów | **~50%** |
| **TOON** | ~150 tokenów | **~60%** |
| **CSV** | ~115 tokenów | **~70%** |

**Wniosek:** Używanie kompaktowego JSON lub TOON może zmniejszyć zużycie tokenów o 50-60%.

### 3.3 Monday.com - Estymacja tokenów

**Typowy rekord Monday.com (item z 10 kolumnami):**

```json
{"id":"123456789","name":"Task name here","status":"Working on it","person":"John Doe","date":"2025-01-15","timeline":"2025-01-01 - 2025-01-31","numbers":1500,"text":"Description text","dropdown":"Option A","tags":["tag1","tag2"]}
```

| Kompleksowość | Kolumny | Tokeny/rekord | 50 rekordów |
|--------------|---------|---------------|-------------|
| **Prosta** | 5-7 | ~80-120 | ~4-6K |
| **Średnia** | 8-12 | ~150-250 | ~7.5-12.5K |
| **Złożona** | 15+ | ~300-500 | ~15-25K |

**Rekomendacja:** Przy budżecie 30-40K tokenów dla danych, można bezpiecznie pobrać:
- **Proste dane:** 50-100 rekordów
- **Średnie dane:** 30-50 rekordów
- **Złożone dane:** 20-30 rekordów

### 3.4 Slack - Estymacja tokenów

**Typowa wiadomość Slack:**

```json
{"user":"U123456","text":"Here's the update on the project. We finished the implementation and testing is in progress.","ts":"1735123456.123456","thread_ts":"1735000000.000000"}
```

| Typ wiadomości | Długość tekstu | Tokeny/wiadomość |
|---------------|----------------|------------------|
| **Krótka** | 10-50 słów | ~50-80 |
| **Średnia** | 50-150 słów | ~100-200 |
| **Długa** | 150+ słów | ~200-400 |

**Rekomendacja:** Przy budżecie 10-15K tokenów dla Slack:
- **Krótkie wiadomości:** 25-30 wiadomości
- **Średnie wiadomości:** 15-20 wiadomości
- **Długie wiadomości:** 10-15 wiadomości

---

## 4. "Lost in the Middle" - Badania naukowe

### 4.1 Problem

Badanie "Lost in the Middle: How Language Models Use Long Contexts" (Liu et al., 2023, TACL 2024) wykazało:

> "Performance is often highest when relevant information occurs at the beginning or end of the input context, and significantly degrades when models must access relevant information in the middle of long contexts."

**Kształt krzywej uwagi:**
```
Accuracy
   ^
   |  *                                    *
   |   *                                  *
   |    *                                *
   |     *                              *
   |      *        _______________     *
   |       *______/               \___*
   |
   +-----------------------------------------> Position
   Start                                  End
```

### 4.2 Kluczowe wnioski

1. **U-shaped performance curve** - modele najlepiej rozumieją informacje na początku (primacy bias) i końcu (recency bias) kontekstu

2. **Spadek do 20%** - GPT-3.5-Turbo wykazał spadek accuracy nawet o 20 punktów procentowych dla informacji w środku kontekstu

3. **Worse than no context** - w niektórych przypadkach, performance z dokumentami w środku był GORSZY niż bez żadnych dokumentów (closed-book)

4. **Extended context ≠ better** - modele z większym context window nie są automatycznie lepsze w wykorzystaniu kontekstu

### 4.3 Implikacje dla PH06-CONTEXT-003

| Problem | Rozwiązanie |
|---------|-------------|
| Informacje w środku ignorowane | Umieszczać najważniejsze dane na początku i końcu |
| Więcej dokumentów = gorsza jakość | Ograniczyć liczbę rekordów do optymalnego minimum |
| Redundancja między dokumentami | Deduplikacja i agregacja przed wysłaniem |

---

## 5. RAG Best Practices - Optymalna liczba dokumentów

### 5.1 Rekomendacje z badań

| Źródło | Rekomendacja top-k | Uzasadnienie |
|--------|-------------------|--------------|
| Google Cloud | k=4 (start) | Baseline, iteracyjne testowanie |
| Industry practice | k=3-5 (FAQ) | Proste zapytania |
| Industry practice | k=10 (medium) | Średnia złożoność |
| Research papers | k=15-20 (complex) | Multi-hop reasoning |
| Cohere Rerank | k=50-200 → rerank → k=10-20 | Two-stage retrieval |

### 5.2 Performance saturation

Badanie "Long-Context RAG Performance of LLMs" (2024) wykazało:

> "Reader model performance saturates long before retriever performance saturates... Using more than 20 retrieved documents only marginally improves reader performance (~1.5% for GPT-3.5-Turbo)."

**Praktyczna implikacja:** Powyżej ~20 dokumentów, dodatkowe dokumenty nie poprawiają jakości odpowiedzi.

### 5.3 Multi-document degradation

Badanie z 2025 (arxiv:2503.04388) wykazało:

> "LLMs suffered measurable performance degradation when presented with more documents, even when the total context length remained identical."

**Spadek accuracy:** do 20 punktów procentowych przy zbyt wielu dokumentach, nawet gdy wszystkie informacje były obecne.

---

## 6. Budget kontekstu - Rekomendowana alokacja

### 6.1 Alokacja dla 200K context window

| Komponent | Tokeny | % budżetu |
|-----------|--------|-----------|
| **System prompt** | 2-5K | 1-2.5% |
| **Historia konwersacji** | 10-20K | 5-10% |
| **Dane z integracji** | 30-50K | 15-25% |
| **Reserved for output** | 8-16K | 4-8% |
| **Safety margin** | 40-80K | 20-40% |
| **RAZEM wykorzystane** | ~60-130K | ~30-65% |

### 6.2 Dlaczego nie wykorzystywać 100%?

1. **Performance degradation** - jakość odpowiedzi spada powyżej 70-75% wykorzystania
2. **Safety margin** - margines na nieoczekiwane rozszerzenia
3. **Multi-turn conversations** - każdy kolejny turn wymaga więcej kontekstu
4. **Extended thinking** - Claude używa tokenów na wewnętrzne rozumowanie

### 6.3 Rekomendowany budżet dla danych integracji

| Scenariusz | Budżet (tokeny) | Monday.com | Slack |
|------------|-----------------|------------|-------|
| **Minimalny** | 15K | 20-30 rekordów | 10-15 wiadomości |
| **Standardowy** | 30K | 40-50 rekordów | 20-25 wiadomości |
| **Rozszerzony** | 50K | 60-80 rekordów | 30-40 wiadomości |

---

## 7. Finalne rekomendacje dla PH06-CONTEXT-003

### 7.1 Monday.com

| Parametr | Wartość | Uzasadnienie |
|----------|---------|--------------|
| **Max rekordów** | **50** | Saturation point dla RAG (~20 docs) + margines |
| **Min rekordów** | **10** | Minimum dla sensownej analizy |
| **Domyślnie** | **30** | Optymalne dla większości zapytań |
| **Trigger "zawęź"** | **>100 potencjalnych** | Gdy board ma >100 items matching |

### 7.2 Slack

| Parametr | Wartość | Uzasadnienie |
|----------|---------|--------------|
| **Max wiadomości** | **25** | Dłuższe treści, kontekst konwersacyjny |
| **Min wiadomości** | **5** | Minimum dla kontekstu |
| **Domyślnie** | **15** | Optymalne dla wyszukiwania |
| **Trigger "zawęź"** | **>50 wyników** | Gdy search zwraca >50 matches |

### 7.3 Format danych

| Rekomendacja | Implementacja |
|--------------|---------------|
| **Kompaktowy JSON** | Usunięcie whitespace, skrócenie kluczy |
| **Selekcja pól** | Tylko wymagane kolumny, nie wszystkie |
| **Agregacja** | Summary + top przykłady zamiast pełnej listy |
| **Deduplikacja** | Usunięcie redundantnych informacji |

### 7.4 Strategie degradacji

Gdy dane przekraczają budżet:

1. **Poziom 1:** Selekcja pól (tylko kluczowe kolumny)
2. **Poziom 2:** Redukcja liczby rekordów (top-N najbardziej relevant)
3. **Poziom 3:** Agregacja (summary zamiast pełnych danych)
4. **Poziom 4:** Pytanie użytkownika o zawężenie

---

## 8. Porównanie z oryginalną propozycją

| Parametr | Oryginalna propozycja | Nowa rekomendacja | Zmiana |
|----------|----------------------|-------------------|--------|
| Monday.com | 50 rekordów | **30-50 rekordów** | Zakres zamiast stałej |
| Slack | 20 wiadomości | **15-25 wiadomości** | Zakres, średnio podobnie |
| Uzasadnienie | "Arbitralne" | **Research-based** | ✅ Udokumentowane |

**Wniosek:** Oryginalna propozycja była rozsądna, ale teraz mamy naukowe uzasadnienie dla tych limitów.

---

## 9. Źródła

### Badania naukowe
1. Liu et al. "Lost in the Middle: How Language Models Use Long Contexts" (TACL 2024)
2. "Long-Context RAG Performance of LLMs" (arxiv:2411.03538, 2024)
3. "Context Length Alone Hurts LLM Performance" (arxiv:2510.05381, 2025)
4. "Found in the Middle: Multi-scale Positional Encoding" (arxiv:2403.04797, 2024)

### Dokumentacja techniczna
5. Anthropic Claude Documentation - Context Windows
6. Google Gemini API Documentation - Token Limits
7. Anthropic "Contextual Retrieval" (2024)

### Industry best practices
8. Google Cloud Blog - "Optimizing RAG Retrieval"
9. AWS Bedrock - RAG Evaluation Metrics
10. Cohere Rerank Documentation

---

## 10. Następne kroki (implementacja)

1. **Utworzenie brancha** `phase/06-context-budget-hardening`
2. **Implementacja token counter** - estymacja tokenów przed wysłaniem
3. **Implementacja limitów** - Monday: 30-50, Slack: 15-25
4. **Strategie degradacji** - automatyczna redukcja przy przekroczeniu
5. **Testy** - walidacja limitów z rzeczywistymi danymi
6. **Dokumentacja** - aktualizacja PROJECT_SPEC.md i BACKLOG.md

