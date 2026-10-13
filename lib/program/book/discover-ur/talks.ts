import { discoverTalks } from "../discover/talks";
import type { BookChapter, Talk } from "../types";

/* Roman Urdu: the same talks and the same cuts (video ids and times unchanged), with the part titles and notes translated */
const UR: Record<string, [string, string]> = {
  "x2-rSnhpw0g:575": ["C4 model mukhtasar mein", "Zoom ke chaar levels — context, containers, components, code — aur notation se pehle abstractions kyun tay karte hain."],
  "x2-rSnhpw0g:690": ["Level 1: system context", "System, use istemaal karne wale log aur woh systems jin se yeh baat karta hai — audit ka pehla diagram."],
  "x2-rSnhpw0g:828": ["Level 2: containers", "Woh hisse jo aap deploy aur run karte hain, aur woh aapas mein kaise baat karte hain — woh level jis par architecture options sketch hote hain."],
  "x2-rSnhpw0g:1020": ["Level 3: components", "Ek container ke andar zoom — sirf wahan jahan kisi ko samajhne mein madad mile."],
  "x2-rSnhpw0g:1703": ["Legend, shapes, rang — khud bolne wale diagrams", "Har diagram par key aur ek jaisi notation, taa ke do option sketches bina samjhane wale ke compare ho sakein."],
  "P_6eDL1aqtA:411": ["Code legacy kab banta hai?", "Umar se zyada is baat se ke aap samajhte hain ke woh kya karta hai. Hairat khatre ki nishani hai; tests, compiler aur jaan boojh kar daali gayi ghaltiyan us ka rawayya seekhne ke tareeqe hain."],
  "P_6eDL1aqtA:2032": ["Legacy code theek karein — ya us se bachein", "Purane code ko behtar karne mein kitna waqt lagayein aur kab us ke gird kaam karein: \"jo maujood hai use behtar karna\" bator option ke peeche ka sawal."],
  "P_6eDL1aqtA:2498": ["Scratch refactoring", "Code samajhne ke liye khul kar refactor karein, phir badlaao phenk dein — kuch badle baghair seekhna."],
  "f84n5oFoZBc:638": ["Masla bayan karein", "Kisi bhi solution ke aane se pehle masla kahein — zubaani, kaghaz par."],
  "f84n5oFoZBc:705": ["Masla samjhein", "Aap ko kya pata hai, kya nahi pata, constraints kya hain? Brief aur unknowns ke sawal."],
  "f84n5oFoZBc:972": ["Zyada input, behtar output", "Masle ke ird gird parhein: milte julte masle aur woh hal jo doosre pehle dhoond chuke hain."],
  "f84n5oFoZBc:1087": ["Trade-offs", "Ek se zyada hal rakhein, aur jaanein ke har ek kya chhorta hai."],
  "f84n5oFoZBc:2284": ["Aap ghalat honge", "Ghalat hona amal ka hissa hai — maqsad pata lagana aur aage barhna hai."],
  "9MKY4KypBzg:192": ["Latency ka rawayya kya hai", "Latency ek distribution hai, ek number nahi — poori shakal bayan karein, us ka ek point nahi."],
  "9MKY4KypBzg:562": ["Latency ki shakal dekhna", "Percentile plots jo woh tail dikhate hain jo average chhupa leta hai."],
  "9MKY4KypBzg:1535": ["Load ke neeche latency bator requirement", "Qabil-e-qubool ko diye gaye load par percentiles mein bayan karna — achhe quality target ki shakal."],
  "9MKY4KypBzg:2158": ["Sustainable throughput", "Woh load jo system latency requirement poori karte hue utha sake — jis ke khilaaf prototype naapna chahiye."],
  "9MKY4KypBzg:2607": ["Coordinated omission", "Load tools kaise khamoshi se sab se buri latencies chhor dete hain — aur baseline ko asal se behtar dikhate hain."],
  "9MKY4KypBzg:3304": ["Behtar naap ke tools", "Latency aise naapna ke tail imaandaar rahe."],
  "tEylFyxbDLE:64": ["Pehle reliability par ittefaq", "Availability ka matlab, kitni kaafi hai, aur na milne par kya hoga — product owners ke saath pehle se tay."],
  "tEylFyxbDLE:126": ["100% kyun nahi?", "100% ke qareeb cost aur complexity tezi se barhti hai; har service ka apna point hai jahan users farq mehsoos karna chhor dete hain."],
  "tEylFyxbDLE:187": ["Service level indicators", "Waqt ke saath metrics, percentile ya median mein samet kar threshold se compare — maslan paanch minute mein 99th-percentile latency 300 ms se kam."],
  "tEylFyxbDLE:250": ["Indicator se objective tak", "SLO indicator ko lambe arse par jodta hai — aur yeh oopar ki had ke saath neeche ki had bhi hai."],
  "tEylFyxbDLE:347": ["Agreements", "SLA oopar bana commercial wada hai, SLO se dheela rakha jaata hai taa ke tootne se pehle khabar ho."],
  "abLan0aXJkw:838": ["Methodology kyun", "Andazon ke bajaye methods: andar jaane ka aisa raasta jo masla dhoonde, jaane pehchane shak wale nahi."],
  "abLan0aXJkw:1318": ["Streetlight anti-method", "Wahan dekhna jahan dekhna aasaan hai, wahan nahi jahan masla hai — pehle aasaan sawalon ka jawab dene ka jaal."],
  "abLan0aXJkw:1714": ["Problem statement method", "Kuch bhi parakhne se pehle ke sawal — aap ko kyun lagta hai masla hai, aur kya badla?"],
  "abLan0aXJkw:2074": ["Scientific method", "Sawal, hypothesis, prediction, test, analysis — ghalat sabit ho sakne wali hypothesis aur spike ki shakal."],
  "abLan0aXJkw:2596": ["Workload characterization", "Load kaun paida kar raha hai, kyun, kya hai, aur waqt ke saath kaise badalta hai — kisi number ko judge karne se pehle."],
  "abLan0aXJkw:2844": ["Drill-down analysis", "Oopar se shuru kar ke level ba level neeche jaana jab tak cause na mile."],
  "abLan0aXJkw:3544": ["USE method", "Har resource ke liye utilization, saturation aur errors — system badalne se pehle naapne ki checklist."],
  "Q6RfMmMwhvM:0": ["Har cheez trade-off hai", "Architecture faislon ki koi best practice nahi — sirf trade-offs jinhein dhoondna aur tolna hai."],
  "Q6RfMmMwhvM:1888": ["Apples-to-apples muqabla", "Options ko ek jaisi sharton par compare karna, taa ke muqabla munsifana ho."],
  "Q6RfMmMwhvM:2398": ["Stakeholders se baat", "Trade-off ko aisi zubaan mein samjhana jise faisla karne wale tol sakein."],
  "Q6RfMmMwhvM:2693": ["Qualitative se quantitative tak", "Qualitative muqable ko naape ja sakne wali cheez mein badalna."],
  "LMBqGPLvonU:69": ["ADR ka dhaancha", "ADR ke hisse, aur har ek kis liye hai."],
  "LMBqGPLvonU:211": ["Asal scenario ke liye ADR likhna", "Ek misaal, halaat se likhe hue record tak."],
  "LMBqGPLvonU:470": ["ADRs ke tools", "Tools jo ADRs ko code ke saath aur likhne mein aasaan rakhte hain."],
  "DngAZyWMGR0:140": ["Architecture bator mushtarka samajh", "Architecture woh jo project ke tajurbekar log is ke kaam karne ke baare mein mil kar samajhte hain — jise audit wapas haasil karta hai."],
  "DngAZyWMGR0:270": ["Architecture bator woh faisle jo badalna mushkil hai", "Sab se zyada tawajjo ke laaiq faisle woh hain jo palatna mushkil hai — decision record unhi ke liye hai."],
  "DngAZyWMGR0:571": ["Design stamina hypothesis", "Achhi andaruni quality team ko waqt ke saath tez rakhti hai — options tolte waqt code health kyun ahem hai."],
};
export const discoverTalksUr: Talk[] = discoverTalks.map((t) => ({ ...t, parts: t.parts.map((p) => { const x = UR[`${t.id}:${p.start}`]; return x ? { ...p, title: x[0], what: x[1] } : p; }) }));

export const talksChapterUr: BookChapter = {
  id: "watch", n: "W", title: "Discover talks mein", kicker: "Dekhein", question: "Nau talks ke woh hisse jo Discover ke liye ahem hain — har ek clip, apne timestamp se chalta hua.",
  intro: [
    { t: "lead", text: "Nau talks shuru se aakhir tak dekhna zaroori nahi. Yeh woh hisse hain jo yahan ahem hain, har ek apne shuru aur aakhir par kata hua, aur un subtopics se juda jin ke kaam aata hai." },
    { t: "p", text: "Topic chunein to sirf us ke hisse dikhein, ya talk ba talk parhein. Har hissa clip ki tarah chalta hai — pehle second se aakhri tak — yahin; **Agla** agle hisse par le jaata hai. Yehi hisse har us subtopic ke aakhir mein bhi aate hain jis ke kaam aate hain." },
    { t: "talks" },
    { t: "note", text: "Timestamps har video ke apne chapter marks ke mutabiq hain (SLI video ke chapters nahi, us ke transcript se kaata gaya). Titles aur notes hamare hain; talks un ke speakers aur publishers ki hain." },
  ],
  sections: [],
};
