# Fizpraktikum — interaktiv laboratoriya qo‘llanmasi

Elektr, magnetizm va optika bo‘yicha elektron laboratoriya qo‘llanmasi. U Qo‘qon davlat universitetining “Fizpraktikum” fani o‘quv dasturi asosida tayyorlangan (FP11234562, 60530500 — Fizika, 3–4-semestrlar, 8 ECTS).

**Mualliflar (fan dasturi tuzuvchilari):** Eshboltayev Iqbol Mamirjonovich (professor, PhD), Urinova Kamala Kamildjonovna (PhD). Taqrizchilar: R. Rasulov, I. Qo‘qonboyev.

## Tarkibi

- **36 ta laboratoriya ishi** (48 mashg‘ulot, L1–L48, 96 soat). 18 tasi elektr va magnetizm (`lab1–lab18.html`), 18 tasi optika (`lab19–lab36.html`). Har bir ishda quyidagilar bor:
  - maqsad, jihozlar, nazariya, bajarish tartibi;
  - to‘ldiriladigan o‘lchash jadvali;
  - xatoliklar hisobi va namunaviy hisob;
  - virtual laboratoriya (ovozli namoyish bilan);
  - texnika xavfsizligi, himoya savollari, 10 savolli test va SI bilan ishlash.
- **Laboratoriyaga kirish** (`kirish.html`). Ichida laboratoriya tartibi, xavfsizlik, hisobot shabloni va o‘lchash asboblari bor. Xatoliklar nazariyasi Styudent usuli, bilvosita o‘lchash va eng kichik kvadratlar usulini qamrab oladi; interaktiv kalkulyatorlar ham shu yerda.
- **Mustaqil ta’lim** (`mustaqil.html`): 46 ta mavzu (144 soat) va 10 ta eksperimental keys.
- **Baholash** (`baholash.html`): JN 30 / ON 20 / YaN 50 rubrikalari, TN–nazorat matritsasi va baho kalkulyatori.
- **O‘qituvchi uchun** (`oqituvchi.html`), **lug‘at** (`glossariy.html`) va **vositalar** (`vositalar.html`).

## Imkoniyatlar

- Kun va tun rejimi. UZ/RU/EN tugmalari butun saytni Google Translate orqali tarjima qiladi.
- Yangi o‘zbek alifbosi (Ö, Ğ, Ş, Ç).
- **Tinglash.** O‘zbekcha ovoz oldindan tayyorlangan neyron MP3 fayllardan ijro etiladi, shuning uchun barcha qurilmalarda bir xil eshitiladi. Formulalar odam o‘qiganidek o‘qiladi. Pauza, oldingi va keyingi xatboshiga o‘tish, “Shu yerdan o‘qish” imkoniyatlari bor.
- **Ovozli namoyish.** Virtual laboratoriya parametrlarni o‘zi o‘zgartirib, natijani tushuntiradi.
- Telefon, kompyuter va 4K interaktiv doskaga moslashadi.

## GitHub Pages’da ochish

Repozitoriyda **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save** ni tanlang.

Sayt shu manzilda ochiladi: `https://eshboltayev.github.io/Fizpraktikum/`

## Mazmunni tahrirlash

Mazmun `gen/` papkasida saqlanadi:

| Fayl | Mazmuni |
|---|---|
| `labs_e1.py`, `labs_e2.py` | Elektr va magnetizm ishlari |
| `labs_o1.py`, `labs_o2.py` | Optika ishlari |
| `tours.py` | Ovozli namoyishlar |
| `other.py` | Mustaqil ta’lim, keyslar, lug‘at, taqvim |

O‘zgartirishdan keyin sahifalarni qayta yarating:

```bash
python3 gen/build.py .
```

GitHub’ga yuklangach, `.github/workflows/ovoz.yml` o‘zbekcha MP3 fayllarni avtomatik yangilaydi.

## Litsenziya

CC BY-SA 4.0.
