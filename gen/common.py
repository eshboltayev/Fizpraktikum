"""Umumiy shablonlar: sarlavha, navigatsiya, footer, bo'limlar."""
import html as _h

SITE = "Fizpraktikum"
AUTHOR = "I.M. Eshboltayev, K.K. Urinova"
AUTHOR_FULL = "Eshboltayev Iqbol Mamirjonovich"

NAV = [
    ("annotatsiya.html", "Darslik haqida"),
    ("kirish.html", "Laboratoriyaga kirish"),
    ("index.html#elektr", "Elektr va magnetizm"),
    ("index.html#optika", "Optika"),
    ("mustaqil.html", "Mustaqil ta’lim"),
    ("index.html#simulyatorlar", "Virtual laboratoriya"),
    ("baholash.html", "Baholash"),
    ("oqituvchi.html", "O‘qituvchi uchun"),
    ("glossariy.html", "Lug‘at"),
    ("index.html#muallif", "Mualliflar"),
]

# Fan dasturidagi adabiyotlar: asosiy [1]–[5], qo'shimcha [Q1]–[Q6]
BASE_LIT = {
    1: "Orifjonov S. Elektromagnitizm. — Toshkent, 2011.",
    2: "Toshxonova J.A. va boshq. Fizikadan praktikum. Elektr va magnetizm. — Toshkent, 2006.",
    3: "O‘lmasova M. va boshq. Fizika (Elektr, optika, atom va yadro fizikasi). — Toshkent, 2007.",
    4: "Eshboltayev I. va boshq. Umumiy fizikadan laboratoriya mashg‘ulotlari. — 2023.",
    5: "Nurmatov N. Elektr va magnetizm fanidan praktikum. — 2021.",
    "Q1": "Izbosarov B.F., Kamolov I.P. Elektromagnetizm. — Toshkent, 2006.",
    "Q3": "Nazarov O‘.Q. Umumiy fizika kursi. 2-jild (Elektr va elektromagnetizm). — Toshkent: O‘zbekiston, 2002.",
    "Q4": "Polvonov S. Umumiy fizika kursidan masalalar to‘plami. — Toshkent: Noshir, 2012.",
    "Q5": "Ismatullayev P., Qodirova Sh., G‘oziyev G‘. Elektr o‘lchash asboblarini rostlash va ta’mirlash. — Toshkent: Sharq, 2007.",
    "Q6": "O‘lmasova M. va boshq. Fizika (Elektr, optika, atom va yadro fizikasi). — T.: O‘qituvchi, 1995.",
}
INTL = {
    "hrw": "Halliday D., Resnick R., Walker J. Fundamentals of Physics. 12th ed. — Hoboken: Wiley, 2021.",
    "purcell": "Purcell E.M., Morin D.J. Electricity and Magnetism. 3rd ed. — Cambridge University Press, 2013.",
    "griffiths": "Griffiths D.J. Introduction to Electrodynamics. 4th ed. — Cambridge University Press, 2017.",
    "horowitz": "Horowitz P., Hill W. The Art of Electronics. 3rd ed. — Cambridge University Press, 2015.",
    "hecht": "Hecht E. Optics. 5th ed. — Pearson, 2017.",
    "pedrotti": "Pedrotti F.L., Pedrotti L.M., Pedrotti L.S. Introduction to Optics. 3rd ed. — Cambridge University Press, 2017.",
    "born": "Born M., Wolf E. Principles of Optics. 7th ed. — Cambridge University Press, 1999.",
    "taylor": "Taylor J.R. An Introduction to Error Analysis. 2nd ed. — Sausalito: University Science Books, 1997.",
    "kirkup": "Kirkup L. Experimental Methods for Science and Engineering Students. 2nd ed. — Cambridge University Press, 2019.",
    "melissinos": "Melissinos A.C., Napolitano J. Experiments in Modern Physics. 2nd ed. — Academic Press, 2003.",
    "gum": "JCGM 100:2008. Evaluation of measurement data — Guide to the expression of uncertainty in measurement (GUM). — BIPM, 2008.",
}

HEAD_JS = r"""<script>(function(){var d=document.documentElement;try{d.dataset.theme=localStorage.getItem('yaf-theme')||'dark';}catch(e){d.dataset.theme='dark';}var m=document.cookie.match(/googtrans=\/uz\/(ru|en)/);if(m){d.classList.add('alif-old');d.dataset.tl=m[1];}})();</script>"""
esc = _h.escape
INTL = {k: f'<span lang="en">{v}</span>' for k, v in INTL.items()}


def head(title, desc, katex=True, extra_css=True):
    k = ""
    if katex:
        k = ('<link rel="stylesheet" href="vendor/katex/katex.min.css">\n'
             '<script defer src="vendor/katex/katex.min.js"></script>\n'
             '<script defer src="vendor/katex/contrib/auto-render.min.js"></script>\n')
    return f"""<!doctype html>
<html lang="uz">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} — {SITE}</title>
<meta name="description" content="{esc(desc)}">
<meta name="author" content="{AUTHOR_FULL}">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:type" content="website">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
{HEAD_JS}
<script src="js/alifbo.js"></script>
<link rel="stylesheet" href="css/styles.css?v=5">
{'<link rel="stylesheet" href="css/darslik.css?v=5">' if extra_css else ''}
{k}</head>
<body>
<a class="skip-link" href="#main">Asosiy mazmunga o‘tish</a>
"""


