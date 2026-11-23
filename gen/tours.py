"""Virtual laboratoriyalar uchun ovozli avtomatik namoyish ssenariylari.
Har bir qadam: (parametrlar, izoh). Tanlov (select) uchun qiymat '#indeks' ko'rinishida beriladi."""

FIN = "Namoyish tugadi. Endi parametrlarni o‘zingiz o‘zgartirib, natijalarni jadvalga yozing."

T = {
 "estat": [
  ({"Q": 10, "d": 5, "a": 20, "eps": 1}, "Bu yassi kondensator. Plastinalarda 10 nanokulon zaryad, oraliq 5 millimetr. Elektrometr 141 volt ko‘rsatmoqda, sig‘im 70,8 pikofarad."),
  ({"d": 10}, "Zaryadni o‘zgartirmasdan plastinalarni 10 millimetrgacha uzoqlashtiramiz. Kuchlanish ikki marta ortdi, maydon kuchlanganligi esa o‘zgarmadi. Grafikda bu to‘g‘ri chiziq."),
  ({"d": 5, "eps": 7}, "Endi oraliqni shisha bilan to‘ldiramiz. Dielektrik singdiruvchanlik 7 bo‘lgani uchun kuchlanish 7 marta kamaydi, energiya ham shuncha kamaydi."),
  ({"eps": 1}, FIN)],
 "rc": [
  ({"R": 100, "C": 500, "U0": 10, "mode": "#0"}, "Kondensator 100 kiloomli rezistor orqali razryadlanmoqda. Vaqt doimiysi 50 sekund: shu vaqtda kuchlanish 37 foizgacha tushadi."),
  ({"C": 250}, "Sig‘imni ikki marta kamaytiramiz. Egri chiziq tikroq bo‘ldi, vaqt doimiysi 25 sekundga qisqardi."),
  ({"C": 500, "mode": "#1"}, "Endi zaryadlanish jarayoni. Vaqt doimiysi o‘tganda kondensator 63 foizgacha zaryadlanadi, besh tau dan keyin esa deyarli to‘liq zaryadlangan bo‘ladi."),
  ({"mode": "#0"}, FIN)],
 "ohm": [
  ({"mat": "#0", "l": 1, "dd": 0.3, "I": 0.2, "sx": "#0"}, "Nixrom sim, uzunligi 1 metr, diametri 0,3 millimetr. Voltmetr ichkarida ulangan sxemada o‘lchangan qarshilik haqiqiysiga juda yaqin."),
  ({"l": 0.5}, "Uzunlikni yarmiga qisqartiramiz. Qarshilik ham ikki marta kamaydi: qarshilik uzunlikka to‘g‘ri proporsional."),
  ({"l": 1, "mat": "#3", "sx": "#1"}, "Endi mis simni ampermetr ichkarida sxemasida o‘lchaymiz. Ampermetr qarshiligi sim qarshiligidan katta bo‘lgani uchun metodik xato yuzlab foizga yetdi. Kichik qarshilik voltmetr ichkarida sxemasida o‘lchanadi."),
  ({"mat": "#0", "sx": "#0"}, FIN)],
 "bridge": [
  ({"Rx": 83, "R0": 50, "x": 30}, "Bu reoxordli ko‘prik. Sirpang‘ich muvozanatdan uzoqda, galvanometr orqali katta tok o‘tmoqda."),
  ({"x": 55}, "Sirpang‘ichni surib, muvozanatga yaqinlashtiramiz. Tok kamaydi, ishorasi almashadigan nuqta yaqin."),
  ({"x": 62.4}, "62,4 santimetrda galvanometr toki nolga teng. Noma’lum qarshilik 50 ni 62,4 ga ko‘paytirib 37,6 ga bo‘lganga teng, ya’ni 83 om."),
  ({"R0": 83, "x": 50}, "Magazin qarshiligini 83 omga tenglashtirsak, muvozanat reoxord o‘rtasiga tushadi. Bu holatda o‘lchash xatoligi eng kichik."),
  ({"R0": 50}, FIN)],
 "meter": [
  ({"mode": "#0", "Ig": 1, "Rg": 100, "n": 10, "dev": 0, "X": 0.6}, "Galvanometrning to‘liq og‘ish toki 1 milliamper, qarshiligi 100 om. Chegarani 10 marta oshirish uchun 11,1 omli shunt kerak."),
  ({"dev": 5}, "Shunt hisoblangandan 5 foiz katta o‘rnatilsa, asbob qariyb 5 foiz ko‘p ko‘rsatadi. Buni kalibrlashda aniqlaymiz."),
  ({"dev": 0, "mode": "#1", "n": 100}, "Endi voltmetr yasaymiz: galvanometr kuchlanishi 0,1 volt, chegarani 100 marta oshirish uchun 9900 omli qo‘shimcha qarshilik ketma-ket ulanadi. Yangi chegara 10 volt."),
  ({"mode": "#0", "n": 10}, FIN)],
 "kirch": [
  ({"E1": 12, "E2": 6, "R1": 10, "R2": 20, "R3": 30}, "Ikki manbali zanjir. Birinchi tarmoqda 0,382 amper, uchinchida 0,273 amper. Ikkinchi tarmoqdagi tok manfiy: kuchsiz manba zaryadlanmoqda."),
  ({"E2": 10}, "Ikkinchi manba EYuKini 10 voltga oshiramiz. Endi ikkala manba ham tok beradi, tugun qoidasi yana aniq bajarilmoqda."),
  ({"E2": 6, "R3": 5}, "Umumiy rezistorni 5 omga kamaytiramiz. Uchinchi tarmoq toki ortdi. Pastdagi jadvalda kontur qoidasi va quvvatlar balansi nolga teng xatolik bilan bajariladi."),
  ({"R3": 30}, FIN)],
 "heater": [
  ({"P": 1960, "m": 1, "k": 3, "Ch": 450}, "Elektr choynakda 1 kilogramm suv isitilmoqda. 90 gradusgacha qariyb 3 daqiqa kerak, foydali ish koeffitsiyenti 85 foiz atrofida."),
  ({"k": 9}, "Issiqlik yo‘qotishini oshiramiz, masalan qopqoq ochiq. Harorat grafigi egilib, FIK kamaydi."),
  ({"k": 3, "m": 0.4}, "Suvni kamaytiramiz. Idishni isitishga ketgan ulush kattalashgani uchun FIK pasaydi."),
  ({"m": 1}, FIN)],
 "vdiode": [
  ({"T": 2400, "B": 0.045, "sc": "#0"}, "Vakuumli diodning volt-amper xarakteristikasi. Kichik kuchlanishda tok bo‘shliq zaryadi bilan cheklangan, katta kuchlanishda to‘yinadi."),
  ({"T": 2500}, "Katod haroratini 100 kelvinga oshiramiz. To‘yinish toki qariyb 2,6 marta ortdi, boshlang‘ich qism esa deyarli o‘zgarmadi."),
  ({"sc": "#1"}, "Logarifmik shkalada boshlang‘ich qism to‘g‘ri chiziq, qiyaligi 1,5. Bu Boguslavskiy–Lengmyur uch ikkinchi qonuni."),
  ({"T": 2400, "sc": "#0"}, FIN)],
 "ampere": [
  ({"B": 0.2, "I": 2, "l": 4, "al": 90}, "Magnit induksiyasi 0,2 tesla, tok 2 amper, o‘tkazgich uzunligi 4 santimetr. Amper kuchi 16 millinyuton, tarozi 1,63 gramm o‘zgarish ko‘rsatmoqda."),
  ({"I": -2}, "Tok yo‘nalishini almashtiramiz. Kuch yo‘nalishi ham teskari bo‘ldi, tarozi ko‘rsatishi manfiy."),
  ({"I": 2, "al": 30}, "O‘tkazgichni maydonga 30 gradus burchak ostida qo‘yamiz. Kuch yarmiga kamaydi, chunki sinus 30 gradus 0,5 ga teng."),
  ({"al": 90}, FIN)],
 "bfield": [
  ({"mode": "#0", "I": 5, "x": 1}, "To‘g‘ri o‘tkazgichdan 5 amper tok o‘tmoqda. 1 santimetr masofada induksiya 100 mikrotesla."),
  ({"x": 4}, "Datchikni 4 santimetrga uzoqlashtiramiz. Induksiya 4 marta kamaydi: maydon masofaga teskari proporsional."),
  ({"mode": "#1", "I": 2, "R": 5, "N": 20, "x": 0}, "Endi 20 o‘ramli, radiusi 5 santimetr halqa. Markazda induksiya 0,5 millitesla."),
  ({"x": 5}, "Halqa o‘qi bo‘ylab radiusga teng masofada maydon markazdagining 35 foiziga tushdi."),
  ({"mode": "#0", "x": 1}, FIN)],
 "solenoid": [
  ({"N": 300, "L": 15, "R": 2, "I": 1, "x": 0}, "300 o‘ramli, uzunligi 15 santimetr g‘altak. Markazda maydon 2,43 millitesla, cheksiz solenoid formulasidan atigi 3 foiz kam."),
  ({"x": 7.5}, "Zondni g‘altak uchiga olib boramiz. Maydon markazdagining qariyb yarmiga tushdi."),
  ({"x": 0, "L": 4}, "G‘altakni qisqa qilamiz. Endi ichkaridagi maydon bir jinsli emas, markazdagi qiymat ham uzun solenoid formulasidan sezilarli kichik."),
  ({"L": 15}, FIN)],
 "tangent": [
  ({"N": 10, "R": 10, "I": 0.2, "BH": 27.6}, "Tangens-galvanometr halqasi magnit meridianida. 0,2 amper tokda strelka 24,5 gradusga og‘di. Bundan Yer maydonining gorizontal tashkil etuvchisi 27,6 mikrotesla."),
  ({"I": 0.44}, "Tokni oshirib, og‘ishni 45 gradusga yaqinlashtiramiz. Bu burchakda o‘lchash xatoligi eng kichik."),
  ({"I": 0.2, "N": 5}, "O‘ramlar sonini yarmiga kamaytiramiz. Og‘ish tangensi ham yarmiga kamaydi."),
  ({"N": 10}, FIN)],
 "earthcoil": [
  ({"N": 200, "r": 10, "f": 10, "ax": "#0", "inc": 59.5}, "G‘altak vertikal o‘q atrofida 10 gers chastota bilan aylanmoqda. EYuK amplitudasi qariyb 10,7 millivolt, bundan gorizontal tashkil etuvchi 27 mikrotesla."),
  ({"f": 20}, "Chastotani ikki marta oshiramiz. Amplituda ham ikki marta ortdi, davr esa ikki marta qisqardi."),
  ({"f": 10, "ax": "#1"}, "Aylanish o‘qini gorizontal qilib, meridian bo‘ylab yo‘naltiramiz. Endi vertikal tashkil etuvchi o‘lchanadi: 46 mikrotesla. Ularning nisbatidan inklinatsiya 59,5 gradus."),
  ({"ax": "#0"}, FIN)],
 "faraday": [
  ({"v": 1, "N": 400, "m": 0.5}, "Magnit g‘altak orqali sekundiga 1 metr tezlikda o‘tmoqda. Yuqorida EYuK impulslari, pastda magnit oqimi. Kirishda va chiqishda impulslar ishorasi qarama-qarshi — Lens qoidasi."),
  ({"v": 2}, "Tezlikni ikki marta oshiramiz. EYuK amplitudasi ikki marta ortdi, impuls esa ikki marta qisqardi. Impuls yuzasi o‘zgarmadi."),
  ({"v": 1, "N": 800}, "O‘ramlar sonini ikki marta oshiramiz: EYuK ham, impuls yuzasi ham ikki marta ortdi."),
  ({"N": 400}, FIN)],
 "electrolysis": [
  ({"met": "#0", "I": 1, "t": 30, "eta": 100}, "Mis kuporosi eritmasidan 1 amper tok 30 daqiqa o‘tmoqda. Katodda qariyb 0,59 gramm mis ajraladi, bundan Faradey doimiysi 96 ming kulon taxminan."),
  ({"met": "#1"}, "Kumushni tanlaymiz. Ioni bir valentli va molyar massasi katta bo‘lgani uchun xuddi shu zaryadda 3,4 marta ko‘p metall ajraladi."),
  ({"met": "#0", "eta": 90}, "Tok unumdorligi 90 foizga tushsa, ya’ni tokning bir qismi vodorod ajralishiga sarflansa, hisoblangan Faradey doimiysi 11 foiz katta chiqadi. Bu tizimli xatolik."),
  ({"eta": 100}, FIN)],
 "lc": [
  ({"L": 10, "C": 0.1, "R": 20}, "Tebranish konturi: 10 milligenri va 0,1 mikrofarad. Chastota 5 kilogers, tebranishlar sekin so‘nmoqda, asllik 16 ga yaqin."),
  ({"C": 0.4}, "Sig‘imni 4 marta oshiramiz. Davr ikki marta uzaydi — Tomson formulasi."),
  ({"C": 0.1, "R": 150}, "Qarshilikni oshiramiz. Tebranishlar tez so‘nmoqda, logarifmik dekrement ortdi."),
  ({"R": 700}, "Qarshilik kritik qiymatdan, ya’ni 632 omdan oshdi. Endi tebranish yo‘q: kondensator aperiodik razryadlanadi."),
  ({"R": 20}, FIN)],
 "trans": [
  ({"k": 0.109, "RL": 11.5, "P0": 3, "Rc": 0.5}, "Pasaytiruvchi transformator, ikkilamchi kuchlanish 23 volt, tok 2 amper. Foydali ish koeffitsiyenti 90 foiz."),
  ({"RL": 60}, "Yuklamani kamaytiramiz, tok 0,4 amperga tushdi. O‘zak isrofi o‘zgarmagani uchun FIK pasaydi."),
  ({"RL": 3}, "Endi yuklama juda katta, tok 6 amperdan oshdi. Chulg‘amlardagi mis isrofi tez o‘sib, FIK yana kamaydi. Maksimum mis isrofi o‘zak isrofiga teng bo‘lganda."),
  ({"RL": 11.5}, FIN)],
 "ac": [
  ({"R": 100, "L": 0.1, "C": 10, "f": 50}, "Ketma-ket RLC zanjir, 50 gers. Sig‘im qarshiligi katta, tok kuchlanishdan 71 gradus oldinda."),
  ({"f": 159}, "Chastotani 159 gersga oshiramiz. Bu rezonans: induktiv va sig‘im qarshiliklar teng, tok maksimal, faza siljishi nolga teng."),
  ({"R": 20}, "Aktiv qarshilikni 20 omga kamaytiramiz. Rezonans egri chizig‘i o‘tkirlashdi va kondensatordagi kuchlanish manba kuchlanishidan 5 marta katta bo‘ldi."),
  ({"R": 100, "f": 50}, FIN)],
 "photom": [
  ({"I": 100, "r": 2, "al": 0}, "Yorug‘lik kuchi 100 kandela bo‘lgan manbadan 2 metr masofada yoritilganlik 25 lyuks."),
  ({"r": 1}, "Masofani yarmiga qisqartiramiz. Yoritilganlik 4 marta ortib, 100 lyuksga yetdi — teskari kvadrat qonuni."),
  ({"r": 2, "al": 60}, "Sirtni 60 gradusga buramiz. Yoritilganlik yarmiga kamaydi — kosinus qonuni."),
  ({"al": 0}, FIN)],
 "bunsen": [
  ({"I0": 25, "Ix": 56.25, "Lb": 100, "x": 25}, "Fotometr ekrani etalon lampaga yaqin, chap tomon kuchliroq yoritilgan va moy dog‘i ajralib ko‘rinmoqda."),
  ({"x": 40}, "Ekranni 40 santimetrga suramiz. Ikki tomon yoritilganligi tenglashdi, dog‘ ko‘rinmay qoldi. Bundan noma’lum lampa kuchi 56 kandela."),
  ({"I0": 50}, "Etalonni kuchliroq qilsak, muvozanat buziladi: ekranni tekshiriladigan lampaga yaqinroq surish kerak."),
  ({"I0": 25}, FIN)],
 "prism": [
  ({"A": 60, "n": 1.52, "i": 30, "col": "#1"}, "60 gradusli prizma, tushish burchagi 30 gradus. Og‘ish burchagi 53 gradus atrofida."),
  ({"i": 49.5}, "Tushish burchagini 49,5 gradusga keltiramiz. Bu minimal og‘ish: nur prizmada asosga parallel yuradi, og‘ish 39 gradus."),
  ({"col": "#3"}, "Binafsha nurni tanlaymiz. Sindirish ko‘rsatkichi kattaroq bo‘lgani uchun u kuchliroq og‘adi — bu dispersiya."),
  ({"col": "#1"}, FIN)],
 "slab": [
  ({"n": 1.51, "i": 45, "d": 1}, "Nur shisha plastinaga 45 gradus ostida tushmoqda, sinish burchagi 27,9 gradus. Chiqqan nur tushuvchiga parallel, lekin 3,3 millimetr siljigan."),
  ({"d": 2}, "Plastina qalinligini ikki marta oshiramiz. Yon siljish ham ikki marta ortdi."),
  ({"d": 1, "n": 2.42}, "Olmos uchun sindirish ko‘rsatkichi 2,42. Nur kuchliroq sinadi, kritik burchak atigi 24 gradus."),
  ({"n": 1.51}, FIN)],
 "appdepth": [
  ({"d": 3, "n": 1.52, "u": 5}, "3 millimetr qalinlikdagi shisha ostidagi nuqta mikroskopda 1,97 millimetr chuqurlikda ko‘rinadi. Qalinliklar nisbati sindirish ko‘rsatkichini beradi."),
  ({"u": 35}, "Kuzatish burchagini oshirsak, zohiriy qalinlik paraksial qiymatdan chetlanadi. Shuning uchun formula kichik aperturada aniq."),
  ({"u": 5, "n": 1.33}, "Suv uchun zohiriy chuqurlik 2,26 millimetr — hovuz tubi yaqinroq ko‘rinishining sababi."),
  ({"n": 1.52}, FIN)],
 "lens": [
  ({"f": 20, "a": 30, "ab": "#0"}, "Fokus masofasi 20 santimetr bo‘lgan yig‘uvchi linza, buyum 30 santimetrda. Tasvir 60 santimetrda: haqiqiy, teskari, ikki marta kattalashgan."),
  ({"a": 60}, "Buyumni 60 santimetrga uzoqlashtiramiz. Tasvir 30 santimetrga yaqinlashib, kichraydi."),
  ({"a": 12}, "Buyum fokus ichida. Endi tasvir mavhum, to‘g‘ri va kattalashgan — lupa shunday ishlaydi."),
  ({"a": 30, "ab": "#1"}, "Sferik aberratsiyani ko‘rsatamiz: linza chetidan o‘tgan nurlar markaziy nurlardan yaqinroqda fokuslanadi."),
  ({"ab": "#0"}, FIN)],
 "microscope": [
  ({"fob": 10, "fok": 25, "D": 160, "NA": 0.25}, "Obyektiv 16 marta, okulyar 10 marta kattalashtiradi, umumiy kattalashtirish 160. Obyekt-mikrometrning 0,1 millimetri 16 millimetr bo‘lib ko‘rinadi."),
  ({"fob": 4}, "Obyektiv fokus masofasini 4 millimetrga kamaytiramiz: kattalashtirish 400 ga yetdi."),
  ({"NA": 0.65}, "Sonli aperturani oshiramiz. Ajrata olish chegarasi yarim mikrometrga kichraydi, foydali kattalashtirish chegarasi ham oshadi."),
  ({"fob": 10, "NA": 0.25}, FIN)],
 "grating": [
  ({"N0": 100, "src": "#0", "L": 1}, "Har millimetrida 100 ta shtrixli panjara va geliy-neon lazer. Birinchi tartib dog‘lar markazdan 6,34 santimetrda. Bundan to‘lqin uzunligi 633 nanometr."),
  ({"src": "#2"}, "Yashil lazerga almashtiramiz. To‘lqin uzunligi qisqa bo‘lgani uchun dog‘lar markazga yaqinlashdi."),
  ({"src": "#3", "N0": 300}, "Oq yorug‘lik va zichroq panjara: har bir tartib spektrga ajraldi, binafsha ichkarida, qizil tashqarida."),
  ({"src": "#0", "N0": 100}, FIN)],
 "slits": [
  ({"N": 2, "b": 0.05, "d": 0.25, "wl": 650, "L": 2}, "Qo‘sh tirqish: polosalar oralig‘i 5,2 millimetr. Uzuq chiziq bitta tirqish difraksiyasi o‘rami. Beshinchi tartib o‘ram minimumiga tushib yo‘qolgan."),
  ({"N": 5}, "Tirqishlar sonini beshtaga oshiramiz. Bosh maksimumlar torayib yorqinlashdi, ular orasida kichik maksimumlar paydo bo‘ldi."),
  ({"N": 2, "d": 0.5}, "Tirqishlar orasini ikki marta oshiramiz: polosalar ikki marta zichlashdi."),
  ({"d": 0.25}, FIN)],
 "newton": [
  ({"R": 1, "wl": 546, "mode": "#0", "k": 5}, "Qaytgan yorug‘likda Nyuton halqalari: markaz qorong‘i, kontrast yuqori. Beshinchi qorong‘i halqa radiusi 1,65 millimetr."),
  ({"R": 2}, "Egrilik radiusi kattaroq linzani olamiz. Halqalar kengaydi: radius radiusning kvadrat ildiziga proporsional."),
  ({"R": 1, "mode": "#1"}, "O‘tgan yorug‘likka o‘tamiz: markaz yorug‘, halqalar joyi almashdi va kontrast ancha past."),
  ({"mode": "#0"}, FIN)],
 "newtonT": [
  ({"R": 1, "wl": 589, "mode": "#1", "k": 5}, "O‘tgan yorug‘likda Nyuton halqalari. Markaz yorug‘, beshinchi yorug‘ halqa radiusi 1,72 millimetr. Kontrast past, chunki ikki marta qaytgan nur kuchsiz."),
  ({"k": 10}, "O‘ninchi halqani tanlaymiz: radius ildiz ikki marta ortdi, 2,43 millimetr. Ikki halqa diametrlari kvadratlari ayirmasidan egrilik radiusi topiladi."),
  ({"k": 5, "mode": "#0"}, "Solishtirish uchun qaytgan yorug‘lik: markaz qorong‘i, kontrast yuqori."),
  ({"mode": "#1"}, FIN)],
 "spectra": [
  ({"el": "#0", "p": 656.3}, "Vodorod spektri. Ko‘rsatkich qizil H alfa chizig‘ida, 656,3 nanometr. Balmer formulasidan Ridberg doimiysi kelib chiqadi."),
  ({"p": 486.1}, "Havorang H beta chizig‘i, 486,1 nanometr. Bu to‘rtinchi sathdan ikkinchisiga o‘tish."),
  ({"el": "#3", "p": 546.1}, "Simob spektri. Yorqin yashil chiziq 546,1 nanometr — spektroskopni darajalash uchun qulay."),
  ({"el": "#2", "p": 589}, "Natriyning sariq dubleti: 589,0 va 589,6 nanometr."),
  ({"el": "#0", "p": 656.3}, FIN)],
 "malus": [
  ({"phi": 0, "I0": 80, "Pd": 0.975}, "Polyarizator va analizator parallel, fototok maksimal: 80 mikroamper."),
  ({"phi": 60}, "Analizatorni 60 gradusga buramiz. Intensivlik to‘rtdan biriga tushdi, chunki kosinus kvadrati 0,25."),
  ({"phi": 90}, "90 gradusda polyaroidlar kesishgan, yorug‘lik deyarli o‘tmaydi."),
  ({"phi": 0}, FIN)],
 "bouguer": [
  ({"a": 0.51, "d": 1, "c": 1, "rf": "#0"}, "Yutilish koeffitsiyenti 0,51 santimetrdan minus birinchi daraja. 1 santimetr qatlam yorug‘likning 60 foizini o‘tkazadi."),
  ({"d": 2}, "Qalinlikni ikki marta oshiramiz: o‘tkazish 36 foiz, ya’ni 0,6 ning kvadrati. Logarifmik grafik to‘g‘ri chiziq."),
  ({"d": 1, "c": 2}, "Eritma konsentratsiyasini ikki marta oshirsak, optik zichlik ham ikki marta ortadi — Ber qonuni."),
  ({"c": 1}, FIN)],
 "absspec": [
  ({"dye": "#0", "c": 1, "l": 1, "p": 525}, "Kaliy permanganat eritmasining yutilish spektri. Maksimum 525 nanometr atrofida, yashil nur yutiladi, shuning uchun eritma binafsha ko‘rinadi."),
  ({"c": 2}, "Konsentratsiyani ikki marta oshiramiz: spektr shakli saqlandi, balandligi ikki marta ortdi."),
  ({"dye": "#1", "c": 1, "p": 780}, "Mis kuporosi qizil va infraqizil nurlarni yutadi, shuning uchun havorang ko‘rinadi."),
  ({"dye": "#0", "p": 525}, FIN)],
 "sugar": [
  ({"c": 0.1, "l": 2, "wl": "#1", "an": 0}, "Saxaroza eritmasi, konsentratsiya 0,1 gramm millilitrga, naycha 2 detsimetr. Qutblanish tekisligi 13,3 gradus burildi."),
  ({"an": 13.3}, "Analizatorni 13,3 gradusga burib, yorug‘likni yana maksimal qildik. Bu burchakdan konsentratsiya topiladi."),
  ({"c": 0.2}, "Konsentratsiyani ikki marta oshirsak, burilish ham ikki marta ortadi."),
  ({"c": 0.1, "wl": "#3"}, "Ko‘k nur sariqdan kuchliroq buriladi — burilish dispersiyasi."),
  ({"wl": "#1", "an": 0}, FIN)],
 "transmit": [
  ({"n": 1.52, "N": 1, "a": 0, "d": 2}, "Bitta shisha plastina qaytish tufayli yorug‘likning 8 foizini yo‘qotadi."),
  ({"N": 5}, "Beshta plastinada yo‘qotish 31 foizga yetdi, shisha yorug‘likni yutmasa ham. Bir taqsim T grafigi to‘g‘ri chiziq."),
  ({"a": 0.3}, "Yutilishni qo‘shamiz: endi yo‘qotish yanada ortdi. Qalin namunalarda yutilish ustun bo‘ladi."),
  ({"a": 0, "N": 1}, FIN)],
 "mz": [
  ({"l": 5, "p": 101.3, "wl": 632.8}, "Max–Zender interferometri. Kamerada atmosfera bosimi, polosalar tinch turibdi."),
  ({"p": 41.3}, "Havoni so‘rib, bosimni 60 kilopaskalga kamaytiramiz. 12,8 ta polosa siljidi. Bundan havoning sindirish ko‘rsatkichi 1,000273."),
  ({"p": 0}, "To‘liq vakuumgacha so‘rsak, 21,6 ta polosa o‘tadi."),
  ({"p": 101.3}, FIN)],
}
