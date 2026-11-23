"""Fizpraktikum elektron qo'llanmasini generatsiya qilish: python3 gen/build.py <chiqish_papkasi>"""
import os, sys, re, json, random
sys.path.insert(0, os.path.dirname(__file__))
from common import *
from labs_e1 import L as E1
from labs_e2 import L as E2
from labs_o1 import L as O1
from labs_o2 import L as O2
import other
from tours import T as TOURS
from alifbo import html_to_new

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
LABS = E1 + E2 + O1 + O2
ELEC, OPT = LABS[:18], LABS[18:]
SIMNAME = {L["sim"]: L["short"] for L in LABS}
SIMNAME["newton"] = "Nyuton halqalari"
TN_TEXT = {
 "TN1": "Elektr va magnit zanjirlarini to‘g‘ri yig‘ish, o‘lchov asboblaridan (ampermetr, voltmetr, multimetr, osillograf) to‘g‘ri va xavfsiz foydalanish",
 "TN2": "Fizik hodisalarni tajribada namoyish qilish, o‘lchov ishlarini bajarish va natijalar aniqligini ta’minlash",
 "TN3": "Maktab va kollejlarda elektr va magnetizm bo‘yicha laboratoriya va ko‘rgazmali tajribalarni mustaqil rejalashtirish va o‘tkazish",
 "TN4": "Fizik hodisalarning fenomenologik mohiyatini o‘quvchilarga sodda, ko‘rgazmali va tushunarli yetkazish",
 "TN5": "O‘lchash natijalarini matematik va grafik qayta ishlash, tizimli va tasodifiy xatoliklarni hisoblash",
 "TN6": "Tajriba natijalarini nazariya bilan solishtirish, sabab-oqibatni tahlil qilish va ilmiy asoslangan xulosa chiqarish",
 "TN7": "Elektr zanjirlari va yuqori kuchlanishli qurilmalar bilan ishlashda texnika xavfsizligiga rioya qilish",
 "TN8": "Fotometrik qurilmalarni yig‘ish, optik asboblardan (mikroskop, interferometr, Nyuton halqalari, linzalar, prizmalar) to‘g‘ri foydalanish",
 "TN9": "Optik hodisalarni tajribada namoyish qilish, o‘lchov ishlarini bajarish va natijalar aniqligini ta’minlash",
 "TN10": "Maktab va kollejlarda optika bo‘yicha ko‘rgazmali tajribalarni mustaqil rejalashtirish",
 "TN11": "Elektr sxemalar va prinsipial chizmalar bo‘yicha zanjirlarni to‘g‘ri va xavfsiz yig‘ish",
 "TN12": "Elektr sxemalar bo‘yicha amaliy elektr va magnit zanjirlarini yig‘ish (yozma ishda baholanadi)",
 "TN13": "Tajriba qurilmalarini ishchi holatga keltirish, kalibrlash va o‘lchov xatoliklarini kamaytirish",
 "TN14": "Tajriba ma’lumotlari asosida grafiklar (VAX, rezonans egri chiziqlari va h.k.) chizish va tahlil qilish",
 "TN15": "O‘lchashlarning absolyut, nisbiy xatoliklari va statistik noaniqliklarni hisoblash",
}
# Fan dasturi bo'yicha TN–nazorat matritsasi (JN, ON, YaN)
TN_MATRIX = {t: ("+", "+" if t in ("TN3", "TN6", "TN11") else "—", "+" if t in ("TN3", "TN6", "TN11", "TN12") else "—") for t in TN_TEXT}


def fix_math(html):
    f = lambda m: m.group(0).replace("<", "\\lt ")
    html = re.sub(r"\\\(.*?\\\)", f, html, flags=re.S)
    return re.sub(r"\$\$.*?\$\$", f, html, flags=re.S)


def write(name, html):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(html_to_new(fix_math(html)))


def strip_tags(s):
    return re.sub(r"<[^>]+>|\\\(|\\\)|\\[a-zA-Z]+|[{}$]", "", s)


def shuffled_quiz(items, seed):
    rnd = random.Random(seed); out = []
    for q, opts, a, ex in items:
        idx = list(range(len(opts))); rnd.shuffle(idx)
        out.append((q, [opts[i] for i in idx], idx.index(a), ex))
    return out


def sim_block(sim, uid):
    steps = TOURS.get(sim, [])
    lis = "".join(f"<li data-set='{json.dumps(p)}'>{t}</li>" for p, t in steps)
    tour = (f'<div class="tour-bar"><button class="voice-btn" type="button" data-tour="tour-{uid}">{SPEAKER}<span>Ovozli namoyish</span></button>'
            f'<span class="muted" style="font-size:.82rem">Model o‘zi parametrlarni o‘zgartirib, natijani tushuntiradi; so‘ng boshqaruv sizga o‘tadi.</span></div>'
            f'<div class="tour-cap" aria-live="polite"></div><ol class="vh tour-steps" id="tour-{uid}">{lis}</ol>') if steps else ""
    return f'<div class="sim-wrap"><div class="sim-box" data-sim="{sim}"></div>{tour}</div>'


def tn_chips(tns):
    return "".join(f'<span class="chip g" title="{TN_TEXT[t]}">{t}</span>' for t in tns)


def lit(r):
    return f"[{r}] {BASE_LIT[r]}" if isinstance(r, int) else f"[{r}] {BASE_LIT[r]}"


def refs_html(refs, intl):
    return ul([lit(r) for r in refs] + [INTL[k] for k in intl]) + '<p class="muted" style="font-size:.85rem">[1]–[5] — fan dasturidagi asosiy, [Q…] — qo‘shimcha adabiyotlar raqamlanishi. Xalqaro darsliklar chuqurlashtirish uchun tavsiya etiladi.</p>'


def pager(prev, nxt):
    p = card_link(prev[0], "← Oldingi", prev[1], "") if prev else "<span></span>"
    n = card_link(nxt[0], "Keyingi →", nxt[1], "").replace('class="card"', 'class="card next"') if nxt else "<span></span>"
    return f'<nav class="pager" aria-label="Sahifalar">{p}{n}</nav>'


def meas_table(cols, nrows):
    h = "".join(f"<th>{c}</th>" for c in cols)
    r = "".join("<tr>" + "".join('<td contenteditable="true"></td>' for _ in cols) + "</tr>" for _ in range(nrows))
    return f'<div class="tw meas"><table class="t meas-t"><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table></div><p class="muted" style="font-size:.82rem">Jadval katakchalariga bevosita yozish mumkin (ma’lumotlar sahifa yopilganda saqlanmaydi — hisobotga ko‘chirib oling).</p>'


ERR_CALC = '''<div class="card err-calc"><h3>Takroriy o‘lchashlar kalkulyatori</h3><label class="control">O‘lchangan qiymatlar (bo‘sh joy yoki yangi qator bilan ajrating)<textarea rows="3">83,1 82,6 83,4 82,9 83,0</textarea></label><label class="control" style="margin-top:.6rem">Asbob xatoligi Δ_asbob (ixtiyoriy)<input type="text" value="0,5"></label><div class="calc-res" aria-live="polite"></div></div>'''
MNK_CALC = '''<div class="card mnk-calc"><h3>Eng kichik kvadratlar usuli (to‘g‘ri chiziq y = kx + b)</h3><label class="control">Har bir qatorda “x y” juftligi<textarea rows="6">0,05 0,76
0,10 1,51
0,15 2,29
0,20 3,02
0,25 3,79</textarea></label><div class="calc-res" aria-live="polite"></div></div>'''