def header(active=""):
    links = "".join(
        f'<a href="{h}"{" aria-current=\"page\"" if h == active else ""}>{t}</a>' for h, t in NAV)
    return f"""<header class="site-header"><div class="container navbar"><a class="brand" href="index.html"><span class="brand-mark"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/></svg></span><span>FIZPRAKTIKUM<small>Elektr, magnetizm va optika · Interaktiv laboratoriya</small></span></a><nav class="nav-links" aria-label="Asosiy navigatsiya">{links}</nav><div class="hdr-tools notranslate" translate="no"><a class="portal-btn" href="https://eshboltayev.github.io/Elektron_Darsliklar/" title="Darslikdan chiqish — elektron darsliklar portaliga qaytish" aria-label="Darslikdan chiqish — elektron darsliklar portaliga qaytish"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg><span>Portal</span></a><div class="lang-switch" role="group" aria-label="Til / Язык / Language"><button type="button" data-lang="uz">UZ</button><button type="button" data-lang="ru">RU</button><button type="button" data-lang="en">EN</button></div><button class="icon-btn theme-btn" type="button" aria-label="Kun va tun rejimini almashtirish" title="Kun / tun rejimi"><svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button></div><button class="menu-toggle" type="button" aria-label="Menyuni ochish" aria-expanded="false">☰</button></div></header>
"""


def footer(sims=False):
    return f"""<footer class="footer"><div class="container">{SITE} — elektr, magnetizm va optika bo‘yicha ochiq elektron laboratoriya qo‘llanmasi · Qo‘qon davlat universiteti, Fizika va astronomiya kafedrasi · 2026 · Mualliflar: <a href="index.html#muallif">{AUTHOR}</a> · Litsenziya: <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.uz" rel="license">CC BY-SA 4.0</a><br>Rasmiy topshiriqlar va baholash faqat HEMIS axborot tizimida yuritiladi.</div></footer>
{'<script src="js/sims.js" defer></script>' if sims else ''}
<script src="js/app.js" defer></script>
</body></html>
"""


SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>'


def hero(crumbs, badge, title, lead="", chips=(), read=None):
    cr = " / ".join(f'<a href="{h}">{t}</a>' if h else f"<span>{t}</span>" for h, t in crumbs)
    ch = "".join(f'<span class="chip {cls}">{t}</span>' for cls, t in chips)
    tools = f'<div class="hero-tools"><button class="voice-btn" type="button" data-read="{read}" aria-label="Mavzuni ovozli tinglash">{SPEAKER}<span>Tinglash</span></button></div>' if read else ""
    return f"""<section class="page-hero"><div class="container">{tools}<nav class="crumbs" aria-label="Yo‘l">{cr}</nav><div class="eyebrow" style="margin-top:1rem">{badge}</div><h1>{title}</h1>{f'<p class="lead">{lead}</p>' if lead else ''}<div class="chips">{ch}</div></div></section>
"""


def sec(sid, num, title, body):
    n = f'<span class="num">{num}</span>' if num else ""
    return f'<section class="doc-sec" id="{sid}"><h2>{n}{title}</h2>{body}</section>\n'


def doc(toc, sections, pager=""):
    t = "".join(f'<li><a href="#{i}">{n}</a></li>' for i, n in toc)
    return f"""<div class="container doc-layout"><aside class="toc" aria-label="Sahifa mundarijasi"><h2>Mundarija</h2><ol>{t}</ol></aside><div class="doc">{''.join(sections)}{pager}</div></div>
"""


def quiz(items, qid):
    out = []
    for i, (qs, opts, a, ex) in enumerate(items):
        o = "".join(f'<label><input type="radio" name="{qid}-{i}" value="{j}"> <span>{"ABCD"[j]}) {t}</span></label>' for j, t in enumerate(opts))
        out.append(f'<div class="q" data-a="{a}"><p>{i+1}. {qs}</p>{o}<div class="fb">To‘g‘ri javob: <b>{"ABCD"[a]}</b>. {ex}</div></div>')
    return f'<div class="quiz">{"".join(out)}<div class="actions"><button class="primary" type="button" data-check>Tekshirish</button><button class="secondary" type="button" data-reset-quiz>Qayta boshlash</button></div><div class="quiz-result" aria-live="polite"></div></div>'


def prompt(pid, text):
    return f'<div class="prompt-box"><button class="secondary copy" type="button" data-copy="{pid}">Nusxalash</button><pre id="{pid}">{esc(text)}</pre></div>'


def ul(items, ordered=False):
    tag = "ol" if ordered else "ul"
    return f"<{tag}>" + "".join(f"<li>{i}</li>" for i in items) + f"</{tag}>"


def table(head_, rows):
    h = "".join(f"<th>{c}</th>" for c in head_)
    r = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in row) + "</tr>" for row in rows)
    return f'<div class="tw"><table class="t"><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table></div>'


def card_link(href, badge, title, text):
    return f'<a class="card" href="{href}"><span class="badge">{badge}</span><h3>{title}</h3><p class="muted">{text}</p></a>'
