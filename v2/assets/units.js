/* Данные свободных юнитов — один источник для каталога (index.html) и страниц units/*.html.
   Фото отобраны вручную, файлы в v2/photos (U3 — рендеры).
   Порядок в барабане: общие планы (экстерьеры/shared) → общие интерьеры
   (зал, кухня, спальня) → санузлы. Действует везде: барабан в карточке юнита и его
   оверлей-лайтбокс (используют один и тот же массив).
   EN-поля — черновой перевод до утверждения RU. */
window.USC_UNITS = [
  {slug:'u1-studio',   q:'u1',fmt:'studio',name:{ru:'Студия',ru_en:'Studio'},                    area:54.2, floor:{ru:'этаж 1–3',en:'floors 1–3'}, photos:['u1-01','u1-05','u1-21','u1-03','u1-17','u1-16','u1-22','u1-06']},
  {slug:'u1-2bd',      q:'u1',fmt:'2bd',   name:{ru:'2+1 спальни',ru_en:'2+1 bedrooms'},          area:89, floor:{ru:'этаж 2',en:'floor 2'},      photos:['u1-10','u1-04','u1-19','u1-20','u1-25','u1-26','u1-18','u1-12','u1-21','u1-23']},
  {slug:'u2-studio',   q:'u2',fmt:'studio',name:{ru:'Студия',ru_en:'Studio'},                    area:39, floor:{ru:'этаж 1–2',en:'floors 1–2'}, photos:['u2-studio-01','u2-studio-03','u2-studio-09','u2-studio-10','u2-studio-02','u2-studio-04','u2-studio-05','u2-studio-06','u2-studio-11']},
  {slug:'u2-1bd',      q:'u2',fmt:'1bd',   name:{ru:'1+1 спальня',ru_en:'1+1 bedroom'},           area:[56.5,62], floor:{ru:'этаж 1–4',en:'floors 1–4'}, photos:['u2-1bd-01','u2-1bd-02','u2-1bd-07','u2-1bd-04','u2-1bd-05','u2-1bd-06','u2-1bd-08','u2-1bd-11','u2-1bd-10','u2-1bd-12']},
  {slug:'u2-2bd',      q:'u2',fmt:'2bd',   name:{ru:'2+1 спальни',ru_en:'2+1 bedrooms'},          area:[89,110], floor:{ru:'этаж 2–3',en:'floors 2–3'}, photos:['u2-2bd-02','u2-2bd-20','u2-2bd-19','u2-2bd-14','u2-2bd-08','u2-2bd-09','u2-2bd-10','u2-2bd-11','u2-2bd-13','u2-2bd-16','u2-2bd-23','u2-2bd-17']},
  {slug:'u2-villa',    q:'u2',fmt:'villa', name:{ru:'Вилла 3+1 с бассейном',ru_en:'3+1 villa with pool'},area:185.8,floor:{ru:'2 этажа',en:'2&nbsp;floors'}, photos:['u2-villa-02','u2-villa-05','u2-villa-31','u2-villa-32','u2-iphone-27','u2-villa-04','u2-villa-08','u2-villa-12','u2-villa-13','u2-villa-17','u2-villa-26','u2-iphone-17']},
  {slug:'u3-1bd',      q:'u3',fmt:'1bd',   name:{ru:'1+1 спальня',ru_en:'1+1 bedroom'},           area:60, floor:{ru:'этаж 1–3',en:'floors 1–3'}, photos:['u3-01','u3-02','u3-04','u3-05'], render:true},
  {slug:'u3-1bd-pool', q:'u3',fmt:'1bd',   name:{ru:'1+1 с бассейном',ru_en:'1+1 with pool'},     area:100,floor:{ru:'этаж 1',en:'floor 1'},      photos:['u3-01','u3-02','u3-04','u3-05'], render:true},
  {slug:'u3-2bd-pool', q:'u3',fmt:'2bd',   name:{ru:'2+1 с бассейном',ru_en:'2+1 with pool'},     area:109,floor:{ru:'этаж 1',en:'floor 1'},      photos:['u3-01','u3-02','u3-04','u3-05'], render:true},
  {slug:'u3-villa',    q:'u3',fmt:'villa', name:{ru:'Вилла 3+1 с бассейном',ru_en:'3+1 villa with pool'},area:200,floor:{ru:'2 этажа',en:'2&nbsp;floors'}, photos:['u3-01','u3-02','u3-04','u3-05'], render:true}
];
window.USC_UNITS.forEach(function (u) { u.name.en = u.name.ru_en; delete u.name.ru_en; });
/* area — из таблицы наличия (пишет tools/sync-lots.mjs): число или диапазон [min,max]; RU с запятой */
window.USC_AREA_TXT = function (u, lang) {
  var f = function (x) { return lang === 'ru' ? String(x).replace('.', ',') : String(x); };
  return Array.isArray(u.area) ? f(u.area[0]) + '\u2013' + f(u.area[1]) : f(u.area);
};
window.USC_COMPLEX = {
  u1:{code:'U1',name:'Space Village', status:{ru:'сдан в 2024, заселён',en:'completed 2024, occupied'}, where:{ru:'внутри Nuanu',en:'inside Nuanu'}},
  u2:{code:'U2',name:'Nuanu Village', status:{ru:'сдан в 2026, заселён',en:'completed 2026, occupied'}, where:{ru:'внутри Nuanu',en:'inside Nuanu'}},
  u3:{code:'U3',name:'Nyanyi Village',status:{ru:'строится, сдача зимой 2026',en:'under construction, handover winter 2026'}, where:{ru:'посёлок Nyanyi, ближе к океану',en:'Nyanyi village, closer to the&nbsp;ocean'}}
};
window.USC_PRICE = {ru:{studio:'от $95 000','1bd':'от $115 000','2bd':'от $170 000',villa:'от $287 000'},
                    en:{studio:'from $95,000','1bd':'from $115,000','2bd':'from $170,000',villa:'from $287,000'}};