# ---------------- Laboratoriya ishi sahifasi ----------------
def lab_page(L):
    n = L["n"]
    elec = n <= 18
    toc = [("maqsad", "Maqsad va natijalar"), ("jihoz", "Jihozlar"), ("nazariya", "Nazariy qism"), ("tartib", "Bajarish tartibi"), ("hisob", "Natijalarni qayta ishlash"), ("misol", "Namunaviy hisob"), ("model", "Virtual laboratoriya"), ("xavfsizlik", "Texnika xavfsizligi"), ("savollar", "Himoya savollari"), ("test", "Nazorat testi"), ("si", "SI bilan ishlash"), ("adabiyot", "Adabiyotlar"), ("oqituvchi", "O‘qituvchi uchun")]
    S = []
    S.append(sec("maqsad", 1, "Ishning maqsadi va kutilayotgan natijalar", f'<p>{L["goal"]}</p><p class="muted">Fan dasturidagi ta’lim natijalari: {"; ".join(f"<b>{t}</b> — {TN_TEXT[t]}" for t in L["tn"])}.</p>'))
    S.append(sec("jihoz", 2, "Kerakli jihozlar", ul(L["equip"]) + '<div class="callout info"><b>Jihoz yetishmasa</b>Ishning o‘lchash qismini quyidagi virtual laboratoriyada bajarib, natijalarni xuddi shu jadvalga yozing; hisobotda buni ko‘rsating.</div>'))
    th = "".join(f"<h3>{n}.{k+1}. {h}</h3>{b}" for k, (h, b) in enumerate(L["theory"]))
    S.append(sec("nazariya", 3, "Nazariy qism", th))
    cols, rows = L["tbl"]
    S.append(sec("tartib", 4, "Ishni bajarish tartibi", ul(L["proc"], True) + "<h3>O‘lchash natijalari jadvali</h3>" + meas_table(cols, rows)))
    S.append(sec("hisob", 5, "Natijalarni qayta ishlash va xatoliklar", L["calc"] + f'<p class="muted">Xatoliklar nazariyasi: <a href="kirish.html#xatolik">laboratoriyaga kirish bo‘limi</a>.</p><div class="grid grid-2">{ERR_CALC}{MNK_CALC}</div>'))
    cond, sol = L["example"]
    S.append(sec("misol", 6, "Namunaviy hisob", f'<div class="example"><div class="ex-h">Namunaviy ma’lumotlar bilan hisob</div><div class="ex-b"><p><b>Shart.</b> {cond}</p><details><summary>Yechimni ko‘rsatish</summary><p>{sol}</p></details></div></div>'))
    S.append(sec("model", 7, f"Virtual laboratoriya: {L['short']}", f'{sim_block(L["sim"], f"l{n}")}<h3>Virtual laboratoriyadagi topshiriqlar</h3>{ul(L["simtask"], True)}<p class="muted" style="font-size:.85rem">Model o‘quv maqsadida soddalashtirilgan. “Asbob ko‘rsatishi” deb belgilangan qiymatlarga real o‘lchashdagi kabi kichik tasodifiy chetlanish qo‘shilgan — takroriy o‘lchashlar uchun foydalaning.</p>'))
    S.append(sec("xavfsizlik", 8, "Texnika xavfsizligi", '<div class="callout warn"><b>Ishni boshlashdan oldin</b>Zanjir yoki qurilma o‘qituvchi tekshirmaguncha ishga tushirilmaydi. Umumiy qoidalar: <a href="kirish.html#xavfsizlik">laboratoriyaga kirish</a>.</div>' + ul(L["safety"])))
    S.append(sec("savollar", 9, "Himoya uchun nazorat savollari", ul(L["questions"], True)))
    S.append(sec("test", 10, "Nazorat testi (10 savol, o‘z-o‘zini tekshirish)", quiz(shuffled_quiz(L["quiz"], 2000 + n), f"l{n}") + '<p class="muted" style="font-size:.85rem;margin-top:.6rem">Bu test o‘z-o‘zini tekshirish uchun; rasmiy oraliq nazorat HEMIS’da o‘tkaziladi.</p>'))
    ai = (f"Men pedagogika oliygohining fizika yo‘nalishi talabasiman. “{strip_tags(L['title'])}” laboratoriya ishini bajardim.\n"
          "1) Mening o‘lchash jadvalimni tekshir: birliklar, xonalar soni, aniq xato yozuvlar.\n"
          "2) Natijani qayta ishlash bosqichlarini tushuntir (o‘rtacha, Styudent usuli, bilvosita o‘lchash xatoligi), lekin hisobni o‘zim bajaraman.\n"
          "3) Natijam jadval qiymatidan farq qilsa, mumkin bo‘lgan tizimli xatolik manbalarini sanab ber.\n"
          "4) Himoya uchun 3 ta savol ber.\n"
          "Cheklov: formulalarni LaTeX’da yoz, ishonching komil bo‘lmagan joyni ochiq ayt.\n\n[Shu yerga o‘lchash jadvalingizni qo‘ying]")
    S.append(sec("si", 11, "Sun’iy intellekt bilan ishlash", f'<div class="callout ai"><b>Qoidalar</b>SI — tekshirilishi shart bo‘lgan yordamchi. Hisobotdagi barcha hisoblar talabaning o‘zi tomonidan bajariladi; SI dan foydalanilgan bo‘lsa, prompt hisobotga ilova qilinadi.</div>{prompt(f"ai-{n}", ai)}'))
    S.append(sec("adabiyot", 12, "Adabiyotlar", refs_html(L["refs"], L["intl"])))
    S.append(f'<section class="doc-sec teacher-note" id="oqituvchi"><h2>O‘qituvchi uchun: 80 daqiqalik mashg‘ulot rejasi</h2>{table(["Vaqt", "Bosqich", "Faoliyat"], [["0–10", "Kirish nazorati (dopusk)", "Himoya savollaridan 2–3 tasi; xavfsizlik bo‘yicha yo‘riqnoma; jurnalga qayd"], ["10–25", "Yig‘ish va sozlash", "Zanjir/qurilmani yig‘ish, o‘qituvchi tekshiruvi; jihoz yetishmasa — virtual laboratoriya"], ["25–55", "O‘lchash", "Jadvalni to‘ldirish, takroriy o‘lchashlar; virtual model bilan solishtirish"], ["55–70", "Qayta ishlash", "Grafik, eng kichik kvadratlar, xatoliklar; kalkulyatorlar bilan tekshirish"], ["70–80", "Himoya", "Xulosa, nazorat savollari; DF bali (JN tarkibida)"]])}<p class="muted">Mashg‘ulot: {L["sess"]} (fan dasturi bo‘yicha). Batafsil: <a href="oqituvchi.html">o‘qituvchi qo‘llanmasi</a>.</p></section>')
    prev = (f"lab{n-1}.html", f"{n-1}-laboratoriya ishi") if n > 1 else ("kirish.html", "Laboratoriyaga kirish")
    nxt = (f"lab{n+1}.html", f"{n+1}-laboratoriya ishi") if n < 36 else ("mustaqil.html", "Mustaqil ta’lim")
    part = ("index.html#elektr", "Elektr va magnetizm") if elec else ("index.html#optika", "Optika")
    chips = [("c", L["sess"]), ("", f"{2 * len(L['sess'].split('–')) if '–' in L['sess'] else 2} akademik soat"), ("v", "Virtual laboratoriya"), ("a", "Adabiyot: " + ", ".join(f"[{r}]" for r in L["refs"]))]
    body = head(f"{n}-laboratoriya ishi: {strip_tags(L['short'])}", strip_tags(L["goal"])[:160]) + header(part[0]) + '<main id="main">' + hero([("index.html", "Bosh sahifa"), part, ("", f"{n}-ish")], f"{n}-laboratoriya ishi · {L['sess']}", L["title"], "", chips, read="maqsad,nazariya,tartib,misol,xavfsizlik") + f'<div class="container" style="padding-top:1rem"><div class="chips">{tn_chips(L["tn"])}</div></div>' + doc(toc, S, pager(prev, nxt)) + "</main>" + footer(sims=True)
    write(f"lab{n}.html", body)


# ---------------- Bosh sahifa ----------------
def lab_cards(labs):
    return "".join(card_link(f"lab{L['n']}.html", f"{L['n']}-ish · {L['sess']}", L["short"], strip_tags(L["goal"])[:115] + "…") for L in labs)


