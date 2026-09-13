/* Данные свободных юнитов — один источник для каталога (index.html) и страниц units/*.html.
   Фото — реальные наборы из prototype-2026-09/assets по комплексу/формату (U3 — рендеры).
   EN-поля — черновой перевод до утверждения RU. */
window.USC_UNITS = [
  {slug:'u1-studio',   q:'u1',fmt:'studio',name:{ru:'Студия',ru_en:'Studio'},                    area:32, floor:{ru:'этаж 1–3',en:'floors 1–3'}, photos:['u1-01','u1-02','u1-03']},
  {slug:'u1-2bd',      q:'u1',fmt:'2bd',   name:{ru:'2+1 спальни',ru_en:'2+1 bedrooms'},          area:89, floor:{ru:'этаж 2',en:'floor 2'},      photos:['u1-06','u1-07','u1-08']},
  {slug:'u2-studio',   q:'u2',fmt:'studio',name:{ru:'Студия',ru_en:'Studio'},                    area:32, floor:{ru:'этаж 1–2',en:'floors 1–2'}, photos:['u2s-01','u2s-02','u2s-03','u2s-04','u2s-05']},
  {slug:'u2-1bd',      q:'u2',fmt:'1bd',   name:{ru:'1+1 спальня',ru_en:'1+1 bedroom'},           area:60, floor:{ru:'этаж 1–4',en:'floors 1–4'}, photos:['u2-1bd-01','u2-1bd-02','u2-1bd-03','u2-1bd-04','u2-1bd-05']},
  {slug:'u2-2bd',      q:'u2',fmt:'2bd',   name:{ru:'2+1 спальни',ru_en:'2+1 bedrooms'},          area:89, floor:{ru:'этаж 2–3',en:'floors 2–3'}, photos:['u2-2bd-01','u2-2bd-02','u2-2bd-03','u2-2bd-04','u2-2bd-05']},
  {slug:'u2-villa',    q:'u2',fmt:'villa', name:{ru:'Вилла 3+1 с бассейном',ru_en:'3+1 villa with pool'},area:200,floor:{ru:'2 этажа',en:'2 floors'}, photos:['u2v-01','u2v-02','u2v-03','u2v-04','u2v-05']},
  {slug:'u3-1bd',      q:'u3',fmt:'1bd',   name:{ru:'1+1 спальня',ru_en:'1+1 bedroom'},           area:60, floor:{ru:'этаж 1–3',en:'floors 1–3'}, photos:['u3-01','u3-02'], render:true},
  {slug:'u3-1bd-pool', q:'u3',fmt:'1bd',   name:{ru:'1+1 с бассейном',ru_en:'1+1 with pool'},     area:100,floor:{ru:'этаж 1',en:'floor 1'},      photos:['u3-02','u3-03'], render:true},
  {slug:'u3-2bd-pool', q:'u3',fmt:'2bd',   name:{ru:'2+1 с бассейном',ru_en:'2+1 with pool'},     area:109,floor:{ru:'этаж 1',en:'floor 1'},      photos:['u3-03','u3-04'], render:true},
  {slug:'u3-villa',    q:'u3',fmt:'villa', name:{ru:'Вилла 3+1 с бассейном',ru_en:'3+1 villa with pool'},area:200,floor:{ru:'2 этажа',en:'2 floors'}, photos:['u3-04','u3-01'], render:true}
];
window.USC_UNITS.forEach(function (u) { u.name.en = u.name.ru_en; delete u.name.ru_en; });
window.USC_COMPLEX = {
  u1:{code:'U1',name:'Space Village', status:{ru:'сдан в 2024, заселён',en:'completed 2024, occupied'}, where:{ru:'внутри Nuanu',en:'inside Nuanu'}},
  u2:{code:'U2',name:'Nuanu Village', status:{ru:'сдан в 2025, заселён',en:'completed 2025, occupied'}, where:{ru:'внутри Nuanu',en:'inside Nuanu'}},
  u3:{code:'U3',name:'Nyanyi Village',status:{ru:'строится, сдача 2026',en:'under construction, due 2026'}, where:{ru:'посёлок Nyanyi, ближе к океану',en:'Nyanyi village, closer to the ocean'}}
};
window.USC_PRICE = {ru:{studio:'от $100 000','1bd':'от $118 000','2bd':'от $190 000',villa:'от $278 000'},
                    en:{studio:'from $100,000','1bd':'from $118,000','2bd':'from $190,000',villa:'from $278,000'}};
window.USC_FMT = {
  studio:{desc:{ru:'Единое пространство: спальня, кухня и гостиная в одном объёме. Полная меблировка.',en:'A single open space: bedroom, kitchen and living room in one volume. Fully furnished.'}},
  '1bd':{desc:{ru:'Отдельная спальня, кухня и гостиная. Вариант с приватным бассейном — в U3.',en:'A separate bedroom, kitchen and living room. A private-pool option is available in U3.'}},
  '2bd':{desc:{ru:'Две спальни, кухня и гостиная отдельно. Формат для семьи или под аренду на двоих.',en:'Two bedrooms, separate kitchen and living room. A format for a family or a two-guest rental.'}},
  villa:{desc:{ru:'Два этажа, три спальни, собственный сад и приватный бассейн.',en:'Two floors, three bedrooms, own garden and private pool.'}}
};
