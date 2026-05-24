import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";
import { Question } from "./types";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scope to manage files created/opened by the app
provider.addScope("https://www.googleapis.com/auth/drive.file");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize core Auth state listener.
 */
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we don't have cached token, we can force getting the token or trigger sign-in state
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure();
    }
  });
};

/**
 * Triggers Google Sign In pop-up and requests the necessary scopes.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Gagal memperoleh token akses Google Drive. Harap ulangi masuk.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Kesalahan proses masuk Google Drive Auth:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Signs the user out from Google & Firebase
 */
export const googleSignOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
};

/**
 * Helper to upload HTML text to Google Drive and convert it into a native Google Document.
 */
export const uploadAsGoogleDoc = async (
  accessToken: string,
  fileName: string,
  htmlContent: string
): Promise<{ id: string; webViewLink: string }> => {
  const metadata = {
    name: fileName,
    mimeType: "application/vnd.google-apps.document", // Automatically convert to Google Doc
  };

  const file = new Blob([htmlContent], { type: "text/html" });

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", file);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Drive upload error details:", errText);
    throw new Error(`Google Drive API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

/**
 * Helper to construct formatted HTML for the "Naskah Soal" Document.
 */
export const generateQuestionsHtml = (
  subject: string,
  fase: string,
  topic: string,
  difficulty: string,
  bloomLevel: string,
  questions: Question[]
): string => {
  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #1a1a1a; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #000; padding-bottom: 10px; }
        .header h1 { font-size: 16pt; margin: 0 0 5px 0; font-weight: bold; text-transform: uppercase; }
        .header h2 { font-size: 12pt; margin: 0 0 5px 0; font-weight: normal; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .meta-table td { padding: 4px 8px; font-size: 11pt; vertical-align: top; }
        .meta-label { font-weight: bold; width: 15%; }
        .meta-colon { width: 2%; text-align: center; }
        .meta-value { width: 33%; }
        .petunjuk { border: 1px solid #1a1a1a; padding: 10px; margin-bottom: 30px; font-size: 10pt; background-color: #fcfcfc; }
        .question-item { margin-bottom: 25px; page-break-inside: avoid; }
        .question-text { font-weight: bold; margin-bottom: 10px; }
        .options-list { list-style-type: none; padding-left: 20px; margin-top: 5px; margin-bottom: 15px; }
        .option-item { margin-bottom: 6px; }
        .stimulus-box { border: 1px dashed #7f8c8d; padding: 12px; margin-bottom: 12px; font-style: italic; background-color: #f9f9f9; font-size: 11pt; }
        .pairing-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .pairing-table th, .pairing-table td { border: 1px solid #1a1a1a; padding: 8px; text-align: left; font-size: 11pt; }
        .pairing-table th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>NASKAH SOAL EVALUASI BELAJAR</h1>
        <h2>DIHASILKAN SECARA OTOMATIS OLEH SOALGEN AI</h2>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Mata Pelajaran</td>
          <td class="meta-colon">:</td>
          <td class="meta-value"><strong>${subject}</strong></td>
          <td class="meta-label">Fase / Kelas</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${fase}</td>
        </tr>
        <tr>
          <td class="meta-label">Materi Pokok</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${topic}</td>
          <td class="meta-label">Waktu Pembuatan</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${dateStr}</td>
        </tr>
        <tr>
          <td class="meta-label">Level Kognitif</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${bloomLevel}</td>
          <td class="meta-label">Tingkat Kesulitan</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${difficulty}</td>
        </tr>
      </table>

      <div class="petunjuk">
        <strong>PETUNJUK UMUM DAN ATURAN PENGERJAAN:</strong>
        <ol style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
          <li>Tuliskan identitas Anda pada lembar jawab yang telah disediakan oleh pengawas.</li>
          <li>Baca setiap pertanyaan dengan saksama sebelum memberikan pilihan atau jawaban tertulis.</li>
          <li>Kerjakan soal yang Anda anggap lebih mudah terlebih dahulu.</li>
          <li>Periksa kembali semua pekerjaan Anda sebelum menyerahkannya kepada pengawas ruang kelas.</li>
          <li>Dilarang bekerja sama, menggunakan alat bantu hitung, atau membuka buku catatan secara curang.</li>
        </ol>
      </div>

      <div>
  `;

  questions.forEach((q, idx) => {
    html += `<div class="question-item">`;
    html += `<div class="question-text">${idx + 1}. ${q.questionText}</div>`;

    // Visual stimulus content, if present
    if (q.stimulus) {
      html += `<div class="stimulus-box">`;
      html += `<strong>⚠️ Media Stimulus (${q.stimulus.type}):</strong><br/>`;
      if (q.stimulus.description) {
        html += `<p>${q.stimulus.description}</p>`;
      }
      
      // Dynamic generated image for 'Gambar Ilustrasi', 'Infografis', 'Peta' inside Exported HTML
      if (q.stimulus.type === 'Gambar Ilustrasi' || q.stimulus.type === 'Infografis' || q.stimulus.type === 'Peta') {
        const cleanPrompt = q.stimulus.description.replace(/["'()\[\]]/g, "").substring(0, 150);
        const imageUrl = `https://image.pollinations.ai/p/${encodeURIComponent(
          `educational science school textbook illustration, ${cleanPrompt}, detailed academic textbook aesthetic, clear colorful diagram layout, minimalist clean vector style`
        )}?width=512&height=384&nologo=true&seed=${q.id}`;
        
        html += `<div style="text-align:center; margin:12px 0;">`;
        html += `<img src="${imageUrl}" alt="${q.stimulus.title || 'Stimulus'}" style="max-width:100%; max-height:280px; border-radius:8px; border:1px solid #d1d5db;" />`;
        html += `<p style="font-size:9pt; color:#6b7280; font-style:italic; margin-top:4px; font-weight:bold;">Gambar Ilustrasi: ${q.stimulus.title || 'Data Visual'}</p>`;
        html += `</div>`;
      }
      if (q.stimulus.tableHeaders && q.stimulus.tableRows) {
        html += `<table style="border-collapse:collapse; width:100%; margin:8px 0; border:1px solid #000;">`;
        html += `<tr style="background-color:#ececec;">`;
        q.stimulus.tableHeaders.forEach((hd: string) => {
          html += `<th style="border:1px solid #000; padding:6px; font-size:10pt;">${hd}</th>`;
        });
        html += `</tr>`;
        q.stimulus.tableRows.forEach((row: string[]) => {
          html += `<tr>`;
          row.forEach((cell: string) => {
            html += `<td style="border:1px solid #000; padding:6px; font-size:10pt;">${cell}</td>`;
          });
          html += `</tr>`;
        });
        html += `</table>`;
      }
      if (q.stimulus.chartData) {
        html += `<p style="font-size:10pt; margin: 4px 0;"><strong>Data Representasi Grafik:</strong><br/>`;
        q.stimulus.chartData.forEach((cd: any) => {
          html += `• ${cd.label}: ${cd.value}<br/>`;
        });
        html += `</p>`;
      }
      html += `</div>`;
    }

    // Different layouts for types of questions
    if (q.type === "Pilihan Ganda" || q.type === "PG Kompleks") {
      if (q.options && q.options.length > 0) {
        html += `<ul class="options-list">`;
        q.options.forEach((opt) => {
          html += `<li class="option-item">${opt}</li>`;
        });
        html += `</ul>`;
      }
    } else if (q.type === "Benar / Salah") {
      html += `<p style="font-style:italic; padding-left: 20px; font-size: 11pt; color: #4a5568;">Pernyataan di atas adalah: [ Benar ] atau [ Salah ]</p>`;
    } else if (q.type === "Menjodohkan") {
      if (q.matchingPairs && q.matchingPairs.length > 0) {
        html += `<p style="font-weight: bold; font-size: 10pt; margin-top:5px; margin-bottom: 5px;">Pasangkan bagian kiri dengan pilihan yang tepat di sebelah kanan:</p>`;
        html += `<table class="pairing-table">`;
        html += `<tr><th>Bagian Kiri (Pertanyaan)</th><th>Bagian Kanan (Opsi Pencocokan)</th></tr>`;
        
        // Render paired elements but shuffle or blank them slightly for a worksheet look
        const rightSides = q.matchingPairs.map((p) => p.right).sort(() => Math.random() - 0.5);
        q.matchingPairs.forEach((pair, pIdx) => {
          html += `<tr>`;
          html += `<td>${pair.left}</td>`;
          html += `<td>${pIdx + 1}. ${rightSides[pIdx]}</td>`;
          html += `</tr>`;
        });
        html += `</table>`;
      }
    } else if (q.type === "Isian Singkat") {
      html += `<div style="height: 30px; border-bottom: 1px dotted #1a1a1a; width: 50%; margin-left: 20px; margin-bottom: 20px;">Jawaban singkat: </div>`;
    } else if (q.type === "Uraian / Esai") {
      html += `<div style="margin-left: 20px; margin-bottom: 10px; font-size:10pt; color: #7f8c8d; font-style:italic;">[ Lembar pengerjaan esai kosong / analisis siswa ]</div>`;
      html += `<div style="height: 80px; width: 100%; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 10px; margin-bottom: 20px;"></div>`;
    }

    html += `</div>`;
  });

  html += `
      </div>
    </body>
    </html>
  `;
  return html;
};

/**
 * Helper to construct formatted HTML for the "Kisi-Kisi Asesmen" Document.
 */
export const generateBlueprintHtml = (
  subject: string,
  fase: string,
  topic: string,
  bloomLevel: string,
  difficulty: string,
  questions: Question[]
): string => {
  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #1a1a1a; margin: 40px; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px; }
        .header h1 { font-size: 14pt; margin: 0 0 5px 0; font-weight: bold; text-transform: uppercase; }
        .header h2 { font-size: 11pt; margin: 0 0 5px 0; font-weight: normal; }
        .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-grid td { padding: 4px 6px; font-size: 10pt; vertical-align: top; }
        .bold-lbl { font-weight: bold; width: 15%; }
        .divider-col { width: 2%; text-align: center; }
        .data-val { width: 33%; }
        .table-matrix { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table-matrix th, .table-matrix td { border: 1px solid #1a1a1a; padding: 10px 8px; text-align: left; vertical-align: top; }
        .table-matrix th { background-color: #f2f2f2; text-align: center; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; }
        .center-col { text-align: center; }
        .text-lead { font-size: 9.5pt; color: #555; font-style: italic; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MATRIKS KISI-KISI INSTRUMEN ASESMEN</h1>
        <h2>KISI-KISI EVALUASI ADMINISTRASI RESMI GURU</h2>
      </div>

      <table class="meta-grid">
        <tr>
          <td class="bold-lbl">Mata Pelajaran</td>
          <td class="divider-col">:</td>
          <td class="data-val"><strong>${subject}</strong></td>
          <td class="bold-lbl">Fase / Kelas</td>
          <td class="divider-col">:</td>
          <td class="data-val">${fase}</td>
        </tr>
        <tr>
          <td class="bold-lbl">Capaian Topik</td>
          <td class="divider-col">:</td>
          <td class="data-val">${topic}</td>
          <td class="bold-lbl">Admin Pembuat</td>
          <td class="divider-col">:</td>
          <td class="data-val">SoalGen AI Workspace</td>
        </tr>
        <tr>
          <td class="bold-lbl">Level Kognitif</td>
          <td class="divider-col">:</td>
          <td class="data-val">${bloomLevel}</td>
          <td class="bold-lbl">Sifat Dokumen</td>
          <td class="divider-col">:</td>
          <td class="data-val">Sangat Rahasia & Valid</td>
        </tr>
      </table>

      <p class="text-lead">
        *Rincian kisi-kisi instrumen di bawah ini dipetakan secara terperinci menggunakan kurikulum adaptif SoalGen AI. Penulisan butir instrumen relevan dengan standar tingkat kesukaran dan level kognitif taksonomi Bloom terkini.
      </p>

      <table class="table-matrix">
        <thead>
          <tr>
            <th style="width: 8%;">No Soal</th>
            <th style="width: 32%;">Kompetensi Inti / Capaian Pembelajaran</th>
            <th style="width: 18%;">Format Soal</th>
            <th style="width: 12%;">Tingkat Kognitif</th>
            <th style="width: 12%;">Tingkat Kesulitan</th>
            <th style="width: 10%;">Skor Maks</th>
            <th style="width: 8%;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  questions.forEach((q, idx) => {
    html += `
          <tr>
            <td class="center-col" style="font-weight: bold;">${idx + 1}</td>
            <td>Membahas kompetensi pokok <strong>${topic}</strong> dengan fokus aplikasi pembelajaran real-life sesuai rincian materi.</td>
            <td style="color: #6d28d9; font-weight: bold;">${q.type}</td>
            <td class="center-col" style="font-family: monospace; font-weight: bold;">${bloomLevel}</td>
            <td class="center-col">${difficulty}</td>
            <td class="center-col" style="font-family: monospace;">${q.points || 10}</td>
            <td class="center-col" style="color: #16a34a; font-weight: bold;">Valid</td>
          </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;
  return html;
};

/**
 * Helper to construct formatted HTML for the "Kunci Jawaban & Pembahasan" Document.
 */
export const generateAnswersHtml = (
  subject: string,
  fase: string,
  topic: string,
  questions: Question[]
): string => {
  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; margin: 40px; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px; }
        .header h1 { font-size: 14pt; margin: 0 0 5px 0; font-weight: bold; text-transform: uppercase; }
        .header h2 { font-size: 11pt; margin: 0 0 5px 0; font-weight: normal; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .meta-table td { padding: 4px 6px; font-size: 10pt; }
        .meta-label { font-weight: bold; width: 15%; }
        .meta-colon { width: 2%; text-align: center; }
        .meta-value { width: 33%; }
        .answer-block { margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; page-break-inside: avoid; }
        .question-lead { font-weight: bold; margin-bottom: 8px; font-size: 11pt; }
        .key-pills { display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-family: monospace; font-size: 10pt; margin: 5px 0; }
        .explanation-title { font-weight: bold; color: #1e3a8a; font-size: 10pt; margin-top: 10px; text-transform: uppercase; }
        .explanation-text { background-color: #f8fafc; padding: 10px; border-left: 3px solid #3b82f6; font-size: 10pt; line-height: 1.4; color: #334155; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KUNCI JAWABAN DAN PEMBAHASAN DETIL</h1>
        <h2>DOKUMEN PEGANGAN DAN ANALISIS EVALUASI GURU</h2>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Mata Pelajaran</td>
          <td class="meta-colon">:</td>
          <td class="meta-value"><strong>${subject}</strong></td>
          <td class="meta-label">Fase / Kelas</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${fase}</td>
        </tr>
        <tr>
          <td class="meta-label">Materi Pokok</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">${topic}</td>
          <td class="meta-label">Format Dokumen</td>
          <td class="meta-colon">:</td>
          <td class="meta-value">Validasi Pembahasan Lengkap</td>
        </tr>
      </table>

      <div>
  `;

  questions.forEach((q, idx) => {
    html += `<div class="answer-block">`;
    html += `<div class="question-lead">JAWABAN SOAL NOMOR ${idx + 1} (${q.type})</div>`;
    html += `<p style="margin: 0 0 8px 0; color: #4a5568;">Pertanyaan: "<em>${q.questionText}</em>"</p>`;

    // Format single/multi answer nicer
    let answerOutput = "";
    if (Array.isArray(q.correctAnswer)) {
      answerOutput = q.correctAnswer.join(", ");
    } else if (q.correctAnswer && typeof q.correctAnswer === "object") {
      answerOutput = JSON.stringify(q.correctAnswer);
    } else {
      answerOutput = String(q.correctAnswer || "Esai Terstruktur");
    }

    html += `<div class="key-pills">KUNCI JAWABAN: ${answerOutput}</div>`;

    if (q.explanation) {
      html += `<div class="explanation-title">Rasionalisasi & Pembahasan:</div>`;
      html += `<div class="explanation-text">${q.explanation}</div>`;
    } else {
      html += `<div class="explanation-title">Rasionalisasi & Pembahasan:</div>`;
      html += `<div class="explanation-text">Lakukan evaluasi jawaban berdasarkan kriteria kunci kebenaran materi esensial ${topic} secara berurutan dan objektif untuk memberikan evaluasi maksimal.</div>`;
    }

    html += `</div>`;
  });

  html += `
      </div>
    </body>
    </html>
  `;
  return html;
};