def index_page():
    sim_cards = "".join(f'<a class="card" href="lab{L["n"]}.html#model"><span class="badge">{L["n"]}-ish</span><h3>{L["short"]}</h3><p class="muted">Virtual laboratoriyani ochish →</p></a>' for L in LABS)
    steps = [("1", "Kirish nazorati", "Nazariya va himoya savollari bo‘yicha tayyorgarlik; texnika xavfsizligi."), ("2", "Yig‘ish", "Sxema yoki optik qurilmani yig‘ish va sozlash; o‘qituvchi tekshiruvi."), ("3", "O‘lchash", "Jadvalni to‘ldirish, takroriy o‘lchashlar; zarur bo‘lsa virtual laboratoriya."), ("4", "Qayta ishlash", "Grafik, eng kichik kvadratlar, xatoliklar — ichki kalkulyatorlar bilan."), ("5", "Xulosa va himoya", "Natijani nazariya va jadval qiymati bilan solishtirish, savollarga javob."), ("6", "Maktabga ko‘chirish", "Shu hodisani maktab o‘quvchilariga ko‘rsatish uchun namoyish tajribasini loyihalash.")]
    st = "".join(f'<article class="card"><span class="badge">QADAM {a}</span><h3>{b}</h3><p class="muted">{c}</p></article>' for a, b, c in steps)
    html = head("Bosh sahifa", "Fizpraktikum — elektr, magnetizm va optika bo‘yicha interaktiv laboratoriya qo‘llanmasi: 36 laboratoriya ishi, 36 virtual laboratoriya, 46 mustaqil ta’lim mavzusi.") + header() + f"""<main id="main">
<section class="hero"><div class="container"><div class="eyebrow">60530500 — Fizika · Bakalavriat · FP11234562</div><h1>Fizikani <span>o‘lchab, hisoblab va tushuntirib</span> o‘rganing.</h1><p class="lead">Elektrostatikadan Faradey induksiyasigacha, fotometriyadan Max–Zender interferometrigacha — fan dasturidagi 48 ta laboratoriya mashg‘ulotining to‘liq yo‘riqnomasi, virtual laboratoriyalar va xatoliklarni hisoblash vositalari. Baholash va rasmiy topshirish HEMIS orqali amalga oshiriladi.</p>
<div class="grid grid-4" style="margin-top:2rem"><div class="card"><div class="eyebrow">01</div><h3>36 laboratoriya ishi</h3><p class="muted">48 mashg‘ulot, 96 soat: nazariya, tartib, jadval, hisob, test.</p></div><div class="card"><div class="eyebrow">02</div><h3>36 virtual laboratoriya</h3><p class="muted">Ovozli namoyish bilan; jihoz yetishmaganda ham ishni bajarish mumkin.</p></div><div class="card"><div class="eyebrow">03</div><h3>46 mustaqil mavzu</h3><p class="muted">144 soat: taqdimot va keys-stadi yo‘riqnomalari.</p></div><div class="card"><div class="eyebrow">04</div><h3>Xatolik kalkulyatorlari</h3><p class="muted">Styudent usuli va eng kichik kvadratlar — har bir ishda.</p></div></div></div></section>
<section id="darslik" class="section"><div class="container"><div class="section-head"><div class="eyebrow">Qo‘llanma haqida</div><h2>Annotatsiya, kirish va baholash</h2><p class="muted">8 ECTS kredit (240 soat: laboratoriya 96, mustaqil ta’lim 144), 3–4-semestrlar. Qo‘llanma fan dasturi, ECTS va xalqaro sifat mezonlariga muvofiq tuzilgan.</p></div><div class="grid grid-3">
{card_link("annotatsiya.html", "Qo‘llanma haqida", "Annotatsiya va xalqaro standartlar", "Bibliografik ma’lumot, uch tildagi annotatsiya, ta’lim natijalari va sifat mezonlariga muvofiqlik.")}
{card_link("kirish.html", "Boshlash", "Laboratoriyaga kirish", "Laboratoriya tartibi, texnika xavfsizligi, hisobot shabloni, o‘lchash asboblari va xatoliklar nazariyasi.")}
{card_link("baholash.html", "Baholash", "JN · ON · YaN rubrikalari", "100 ballik tizim, saralash ballari, TN–nazorat matritsasi va baho kalkulyatori.")}
{card_link("oqituvchi.html", "O‘qituvchi", "O‘qituvchi uchun qo‘llanma", "Ikki semestrlik taqvim, mashg‘ulot rejasi, virtual laboratoriyalardan foydalanish va SI siyosati.")}
{card_link("mustaqil.html", "Mustaqil ta’lim", "46 mavzu va keys-stadi banki", "Har bir mavzu uchun soatlar, bog‘liq laboratoriya ishlari va taqdimot talablari; 10 ta eksperimental keys.")}
{card_link("glossariy.html", "Ilova", "Atamalar lug‘ati va vositalar", f"{len(other.GLOSS)} ta atama o‘zbekcha–inglizcha; Phyphox, PhET, Tracker, Python va boshqa bepul vositalar.")}
</div></div></section>
<section id="model" class="section"><div class="container"><div class="section-head"><div class="eyebrow">Ish sikli</div><h2>Har bir laboratoriya ishi olti bosqichda</h2><p class="muted">Bo‘lajak fizika o‘qituvchisi uchun oxirgi bosqich — hodisani maktabda ko‘rsatishni rejalashtirish (TN3, TN4, TN10).</p></div><div class="grid grid-3">{st}</div></div></section>
<section id="elektr" class="section"><div class="container"><div class="section-head"><div class="eyebrow">3-semestr · L1–L24 · 48 soat</div><h2>Elektr va magnetizm: 18 ta laboratoriya ishi</h2></div><div class="grid grid-3">{lab_cards(ELEC)}</div></div></section>
<section id="optika" class="section"><div class="container"><div class="section-head"><div class="eyebrow">4-semestr · L25–L48 · 48 soat</div><h2>Optika: 18 ta laboratoriya ishi</h2></div><div class="grid grid-3">{lab_cards(OPT)}</div></div></section>
<section id="simulyatorlar" class="section"><div class="container"><div class="section-head"><div class="eyebrow">Virtual laboratoriya</div><h2>Brauzerdagi laboratoriya stendlari</h2><p class="muted">Quyida ikkita stend; qolganlari tegishli laboratoriya ishi sahifasida. “Ovozli namoyish” tugmasi modelni avtomatik boshqarib, natijani tushuntiradi.</p></div>
{sim_block("kirch", "i1")}<div style="margin-top:1.4rem">{sim_block("grating", "i2")}</div>
<div class="grid grid-4" style="margin-top:1.5rem">{sim_cards}</div></div></section>
<section id="ai-lab" class="section"><div class="container"><div class="section-head"><div class="eyebrow">SI integratsiyasi</div><h2>Prompt generatori</h2><p class="muted">Laboratoriya ishi va rolni tanlang — tekshiruv qoidalari kiritilgan tayyor prompt hosil bo‘ladi.</p></div><div class="grid grid-2"><div class="card"><label class="control">Laboratoriya ishi<select id="p-topic">{''.join(f'<option>{L["n"]}. {strip_tags(L["short"])}</option>' for L in LABS)}</select></label><label class="control" style="margin-top:.8rem">Daraja<select id="p-level"><option>Boshlang‘ich</option><option selected>O‘rta</option><option>Ilg‘or</option></select></label><label class="control" style="margin-top:.8rem">Rol<select id="p-role"><option value="student">talaba</option><option value="teacher">o‘qituvchi</option></select></label><button class="primary" id="gen-prompt" style="margin-top:1rem" type="button">Prompt yaratish</button></div><div class="card"><div class="prompt-box"><button class="secondary copy" type="button" data-copy="p-out">Nusxalash</button><pre id="p-out">Prompt shu yerda ko‘rinadi…</pre></div></div></div></div></section>
<section id="hemis" class="section"><div class="container"><div class="card" style="border-left:4px solid #38bdf8"><div class="eyebrow">Rasmiy jarayonlar</div><h2>Baholash va topshiriqlarni topshirish — HEMIS’da</h2><p class="muted">Ushbu sayt ochiq o‘quv materiallari to‘plami bo‘lib, hisob yaratmaydi va baho qo‘ymaydi. 1-MT (5-hafta), 2-MT (10-hafta), oraliq nazorat testi (12-hafta) va yakuniy nazorat natijalari universitetning HEMIS axborot tizimida yuritiladi.</p></div></div></section>
<section id="muallif" class="section"><div class="container"><div class="card author-card"><img class="author-photo" src="img/author.jpg" width="480" height="566" alt="{AUTHOR_FULL}" loading="lazy"><div class="author-info"><div class="eyebrow">Mualliflar (fan dasturi tuzuvchilari)</div><h2>{AUTHOR_FULL}</h2><p class="author-role">Professor, PhD</p><p class="muted">Qo‘qon davlat universiteti, Fizika va astronomiya kafedrasi.</p><h3 style="margin-top:1.2rem">Urinova Kamala Kamildjonovna</h3><p class="muted">PhD, Fizika va astronomiya kafedrasi o‘qituvchisi (assistent).</p><p class="muted">Taqrizchilar: R. Rasulov, I. Qo‘qonboyev.</p></div></div></div></section>
</main>""" + footer(sims=True)
    write("index.html", html)


