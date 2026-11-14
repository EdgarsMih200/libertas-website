# -*- coding: utf-8 -*-
# Pielikumi: darbības vārdu tabulas, ceļotāja sarunvārdnīca, varoņi

PERS = ["yo", "tú", "él/ella/Ud.", "nosotros", "vosotros", "ellos/Uds."]

IMPF = {"ar": ["aba", "abas", "aba", "ábamos", "abais", "aban"], "er": ["ía", "ías", "ía", "íamos", "íais", "ían"]}
FUT = ["é", "ás", "á", "emos", "éis", "án"]


def imperf(inf):
    st, g = inf[:-2], inf[-2:]
    return [st + e for e in IMPF["ar" if g == "ar" else "er"]]


def fut(stem):
    return [stem + e for e in FUT]


def s(x):
    return x.split()

# (nenoteiksme, nozīme, tagadne, vienkāršā pagātne, nepabeigtā pagātne|None, nākotnes celms|None, ģerundijs, divdabis, piezīme)
VERBI = [
 ("hablar", "runāt", s("hablo hablas habla hablamos habláis hablan"), s("hablé hablaste habló hablamos hablasteis hablaron"), None, None, "hablando", "hablado", "Paraugs visiem -ar vārdiem"),
 ("comer", "ēst", s("como comes come comemos coméis comen"), s("comí comiste comió comimos comisteis comieron"), None, None, "comiendo", "comido", "Paraugs visiem -er vārdiem"),
 ("vivir", "dzīvot", s("vivo vives vive vivimos vivís viven"), s("viví viviste vivió vivimos vivisteis vivieron"), None, None, "viviendo", "vivido", "Paraugs visiem -ir vārdiem"),
 ("ser", "būt (kas, kāds)", s("soy eres es somos sois son"), s("fui fuiste fue fuimos fuisteis fueron"), s("era eras era éramos erais eran"), None, "siendo", "sido", "Pagātne kā ir"),
 ("estar", "būt (kur, kā)", s("estoy estás está estamos estáis están"), s("estuve estuviste estuvo estuvimos estuvisteis estuvieron"), None, None, "estando", "estado", ""),
 ("tener", "būt (kam), piederēt", s("tengo tienes tiene tenemos tenéis tienen"), s("tuve tuviste tuvo tuvimos tuvisteis tuvieron"), None, "tendr", "teniendo", "tenido", "tener que = vajag"),
 ("haber", "palīgdarb. v.; hay = ir", s("he has ha hemos habéis han"), s("hube hubiste hubo hubimos hubisteis hubieron"), None, "habr", "habiendo", "habido", "Saliktā tagadne: he + divdabis"),
 ("ir", "iet, braukt", s("voy vas va vamos vais van"), s("fui fuiste fue fuimos fuisteis fueron"), s("iba ibas iba íbamos ibais iban"), None, "yendo", "ido", "ir a + nenoteiksme = tuvā nākotne"),
 ("hacer", "darīt, taisīt", s("hago haces hace hacemos hacéis hacen"), s("hice hiciste hizo hicimos hicisteis hicieron"), None, "har", "haciendo", "hecho", "hace frío / calor"),
 ("poder", "varēt", s("puedo puedes puede podemos podéis pueden"), s("pude pudiste pudo pudimos pudisteis pudieron"), None, "podr", "pudiendo", "podido", "o → ue"),
 ("querer", "gribēt; mīlēt", s("quiero quieres quiere queremos queréis quieren"), s("quise quisiste quiso quisimos quisisteis quisieron"), None, "querr", "queriendo", "querido", "e → ie"),
 ("decir", "teikt", s("digo dices dice decimos decís dicen"), s("dije dijiste dijo dijimos dijisteis dijeron"), None, "dir", "diciendo", "dicho", ""),
 ("venir", "nākt", s("vengo vienes viene venimos venís vienen"), s("vine viniste vino vinimos vinisteis vinieron"), None, "vendr", "viniendo", "venido", ""),
 ("ver", "redzēt", s("veo ves ve vemos veis ven"), s("vi viste vio vimos visteis vieron"), s("veía veías veía veíamos veíais veían"), None, "viendo", "visto", ""),
 ("dar", "dot", s("doy das da damos dais dan"), s("di diste dio dimos disteis dieron"), None, None, "dando", "dado", ""),
 ("saber", "zināt, prast", s("sé sabes sabe sabemos sabéis saben"), s("supe supiste supo supimos supisteis supieron"), None, "sabr", "sabiendo", "sabido", ""),
 ("poner", "likt", s("pongo pones pone ponemos ponéis ponen"), s("puse pusiste puso pusimos pusisteis pusieron"), None, "pondr", "poniendo", "puesto", ""),
 ("salir", "iziet", s("salgo sales sale salimos salís salen"), s("salí saliste salió salimos salisteis salieron"), None, "saldr", "saliendo", "salido", ""),
 ("dormir", "gulēt", s("duermo duermes duerme dormimos dormís duermen"), s("dormí dormiste durmió dormimos dormisteis durmieron"), None, None, "durmiendo", "dormido", "o → ue"),
 ("pedir", "lūgt, pasūtīt", s("pido pides pide pedimos pedís piden"), s("pedí pediste pidió pedimos pedisteis pidieron"), None, None, "pidiendo", "pedido", "e → i"),
 ("jugar", "spēlēt", s("juego juegas juega jugamos jugáis juegan"), s("jugué jugaste jugó jugamos jugasteis jugaron"), None, None, "jugando", "jugado", "u → ue"),
 ("levantarse", "celties", s("me_levanto te_levantas se_levanta nos_levantamos os_levantáis se_levantan"), s("me_levanté te_levantaste se_levantó nos_levantamos os_levantasteis se_levantaron"), None, None, "levantándose", "levantado", "Refleksīvs: me, te, se, nos, os, se"),
]


