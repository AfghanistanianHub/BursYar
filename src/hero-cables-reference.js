const ICONS={
 doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M10 8h5M10 12h5M10 16h3"/></svg>',
 seal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="M10 9l1.5 1.5L15 7"/><path d="M9.5 13.5L8 21l4-2.5L16 21l-1.5-7.5"/></svg>',
 ribbon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="M9 13.5L6.5 21 12 18l5.5 3L15 13.5"/></svg>',
 idcard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="7" width="4" height="5"/><path d="M14 8h3M14 12h3M8 16h8"/></svg>',
 cv:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.5 17c.7-1.8 2-2.7 3.5-2.7s2.8.9 3.5 2.7"/></svg>',
 envelope:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
 globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.6 3 14.4 0 18M12 3c-3 3.6-3 14.4 0 18"/></svg>',
 quote:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v12H9.5L5 20z"/><path d="M9 9h6M9 12.5h4"/></svg>',
 bank:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-6 9 6"/><path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9"/><path d="M3 19h18"/></svg>',
 list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>',
 portrait:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 17c.8-2 2.5-3 4.5-3s3.7 1 4.5 3"/></svg>',
 monitor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/></svg>'
};

const TILES=[
 {label:'CV', icon:'cv', x:188, y:463, lab:'below', color:'#1D7A44'},
 {label:'Motivation', icon:'envelope', x:242, y:398, lab:'below', color:'#A63F0E'},
 {label:'Passport', icon:'idcard', x:94, y:389, lab:'below', color:'#1D5FA8'},
 {label:'IELTS 7.0', icon:'seal', x:139, y:312, lab:'below', color:'#96700F'},
 {label:'Transcript', icon:'doc', x:71, y:110, lab:'above', color:'#BE4E12'},
 {label:'Degree', icon:'ribbon', x:216, y:190, lab:'above', color:'#155E55'},
 {label:'Official page', icon:'globe', x:994, y:211, lab:'below', color:'#155E55'},
 {label:'University', icon:'monitor', x:1138, y:140, lab:'above', color:'#BE4E12'},
 {label:'Scholarships', icon:'list', x:1098, y:288, lab:'below', color:'#96700F'},
 {label:'Bank statement', icon:'bank', x:1007, y:355, lab:'below', color:'#1D5FA8'},
 {label:'Recommendation', icon:'quote', x:1059, y:429, lab:'below', color:'#7A1E24'},
 {label:'Photo ID', icon:'portrait', x:938, y:464, lab:'below', color:'#5C6672'},
];