# ---------------- Annotatsiya ----------------
def annot_page():
    toc = [("bib", "Bibliografik ma’lumot"), ("ann", "Annotatsiya (uz/ru/en)"), ("soz", "So‘z boshi"), ("fan", "Fan ma’lumotlari"), ("tn", "Ta’lim natijalari"), ("std", "Xalqaro standartlar"), ("mund", "Mundarija"), ("foyd", "Foydalanish tavsiyalari")]
    S = []
    S.append(sec("bib", 1, "Bibliografik ma’lumot", f"""<p><b>Eshboltayev I.M., Urinova K.K.</b> Fizpraktikum: elektr, magnetizm va optika bo‘yicha interaktiv laboratoriya qo‘llanmasi (bakalavriat, 60530500 — Fizika). — Qo‘qon: Qo‘qon davlat universiteti, 2026.</p>
<p><b>Taqrizchilar:</b> R. Rasulov, I. Qo‘qonboyev.</p>
<p class="muted">Qo‘llanma “Fizpraktikum” fanining 2026/2027 o‘quv yili uchun tasdiqlangan o‘quv dasturi (FP11234562) asosida tayyorlangan. Litsenziya: CC BY-SA 4.0.</p>"""))
    S.append(sec("ann", 2, "Annotatsiya", """<h3>O‘zbekcha</h3><p>Elektron qo‘llanmada umumiy fizikaning “Elektr va magnetizm” va “Optika” bo‘limlari bo‘yicha 36 ta laboratoriya ishi (48 mashg‘ulot) bayon etilgan: elektrostatika, kondensatorlar, Om va Kirxgoff qonunlari, ko‘prik usuli, o‘lchov asboblarini kengaytirish, vakuumli diod, Amper kuchi, toklar magnit maydoni, Yer magnit maydoni, elektromagnit induksiya, elektroliz, tebranishlar, transformator va o‘zgaruvchan tok; fotometriya, sinish, linzalar va mikroskop, difraksiya, interferensiya, spektrlar, qutblanish, yutilish va interferometriya. Har bir ish maqsad, jihozlar, nazariya, bajarish tartibi, o‘lchash jadvali, xatoliklarni hisoblash, namunaviy hisob, virtual laboratoriya, xavfsizlik qoidalari, himoya savollari va testdan iborat. Qo‘llanma bo‘lajak fizika o‘qituvchilari va ularning ustozlari uchun mo‘ljallangan.</p>
<div lang="ru"><h3>Русский</h3><p>Электронное пособие содержит 36 лабораторных работ (48 занятий) по разделам «Электричество и магнетизм» и «Оптика» общего курса физики: электростатика, конденсаторы, законы Ома и Кирхгофа, мостовой метод, расширение пределов измерительных приборов, вакуумный диод, сила Ампера, магнитное поле токов и Земли, электромагнитная индукция, электролиз, колебания, трансформатор и переменный ток; фотометрия, преломление, линзы и микроскоп, дифракция, интерференция, спектры, поляризация, поглощение и интерферометрия. Каждая работа включает цель, оборудование, теорию, порядок выполнения, таблицу измерений, расчёт погрешностей, пример расчёта, виртуальную лабораторию, технику безопасности, контрольные вопросы и тест. Пособие предназначено для будущих учителей физики и преподавателей.</p></div>
<div lang="en"><h3>English</h3><p>This interactive e-manual contains 36 laboratory experiments (48 sessions) in the Electricity &amp; Magnetism and Optics parts of the general physics course: electrostatics, capacitors, Ohm’s and Kirchhoff’s laws, the Wheatstone bridge, meter range extension, the vacuum diode, the Ampère force, magnetic fields of currents and of the Earth, electromagnetic induction, electrolysis, oscillations, the transformer and AC circuits; photometry, refraction, lenses and the microscope, diffraction, interference, spectra, polarization, absorption and interferometry. Each experiment includes aims, apparatus, theory, procedure, a data table, uncertainty analysis, a worked example, a virtual lab, safety rules, viva questions and a quiz. It is intended for pre-service physics teachers and their instructors.</p></div>"""))
    S.append(sec("soz", 3, "So‘z boshi", "<p>Fizika — eksperimental fan: har bir qonun o‘lchash bilan tasdiqlanadi va har bir o‘lchash o‘z xatoligiga ega. Bo‘lajak fizika o‘qituvchisi tajribani nafaqat o‘zi to‘g‘ri bajarishi, balki uni maktab o‘quvchilariga xavfsiz, ko‘rgazmali va tushunarli ko‘rsata olishi kerak. Qo‘llanma shu ikki maqsadni birlashtiradi: har bir ish o‘lchash va xatoliklarni hisoblash bilan yakunlanadi, so‘ngra hodisani maktabda qanday ko‘rsatish haqidagi savol bilan davom etadi.</p><p>Virtual laboratoriyalar real jihozning o‘rnini bosmaydi, lekin tayyorgarlik, jihoz yetishmaganda ishni bajarish va natijalarni tekshirish uchun xizmat qiladi. Ovozli o‘qish va ovozli namoyish funksiyalari o‘qituvchiga katta ekranda ishlash imkonini beradi.</p>"))
    S.append(sec("fan", 4, "Fan ma’lumotlari", table(["Ko‘rsatkich", "Qiymat"], [["Fan kodi", "FP11234562"], ["Ta’lim yo‘nalishi", "60530500 — Fizika (kunduzgi)"], ["O‘quv yili / semestr", "2026/2027 / 3–4-semestrlar"], ["ECTS kreditlar", "8"], ["Jami yuklama", "240 soat: laboratoriya 96, mustaqil ta’lim 144"], ["Haftalik dars soatlari (dastur bo‘yicha)", "7"], ["Fan turi / tili", "Majburiy / o‘zbek"], ["O‘quv rejadagi raqam", "60530500 — 1.21"], ["Baholash", "JN 30 + ON 20 + YaN 50 = 100 ball; saralash 18/12/30"]]) + "<h3>Boshlang‘ich bilimlar (prerekvizitlar)</h3>" + ul(["Mexanika va molekulyar fizika (MM11212)", "Chiziqli algebra va analitik geometriya (CG1106)", "Matematik analiz (MA12312)", "Elektr va magnetizm (EL1306)"])))
    S.append(sec("tn", 5, "Ta’lim natijalari (TN1–TN15)", "<p>Fan maqsadi — bo‘lajak fizika o‘qituvchilarida elektr, magnetizm va optika hodisalarini tajribada kuzatish va tushunishga oid fenomenologik bilim, amaliy ko‘nikma va kasbiy malakalarni shakllantirish.</p>" + table(["Kod", "Natija", "Qo‘llanmadagi ishlar"], [[t, TN_TEXT[t], ", ".join(f'<a href="lab{L["n"]}.html">{L["n"]}</a>' for L in LABS if t in L["tn"]) or "Mustaqil ta’lim, keys-stadi, yozma ish"] for t in TN_TEXT])))
    S.append(sec("std", 6, "Xalqaro ta’lim talablariga muvofiqlik", table(["Mezon", "Talab", "Qo‘llanmada amalga oshirilishi"], [
        ["ECTS Users’ Guide (2015), Bolonya jarayoni", "Natijalar va kredit yuklamasi aniq", "8 ECTS = 240 soat; har bir ish TN kodlariga bog‘langan; mustaqil ta’lim soatlari ko‘rsatilgan"],
        ["Dublin deskriptorlari (1-bosqich — bakalavriat)", "Bilim, qo‘llash, xulosa, kommunikatsiya, o‘rganish ko‘nikmasi", "Nazariya (bilim), o‘lchash va hisob (qo‘llash), xatolik tahlili (xulosa), himoya va taqdimot (kommunikatsiya)"],
        ["Konstruktiv moslashuv (Biggs), Blum taksonomiyasi", "Natija → faoliyat → baholash mos", "TN–nazorat matritsasi; “eslash”dan “loyihalash”gacha topshiriqlar (keys K9)"],
        ["GUM (JCGM 100:2008) — o‘lchash noaniqligi", "Noaniqlikni bir xil qoidada ifodalash", "Styudent usuli, A va B turdagi noaniqliklar birlashtirilishi, kalkulyatorlar"],
        ["AAPT laboratoriya kurslari tavsiyalari (2014)", "Eksperimental modellashtirish, ma’lumot tahlili, kommunikatsiya", "Har bir ishda model ↔ o‘lchash taqqoslanadi, grafik va eng kichik kvadratlar, hisobot shabloni"],
        ["Quality Matters (QM) rubrikasi", "Aniq maqsadlar, ochiq baholash, faol o‘rganish", "Har bir sahifada maqsad va natijalar; rubrikalar ochiq; virtual laboratoriyalar va testlar"],
        ["WCAG 2.2 AA (veb-qulaylik)", "Kontrast, klaviatura, matnli muqobil", "“Asosiy mazmunga o‘tish” havolasi, aria-yorliqlar, ovozli o‘qish, kun/tun rejimi"],
        ["UNESCO OER tavsiyasi (2019), CC BY-SA 4.0", "Ochiq o‘quv resurslari", "Ro‘yxatdan o‘tishsiz kirish, manba kodi GitHub’da"],
        ["SI birliklar tizimi (BIPM)", "Kattalik va birliklarni bir xil yozish", "Barcha misollarda SI birliklari; amaliy birliklar (sm, mkTl, lk) aniq belgilangan"]])))
    mund = "".join(f'<li><a href="lab{L["n"]}.html">{L["n"]}-laboratoriya ishi ({L["sess"]}). {L["title"]}</a></li>' for L in LABS)
    S.append(sec("mund", 7, "Mundarija", f'<ol class="toc-list"><li><a href="kirish.html">Laboratoriyaga kirish: tartib, xavfsizlik, xatoliklar nazariyasi</a></li></ol><h3>Elektr va magnetizm</h3><ol>{"".join(f"<li><a href=\"lab{L['n']}.html\">{L['title']}</a> <span class=\"muted\">({L['sess']})</span></li>" for L in ELEC)}</ol><h3>Optika</h3><ol start="19">{"".join(f"<li><a href=\"lab{L['n']}.html\">{L['title']}</a> <span class=\"muted\">({L['sess']})</span></li>" for L in OPT)}</ol><h3>Ilovalar</h3>' + ul(['<a href="mustaqil.html">Mustaqil ta’lim va keys-stadi</a>', '<a href="baholash.html">Baholash mezonlari</a>', '<a href="oqituvchi.html">O‘qituvchi uchun qo‘llanma</a>', '<a href="glossariy.html">Atamalar lug‘ati</a>', '<a href="vositalar.html">Dasturiy va raqamli vositalar</a>'])))
    _ = mund
    S.append(sec("foyd", 8, "Foydalanish tavsiyalari", ul(["<b>Talabaga:</b> mashg‘ulotdan oldin nazariya va himoya savollarini o‘qing, virtual laboratoriyada tajribani “mashq” qiling; mashg‘ulotda jadvalni to‘ldiring; uyda kalkulyatorlar bilan natijani tekshirib, hisobot yozing.", "<b>O‘qituvchiga:</b> ovozli o‘qish va ovozli namoyishni proyektor yoki interaktiv doskada ishlating; jihoz yetishmaganda virtual laboratoriyani asosiy stend sifatida qo‘llang.", "<b>Tillar:</b> yuqoridagi UZ/RU/EN tugmalari butun saytni tarjima qiladi.", "<b>Bosma:</b> har bir sahifani brauzerning “Chop etish” funksiyasi bilan PDF sifatida saqlash mumkin."])))
    html = head("Qo‘llanma haqida", "Annotatsiya, fan ma’lumotlari, ta’lim natijalari va xalqaro standartlarga muvofiqlik") + header("annotatsiya.html") + '<main id="main">' + hero([("index.html", "Bosh sahifa"), ("", "Qo‘llanma haqida")], "Kirish", "Qo‘llanma haqida", "Fizpraktikum fanining o‘quv dasturi asosida tayyorlangan interaktiv laboratoriya qo‘llanmasi.", [("c", "8 ECTS"), ("c", "240 soat"), ("g", "TN1–TN15")], read="ann,soz") + doc(toc, S) + "</main>" + footer()
    write("annotatsiya.html", html)


