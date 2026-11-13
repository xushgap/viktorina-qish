module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(405).json({ error: "POST kerak" });
  const { grade, topic, pass } = req.body || {};
  if (process.env.TEACHER_PASS && pass !== process.env.TEACHER_PASS)
    return res.status(401).json({ error: "Parol noto'g'ri" });
  if (!grade || !topic) return res.status(400).json({ error: "grade va topic kerak" });

  const prompt = `O'zbekiston maktab informatika darsligi. ${grade}-sinf, mavzu: "${topic}". 12 ta test savoli tuz. O'zbek tilida lotin yozuvida. FAQAT JSON massiv qaytargusan, boshqa hech narsa yozma:\n[{"q":"savol","o":["A","B","C","D"],"c":0}]\nc = to'g'ri javob indeksi (0-3). To'g'ri javoblar turli o'rinlarda bo'lsin.`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen/qwen3-8b",
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          { role: "system", content: "Faqat JSON massiv qaytarasan. Hech qanday izoh yozma." },
          { role: "user", content: prompt }
        ]
      })
    });
    const j = await r.json();
    if (j.error) return res.status(502).json({ error: j.error.message });
    const text = j?.choices?.[0]?.message?.content || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return res.status(502).json({ error: "JSON topilmadi", raw: text.slice(0, 200) });
    const qs = JSON.parse(match[0]);
    const valid = qs.filter(x => x && x.q && Array.isArray(x.o) && x.o.length === 4 && x.c >= 0 && x.c <= 3);
    if (!valid.length) return res.status(502).json({ error: "Savollar yaratilmadi" });
    res.json({ questions: valid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
