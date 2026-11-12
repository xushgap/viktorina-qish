module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin","*");
  if (req.method !== "POST") return res.status(405).json({error:"POST kerak"});
  const {grade,topic,pass} = req.body||{};
  if (process.env.TEACHER_PASS && pass!==process.env.TEACHER_PASS)
    return res.status(401).json({error:"Parol noto'g'ri"});
  const model = process.env.GEMINI_MODEL||"gemini-2.5-flash";
  const prompt = `${grade}-sinf informatika. Mavzu: "${topic}". 12 ta test savoli. O'zbek tilida lotin yozuvida. FAQAT JSON massiv: [{"q":"savol","o":["A","B","C","D"],"c":0}]. c=to'g'ri javob indeksi 0-3.`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({error:"Gemini javob bermadi",raw:JSON.stringify(j).slice(0,300)});
    res.json({questions:JSON.parse(text)});
  } catch(e){
    res.status(500).json({error:e.message});
  }
};