# ---------------- Laboratoriyaga kirish ----------------
def kirish_page():
    toc = [("tartib", "Laboratoriya tartibi"), ("xavfsizlik", "Texnika xavfsizligi"), ("hisobot", "Hisobot shabloni"), ("asboblar", "O‘lchash asboblari"), ("xatolik", "Xatoliklar nazariyasi"), ("tasodifiy", "Takroriy o‘lchashlar"), ("bilvosita", "Bilvosita o‘lchash"), ("mnk", "Grafik va eng kichik kvadratlar"), ("kalk", "Kalkulyatorlar")]
    stud = table(["n", "2", "3", "4", "5", "6", "7", "8", "10", "15", "20", "∞"], [["t (P = 0,95)", "12,7", "4,30", "3,18", "2,78", "2,57", "2,45", "2,36", "2,26", "2,14", "2,09", "1,96"]])
    S = [
     sec("tartib", 1, "Laboratoriyada ishlash tartibi", ul(["Har bir mashg‘ulotga ishning nazariyasi va tartibini o‘qib, o‘lchash jadvalini tayyorlab keling — kirish nazoratidan (dopusk) o‘tmagan talaba ishga qo‘yilmaydi.", "Zanjir yoki optik qurilma o‘qituvchi tekshirmaguncha manbaga ulanmaydi.", "O‘lchash natijalari darhol, tuzatishsiz jadvalga (qoralama daftarga) yoziladi; noto‘g‘ri qiymat o‘chirilmaydi, chizib qo‘yiladi va sababi yoziladi.", "Ish oxirida jihozlar o‘chiriladi, joyi tartibga keltiriladi va o‘lchash natijalari o‘qituvchiga imzolatiladi.", "Hisobot keyingi mashg‘ulotgacha topshiriladi va himoya qilinadi."], True)),
     sec("xavfsizlik", 2, "Texnika xavfsizligi qoidalari", '<div class="callout warn"><b>Asosiy qoida</b>Kuchlanish ostidagi zanjirda hech qanday o‘zgartirish kiritilmaydi. Shikastlangan izolyatsiya, uchqun, hid yoki tutun sezilsa — darhol manbani o‘chiring va o‘qituvchiga xabar bering.</div><h3>Elektr qurilmalari bilan</h3>' + ul(["42 V dan yuqori kuchlanish (tarmoq 220 V, spektral naycha manbalari, anod manbalari) faqat o‘qituvchi ishtirokida.", "Ulanishlar faqat manba o‘chirilganda o‘zgartiriladi; ampermetr — ketma-ket, voltmetr — parallel.", "Kondensatorlar ishdan keyin rezistor orqali razryadlanadi; elektrolitik kondensatorning qutbiga rioya qilinadi.", "Ho‘l qo‘l bilan ishlash, simlarni tishlab tozalash, jihozni qoldirib ketish taqiqlanadi."]) + "<h3>Optik qurilmalar bilan</h3>" + ul(["Lazer nuri hech qachon ko‘zga va boshqalarga yo‘naltirilmaydi; nur yo‘li ko‘z sathidan pastda bo‘ladi; yaltiroq buyumlar olib qo‘yiladi.", "Simob lampasi ultrabinafsha nur chiqaradi — himoya qopqog‘i va filtr bilan ishlatiladi.", "Lampalar va issiq jihozlar sovimaguncha ushlanmaydi.", "Optik sirtlar barmoq bilan ushlanmaydi, faqat maxsus salfetka bilan artiladi."]) + "<h3>Kimyoviy moddalar bilan (15, 33, 34-ishlar)</h3>" + ul(["Mis kuporosi, kaliy permanganat — qo‘lqop va ko‘zoynak bilan; eritmalar lavabaga to‘kilmaydi.", "Shisha idishlar va naychalar ehtiyotkorlik bilan ishlatiladi."])),
     sec("hisobot", 3, "Laboratoriya ishi hisoboti shabloni", ul(["Titul: ish raqami va nomi, talaba F.I.Sh., guruh, sana.", "Ishning maqsadi (1–2 jumla).", "Jihozlar ro‘yxati (asboblarning aniqlik sinfi va chegaralari bilan).", "Qisqacha nazariya va hisob formulalari.", "Qurilma sxemasi yoki optik sxema.", "O‘lchash natijalari jadvali (o‘qituvchi imzosi bilan).", "Hisoblar: bitta to‘liq namunaviy hisob, qolganlari jadvalda.", "Grafiklar (o‘qlar nomi va birliklari, tajriba nuqtalari va moslashtirilgan chiziq).", "Xatoliklar hisobi va natija: \\(x=\\langle x\\rangle\\pm\\Delta x\\), \\(\\varepsilon=\\ldots\\,\\%\\), \\(P=0{,}95\\).", "Xulosa: natija jadval qiymati yoki nazariya bilan mosmi? Farq xatolik chegarasida bo‘lmasa — sababi.", "Pedagogik ilova: shu hodisani maktabda qanday ko‘rsatish mumkin (2–3 jumla)."], True)),
     sec("asboblar", 4, "O‘lchash asboblari va ularning xatoligi", "<p>Strelkali asbobning <b>aniqlik sinfi</b> \\(\\gamma\\) (shkalada 0,5; 1,0; 1,5; 2,5) — keltirilgan xatolik foizda: \\(\\Delta X=\\gamma X_m/100\\), \\(X_m\\) — shkala chegarasi. Raqamli multimetr xatoligi odatda “±(a % ko‘rsatkichdan + b birlik oxirgi xonadan)” ko‘rinishida beriladi. Chizg‘ich, shtangensirkul, mikrometr uchun asbob xatoligi — bo‘lim qiymatining yarmi (yoki pasportdagi qiymat).</p>" + table(["Asbob", "Odatiy xatolik"], [["Chizg‘ich (mm)", "0,5 mm"], ["Shtangensirkul", "0,05–0,1 mm"], ["Mikrometr", "0,01 mm"], ["Sekundomer (qo‘l)", "≈ 0,2 s (reaksiya)"], ["Strelkali ampermetr, 1,0 sinf, 1 A", "0,01 A"], ["Raqamli multimetr (DC V)", "±(0,5 % + 2 birlik)"], ["Termometr (0,5 °C bo‘lim)", "0,25–0,5 °C"], ["Transportir", "0,5°"]])),
     sec("xatolik", 5, "Xatoliklar nazariyasi asoslari", "<p><b>Absolyut xatolik</b> \\(\\Delta x\\) — o‘lchangan qiymatning haqiqiy qiymatdan mumkin bo‘lgan chetlanishi (kattalik birligida). <b>Nisbiy xatolik</b> \\(\\varepsilon=\\Delta x/\\langle x\\rangle\\) — odatda foizda.</p>" + table(["Turi", "Manbai", "Qanday kamaytiriladi"], [["Tizimli", "Asbob kalibrlanmagan, metodika (masalan, ampermetr ulash sxemasi), tashqi ta’sir (Yer maydoni)", "Kalibrlash, tuzatish kiritish, usulni o‘zgartirish, simmetrik o‘lchash (tok yo‘nalishini almashtirish)"], ["Tasodifiy", "Ko‘z bilan baholash, tebranish, shovqin", "Takroriy o‘lchash va o‘rtachalash"], ["Qo‘pol (promax)", "Noto‘g‘ri yozish, asbobni noto‘g‘ri o‘qish", "Shubhali qiymatni tekshirib, sababi bilan chiqarib tashlash"]]) + '<p>GUM tavsiyasiga ko‘ra statistik usulda topilgan noaniqlik <b>A turi</b>, asbob pasporti va boshqa ma’lumotlardan topilgani <b>B turi</b> deyiladi; ular kvadratik qo‘shiladi.</p>'),
     sec("tasodifiy", 6, "Takroriy (bevosita) o‘lchashlar — Styudent usuli", "$$\\langle x\\rangle=\\frac1n\\sum x_i,\\qquad S=\\sqrt{\\frac{\\sum(x_i-\\langle x\\rangle)^2}{n-1}},\\qquad \\Delta x_{tas}=t_{P,n}\\frac{S}{\\sqrt n},\\qquad \\Delta x=\\sqrt{\\Delta x_{tas}^2+\\Delta x_{asb}^2}.$$<p>Styudent koeffitsiyentlari (ishonchlilik \\(P=0{,}95\\)):</p>" + stud),
     sec("bilvosita", 7, "Bilvosita o‘lchash xatoligi", "<p>Agar \\(y=f(x_1,x_2,\\ldots)\\) bo‘lsa, mustaqil xatoliklar uchun</p>$$\\Delta y=\\sqrt{\\sum\\left(\\frac{\\partial f}{\\partial x_i}\\Delta x_i\\right)^2}.$$<p>Darajali bog‘lanish \\(y=Cx_1^ax_2^b\\) uchun nisbiy xatoliklar qulay: \\(\\varepsilon_y=\\sqrt{(a\\varepsilon_1)^2+(b\\varepsilon_2)^2}\\). Laboratoriya amaliyotida ko‘pincha yuqori baho — modullar yig‘indisi \\(\\varepsilon_y=|a|\\varepsilon_1+|b|\\varepsilon_2\\) ishlatiladi (bu qo‘llanmadagi formulalar shunday yozilgan).</p><div class=\"example\"><div class=\"ex-h\">Misol</div><div class=\"ex-b\"><p>\\(\\rho=\\pi d^2R/(4l)\\): \\(\\varepsilon_\\rho=2\\varepsilon_d+\\varepsilon_R+\\varepsilon_l\\). \\(d\\) 3 % xato bilan o‘lchansa, faqat shuning o‘zi 6 % beradi — eng aniq o‘lchanishi kerak bo‘lgan kattalikni shunday aniqlaymiz.</p></div></div><p><b>Yaxlitlash qoidasi:</b> xatolik 1–2 qiymatli raqamgacha yaxlitlanadi, natija xatolik bilan bir xil xonagacha: \\(\\rho=(1{,}07\\pm0{,}12)\\cdot10^{-6}\\) Om·m.</p>"),
     sec("mnk", 8, "Grafik va eng kichik kvadratlar usuli", "<p>Ko‘p qonunlar chiziqlashtirilib, to‘g‘ri chiziq \\(y=kx+b\\) ko‘rinishiga keltiriladi (masalan, \\(\\ln U\\) — \\(t\\), \\(\\operatorname{tg}\\varphi\\) — \\(I\\), \\(D_k^2\\) — \\(k\\)). Eng kichik kvadratlar usuli:</p>$$k=\\frac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{\\sum(x_i-\\bar x)^2},\\quad b=\\bar y-k\\bar x,\\quad S_k=\\sqrt{\\frac{\\sum(y_i-kx_i-b)^2}{(n-2)\\sum(x_i-\\bar x)^2}}.$$<p>Grafik talablari: o‘qlar nomi va birligi, qulay masshtab (grafik maydonning katta qismini egallasin), tajriba nuqtalari belgilar bilan, chiziq nuqtalar orasidan o‘tkaziladi (nuqtalarni birlashtirib emas).</p>"),
     sec("kalk", 9, "Kalkulyatorlar", f'<div class="grid grid-2">{ERR_CALC}{MNK_CALC}</div>')]
    html = head("Laboratoriyaga kirish", "Laboratoriya tartibi, texnika xavfsizligi, hisobot shabloni, o‘lchash asboblari va xatoliklar nazariyasi") + header("kirish.html") + '<main id="main">' + hero([("index.html", "Bosh sahifa"), ("", "Laboratoriyaga kirish")], "Boshlash", "Laboratoriyaga kirish: tartib, xavfsizlik va xatoliklar nazariyasi", "Har bir laboratoriya ishidan oldin o‘qilishi shart bo‘lgan umumiy bo‘lim (TN5, TN7, TN13, TN15).", [("c", "TN5"), ("c", "TN7"), ("c", "TN15")], read="tartib,xavfsizlik,hisobot,xatolik") + doc(toc, S, pager(("annotatsiya.html", "Qo‘llanma haqida"), ("lab1.html", "1-laboratoriya ishi"))) + "</main>" + footer()
    write("kirish.html", html)