const CABLES=[[[211.4, 463.4], [219.1, 464.3], [226.7, 465.2], [234.5, 465.6], [242.2, 465.8], [249.9, 465.8], [257.6, 465.8], [265.4, 465.8], [273.1, 465.4], [280.8, 464.6], [288.5, 463.6], [296.1, 462.5], [303.6, 460.8], [311.1, 458.7], [318.5, 456.3], [325.5, 453.2], [332.4, 449.7], [339.3, 446.2], [345.7, 441.8], [351.6, 436.8], [357.2, 431.6], [362.6, 426.0], [367.7, 420.2], [372.7, 414.3], [377.7, 408.4], [382.8, 402.6], [387.9, 396.7], [392.9, 390.8], [398.0, 385.1], [403.2, 379.4], [408.7, 373.9], [414.3, 368.6], [420.3, 363.7], [427.1, 359.9], [433.8, 356.3], [440.9, 353.1], [448.2, 350.6], [455.6, 348.4], [463.2, 346.7], [470.8, 345.5], [478.5, 344.9], [486.2, 344.8], [494.0, 345.0], [501.7, 345.5], [509.4, 346.2], [517.1, 347.1], [524.4, 349.5], [530.8, 353.7], [530.8, 366]],
  [[265.9, 398.5], [272.4, 398.7], [278.8, 398.9], [285.3, 399.3], [291.8, 399.7], [298.2, 400.5], [304.5, 401.7], [310.9, 402.9], [317.3, 404.0], [323.7, 404.4], [330.2, 404.4], [336.6, 403.7], [343.0, 402.6], [349.1, 400.4], [354.8, 397.4], [360.5, 394.3], [366.0, 391.0], [371.5, 387.5], [376.8, 383.8], [381.9, 379.9], [387.2, 376.2], [392.4, 372.2], [397.6, 368.5], [402.7, 364.5], [408.1, 360.9], [413.5, 357.3], [418.9, 353.8], [424.5, 350.5], [430.4, 347.8], [436.4, 345.6], [442.6, 343.5], [448.7, 341.5], [454.9, 339.5], [461.1, 337.9], [467.5, 336.8], [474.0, 336.2], [480.4, 335.6], [486.9, 335.3], [493.3, 335.0], [499.8, 335.4], [506.3, 335.9], [512.7, 336.7], [519.0, 337.8], [525.3, 339.5], [531.3, 341.9], [537.0, 344.9], [542.2, 348.7], [546.7, 353.3], [546.7, 366]],
  [[117.7, 389.7], [127.4, 389.7], [137.1, 389.5], [146.7, 388.1], [156.0, 385.4], [165.0, 381.8], [173.7, 377.4], [182.3, 372.8], [190.8, 368.1], [199.6, 364.2], [208.9, 361.4], [218.4, 359.4], [228.1, 358.4], [237.8, 358.1], [247.5, 358.1], [257.2, 358.1], [266.9, 358.7], [276.6, 359.2], [286.3, 359.7], [295.9, 360.3], [305.7, 360.4], [315.4, 360.4], [325.1, 360.4], [334.8, 360.2], [344.5, 359.5], [354.2, 358.9], [363.7, 357.5], [373.1, 354.8], [382.6, 352.9], [392.2, 351.5], [401.5, 348.8], [410.7, 345.7], [420.0, 342.9], [429.3, 340.3], [438.5, 337.1], [447.8, 334.3], [457.2, 331.8], [466.7, 330.0], [476.4, 329.0], [486.1, 328.9], [495.8, 329.0], [505.5, 329.5], [515.1, 330.6], [524.5, 332.8], [533.7, 335.9], [542.6, 339.7], [550.1, 345.8], [556.2, 353.3], [556.2, 366]],
  [[162.1, 312.5], [171.1, 312.5], [180.0, 312.8], [188.9, 313.7], [197.8, 314.6], [206.7, 315.6], [215.5, 317.4], [224.3, 319.2], [233.0, 321.3], [241.7, 323.5], [250.4, 325.7], [259.2, 327.5], [268.0, 329.0], [276.7, 330.9], [285.5, 332.8], [294.3, 334.6], [303.1, 335.9], [312.0, 336.9], [321.0, 337.4], [329.9, 337.8], [338.9, 338.0], [347.8, 337.9], [356.8, 337.5], [365.7, 336.6], [374.5, 335.0], [383.3, 333.1], [392.1, 331.8], [400.9, 330.1], [409.8, 328.7], [418.7, 327.9], [427.5, 326.2], [436.3, 324.8], [445.2, 323.5], [454.1, 322.2], [463.0, 321.3], [471.9, 320.8], [480.9, 320.8], [489.8, 320.9], [498.8, 321.5], [507.7, 322.3], [516.6, 323.2], [525.4, 325.2], [534.0, 327.4], [542.6, 329.9], [550.7, 333.7], [557.9, 339.1], [563.7, 345.9], [568.8, 353.3], [568.8, 366]],
  [[71.0, 128.0], [71.3, 141.3], [72.8, 154.4], [76.1, 167.3], [80.2, 179.9], [85.0, 192.2], [90.3, 204.4], [96.9, 215.9], [103.9, 227.1], [112.1, 237.5], [121.2, 247.1], [131.5, 255.5], [143.0, 262.0], [155.5, 266.3], [168.6, 267.9], [181.8, 269.9], [194.9, 271.8], [207.9, 273.9], [221.1, 275.5], [234.3, 276.8], [247.4, 279.0], [260.3, 281.8], [273.3, 284.5], [285.9, 288.6], [297.8, 294.4], [308.7, 301.9], [320.2, 308.5], [332.2, 314.1], [344.7, 318.4], [357.8, 320.1], [371.1, 320.6], [384.3, 320.3], [397.5, 319.0], [410.7, 317.3], [423.8, 315.8], [437.1, 315.0], [450.3, 314.0], [463.5, 313.1], [476.8, 313.1], [490.0, 313.1], [503.3, 313.7], [516.4, 315.1], [529.6, 316.6], [542.4, 319.9], [554.7, 324.9], [565.5, 332.5], [574.5, 342.2], [582.1, 353.1], [582.1, 366]],
  [[218.2, 205.2], [217.0, 214.5], [217.4, 223.9], [219.5, 233.1], [223.3, 241.7], [228.8, 249.3], [236.0, 255.3], [244.3, 259.8], [253.1, 263.3], [262.1, 265.8], [271.5, 267.0], [280.9, 267.9], [290.2, 268.8], [299.6, 269.9], [308.8, 271.8], [317.7, 274.8], [326.4, 278.5], [335.1, 282.1], [343.3, 286.7], [351.4, 291.6], [359.8, 295.9], [368.3, 299.8], [377.1, 303.3], [386.1, 305.9], [395.4, 307.5], [404.8, 308.3], [414.2, 308.3], [423.6, 307.7], [433.0, 307.1], [442.4, 306.2], [451.8, 305.3], [461.2, 304.7], [470.6, 304.1], [480.0, 304.0], [489.4, 304.0], [498.9, 304.0], [508.3, 304.3], [517.7, 304.9], [527.0, 305.9], [536.2, 308.1], [545.2, 310.9], [554.0, 314.1], [562.5, 318.3], [570.2, 323.7], [577.2, 330.0], [583.6, 336.9], [588.9, 344.7], [593.2, 353.1], [593.2, 366]],
  [[971.8, 211.1], [962.4, 211.7], [953.1, 213.5], [944.5, 217.3], [937.3, 223.2], [931.4, 230.6], [925.9, 238.2], [920.3, 245.8], [914.5, 253.3], [908.9, 260.9], [903.7, 268.7], [898.1, 276.3], [892.5, 283.9], [887.0, 291.5], [881.3, 299.0], [875.4, 306.3], [868.5, 312.7], [860.7, 318.0], [852.3, 322.2], [843.4, 325.5], [834.3, 328.0], [825.0, 329.2], [815.6, 329.4], [806.2, 328.9], [796.8, 328.1], [787.4, 326.8], [778.4, 324.3], [769.5, 321.0], [760.9, 317.3], [752.5, 313.0], [743.8, 309.4], [734.8, 306.4], [725.9, 303.4], [716.9, 300.8], [707.6, 299.1], [698.2, 298.7], [688.8, 298.7], [679.3, 298.9], [670.0, 300.2], [660.9, 302.7], [652.0, 305.6], [643.3, 309.3], [635.7, 314.8], [628.9, 321.3], [622.8, 328.5], [617.0, 335.9], [612.7, 344.3], [609.3, 353.1], [609.3, 366]],
  [[1137.8, 163.8], [1137.6, 176.9], [1135.7, 189.8], [1129.7, 201.4], [1121.4, 211.5], [1112.8, 221.4], [1103.3, 230.4], [1093.2, 238.7], [1082.5, 246.3], [1071.2, 253.0], [1059.7, 259.3], [1047.6, 264.2], [1035.2, 268.4], [1022.3, 270.8], [1009.5, 273.6], [996.8, 276.6], [984.1, 280.0], [971.8, 284.6], [959.8, 289.8], [948.2, 295.8], [937.1, 302.7], [925.7, 309.3], [914.3, 315.8], [903.5, 323.2], [892.6, 330.5], [881.2, 336.9], [869.0, 341.6], [856.6, 345.8], [843.9, 349.2], [830.9, 350.7], [817.8, 351.5], [804.7, 351.5], [791.6, 351.4], [778.8, 348.8], [766.4, 344.7], [754.5, 339.2], [744.1, 331.2], [733.4, 323.8], [721.4, 318.6], [709.1, 314.0], [696.3, 311.3], [683.2, 310.8], [670.1, 311.8], [657.7, 315.9], [646.3, 322.3], [636.9, 331.4], [629.0, 341.8], [622.6, 353.2], [622.6, 366]],
  [[1075.7, 288.8], [1065.4, 288.1], [1055.1, 288.2], [1044.8, 288.7], [1034.6, 290.2], [1024.5, 292.3], [1014.4, 294.4], [1004.5, 297.4], [995.0, 301.3], [985.9, 306.3], [977.6, 312.4], [969.8, 319.1], [961.4, 325.1], [952.8, 330.8], [944.0, 336.1], [935.0, 341.2], [925.6, 345.5], [915.9, 348.9], [906.1, 352.3], [896.4, 355.6], [886.5, 358.4], [876.5, 361.1], [866.6, 364.1], [856.4, 365.7], [846.2, 366.8], [835.9, 367.7], [825.6, 367.7], [815.3, 367.5], [805.0, 366.9], [794.7, 366.0], [784.7, 363.6], [774.9, 360.2], [765.4, 356.3], [756.1, 351.9], [746.8, 347.3], [738.1, 341.8], [729.8, 335.7], [721.1, 330.2], [712.0, 325.3], [702.3, 321.9], [692.1, 320.6], [681.8, 320.3], [671.5, 321.1], [661.6, 323.9], [652.6, 328.9], [645.1, 335.9], [638.8, 344.1], [633.8, 353.1], [633.8, 366]],
  [[984.7, 355.8], [977.0, 355.8], [969.2, 355.8], [961.4, 355.8], [953.6, 356.1], [945.9, 357.2], [938.4, 359.1], [930.9, 361.3], [923.4, 363.4], [916.0, 365.6], [908.7, 368.4], [901.4, 371.2], [894.0, 373.4], [886.4, 375.4], [879.0, 377.8], [871.7, 380.2], [864.4, 383.1], [857.0, 385.5], [849.4, 387.0], [841.7, 388.3], [834.0, 389.4], [826.2, 389.8], [818.5, 389.6], [810.7, 388.6], [803.2, 386.8], [795.7, 384.7], [788.4, 381.9], [781.2, 379.0], [773.8, 376.4], [766.9, 372.9], [760.3, 368.9], [753.4, 365.1], [746.9, 361.0], [740.9, 356.0], [735.1, 350.8], [728.8, 346.2], [722.1, 342.3], [715.2, 338.7], [708.1, 335.4], [700.7, 333.1], [693.0, 331.9], [685.3, 331.3], [677.5, 331.9], [669.9, 333.4], [662.7, 336.2], [656.5, 340.9], [651.3, 346.7], [647.0, 353.2], [647.0, 366]],
  [[1036.2, 429.8], [1027.5, 429.1], [1018.8, 429.1], [1010.1, 428.4], [1001.5, 427.7], [992.8, 427.1], [984.1, 426.5], [975.5, 425.6], [967.1, 423.5], [958.8, 420.9], [950.5, 418.2], [942.1, 416.0], [933.7, 413.7], [925.4, 411.4], [916.8, 410.2], [908.1, 410.1], [899.4, 410.7], [890.8, 411.5], [882.1, 412.4], [873.5, 413.5], [864.9, 414.6], [856.2, 415.3], [847.6, 415.8], [838.9, 416.3], [830.2, 416.5], [821.5, 416.5], [812.8, 416.2], [804.3, 414.8], [796.1, 412.0], [788.0, 408.7], [780.2, 405.0], [772.8, 400.3], [765.8, 395.2], [759.1, 389.8], [752.5, 384.1], [746.0, 378.3], [739.5, 372.5], [733.0, 366.7], [726.5, 361.0], [719.7, 355.6], [712.6, 350.5], [705.4, 345.8], [697.2, 342.8], [688.6, 341.8], [679.9, 341.7], [671.5, 343.4], [663.9, 347.7], [657.5, 353.5], [657.5, 366]],
  [[915.9, 464.3], [911.2, 464.7], [906.4, 464.7], [901.6, 464.5], [896.9, 464.4], [892.1, 464.3], [887.3, 464.3], [882.5, 464.3], [877.7, 464.3], [873.0, 464.3], [868.2, 464.3], [863.4, 464.3], [858.6, 464.3], [853.9, 464.3], [849.1, 464.3], [844.3, 464.3], [839.5, 463.9], [834.8, 463.6], [830.0, 463.1], [825.3, 462.5], [820.6, 461.6], [816.0, 460.4], [811.4, 459.0], [806.9, 457.3], [802.5, 455.6], [798.1, 453.8], [793.8, 451.7], [789.5, 449.5], [785.5, 447.0], [781.6, 444.2], [778.0, 441.1], [774.7, 437.6], [771.5, 434.1], [768.4, 430.5], [765.3, 426.8], [762.3, 423.1], [759.4, 419.3], [756.3, 415.7], [753.4, 411.9], [750.4, 408.2], [747.4, 404.4], [744.3, 400.8], [741.1, 397.2], [720, 380], [700, 368], [680, 360], [668, 352], [668, 366]]];