def tabula(v):
    inf, noz, pres, ind, imp, fst, ger, part, piez = v
    base = inf[:-2] if not inf.endswith("se") else inf[:-4]
    if imp is None:
        imp = imperf(inf if not inf.endswith("se") else inf[:-2])
        if inf.endswith("se"):
            imp = [p + " " + x for p, x in zip(["me", "te", "se", "nos", "os", "se"], imp)]
    if fst is None:
        fu = fut(inf if not inf.endswith("se") else inf[:-2])
        if inf.endswith("se"):
            fu = [p + " " + x for p, x in zip(["me", "te", "se", "nos", "os", "se"], fu)]
    else:
        fu = fut(fst)
    pres = [x.replace("_", " ") for x in pres]
    ind = [x.replace("_", " ") for x in ind]
    return dict(inf=inf, noz=noz, rows=list(zip(PERS, pres, ind, imp, fu)), ger=ger, part=part, piez=piez)


SARUNVARDNICA = [
 ("Pamatfrāzes", [
  ("Hola. / Adiós.", "Sveiki. / Uz redzēšanos."),
  ("Por favor. / Gracias.", "Lūdzu. / Paldies."),
  ("De nada.", "Nav par ko."),
  ("Perdón. / Lo siento.", "Atvainojiet. / Man žēl."),
  ("Sí. / No.", "Jā. / Nē."),
  ("¿Qué tal?", "Kā iet?"),
  ("Vale.", "Labi, sarunāts."),
 ]),
 ("Ja nesaproti", [
  ("No entiendo.", "Es nesaprotu."),
  ("¿Puede repetir, por favor?", "Vai varat atkārtot, lūdzu?"),
  ("Más despacio, por favor.", "Lēnāk, lūdzu."),
  ("¿Habla inglés?", "Vai jūs runājat angliski?"),
  ("¿Cómo se dice … en español?", "Kā spāniski saka …?"),
  ("¿Qué significa …?", "Ko nozīmē …?"),
  ("¿Cómo se escribe?", "Kā to raksta?"),
 ]),
 ("Ceļā", [
  ("¿Dónde está …?", "Kur atrodas …?"),
  ("¿Cómo llego a …?", "Kā nokļūt līdz …?"),
  ("Un billete para …, por favor.", "Vienu biļeti uz …, lūdzu."),
  ("¿A qué hora sale el tren?", "Cikos atiet vilciens?"),
  ("¿Está lejos / cerca?", "Vai tas ir tālu / tuvu?"),
  ("a la derecha / a la izquierda / todo recto", "pa labi / pa kreisi / taisni"),
  ("la parada de autobús", "autobusa pietura"),
 ]),
 ("Viesnīcā", [
  ("Tengo una reserva a nombre de …", "Man ir rezervācija uz … vārda."),
  ("¿Hay habitaciones libres?", "Vai ir brīvas istabas?"),
  ("¿El desayuno está incluido?", "Vai brokastis ir iekļautas?"),
  ("¿Cuál es la contraseña del wifi?", "Kāda ir wifi parole?"),
  ("La llave, por favor.", "Atslēgu, lūdzu."),
  ("No funciona el aire acondicionado.", "Nedarbojas kondicionieris."),
 ]),
 ("Kafejnīcā un restorānā", [
  ("Una mesa para dos, por favor.", "Galdiņu diviem, lūdzu."),
  ("La carta, por favor.", "Ēdienkarti, lūdzu."),
  ("¿Qué me recomienda?", "Ko jūs ieteiktu?"),
  ("Para mí, …", "Man …"),
  ("Un café con leche y un agua sin gas.", "Kafiju ar pienu un negāzētu ūdeni."),
  ("Soy alérgico/-a a …", "Man ir alerģija pret …"),
  ("La cuenta, por favor.", "Rēķinu, lūdzu."),
  ("¿Puedo pagar con tarjeta?", "Vai varu maksāt ar karti?"),
 ]),
 ("Veikalā", [
  ("¿Cuánto cuesta?", "Cik tas maksā?"),
  ("Solo estoy mirando.", "Es tikai skatos."),
  ("¿Tiene una talla más grande?", "Vai jums ir lielāks izmērs?"),
  ("¿Puedo probármelo?", "Vai varu to uzlaikot?"),
  ("Me lo llevo.", "Es to ņemšu."),
  ("¿Me da una bolsa?", "Vai varat iedot maisiņu?"),
 ]),
 ("Ārkārtas situācijās", [
  ("¡Ayuda!", "Palīgā!"),
  ("Llame a una ambulancia.", "Izsauciet ātro palīdzību."),
  ("Necesito un médico.", "Man vajag ārstu."),
  ("Me duele aquí.", "Man sāp šeit."),
  ("He perdido mi pasaporte.", "Esmu pazaudējis/-usi pasi."),
  ("¿Dónde está la farmacia más cercana?", "Kur ir tuvākā aptieka?"),
  ("Número de emergencias: 112", "Ārkārtas tālrunis: 112"),
 ]),
 ("Sarunai", [
  ("Me llamo … ¿Y tú?", "Mani sauc … Un tevi?"),
  ("Soy de Letonia.", "Es esmu no Latvijas."),
  ("Estoy aprendiendo español.", "Es mācos spāņu valodu."),
  ("¿A qué te dedicas?", "Ar ko tu nodarbojies?"),
  ("¡Qué bonito!", "Cik jauki!"),
  ("¡Salud!", "Priekā! (sadzerot)"),
  ("¡Buen provecho!", "Labu apetīti!"),
 ]),
]