# ---------------- Mustaqil ta'lim ----------------
def mustaqil_page():
    toc = [("talab", "Talablar va muddatlar"), ("mavzular", "46 ta mavzu"), ("keys", "Keys-stadi banki"), ("taqdimot", "Taqdimot rubrikasi")]
    total = sum(h for _, h, _, _ in other.MT)
    items = "".join(f'<details class="mt-item"><summary><b>{i}.</b> {t} <span class="chip">{h} soat</span></summary>{ul(pts)}<p class="muted">Bog‘liq laboratoriya ishlari: {", ".join(f"<a href=\"lab{n}.html\">{n}</a>" for n in labs)}.</p></details>' for i, (t, h, labs, pts) in enumerate(other.MT, 1))
    keys = "".join(f'<div class="example"><div class="ex-h">{t}</div><div class="ex-b"><p>{d}</p><p class="muted">Bog‘liq ishlar: {", ".join(f"<a href=\"lab{n}.html\">{n}</a>" for n in labs)}.</p></div></div>' for t, d, labs in other.KEYS)
    S = [sec("talab", 1, "Mustaqil ta’lim talablari", f"<p>Mustaqil ta’lim hajmi — {total} soat (dastur bo‘yicha 144 soat). Har bir mavzu bo‘yicha taqdimot tayyorlanadi; JN tarkibida ikkita topshiriq baholanadi:</p>" + table(["Topshiriq", "Ball", "Muddat", "Mazmuni"], [["1-MT: mustaqil ta’lim taqdimoti va himoyasi", "5", "5-hafta (HEMIS)", "Tanlangan mavzu bo‘yicha 10–15 slayd: hodisa, tajriba sxemasi, formulalar, maktabda namoyish usuli, manbalar"], ["2-MT: keys-stadi tahlili", "5", "10-hafta (HEMIS)", "Quyidagi banklardan bitta eksperimental muammoga asoslangan yechim: sabablar, hisob, tajriba rejasi, xulosa"]])),
         sec("mavzular", 2, "Mustaqil ta’lim mavzulari", items),
         sec("keys", 3, "Keys-stadi banki (2-MT)", keys),
         sec("taqdimot", 4, "Taqdimot va keys rubrikasi (fan dasturi bo‘yicha)", table(["Daraja", "1-MT taqdimot (5 ball)", "2-MT keys-stadi (5 ball)"], [["Yuqori (5)", "Ilmiy-metodik adabiyotlardan foydalanib mukammal tayyorlangan; jarayonlar va eksperimental chizmalar izchil bayon qilingan, erkin fikr bildiradi", "Muammoli vaziyat chuqur tahlil qilingan, fizik qonuniyatlar asosida to‘liq va ijodiy yechim; xulosalar ilmiy asoslangan"], ["Yetarli (4)", "Tushunarli, ammo bazaviy darsliklar bilan cheklangan; himoyada matnga qaram, kichik noaniqliklar", "Asboblarni qo‘llash yoki qonunlarni topishda qisman to‘g‘ri yechim, mustaqil yondashuv yetishmaydi"], ["Minimal (3)", "Yuzaki; tajriba sxemalari yo‘q, mavzuni tushuntira olmaydi", "Mohiyat to‘liq anglanmagan, umumiy so‘zlar, aniq eksperimental yechim yo‘q"], ["Erishilmagan (0)", "Tayyorlanmagan yoki 5-haftagacha HEMIS’ga yuklanmagan", "Bajarilmagan yoki 10-haftagacha topshirilmagan"]]))]
    html = head("Mustaqil ta’lim", "46 ta mustaqil ta’lim mavzusi, taqdimot va keys-stadi topshiriqlari") + header("mustaqil.html") + '<main id="main">' + hero([("index.html", "Bosh sahifa"), ("", "Mustaqil ta’lim")], "144 soat", "Mustaqil ta’lim topshiriqlari", "Fan dasturidagi 46 mavzu, bog‘liq laboratoriya ishlari va 10 ta eksperimental keys.", [("c", "1-MT · 5-hafta"), ("c", "2-MT · 10-hafta")], read="talab,keys") + doc(toc, S) + "</main>" + footer()
    write("mustaqil.html", html)