const PINS=[530.8,546.7,556.2,568.8,582.1,593.2,609.3,622.6,633.8,647.0,657.5,668];

const copy = {
  en: {
    title:'Introducing <span class="by-acc">BursYar AI</span><br>Scholarships, checked against your documents',
    lead:'BursYar reads your documents, checks the official requirements, and shows your next step.',
    action:'Check my eligibility', sample:'Illustrative example', program:'Meridian', degree:'Degree', language:'Language', grades:'GPA',
    met:'Met', unknown:'Unknown', notMet:'Not met', evidence:'1 needs evidence', pause:'Pause animation', play:'Play animation',
  },
  fa: {
    title:'<span class="by-acc">بورس‌یار با هوش مصنوعی</span><br>بررسی بورسیه بر اساس مدارک شما',
    lead:'بورس‌یار مدارک شما را می‌خواند، شرایط رسمی را بررسی می‌کند و گام بعدی را نشان می‌دهد.',
    action:'شروع با مدارک خود', sample:'نمونهٔ نمایشی', program:'مریدین', degree:'مدرک تحصیلی', language:'زبان', grades:'معدل',
    met:'برآورده شد', unknown:'نامشخص', notMet:'برآورده نشد', evidence:'یک شرط به مدرک نیاز دارد', pause:'توقف حرکت', play:'پخش حرکت',
    tiles:['رزومه','انگیزه‌نامه','گذرنامه','آیلتس ۷٫۰','ریزنمرات','مدرک تحصیلی','صفحهٔ رسمی','دانشگاه','بورسیه‌ها','صورت‌حساب بانکی','توصیه‌نامه','مدرک هویت'],
  },
  ps: {
    title:'<span class="by-acc">بورس‌یار له مصنوعي ځیرکتیا سره</span><br>ستاسو د اسنادو پر بنسټ د بورس ارزونه',
    lead:'بورس‌یار ستاسو اسناد لولي، رسمي شرطونه ارزوي او بل ګام درښيي.',
    action:'خپل شرایط وارزوئ', sample:'ازمایښتي بېلګه', program:'مېریډین', degree:'تحصیلي سند', language:'ژبه', grades:'نمرې',
    met:'پوره شو', unknown:'نامعلوم', notMet:'پوره نه شو', evidence:'یو شرط سند ته اړتیا لري', pause:'حرکت ودروئ', play:'حرکت پیل کړئ',
    tiles:['ژوندلیک','انګېزه‌لیک','پاسپورټ','آیلټس ۷٫۰','د نمرو لړلیک','تحصیلي سند','رسمي پاڼه','پوهنتون','بورسونه','بانکي حساب','سپارښت‌لیک','پېژندپاڼه'],
  },
};