VARONI = [
 ("Līga", "L", "#B4502A", "Līga Ozola, 30 años. Diseñadora de Riga. Se muda a Valencia por trabajo.", "30 gadi, dizainere no Rīgas. Pārceļas uz Valensiju darba dēļ."),
 ("Carmen", "C", "#6B1D1D", "La vecina de Līga. Simpática, habladora y gran cocinera.", "Līgas kaimiņiene. Sirsnīga, runīga un lieliska pavāre."),
 ("Lucía", "Lu", "#2F5878", "La nieta de Carmen. Tiene ocho años y adora los animales.", "Karmenas mazmeita. Viņai ir astoņi gadi, un viņa dievina dzīvniekus."),
 ("Javier", "J", "#34503F", "Compañero de trabajo de Līga. Valenciano, cocinero y bailarín.", "Līgas darba kolēģis. Valensietis, prot gatavot un dejot."),
 ("Andris", "A", "#5C554D", "El hermano de Līga. Programador. Llega en la segunda parte.", "Līgas brālis, programmētājs. Ierodas grāmatas otrajā daļā."),
 ("Toby", "T", "#C98F3A", "El perro de Carmen. Pequeño, marrón y loco por el chocolate.", "Karmenas suns. Mazs, brūns un traks uz šokolādi."),
]