# ---------------- Baholash ----------------
def baholash_page():
    toc = [("tartib", "Umumiy tartib"), ("matritsa", "TN–nazorat matritsasi"), ("jn", "Joriy nazorat (30)"), ("on", "Oraliq nazorat (20)"), ("yn", "Yakuniy nazorat (50)"), ("baho", "Yakuniy baho"), ("kalk", "Baho kalkulyatori")]
    mat = table(["TN", "Natija", "JN", "ON", "YaN"], [[t, TN_TEXT[t]] + [f'<span class="{"plus" if v == "+" else "minus"}">{v}</span>' for v in TN_MATRIX[t]] for t in TN_TEXT])
    S = [sec("tartib", 1, "Baholashning umumiy tartibi", table(["Nazorat turi", "Maksimal ball", "Saralash bali", "Vosita"], [["Joriy nazorat (JN)", "30", "18", "1-MT: taqdimot va himoya (5); DF: laboratoriya mashg‘ulotlaridagi faollik (20); 2-MT: keys-stadi (5)"], ["Oraliq nazorat (ON)", "20", "12", "12-hafta, HEMIS’da 20 savolli test"], ["Yakuniy nazorat (YaN)", "50", "30", "1-kurslar uchun yozma ish; yuqori kurslar uchun Universitet Kengashi belgilagan shakl: 3 ta nazariy/eksperimental savol + 1 ta amaliy keys"], ["Jami", "100", "—", ""]]) + '<div class="callout warn"><b>Muhim</b>Har bir nazorat turidan ajratilgan ballning kamida 60 % i to‘planishi shart. Bir nazorat turidagi yetishmagan ball boshqasidagi yuqori ball hisobiga qoplanmaydi.</div>'),
         sec("matritsa", 2, "Ta’lim natijasi — baholash vositasi muvofiqligi", mat),
         sec("jn", 3, "Joriy nazorat rubrikasi — 30 ball", table(["Mezon", "Ball", "Yuqori", "Yetarli", "Minimal", "Erishilmagan"], [
             ["Laboratoriya mashg‘ulotlaridagi faollik: zanjir/qurilmani yig‘ish, o‘lchash, xatoliklarni hisoblash", "20", "Sxemalar va optik qurilmalarni bexato yig‘adi, asboblardan (osillograf, multimetr, mikroskop) mustaqil foydalanadi, xatoliklarni to‘g‘ri hisoblab, aniq grafiklar chizadi va xulosalaydi", "Asosiy zanjir/qurilmani yig‘adi, lekin sozlash, xatolik hisobi yoki grafik tahlilida o‘qituvchi yordamiga tayanadi", "Faqat sodda qurilmalarni ishlata oladi; yig‘ish va hisobda jiddiy xatolar, fenomenologik tahlil yo‘q", "Tajribada ishtirok etmaydi, asboblardan foydalana olmaydi, xavfsizlik qoidalarini bilmaydi"],
             ["1-MT: taqdimot va himoya", "5", "Mukammal, ilmiy-metodik manbalar bilan, izchil va erkin himoya", "Tushunarli, bazaviy darsliklar bilan cheklangan", "Yuzaki, tajriba sxemalari yo‘q", "Tayyorlanmagan yoki 5-haftada yuklanmagan"],
             ["2-MT: keys-stadi", "5", "Chuqur tahlil, ijodiy va asoslangan yechim", "Qisman to‘g‘ri, mustaqillik yetishmaydi", "Mohiyat anglanmagan", "Bajarilmagan yoki 10-haftada topshirilmagan"]])),
         sec("on", 4, "Oraliq nazorat rubrikasi — 20 ball", table(["Daraja", "To‘g‘ri javoblar (20 tadan)", "Tavsif"], [["Yuqori", "18–20 (90–100 %)", "Eksperimental metodlarni to‘liq tushunadi va bilimni to‘g‘ri ifodalaydi"], ["Yetarli", "14–17 (70–89,9 %)", "Asboblar ishlash prinsipini biladi, murakkab hisoblarda adashadi"], ["Minimal", "12–13 (60–69,9 %)", "Yuzaki tasavvur, asosan sodda savollarni yechgan"], ["Erishilmagan", "0–11 (0–59,9 %)", "Dastur o‘zlashtirilmagan, o‘lchash usullarini tushunmaydi"]]) + f'<p class="muted">Tayyorgarlik uchun har bir laboratoriya ishidagi nazorat testlaridan foydalaning (jami {10 * len(LABS)} savol).</p>'),
         sec("yn", 5, "Yakuniy nazorat rubrikasi — 50 ball", table(["Topshiriq", "Ball", "Yuqori", "Yetarli", "Minimal", "Erishilmagan"], [["Eksperimental-nazariy savollar (1–3), har biri 10 ball: tajriba usuli va asboblar ishlash prinsipi (4) + fizik va metrologik atamalar (3) + xatoliklar nazariyasi va mantiqiy xulosa (3)", "30", "27–30", "21–26", "18–20", "0–17"], ["Laboratoriya keysi (4-savol): tajriba ma’lumotlarini qayta ishlash, sxema yig‘ish muammolari yoki xatoliklarni hisoblash; grafik tahlil", "20", "18–20", "14–17", "12–13", "0–11"]]) + "<h3>Namunaviy keys (4-savol)</h3><p>Uitston ko‘prigida \\(R_0=100\\) Om bo‘lganda muvozanat 5 marta o‘lchandi: \\(l_1=\\) 41,2; 41,5; 40,9; 41,3; 41,1 sm (\\(L=100\\) sm, \\(\\Delta l_{asb}=0{,}1\\) sm). \\(R_x\\) ni, tasodifiy va to‘liq xatolikni hisoblang; muvozanat reoxord chetiga yaqin bo‘lsa, aniqlik qanday o‘zgarishini asoslang. (<a href=\"lab4.html\">4-ish</a>, <a href=\"kirish.html#tasodifiy\">Styudent usuli</a>.)</p>"),
         sec("baho", 6, "Fan bo‘yicha bahoni aniqlash", table(["Jami ball", "Baho", "Tavsif"], [["90–100", "A’lo", "Ta’lim natijalarini yuqori darajada egallagan; bilimni mustaqil tahlil qiladi va yangi vaziyatlarda qo‘llaydi."], ["70–89,9", "Yaxshi", "Asosiy natijalarni barqaror egallagan; amaliy vaziyatlarda qo‘llaydi."], ["60–69,9", "Qoniqarli", "Minimal natijalarga erishgan, tahlil va asoslashda cheklovlar bor."], ["0–59,9", "Qoniqarsiz", "Minimal natijalarga yetarli darajada erishmagan."]])),
         sec("kalk", 7, "Baho kalkulyatori", """<div id="grade-calc" class="two"><div>
<label class="control">1-MT taqdimot (0–5) <output data-for="jn-mt1"></output><input id="jn-mt1" type="range" min="0" max="5" step="0.5" value="4"></label>
<label class="control">DF laboratoriyadagi faollik (0–20) <output data-for="jn-df"></output><input id="jn-df" type="range" min="0" max="20" step="0.5" value="15"></label>
<label class="control">2-MT keys-stadi (0–5) <output data-for="jn-mt2"></output><input id="jn-mt2" type="range" min="0" max="5" step="0.5" value="4"></label>
<label class="control">Oraliq nazorat (0–20) <output data-for="on"></output><input id="on" type="range" min="0" max="20" step="1" value="15"></label>
<label class="control">Yakuniy nazorat (0–50) <output data-for="yn"></output><input id="yn" type="range" min="0" max="50" step="1" value="38"></label></div>
<div class="card kpi"><div class="l">Jami</div><div class="calc-out" id="calc-total"></div><div class="l" style="margin-top:.6rem">Baho</div><div class="v" id="calc-grade" style="font-size:1.3rem"></div><p class="muted" id="calc-detail" style="font-size:.8rem"></p></div></div><p class="muted" style="font-size:.85rem">Kalkulyator ma’lumot uchun; rasmiy ball HEMIS’da hisoblanadi.</p>""")]
    html = head("Baholash", "JN, ON, YaN rubrikalari, TN–nazorat matritsasi va baho kalkulyatori") + header("baholash.html") + '<main id="main">' + hero([("index.html", "Bosh sahifa"), ("", "Baholash")], "Baholash · 100 ball", "Talaba bilimini baholash mezonlari", "Fan dasturidagi baholash tartibi, rubrikalar va ta’lim natijalari bilan muvofiqlik.", [("c", "JN 30 / 18"), ("c", "ON 20 / 12"), ("c", "YaN 50 / 30")]) + doc(toc, S) + "</main>" + footer()
    write("baholash.html", html)