export function referenceHero(language) {
  const t=copy[language] ?? copy.en;
  const dir=language==='en'?'ltr':'rtl';
  return `<section id="by-hero-cables" aria-labelledby="by-title">
    <div id="by-stage">
      <div class="by-hero" dir="${dir}">
        <h1 id="by-title">${t.title}</h1>
        <p>${t.lead}</p>
        <div class="by-actions"><a class="by-btn" href="#documents-mount" data-open=".workspace">${t.action}</a></div>
      </div>
      <svg id="by-cables" width="1200" height="676" viewBox="0 0 1200 676" aria-hidden="true">
        <ellipse class="by-halo" cx="601" cy="433" rx="219" ry="145"/>
        <ellipse class="by-ring" cx="601" cy="433" rx="140" ry="81"/>
        ${CABLES.map(points=>`<path d="M ${points.map(point=>point.join(' ')).join(' L ')}"/>`).join('')}
        ${PINS.map(x=>`<rect x="${x-4.5}" y="352" width="9" height="14" rx="2" class="by-pin"/>`).join('')}
        ${CABLES.map(([[x,y]],index)=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${TILES[index].color}"/>`).join('')}
        ${TILES.map(tile=>`<circle class="by-bead" r="3.5" fill="${tile.color}" visibility="hidden"/>`).join('')}
      </svg>
      ${TILES.map((tile,index)=>`<div class="by-tile"><span aria-hidden="true">${ICONS[tile.icon]}</span><span class="by-tlabel ${tile.lab}">${t.tiles?.[index] ?? tile.label}</span></div>`).join('')}
      <div id="by-hub" aria-hidden="true"><div class="by-fa" lang="fa">بورس‌یار</div><div class="by-en">BursYar</div><div class="by-ai">AI</div></div>
      <div id="by-result" dir="${dir}">
        <div class="by-rhead"><span>${t.sample}</span><span>${t.program}</span></div>
        <div class="by-row"><span>${t.degree}</span><span class="by-pill ok">${t.met}</span></div>
        <div class="by-row"><span>${t.language}</span><span class="by-pill warn">${t.unknown}</span></div>
        <div class="by-row"><span>${t.grades}</span><span class="by-pill no">${t.notMet}</span></div>
        <div class="by-rfoot">${t.evidence}</div>
      </div>
      <button class="by-motion" type="button" hidden>${t.pause}</button>
    </div>
  </section>`;
}

export function mountReferenceHero(root, language) {
  const section=root.querySelector('#by-hero-cables');
  section.querySelectorAll('.by-tile').forEach((node,index)=>{
    const tile=TILES[index];
    Object.assign(node.style,{left:(tile.x-23)+'px',top:(tile.y-23)+'px',color:tile.color});
  });
  const stage=section.querySelector('#by-stage');
  const button=section.querySelector('.by-motion');
  const desktop=matchMedia('screen and (min-width:1050px)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const t=copy[language] ?? copy.en;
  const paths=[...section.querySelectorAll('#by-cables > path')];
  const beads=[...section.querySelectorAll('.by-bead')];
  let lengths;
  let visible=false;
  let paused=false;
  let frame=0;
  let elapsed=0;
  let lastFrame;

  function fit() {
    if(section.clientWidth)stage.style.transform=`scale(${section.clientWidth/1200})`;
  }

  function draw() {
    lengths ??= paths.map(path=>path.getTotalLength());
    beads.forEach((bead,index)=>{
      const progress=(elapsed/10000+index/paths.length)%1;
      const {x,y}=paths[index].getPointAtLength(progress*lengths[index]);
      bead.setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      bead.setAttribute('visibility','visible');
    });
  }

  function tick(now) {
    if(lastFrame===undefined||now-lastFrame>=1000/24){
      if(lastFrame!==undefined)elapsed+=now-lastFrame;
      lastFrame=now;
      draw();
    }
    frame=requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    lastFrame=undefined;
    const motionAvailable=Boolean(observer)&&!reduced.matches;
    button.hidden=!motionAvailable;
    button.textContent=paused?t.play:t.pause;
    beads.forEach(bead=>bead.setAttribute('visibility','hidden'));
    fit();
    if(!desktop.matches||!visible||document.hidden||!motionAvailable)return;
    if(paused)draw();
    else frame=requestAnimationFrame(tick);
  }

  function toggle() {
    paused=!paused;
    sync();
  }

  const observer=typeof IntersectionObserver==='function' ? new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    sync();
  }) : null;
  const resize=typeof ResizeObserver==='function' ? new ResizeObserver(fit) : null;
  observer?.observe(section);
  if(resize)resize.observe(section);
  else window.addEventListener('resize',fit);
  button.addEventListener('click',toggle);
  document.addEventListener('visibilitychange',sync);
  desktop.addEventListener('change',sync);
  reduced.addEventListener('change',sync);
  sync();
  return ()=>{
    cancelAnimationFrame(frame);
    observer?.disconnect();
    resize?.disconnect();
    window.removeEventListener('resize',fit);
    button.removeEventListener('click',toggle);
    document.removeEventListener('visibilitychange',sync);
    desktop.removeEventListener('change',sync);
    reduced.removeEventListener('change',sync);
  };
}
