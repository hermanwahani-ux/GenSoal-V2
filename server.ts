import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Lazy initialize Gemini client
  let ai: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return ai;
  }

  // API Route for creating questions securely via server-side Gemini call
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const config = req.body;
      let client;
      try {
        client = getGeminiClient();
      } catch (keyError: any) {
        return res.status(400).json({
          success: false,
          error: "API Key Gemini belum diset. Hubungi admin atau atur di Secrets panel.",
          missingKey: true
        });
      }

      const {
        subject,
        fase,
        topic,
        format,
        count,
        difficulty,
        bloomLevel,
        useVisual,
        visualType,
        isMixedFormat,
        mixedFormats,
        visualCount,
      } = config;

      const faseLabels: { [key: string]: string } = {
        A: "Fase A (Kelas 1-2 SD)",
        B: "Fase B (Kelas 3-4 SD)",
        C: "Fase C (Kelas 5-6 SD)",
        D: "Fase D (Kelas 7-9 SMP)",
        E: "Fase E (Kelas 10 SMA / SMK)",
        F: "Fase F (Kelas 11-12 SMA / SMK)",
      };

      // Construct dynamic format & count breakdown instruction
      let formatInstruction = "";
      if (isMixedFormat && mixedFormats) {
        const list = Object.entries(mixedFormats)
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([type, qty]) => `- Tipe "${type}": sejumlah ${qty} butir soal`);
        if (list.length > 0) {
          formatInstruction = `Format soal yang dibuat wajib berupa campuran (kombinasi) rapi dengan rincian jumlah:\n${list.join("\n")}\n\nPastikan setiap objek soal dalam daftar JSON yang Anda hasilkan memiliki field 'type' yang tepat sesuai tipe masing-masing soal tersebut (pilih antara: "Pilihan Ganda", "PG Kompleks", "Benar / Salah", "Menjodohkan", "Isian Singkat", "Uraian / Esai").`;
        }
      }

      if (!formatInstruction) {
        formatInstruction = `Format Soal harus berupa tipe "${format}".
   - "Pilihan Ganda": Sediakan 4 pilihan jawaban untuk SD (A-D) atau 5 pilihan jawaban untuk SMP/SMA (A-E). Hanya ada 1 pilihan jawaban benar. Format opsi harus rapi seperti "A. [pilihan]", "B. [pilihan]" di list 'options'.
   - "PG Kompleks": Pilihan ganda dengan beberapa opsi benar (lebih dari 1). Mintalah siswa memilih semua opsi yang benar. Sediakan 4-5 opsi, sebutkan opsi mana saja yang benar di correctAnswers (berisi karakter huruf pilihan seperti ["A", "C"]).
   - "Benar / Salah": Pernyataan menantang/analitis di mana siswa harus menentukan apakah "Benar" atau "Salah". 'correctAnswer' harus bernilai "Benar" atau "Salah".
   - "Menjodohkan": Buatlah daftar pencocokan yang menarik. Sediakan properti 'matchingPairs' yang berisi pasangan pertanyaan (left) dan jawaban yang benar (right) sebanyak 3-5 pasangan.
   - "Isian Singkat": Soal matematika atau konsep yang jawabannya berupa kata/frasa singkat atau angka pasti.
   - "Uraian / Esai": Soal terbuka bernilai analitis tinggi (Mendorong kemampuan berpikir tingkat tinggi/HOTS).`;
      }

      let visualInstruction = "Jangan gunakan stimulus visual";
      if (useVisual) {
        const qtyStr = visualCount && visualCount !== "Semua" ? `pada ${visualCount} butir soal saja` : "pada semua butir soal";
        visualInstruction = `Wajib gunakan stimulus tipe ${visualType} ${qtyStr}. Untuk soal yang kebagian stimulus, buatlah obyek 'stimulus' bernilai valid dengan tipe tersebut. Untuk soal selebihnya yang tidak kebagian stimulus visual, biarkan properti 'stimulus' bernilai null atau tidak ada.`;
      }

      const systemInstruction = `Anda adalah asisten kecerdasan buatan (SoalGen AI) khusus pendidikan Indonesia yang ahli dalam menyusun soal ujian tingkat sekolah berdasarkan Kurikulum Merdeka.
Tugas Anda adalah membuat sejumlah soal ujian berkualitas tinggi, bersih, akurat, bebas dari bias, inovatif, dan relevan sesuai dengan parameter yang diberikan oleh guru.

PANDUAN BUAT SOAL:
1. Bahasan/Materi harus sangat sesuai dengan Kurikulum Merdeka.
2. Perhatikan Fase: "${faseLabels[fase] || fase}". Pastikan bahasa, konsep, kompleksitas materi, dan ilustrasi tepat secara psikologi perkembangan siswa fase tersebut.
3. Topik/Materi spesifik: "${topic}". Jika topik terlalu umum, kembangkan ke materi esensial utama sesuai tingkat usianya.
4. Tingkat Kesulitan: "${difficulty}". Mudahkan jika Mudah, sedang jika Sedang, menantang jika Sulit.
5. Format Soal:
${formatInstruction}
6. Level Kognitif Bloom: "${bloomLevel}".
   - C1 (Mengingat): Menemukan kembali pengetahuan yang relevan dari memori jangka panjang.
   - C2 (Memahami): Membangun makna dari pesan-pesan instruksional (termasuk lisan, tertulis, grafis).
   - C3 (Menerapkan): Melakukan atau menggunakan prosedur dalam situasi yang diberikan.
   - C4 (Menganalisis): Memecahkan materi ke dalam bagian-bagian penyusunnya dan menentukan hubungan.
   - C5 (Mengevaluasi): Membuat penilaian berdasarkan kriteria dan standar.
   - C6 (Menciptakan): Menempatkan elemen-elemen bersama-sama untuk membentuk satu kesatuan yang koheren atau fungsional.
7. Stimulus Media Visual: ${visualInstruction}
   - "Tabel Data": Berikan data tabel terstruktur nyata (misalnya tabel pengamatan sains, data keliling lingkaran, tabel frekuensi matematika). Isi 'tableHeaders' dan 'tableRows' dengan data fiktif atau fakta yang edukatif dan menantang.
   - "Grafik / Diagram": Berikan data numerik terstruktur yang dapat digambarkan sebagai diagram garis, lingkaran, atau batang. Isi 'chartData' berisi list item { label: string, value: number } (mis. Penjualan roti, suhu udara bulanan).
   - "Gambar Ilustrasi" / "Infografis" / "Peta": Berikan deskripsi stimulus yang sangat kaya rinciannya di bidang 'description' seakan-akan ada gambar, infografik, atau peta berkode tertentu di sana. Guru atau murid akan membaca deskripsi tersebut untuk menjawab soal.

8. Semua soal wajib memiliki penjelasan/pembahasan ('explanation') yang jelas, mendalam, membimbing secara logis, ditulis dalam Bahasa Indonesia yang formal dan ramah untuk dipahami siswa dan guru. Serta tentukan nilai bobot poin ('points') yang wajar (misal: PG = 10, Uraian/HOTS = 20-30).`;

      const promptText = `Hasilkan ${count} butir soal ujian dengan parameter berikut:
Mata Pelajaran: ${subject}
Fase: ${faseLabels[fase] || fase}
Topik/Materi: ${topic}
Format Soal: ${isMixedFormat ? "Campuran" : format}
Tingkat Kesulitan: ${difficulty}
Level Kognitif Bloom: ${bloomLevel}
Menggunakan Stimulus Visual: ${useVisual ? `Ya (${visualType}, kuantitas: ${visualCount || 'Semua'})` : "Tidak"}

Pastikan menghasilkan output sesuai dengan JSON Schema yang telah ditentukan secara lengkap, akurat, dan valid.`;

      // Define our Gemini structured JSON schema
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "ID unik fiktif, misal: q-1, q-2" },
                type: { type: Type.STRING, description: "Harus sama dengan tipe format soal" },
                questionText: { type: Type.STRING, description: "Teks pertanyaan utama/soal dalam bahasa Indonesia. Jika ada stimulus, kaitkan langsung dengan stimulus tersebut." },
                stimulus: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Tipe stimulus visual, persis sama dengan salah satu dari: Gambar Ilustrasi, Infografis, Grafik / Diagram, Tabel Data, Peta" },
                    title: { type: Type.STRING, description: "Judul stimulus, contoh: Tabel Hasil Pengukuran pH Larutan" },
                    description: { type: Type.STRING, description: "Penjelasan deskriptif stimulus visual atau teks petunjuk stimulus yang kaya detail ilmiah/data" },
                    tableHeaders: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    tableRows: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    chartData: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.NUMBER }
                        },
                        required: ["label", "value"]
                      }
                    }
                  },
                  required: ["type", "description"]
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Pilihan jawaban (A, B, C, D atau E) jika tipe soal adalah Pilihan Ganda atau PG Kompleks"
                },
                correctAnswer: {
                  type: Type.STRING,
                  description: "Kunci jawaban akhir fiktif: 'A'/'B'/'C'/'D'/'E' untuk Pilihan Ganda; 'Benar'/'Salah' untuk Benar/Salah; Kata/Angka pasti untuk Isian Singkat; ringkasan kunci jawaban untuk Uraian."
                },
                correctAnswers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Kumpulan jawaban benar untuk PG Kompleks (misal: ['A', 'C'])"
                },
                matchingPairs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      left: { type: Type.STRING, description: "Item di kolom kiri (Pertanyaan/Pernyataan)" },
                      right: { type: Type.STRING, description: "Pasangan benar di kolom kanan (Jawaban)" }
                    },
                    required: ["left", "right"]
                  },
                  description: "Daftar pasangan menjodohkan"
                },
                explanation: { type: Type.STRING, description: "Pembahasan rinci, runut, dan ilmiah mengapa jawaban tersebut benar dalam bahasa Indonesia." },
                points: { type: Type.INTEGER, description: "Bobot skor soal (contoh: 10 atau 20)" }
              },
              required: ["id", "type", "questionText", "explanation", "points"]
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Tidak menerima respon teks dari Gemini API.");
      }

      const questions = JSON.parse(responseText.trim());
      res.json({ success: true, questions });
    } catch (error: any) {
      console.error("Error generating questions:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal menghasilkan soal lewat AI." });
    }
  });

  // Handle building files path for production or middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Development server running on http://localhost:${PORT}`);
  });
}

startServer();