# ---------------- O'qituvchi uchun ----------------
def teacher_page():
    toc = [("taqvim", "Tavsiya etiladigan taqvim"), ("dars", "Mashg‘ulot tuzilishi"), ("virtual", "Virtual laboratoriyalar"), ("ovoz", "Ovoz, til va doska"), ("si", "SI siyosati"), ("moslash", "Moslashtirish")]
    S = [sec("taqvim", 1, "Tavsiya etiladigan taqvim (ikki semestr)", '<p class="muted">Fan dasturida mashg‘ulotlarning haftalarga taqsimoti ko‘rsatilmagan; quyidagi jadval dasturdagi nazorat muddatlariga (5, 10, 12-haftalar) mos tavsiyadir. Kafedra jadvaliga qarab o‘zgartiriladi.</p>' + table(["Hafta", "3-semestr (elektr va magnetizm)", "4-semestr (optika)", "Izoh"], [[str(w), a, b, nt or "—"] for w, a, b, nt in other.CAL]) + "<h3>Mashg‘ulotlar va laboratoriya ishlari muvofiqligi</h3>" + table(["Mashg‘ulot", "Laboratoriya ishi"], [[L["sess"], f'<a href="lab{L["n"]}.html">{L["n"]}. {L["short"]}</a>'] for L in LABS])),
         sec("dars", 2, "80 daqiqalik mashg‘ulot tuzilishi", table(["Bosqich", "Vaqt", "O‘qituvchi faoliyati", "Qo‘llanmadagi bo‘lim"], [["Kirish nazorati", "10 daq", "2–3 ta himoya savoli, xavfsizlik yo‘riqnomasi", "Himoya savollari, xavfsizlik"], ["Yig‘ish va sozlash", "15 daq", "Sxemani tekshirish va ruxsat berish", "Bajarish tartibi"], ["O‘lchash", "30 daq", "Kuzatish, maslahat; jihoz yetishmasa virtual stend", "Jadval, virtual laboratoriya"], ["Qayta ishlash", "15 daq", "Grafik va xatolik hisobini tekshirish", "Kalkulyatorlar"], ["Himoya", "10 daq", "Xulosa va savollar; DF bali", "Nazorat testi"]]) + '<p>Ikki mashg‘ulotga mo‘ljallangan ishlarda (masalan, L1–L2) birinchi mashg‘ulot o‘lchashga, ikkinchisi qo‘shimcha tajribalar, qayta ishlash va himoyaga ajratiladi.</p>'),
         sec("virtual", 3, "Virtual laboratoriyalardan foydalanish", ul(["<b>Tayyorgarlik:</b> talabalar uyda virtual stendda o‘lchash ketma-ketligini mashq qiladi va kutilayotgan natijani biladi.", "<b>Jihoz yetishmasa:</b> virtual stend asosiy o‘lchash vositasi bo‘ladi; “asbob ko‘rsatishi” qiymatlarida tasodifiy chetlanish bor, shuning uchun takroriy o‘lchashlar va Styudent usuli ma’noli qoladi.", "<b>Taqqoslash:</b> real o‘lchash natijasi virtual model bilan solishtiriladi — farq tizimli xatolikni aniqlashga yordam beradi.", "<b>Namoyish:</b> “Ovozli namoyish” tugmasi modelni avtomatik boshqaradi va o‘zbek tilida tushuntiradi — keyin talabalar o‘zlari parametrlarni o‘zgartiradi."])),
         sec("ovoz", 4, "Ovozli o‘qish, tillar va interaktiv doska", ul(["<b>Tinglash</b> tugmasi (sahifa yuqorisida) ishning maqsadi, nazariyasi, tartibi, namunaviy hisobi va xavfsizlik qoidalarini o‘qiydi. Pauza, oldingi/keyingi, to‘xtatish tugmalari bor; istalgan xatboshini bosib “Shu yerdan o‘qish” mumkin; Esc — to‘xtatish.", "O‘zbekcha ovoz barcha qurilmalarda bir xil neyron ovozda (oldindan tayyorlangan MP3); rus va ingliz tillarida brauzer ovozi ishlatiladi.", "<b>UZ/RU/EN</b> tugmalari butun saytni tarjima qiladi (testlar bilan birga).", "Interaktiv doskada brauzerni to‘liq ekranga o‘tkazing (F11); sayt katta ekranga avtomatik moslashadi."])),
         sec("si", 5, "Sun’iy intellektdan foydalanish siyosati", ul(["SI hisobotni yozib berish uchun emas, tushunish va tekshirish uchun ishlatiladi.", "Hisobotdagi barcha o‘lchash va hisoblar talabaning o‘zi tomonidan bajariladi; SI dan foydalanilgan bo‘lsa, prompt ilova qilinadi.", "Himoyada talaba har bir formula va sonni izohlay olishi shart."])),
         sec("moslash", 6, "Qo‘llanmani moslashtirish", "<p>Mazmun <code>gen/</code> papkasidagi Python fayllarida saqlanadi (laboratoriya ishlari: <code>labs_e1.py</code>, <code>labs_e2.py</code>, <code>labs_o1.py</code>, <code>labs_o2.py</code>). O‘zgartirishdan keyin <code>python3 gen/build.py .</code> buyrug‘i bilan sahifalar qayta yaratiladi; GitHub’ga yuklangach o‘zbekcha ovoz avtomatik yangilanadi.</p>")]
    html = head("O‘qituvchi uchun", "Taqvim, mashg‘ulot tuzilishi, virtual laboratoriyalar va SI siyosati") + header("oqituvchi.html") + '<main id="main">' + hero([("index.html", "Bosh sahifa"), ("", "O‘qituvchi uchun")], "Metodik qo‘llanma", "O‘qituvchi uchun qo‘llanma", "Ikki semestrlik taqvim, mashg‘ulot rejasi va raqamli vositalardan foydalanish.", [("c", "48 mashg‘ulot"), ("c", "96 soat")]) + doc(toc, S) + "</main>" + footer()
    write("oqituvchi.html", html)


def gloss_page():
    rows = [[f"<b>{a}</b>", f'<i lang="en">{b}</i>', c, f'<a href="lab{n}.html">{n}-ish</a>' if n else '<a href="kirish.html#xatolik">Kirish</a>'] for a, b, c, n in sorted(other.GLOSS, key=lambda x: x[0])]
    S = [sec("lugat", None, f"Atamalar ({len(rows)})", '<label class="control" style="max-width:420px">Qidirish<input type="search" data-filter="gloss-t" data-count="gloss-n" placeholder="atama yoki inglizcha"></label><p class="muted" id="gloss-n"></p>' + table(["Atama", "English", "Ta’rif", "Ish"], rows).replace('<table class="t">', '<table class="t" id="gloss-t">'))]
    html = head("Atamalar lug‘ati", "Elektr, magnetizm va optika atamalari: o‘zbekcha–inglizcha") + header("glossariy.html") + '<main id="main">' + hero([("index.html", "Bosh sahifa"), ("", "Lug‘at")], "Ilova", "Atamalar lug‘ati", "O‘zbekcha atama, inglizcha muqobili, qisqa ta’rif va laboratoriya ishi.", []) + doc([("lugat", "Atamalar")], S) + "</main>" + footer()
    write("glossariy.html", html)


def tools_page():
    rows = [[f"<b>{a}</b>", b, c, f'<a href="{d}" rel="noopener" target="_blank">{d.replace("https://", "")}</a>'] for a, b, c, d in other.TOOLS]
    S = [sec("vosita", None, "Dasturiy va raqamli vositalar", table(["Vosita", "Qo‘llanilishi", "Litsenziya", "Havola"], rows) + '<div class="callout info"><b>Smartfon — cho‘ntakdagi laboratoriya</b>Phyphox ilovasi magnitometr (10, 12, 13-ishlar), yorug‘lik datchigi (19, 20, 31, 32-ishlar) va kamera (27-ish) yordamida maktabda jihozsiz tajriba o‘tkazish imkonini beradi (TN3, TN10).</div>')]
    html = head("Vositalar", "Laboratoriya ishlari uchun bepul dasturiy va raqamli vositalar") + header("glossariy.html") + '<main id="main">' + hero([("index.html", "Bosh sahifa"), ("", "Vositalar")], "Ilova", "Dasturiy va raqamli vositalar", "Ma’lumotlarni yig‘ish, qayta ishlash va modellashtirish uchun bepul vositalar.", []) + doc([("vosita", "Vositalar")], S) + "</main>" + footer()
    write("vositalar.html", html)


def notfound():
    html = head("Sahifa topilmadi", "404") + header() + '<main id="main">' + hero([("index.html", "Bosh sahifa")], "404", "Sahifa topilmadi", "Manzil noto‘g‘ri yoki sahifa ko‘chirilgan. Bosh sahifaga qayting.", []) + "</main>" + footer()
    write("404.html", html)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for L in LABS:
        lab_page(L)
    index_page(); annot_page(); kirish_page(); mustaqil_page(); baholash_page(); teacher_page(); gloss_page(); tools_page(); notfound()
    print(f"Tayyor: {len(LABS)} laboratoriya ishi + 9 sahifa → {OUT}")