/* числовая цена в USD — источник для форматирования USD/IDR в рантайме (window.__uscMoney, site.js).
   Минимальная цена свободного лота формата — пишет tools/sync-lots.mjs из таблицы наличия */
window.USC_PRICE_USD = {studio:95000,'1bd':115000,'2bd':170000,villa:287000};
window.USC_FMT = {
  studio:{desc:{ru:'Единое пространство без&nbsp;перегородок: совмещённые спальня, кухня и&nbsp;гостиная. Чистые линии, натуральные материалы, полная меблировка от&nbsp;UNIT.FURNITURE. Собственная терраса: ваше личное пространство на&nbsp;свежем воздухе. Вид на&nbsp;рисовые поля или&nbsp;внутренний двор комплекса',en:'One open space with no partitions: bedroom, kitchen and&nbsp;living room together. Clean lines, natural materials, fully furnished by&nbsp;UNIT.FURNITURE. Your own terrace is&nbsp;your private space in the&nbsp;open air. Views of the&nbsp;rice fields or the&nbsp;inner courtyard'}},
  '1bd':{desc:{ru:'Пространство, где есть место и для&nbsp;уединения, и для&nbsp;жизни. Отдельная спальня для&nbsp;спокойного отдыха. Кухня и&nbsp;гостиная для&nbsp;встреч, работы и&nbsp;неспешных завтраков на&nbsp;террасе. Вид на&nbsp;рисовые поля или&nbsp;тропический двор комплекса. Для&nbsp;тех, кто ценит компактность и&nbsp;продуманность',en:'A&nbsp;space with room both for&nbsp;privacy and for&nbsp;living. A&nbsp;separate bedroom for&nbsp;quiet rest. Kitchen and&nbsp;living room for&nbsp;meeting friends, working and&nbsp;slow breakfasts on the&nbsp;terrace. Views of the&nbsp;rice fields or the&nbsp;tropical courtyard. For&nbsp;those who value a&nbsp;compact, well thought-out home'}},
  '2bd':{desc:{ru:'Просторный семейный формат с&nbsp;чётким зонированием: две изолированные спальни, отдельная кухня и&nbsp;гостиная. Полная меблировка от&nbsp;UNIT.FURNITURE. Собственная терраса с&nbsp;видом на&nbsp;рисовые поля или&nbsp;внутренний двор. Идеальный баланс приватности и&nbsp;общего пространства для&nbsp;семьи или&nbsp;аренды на&nbsp;двоих',en:'A&nbsp;spacious family format with clear zoning: two separate bedrooms, a&nbsp;separate kitchen and&nbsp;living room. Fully furnished by&nbsp;UNIT.FURNITURE. Your own terrace overlooking the&nbsp;rice fields or the&nbsp;inner courtyard. The&nbsp;right balance of&nbsp;privacy and&nbsp;shared space for a&nbsp;family or a&nbsp;two-guest rental'}},
  villa:{desc:{ru:'Двухэтажная вилла для&nbsp;тех, кому нужно больше пространства. Три спальни, просторная кухня-гостиная и&nbsp;полная меблировка от&nbsp;UNIT.FURNITURE. Собственный сад с&nbsp;приватным бассейном: тихое утро и&nbsp;вечер у&nbsp;воды. Подходит для&nbsp;большой семьи или&nbsp;аренды компанией',en:'A&nbsp;two-storey villa for those who need more space. Three bedrooms, a&nbsp;spacious kitchen-living room and full furnishing by&nbsp;UNIT.FURNITURE. Your own garden with a&nbsp;private pool for quiet mornings and evenings by&nbsp;the&nbsp;water. Suits a&nbsp;large family or a&nbsp;group rental'}}
};
