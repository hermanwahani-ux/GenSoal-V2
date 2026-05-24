import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Settings,
  Sparkles,
  HelpCircle,
  FileText,
  Copy,
  Printer,
  ChevronDown,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  Trash2,
  Bookmark,
  ChevronRight,
  Sliders,
  AlertCircle,
  Lightbulb,
  Info,
  Edit3,
  Check,
  Download,
  Eye,
  Coffee,
  Database,
  Lock,
  User as UserIcon
} from "lucide-react";
import { Question, GeneratorConfig, QuestionType } from "./types";
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  uploadAsGoogleDoc,
  generateQuestionsHtml,
  generateBlueprintHtml,
  generateAnswersHtml
} from "./googleDriveService";
import { User } from "firebase/auth";
import { Cloud, LogOut, ExternalLink } from "lucide-react";

// Static Subject Data with corresponding colors & icons
interface SubjectPreset {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: string[];
}

const SUBJECT_PRESETS: SubjectPreset[] = [
  {
    id: "Matematika",
    name: "Matematika",
    icon: "📐",
    color: "amber",
    topics: [
      "Bilangan Pecahan dan Operasinya",
      "Geometri Bangun Ruang (Volume & Luas Permukaan)",
      "Peluang dan Statistika Dasar",
      "Aljabar Linear Sederhana",
      "Sistem Persamaan Kuadrat",
      "Aplikasi Teorema Pythagoras"
    ]
  },
  {
    id: "Sains / IPA",
    name: "Sains / IPA",
    icon: "🔬",
    color: "emerald",
    topics: [
      "Fotosintesis dan Rantai Makanan Ekosistem",
      "Hukum Newton tentang Gerak dan Gaya",
      "Sistem Peredaran Darah Manusia",
      "Zat Campuran dan Perubahan Kimia",
      "Siklus Air dan Pemanasan Global",
      "Kemagnetan dan Induksi Elektromagnetik"
    ]
  },
  {
    id: "Bahasa Indonesia",
    name: "Bahasa Indonesia",
    icon: "📝",
    color: "blue",
    topics: [
      "Menganalisis Ide Pokok dan Gagasan Utama Paragraf",
      "Puisi Lama dan Dongeng Nusantara",
      "Menulis Surat Resmi dan Surat Pribadi",
      "Struktur Teks Prosedur dan Eksplanasi",
      "Majas dan Gaya Bahasa dalam Cerpen",
      "Paragraf Persuasi dan Argumentasi"
    ]
  },
  {
    id: "IPS",
    name: "IPS",
    icon: "🌍",
    color: "indigo",
    topics: [
      "Keragaman Budaya dan Suku Bangsa Indonesia",
      "Peta, Skala, dan Orientasi Geografis",
      "Sejarah Proklamasi Kemerdekaan RI 1945",
      "Kegiatan Ekonomi dan Kesejahteraan Masyarakat",
      "Zaman Kerajaan Hindu-Buddha dan Islam di Nusantara",
      "Interaksi Sosial dan Globalisasi"
    ]
  },
  {
    id: "Bahasa Inggris",
    name: "Bahasa Inggris",
    icon: "🇬🇧",
    color: "violet",
    topics: [
      "Reading Comprehension on Narrative Essay",
      "Descriptive Text about Historical Places",
      "Simple Present vs Simple Past Tenses",
      "Asking and Giving Opinion Dialogues",
      "Procedure Text and Recipe Steps"
    ]
  },
  {
    id: "Pendidikan Pancasila",
    name: "Pendidikan Pancasila",
    icon: "🦅",
    color: "rose",
    topics: [
      "Nilai-nilai Luhur Pancasila dalam Kehidupan Sehari-hari",
      "Hak dan Kewajiban Warga Negara",
      "Keanekaragaman Bhinneka Tunggal Ika",
      "Sejarah Perumusan Pancasila oleh Para Pendiri Bangsa",
      "Sistem Pemerintahan Daerah dan Pusat"
    ]
  },
  {
    id: "Lainnya",
    name: "Lainnya (Kustom - Tulis Sendiri)",
    icon: "📚",
    color: "slate",
    topics: [
      "Fisika",
      "Kimia",
      "Informatika",
      "Seni Budaya",
      "Ekonomi / Akuntansi"
    ]
  }
];

const DETAILED_TOPICS_BY_FASE: { [subject: string]: { [fase: string]: string[] } } = {
  "Matematika": {
    A: [
      "Mengenal Bilangan Cacah 1-20 & Penjumlahan Sederhana",
      "Menyusun Pola Gambar & Pola Ubin Bergambar",
      "Bentuk Bangun Datar Dasar (Segitiga, Segiempat, Lingkaran)",
      "Satu Dekade: Mengenal Puluh dan Satuan Bilangan",
      "Mengukur Panjang Benda Menggunakan Satuan Tidak Baku"
    ],
    B: [
      "Perkalian & Pembagian Bilangan Cacah sampai 100",
      "Pecahan Senilai Berbantuan Blok Gambar / Model Konkrit",
      "Keliling & Luas Bangun Datar (Persegi & Persegi Panjang)",
      "Mengenal Jenis-Jenis Sudut (Siku, Lancip, Tumpul, Tegak)",
      "Membaca Data Tabel Turus & Diagram Batang Bergambar"
    ],
    C: [
      "Operasi Hitung Campuran Desimal & Persentase Pecahan",
      "Menghitung Volume Bangun Ruang Kubus & Balok (Jaring-jaring)",
      "Analisis Penyajian Data dalam Diagram Batang & Diagram Garis",
      "Mengukur Kecepatan, Jarak, & Kelajuan Sederhana Selisih",
      "Simetri Putar, Lipat & Koordinasi Posisi Cartesius"
    ],
    D: [
      "Persamaan Linear Satu Variabel & Penerapan di Toko",
      "Membuktikan Teorema Pythagoras Berbantuan Luas Persegi",
      "Statistika Deskriptif Kurikulum (Mean, Median, Modus)",
      "Relasi, Fungsi Aljabar, & Cara Penyajian Rumus Diagram",
      "Perbandingan Senilai, Berbalik Nilai & Hitung Skala Peta"
    ],
    E: [
      "Eksponen & Bentuk Akar beserta Persamaan Eksponensial",
      "Deret & Barisan Aritmetika serta Geometri Tabungan Bank",
      "Sistem Persamaan Linear Tiga Variabel (SPLTV) Realistis",
      "Fungsi Kuadrat, Titik Puncak, & Penggambaran Kurva Grafik",
      "Statistika Data Kelompok: Desil, Kuartil, & Histogram Ringkas"
    ],
    F: [
      "Fungsi Trigonometri Kebalikan & Grafik Gelombang Sinus",
      "Limit Fungsi Aljabar & Metode Faktorisasi Aljabar",
      "Matriks: Determinan & Invers Ordo 3x3 Serta Aplikasinya",
      "Aturan Turunan Fungsi Aljabar & Masalah Optimasi Guru",
      "Teori Peluang Kejadian Saling Lepas & Kombinasi Faktorial"
    ]
  },
  "Sains / IPA": {
    A: [
      "Bagian Tubuh Hewan dan Tumbuhan beserta Fungsinya",
      "Sifat Fisik Benda di Rumah (Bentuk, Kasar-Halus, Warna)",
      "Pancaindra Manusia: Cara Merawat & Kegunaan Utama Indra",
      "Makhluk Hidup vs Benda Mati: Menentukan Ciri-Cirinya",
      "Siang dan Malam: Mengenal Perubahan Cuaca & Suhu Lingkungan"
    ],
    B: [
      "Siklus Hidup Hewan (Metamorfosis Sempurna & Tak Sempurna)",
      "Gaya Magnet, Gaya Gesek, Gaya Gravitasi & Pengaruhnya",
      "Perubahan Wujud Zat (Mencair, Membeku, Menguap, Menyublim)",
      "Bagian-Bagian Tumbuhan Menyerap Nutrisi & Manfaat Akar",
      "Pelestarian Lingkungan di Sekolah & Pencegahan Kerusakan Tanah"
    ],
    C: [
      "Organ Pencernaan, Organ Pernapasan, dan Peredaran Darah",
      "Hubungan Rantai Makanan & Keseimbangan Jaring Ekosistem",
      "Perpindahan Kalor Konduksi, Konveksi, Radiasi pada Termos",
      "Sistem Organ Gerak Manusia: Macam Tulang & Sendi Putar",
      "Asal-Usul Bunyi, Sifat Cahaya Memantul, & Pembiasan Kaca"
    ],
    D: [
      "Sistem Ekskresi & Struktur Koordinasi Saraf Otak Manusia",
      "Hukum Newton, Gaya Sentripetal, GLB, GLBB, & Gerak Lurus",
      "Siklus Hidup Air Hidrologi & Struktur Lapisan Batuan Bumi",
      "Pencemaran Lingkungan & Dampak Gas Efek Rumah Kaca",
      "Struktur Organel Sel Hewan vs Sel Tumbuhan dengan Mikroskop"
    ],
    E: [
      "Struktur Sel, Fungsi Membran, & Transpor Aktif Seluler",
      "Stoikiometri Dasar, Hukum Kelestarian Massa Proust-Lavoisier",
      "Keanekaragaman Hayati Fauna-Flora Wallacea & Konservasi",
      "Struktur Atom, Konfigurasi Elektron Kulit & Golongan Unsur",
      "Pemanasan Global: Efek Protokol Kyoto & Solusi Energi Hijau"
    ],
    F: [
      "Induksi Elektromagnetik, Hukum Faraday, & Kaidah Tangan Kanan",
      "Bioteknologi Modern: Rekayasa Genetika Hibrida Kultur Jaringan",
      "Teori Relativitas Khusus Massa-Energi Kontraksi Panjang Einstein",
      "Hukum Termodinamika & Efisiensi Mesin Kalor Carnot Sederhana",
      "Kimia Organik Senyawa Karbon, Alkana, Alkena, & Isomer Rantai"
    ]
  },
  "Bahasa Indonesia": {
    A: [
      "Mata & Telinga Sehat (Suku Kata ba-bi-bu, ca-ci-cu)",
      "Menyimak Cerita Dongeng Rakyat Nusantara Bergambar Menarik",
      "Aturan Menulis Huruf Kapital di Awal Kalimat & Tanda Titik",
      "Membaca Nyaring Kata Nama Benda di Sekitar Ruang Kelas",
      "Menyusun Kosakata Berkenalan Diri Sendiri Secara Sopan"
    ],
    B: [
      "Menemukan Kalimat Utama & Gagasan Pokok Paragraf Pendek",
      "Menganalisis Unsur Tokoh, Watak, & Amanat Cerita Rakyat",
      "Menulis Pengalaman Liburan Sekolah Bermodalkan Ejaan Tepat",
      "Kalimat Aktif dan Kalimat Pasif Serta Penggunaan Imbuhan me-",
      "Membaca Puisi Anak dengan Lafal, Intonasi, dan Ekspresi Sempurna"
    ],
    C: [
      "Membedakan Fakta dan Opini dalam Artikel Berita Edukasi",
      "Menulis Surat Resmi Undangan Kelas & Surat Pribadi Kawan",
      "Menganalisis Struktur Teks Narasi & Teks Teks Eksposisi Singkat",
      "Kalimat Majemuk Setara serta Penggunaan Konjungsi Penghubung",
      "Menyimak dan Menulis Ringkasan Pidato Sambutan Pembina Upacara"
    ],
    D: [
      "Menyusun Teks Prosedur Kegiatan & Teks Eksplanasi Fenomena",
      "Mengapresiasi Puisi Kontemporer (Majas Personifikasi & Metafora)",
      "Struktur Penulisan Teks Laporan Hasil Observasi (LHO) Lapangan",
      "Menulis Surat Lamaran Sekolah, Surat Dinas, & Iklan Pengumuman",
      "Menganalisis Karakteristik Novel Remaja & Struktur Drama Sekolah"
    ],
    E: [
      "Seni Bernegosiasi: Menyusun Teks Teks Negosiasi Kerja Sama Usaha",
      "Menulis Teks Anekdot Kreatif yang Bermuatan Kritik Sosial",
      "Menganalisis Karya Ilmiah: Sistematika & Kaidah Kebahasaan",
      "Pembelajaran Menyimak Teks Laporan Eksposisi Akurat Berita",
      "Menulis Teks Hikayat Klasik & Menyajikannya Kembali dalam Cerpen"
    ],
    F: [
      "Kritik Sastra & Tatanan Esai Sastrawan Angkatan Pujangga Baru",
      "Meresensi Buku Nonfiksi Komparatif & Menilai Estetika Novel",
      "Menyusun Proposal Kegiatan Pentas Seni & Penggalangan Dana OSIS",
      "Menulis Drama Naskah Pentas Berdurasi Singkat & Aturan Akting",
      "Menganalisis Jurnal Ilmiah & Menulis Editorial Opini Redaksi"
    ]
  },
  "IPS": {
    A: [
      "Mengenal Identitas Diri Sendiri & Hubungan Silsilah Keluarga",
      "Tata Tertib & Contoh Sikap Disiplin di Rumah serta Sekolah",
      "Mengenal Tata Letak Ruangan Sekolah & Denah Jalan Rumah",
      "Sikap Kebiasaan Berbagi dengan Teman Sebaya di Kelas",
      "Mengenal Kegunaan Uang Kertas & Logam Republik Indonesia"
    ],
    B: [
      "Keberagaman Budaya Suku, Rumah Adat, & Pakaian Nusantara",
      "Potensi Sumber Daya Alam Daerah Pegunungan dan Pesisir Pantai",
      "Makna Simbol Lambang Garuda Pancasila & Sejarah Singkatnya",
      "Kerjasama di Lingkungan Rukun Tetangga (RT) & Kegiatan Kerja Bakti",
      "Mengenal Sejarah Asal Mula Nama Desa / Kelurahan Setempat"
    ],
    C: [
      "Zaman Penjajahan Bangsa Barat & Perjuangan Pahlawan Nasional",
      "Kondisi Geografis Pulau-Pulau Besar Indonesia Berdasar Peta",
      "Memahami Siklus Kegiatan Ekonomi Konsumsi, Distribusi, & Produksi",
      "Sejarah Singkat Proklamasi Kemerdekaan & Tokoh-Tokoh Utama",
      "Koperasi Indonesia: Asas Kekeluargaan & Jenis Usaha Rakyat"
    ],
    D: [
      "Kehidupan Sosial Masa Praaksara & Fosil Manusia Purba Jawa",
      "Membaca Peta Tematik, Mengukur Skala, & Dasar Penginderaan Jauh",
      "Interaksi Sosial, Sosialisasi Teman Sebaya & Penyimpangan Remaja",
      "Lembaga Sosial (Keluarga, Agama, Politik, Ekonomi, Pendidikan)",
      "Letak Astronomis Indonesia & Angin Muson Barat serta Timur"
    ],
    E: [
      "Teori-Teori Masuknya Hindu-Buddha & Sejarah Perkembangan Kerajaan",
      "Konflik Sosial, Integrasi Sosial, & Metode Mediasi Konflik",
      "Globalisasi Abad 21: Dampak Pasar Online bagi UMKM Kreatif",
      "Struktur Sosial Masyarakat: Stratifikasi vs Diferensiasi Sosial",
      "Kebutuhan Manusia, Kelangkaan Sumber Daya & Masalah Ekonomi Modern"
    ],
    F: [
      "Perjanjian Multilateral G20 & Kerjasama Ekonomi Internasional ASEAN",
      "Sejarah Perang Dunia I & II serta Dampak Politik Pasca Kolonial",
      "Kebijakan Moneter BI, Laju Inflasi, & Kebijakan Fiskal Negara",
      "Pasar Modal Indonesia, Saham, Obligasi, & Otoritas Jasa Keuangan",
      "Analisis Dampak Modernisasi terhadap Perubahan Nilai Adat Istiadat"
    ]
  },
  "Bahasa Inggris": {
    A: [
      "Introducing Myself and Greeting My Teachers and Friends",
      "Identifying Common Colors, Alphabet Shapes, and Classroom Objects",
      "Counting Numbers From 1 to 20 & Naming Fun Pet Animals",
      "Describing My Happy Family and Singing Simple Action Songs",
      "Requesting Things Nicely: Can I Borrow Please? and Thank You"
    ],
    B: [
      "Describing Wild Animals in the Zoo and Their Body Coverings",
      "What We Do Every Day: Telling Simple Daily Morning Routines",
      "Naming Parts of Human Body and Pointing Colors of Hair/Eyes",
      "Identifying Foods and Drinks on the Dining Table: Likes and Dislikes",
      "Understanding My Simple Classroom Command Sentences (Sit Down)"
    ],
    C: [
      "Giving Clear Directions and Maps: Next to, Opposite, Turn Right",
      "Comparing Time: Simulating Simple Past and Simple Present",
      "My Hobbies: Explaining What We Like to Do after School Safely",
      "Telling School Activities & Writing Weekly Classroom Schedule",
      "Shopping Dialogues: How Much is This? and Paying at Cashier"
    ],
    D: [
      "Moral Message and Reading Narrative Fables (The Hare and Tortoise)",
      "Describing Wonderful Historical Monuments and Natural Wonders",
      "Expressing Strong Agreements & Disagreements on Social Themes",
      "Drafting Recount Text: My Exciting Experience during Last Holiday",
      "Understanding Active vs Passive Voice Sentences in Technical Texts"
    ],
    E: [
      "Writing Personal Experiences in Past Times through Recount Texts",
      "Structure and Social Purpose of Analytical Exposition Texts",
      "Job Application Letters & Crafting Professional Interview Dialogue",
      "Formulating Opinion Texts: Is Social Media Good or Bad for Us?",
      "Using Modal Auxiliaries to Express Advice, Ability, and Obligation"
    ],
    F: [
      "Creating Formal Invitation Letters and Designing Response Cards",
      "Constructing Discussion Essay: Pros & Cons of Artificial Intelligence",
      "Hypothesizing: Conditional Sentences Type 2 & 3 in Future Cases",
      "Analysing News Item Texts and Writing Informative Reports",
      "English Idioms in Pop Songs & Metaphorical Meanings in Literature"
    ]
  },
  "Pendidikan Pancasila": {
    A: [
      "Makna Lambang Simbol Pancasila di Dinding Kelas Sekolah Dasar",
      "Aturan Bermain Bersama secara Rukun, Antre, & Saling Berbagi",
      "Menghargai Keberagaman Ciri Karakteristik Fisik Teman Sekelas",
      "Uraian Makna Sila Pertama Pancasila dalam Doa Harian Bersama",
      "Mengenal Bendera Merah Putih & Tata Cara Sikap Hormat Bendera"
    ],
    B: [
      "Sikap Toleransi Menghargai Keragaman Perbedaan Suku Agama",
      "Kewajiban & Hak Anak sebagai Murid di Sekolah dan Rumah Tinggal",
      "Kegiatan Gotong Royong sebagai Jiwa Kebersihan di Lingkungan",
      "Sikap Patuh Terhadap Aturan Norma Umum di Lingkungan Keluarga",
      "Mengenal Arti Musyawarah Sederhana Mengambil Keputusan Kelas"
    ],
    C: [
      "Sejarah Perumusan Pancasila sebagai Pengikat Persatuan Bangsa",
      "Norma-Norma Sosial Kemasyarakatan (Kesusilan, Kesopanan, Hukum)",
      "Fungsi Lambang Negara & Makna Semboyan NKRI Bhinneka Tunggal Ika",
      "Contoh Penerapan Musyawarah Mufakat di Desaku & Sekolahku",
      "Mengenal Wilayah NKRI, Batas Negara & Kedaulatan Kemaritiman"
    ],
    D: [
      "Sistem Pembagian Urusan Pemerintahan Daerah & Otonomi Khusus",
      "Makna Demokrasi Pancasila dan Urutan Kedudukan Undang-Undang RI",
      "Makna Bela Negara & Peran Pemuda dalam Menjaga Keutuhan NKRI",
      "Bhinneka Tunggal Ika: Merawat Harmoni Sosial dari Berita Hoaks",
      "Lembaga-Lembaga Tinggi Negara RI Berdasar Amandemen UUD 1945"
    ],
    E: [
      "Kasus Pelanggaran HAM Internasional, Upaya Pencegahan & Solusi",
      "Hubungan Kultural Pancasila dengan Pembukaan UUD NRI Tahun 1945",
      "Memelihara Sikap Toleransi Keberagaman dalam Negeri Multikultural",
      "Menganalisis Perilaku Konstitusional dalam Kehidupan Sehari-hari",
      "Ancaman Disintegrasi Bangsa & Strategi Pertahanan Nasional Sishankamrata"
    ],
    F: [
      "Jiwa Semangat Sumpah Pemuda 1928, Sejarah & Kebangkitan Nasional",
      "Penerapan Konsep Wawasan Nusantara dalam Bingkai Kedaulatan RI",
      "Menjaga Pancasila dari Penetrasi Ideologi Transnasional Radikal",
      "Sengketa Batas Wilayah Antarnegara dan Upaya Diplomasi Hukum Laut",
      "Analisis Indeks Demokrasi Indonesia Berdasarkan Pengawasan Publik"
    ]
  },
  "Lainnya": {
    A: [
      "Dasar Seni Rupa: Menggambar Garis, Lingkaran & Warna Primer",
      "Gerak Dasar Lokomotor, Non-lokomotor dalam Senam Pagi Sekolah",
      "Pengenalan Jenis Bunyi-Bunyian Sekitar & Ketukan Tempo Lambat",
      "Seni Melipat Kertas Origami Menjadi Bentuk Hewan Lucu",
      "Mengenal Pola Nada Lagu Anak Sehari-hari Berirama Gembira"
    ],
    B: [
      "Mengenal Bagian Hardware Komputer, Keyboard & Klik Mouse",
      "Membuat Kolase Kreatif Estetik dari Ranting & Daun Kering Sekitar",
      "Gerakan Senam Ketangkasan Sederhana & Menjaga Keseimbangan Tubuh",
      "Apresiasi Lagu Tradisional Daerah Sendiri Mengenal Alat Musik",
      "Pentingnya Kebersihan Mulut, Gigi, Kesehatan Kulit & Cara Mandi"
    ],
    C: [
      "Dasar Pemrograman Visual Scratch: Membuat Sprite Bergerak Kanan",
      "Bernyanyi Lagu Daerah Jawa & Sumatra Secara Paduan Suara Sekolah",
      "Mengenal Seni Kriya Anyaman bambu & Kerajinan Tangan Nusantara",
      "Kesehatan Reproduksi Remaja: Menjaga Organ Tubuh Masa Pubertas",
      "Mengenal Unsur Tari Daerah Kontemporer Menggunakan Properti Kipas"
    ],
    D: [
      "Empat Fondasi Berpikir Komputasional Informatika Sekolah Menengah",
      "Ancaman Keamanan Siber (Phishing) & Aturan Etika Netizen Sosial",
      "Merenungkan Makna Kejujuran Melalui Seni Teater Pantomim Kelas",
      "Mengolah Sampah Organik Menjadi Kompos Cair & Hidroponik Botol",
      "Pola Hidup Bersih Sehat (PHBS) Menghindari Wabah Penyakit Menular"
    ],
    E: [
      "Apresiasi Karya Musik Tradisional Gamelan vs Orkestra Modern",
      "Menganalisis Struktur Transaksi Persamaan Dasar Akuntansi Usaha",
      "Siklus Pembelahan Sel Mitosis & Meiosis Serta Enzim Katalase",
      "Prinsip Desain Grafis Canva: Membuat Poster Papan Pengumuman",
      "Teknik Dasar Cabang Atletik: Lari Jarak Pendek, Lompat Jauh"
    ],
    F: [
      "Analisis Laporan Keuangan Neraca & Laba Rugi Perusahaan Dagang",
      "Memprogram Algoritma Pencarian Linear Sederhana Bahasa Python",
      "Sejarah Krisis Moneter 1998 & Pembelajaran Ekonomi Berkelanjutan",
      "Apresiasi Teater Dokumenter Berdasar Peristiwa Sejarah Indonesia",
      "Merancang Maket Arsitektur Miniatur Rumah Ramah Lingkungan Hijau"
    ]
  }
};

const BLOOM_LEVELS = [
  { value: "C1 - Mengingat", desc: "Menemukan kembali pengetahuan dari memori jangka panjang." },
  { value: "C2 - Memahami", desc: "Membangun makna dari pesan lisan, tulisan, maupun visual." },
  { value: "C3 - Menerapkan", desc: "Melakukan atau menggunakan prosedur dalam situasi baru." },
  { value: "C4 - Menganalisis", desc: "Memecahkan materi ke dalam bagian penyusun & hubungannya." },
  { value: "C5 - Mengevaluasi", desc: "Membuat penilaian berdasarkan kriteria dan standar baku." },
  { value: "C6 - Menciptakan", desc: "Menyusun elemen untuk membentuk kesatuan yang logis/baru." }
];

export default function App() {
  // Config State matches GeneratorConfig
  const [subject, setSubject] = useState<string>("Matematika");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [printMode, setPrintMode] = useState<'all' | 'questions' | 'answers' | 'blueprint'>('all');
  const [fase, setFase] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>("D");
  const [topic, setTopic] = useState<string>("Bilangan Pecahan dan Operasinya");
  const [format, setFormat] = useState<QuestionType>("Pilihan Ganda");
  const [count, setCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit' | 'Campuran'>("Sedang");
  const [bloomLevel, setBloomLevel] = useState<string>("C3 - Menerapkan");
  const [useVisual, setUseVisual] = useState<boolean>(false);
  const [visualType, setVisualType] = useState<'Gambar Ilustrasi' | 'Infografis' | 'Grafik / Diagram' | 'Tabel Data' | 'Peta'>("Gambar Ilustrasi");

  const [isMixedFormat, setIsMixedFormat] = useState<boolean>(false);
  const [mixedFormats, setMixedFormats] = useState<{ [key in QuestionType]: number }>({
    "Pilihan Ganda": 3,
    "PG Kompleks": 0,
    "Benar / Salah": 0,
    "Menjodohkan": 0,
    "Isian Singkat": 0,
    "Uraian / Esai": 0
  });
  const [visualCount, setVisualCount] = useState<number | 'Semua'>('Semua');

  // Sync mixed formats sum into core count
  useEffect(() => {
    if (isMixedFormat) {
      const sum = (Object.values(mixedFormats) as number[]).reduce((a: number, b: number) => a + b, 0);
      setCount(sum || 1);
    }
  }, [mixedFormats, isMixedFormat]);

  // App UI/UX States
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedPackages, setSavedPackages] = useState<{ id: string; date: string; subject: string; topic: string; questions: Question[] }[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState<boolean>(false);

  // Student Test Preview States
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: any }>({});
  const [revealedAnswers, setRevealedAnswers] = useState<{ [qId: string]: boolean }>({});
  const [showScore, setShowScore] = useState<boolean>(false);
  
  // Custom Edit Question States
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState<string>("");
  const [editExplanationText, setEditExplanationText] = useState<string>("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<string>("");

  // Google Drive Integration states
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDriveLoading, setIsDriveLoading] = useState<boolean>(false);
  const [driveStatusMessage, setDriveStatusMessage] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null);

  // Loaded state tracker for lightweight real-time stimulus images
  const [imageLoadedStates, setImageLoadedStates] = useState<{ [qId: string]: boolean }>({});
  const [imageSeeds, setImageSeeds] = useState<{ [qId: string]: number }>({});

  // Login Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("admin_is_logged_in") === "true";
  });
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername.trim() === "admin" && loginPassword === "admin") {
      setIsLoggedIn(true);
      setLoginError(null);
      localStorage.setItem("admin_is_logged_in", "true");
    } else {
      setLoginError("Username atau Password salah. Silakan coba lagi.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername("");
    setLoginPassword("");
    localStorage.removeItem("admin_is_logged_in");
  };

  // Topic Interactive Suggestion controls
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  const getSuggestions = () => {
    const list = DETAILED_TOPICS_BY_FASE[subject]?.[fase] || SUBJECT_PRESETS.find(p => p.id === subject)?.topics || [];
    if (list.length === 0) return [];
    
    const limit = 4; // Show exactly 4 topics in a balanced responsive grid
    const startIndex = (shuffleSeed * limit) % list.length;
    
    let sliced = list.slice(startIndex, startIndex + limit);
    if (sliced.length < limit && list.length > limit) {
      sliced = [...sliced, ...list.slice(0, limit - sliced.length)];
    }
    return sliced;
  };

  const getTopicIcon = (sub: string, index: number) => {
    const icons: { [key: string]: string[] } = {
      "Matematika": ["📐", "📊", "➗", "📈", "⚙️"],
      "Sains / IPA": ["🔬", "🌿", "⚡", "🪐", "💧"],
      "Bahasa Indonesia": ["✍️", "📖", "📝", "🎤", "📣"],
      "IPS": ["🌍", "🗺️", "🏺", "💼", "🏢"],
      "Bahasa Inggris": ["🇬🇧", "🗣️", "📝", "🎬", "🍿"],
      "Pendidikan Pancasila": ["🦅", "⚖️", "🏠", "🤝", "🚩"],
      "Lainnya": ["📚", "🎨", "💻", "🎭", "⚽"]
    };
    const list = icons[sub] || ["💡", "📌", "📌", "✨"];
    return list[index % list.length];
  };

  // Sync / Initialize Google Drive Authentication
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDriveSignIn = async () => {
    setIsDriveLoading(true);
    setDriveStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setDriveUser(res.user);
        setDriveToken(res.accessToken);
        setDriveStatusMessage({ type: 'success', text: "Berhasil masuk dan terhubung dengan Google Drive!" });
      }
    } catch (err: any) {
      console.error(err);
      setDriveStatusMessage({ type: 'error', text: err.message || "Gagal masuk ke Google." });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDriveSignOut = async () => {
    setIsDriveLoading(true);
    setDriveStatusMessage(null);
    try {
      await googleSignOut();
      setDriveUser(null);
      setDriveToken(null);
      setDriveStatusMessage({ type: 'success', text: "Berhasil keluar dari akun Google." });
    } catch (err: any) {
      console.error(err);
      setDriveStatusMessage({ type: 'error', text: "Gagal keluar dari akun Google." });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleSaveDocToDrive = async (docType: 'questions' | 'blueprint' | 'answers') => {
    if (!driveToken) {
      setDriveStatusMessage({ type: 'error', text: "Silakan hubungkan akun Google Anda terlebih dahulu." });
      return;
    }
    setIsDriveLoading(true);
    setDriveStatusMessage(null);
    try {
      let fileName = "";
      let htmlContent = "";

      const currentSubjectStr = subject === "Lainnya" ? (customSubject || "Kustom") : subject;

      if (docType === 'questions') {
        fileName = `Naskah Soal - ${currentSubjectStr} - ${topic}`;
        htmlContent = generateQuestionsHtml(currentSubjectStr, fase, topic, difficulty, bloomLevel, questions);
      } else if (docType === 'blueprint') {
        fileName = `Kisi-Kisi Asesmen - ${currentSubjectStr} - ${topic}`;
        htmlContent = generateBlueprintHtml(currentSubjectStr, fase, topic, bloomLevel, difficulty, questions);
      } else {
        fileName = `Kunci & Pembahasan - ${currentSubjectStr} - ${topic}`;
        htmlContent = generateAnswersHtml(currentSubjectStr, fase, topic, questions);
      }

      const res = await uploadAsGoogleDoc(driveToken, fileName, htmlContent);
      setDriveStatusMessage({
        type: 'success',
        text: `Sukses menyimpan dokumen "${fileName}" ke Google Drive Anda!`,
        link: res.webViewLink
      });
    } catch (err: any) {
      console.error(err);
      setDriveStatusMessage({ type: 'error', text: err.message || "Terjadi kesalahan saat mengunggah dokumen ke Drive." });
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Load saved packages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("soalgen_history");
      if (saved) {
        setSavedPackages(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Gagal meload riwayat soal:", e);
    }
  }, []);

  // Set default topic when subject changes
  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    setSubjectDropdownOpen(false);
    
    // Auto-set the first suggestion of the currently selected phase of this new subject
    const detailedList = DETAILED_TOPICS_BY_FASE[newSub]?.[fase];
    if (detailedList && detailedList.length > 0) {
      setTopic(detailedList[0]);
    } else {
      const found = SUBJECT_PRESETS.find(p => p.id === newSub);
      if (found && found.topics.length > 0) {
        setTopic(found.topics[0]);
      }
    }
  };

  // Set default topic when Fase changes (Linear Kurikulum Merdeka)
  const handleFaseChange = (newFase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => {
    setFase(newFase);
    const detailedList = DETAILED_TOPICS_BY_FASE[subject]?.[newFase];
    if (detailedList && detailedList.length > 0) {
      setTopic(detailedList[0]);
    }
  };

  // Analyze if current topic is linear/aligned with the selected subject and fase
  const analyzeTopicAlignment = () => {
    if (!topic || topic.trim() === "") return null;
    
    const tLower = topic.toLowerCase();
    
    // Define keyword records for analytical check
    const keywordMapping: {
      keywords: string[];
      recommendedSubject: string;
      recommendedFase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      reason: string;
    }[] = [
      {
        keywords: ["trigonometri", "limit function", "limit fungsi", "turunan", "integral", "fungsi trigonometri", "matriks", "determinan", "ordo 3x3", "turunan fungsi", "kombinasi faktorial"],
        recommendedSubject: "Matematika",
        recommendedFase: "F",
        reason: "materi matematika tingkat lanjut SMA/SMK"
      },
      {
        keywords: ["eksponen", "akar", "logaritma", "barisan aritmetika", "deret", "spltv", "fungsi kuadrat", "kurva grafik", "desil", "kuartil", "histogram"],
        recommendedSubject: "Matematika",
        recommendedFase: "E",
        reason: "materi aljabar & analisis data kelas 10 SMA/SMK"
      },
      {
        keywords: ["pitagoras", "pythagoras", "persamaan linear", "pertidaksamaan", "statistika deskriptif", "mean", "median", "modus", "rata-rata", "perbandingan senilai", "skala peta"],
        recommendedSubject: "Matematika",
        recommendedFase: "D",
        reason: "materi esensial matematika tingkat SMP"
      },
      {
        keywords: ["volume", "kubus", "balok", "jaring-jaring", "pecahan desimal", "operasi hitung campuran desimal", "kecepatan", "jarak", "simetri putar", "cartesius"],
        recommendedSubject: "Matematika",
        recommendedFase: "C",
        reason: "materi hitung lanjut kelas 5-6 SD"
      },
      {
        keywords: ["perkalian", "pembagian", "pecahan senilai", "luas bangun", "keliling", "sudut", "diagram batang bergambar", "tabel turus"],
        recommendedSubject: "Matematika",
        recommendedFase: "B",
        reason: "materi hitung dasar kelas 3-4 SD"
      },
      {
        keywords: ["penjumlahan", "pengurangan", "angka 1-20", "bangun datar sederhana", "segitiga", "lingkaran", "bilangan cacah 1-20", "pola ubin"],
        recommendedSubject: "Matematika",
        recommendedFase: "A",
        reason: "materi fondasi numerasi awal kelas 1-2 SD"
      },
      {
        keywords: ["induksi elektromagnetik", "bioteknologi", "relativitas", "dna", "rekayasa genetika", "termodinamika", "kimia organik", "alkana", "alkena", "isomer"],
        recommendedSubject: "Sains / IPA",
        recommendedFase: "F",
        reason: "materi fisik-biologi tingkat lanjut kelas 11-12 SMA/SMK"
      },
      {
        keywords: ["transpor membran", "transpor aktif", "stoikiometri", "keanekaragaman hayati Fauna", "fauna", "flora", "struktur atom", "elektron kulit", "unsu", "protokol kyoto"],
        recommendedSubject: "Sains / IPA",
        recommendedFase: "E",
        reason: "konsep dasar biologi & kimia modern kelas 10 SMA/SMK"
      },
      {
        keywords: ["sistem saraf", "saraf", "ekskresi", "organel", "otak", "hukum newton", "gerak lurus", "siklus hidup air", "lapisan bumi", "pemanasan global", "global warming", "mikoskop", "sel hewan"],
        recommendedSubject: "Sains / IPA",
        recommendedFase: "D",
        reason: "konsep sains IPA terapan tingkat SMP"
      },
      {
        keywords: ["pencernaan", "pernapasan", "organ pernapasan", "organ pencernaan", "peredaran darah", "rantai makanan", "ekosistem", "kalor", "konduksi", "konveksi", "radiasi", "sendi putar", "sifat cahaya"],
        recommendedSubject: "Sains / IPA",
        recommendedFase: "C",
        reason: "sains tubuh makhluk hidup & energi kelas 5-6 SD"
      },
      {
        keywords: ["siklus hidup", "metamorfosis", "magnet", "gaya magnet", "gaya gesek", "zat padat", "cair", "wujud benda", "metamorfosis sempurna", "pelestarian lingkungan"],
        recommendedSubject: "Sains / IPA",
        recommendedFase: "B",
        reason: "sains eksploratif alam benda kelas 3-4 SD"
      },
      {
        keywords: ["bagian tubuh hewan", "pancaindra", "wujud benda sekitar", "merawat indra", "makhluk hidup vs benda mati"],
        recommendedSubject: "Sains / IPA",
        recommendedFase: "A",
        reason: "sains dasar pengenalan lingkungan kelas 1-2 SD"
      },
      {
        keywords: ["kritik sastra", "esai sastra", "resensi", "proposal kegiatan", "pentas seni", "drama naskah", "jurnal ilmiah", "editorial opini"],
        recommendedSubject: "Bahasa Indonesia",
        recommendedFase: "F",
        reason: "literatur tinggi & menulis fungsional kelas 11-12 SMA/SMK"
      },
      {
        keywords: ["negosiasi", "anekdot", "sindiran", "karya ilmiah", "sistematika", "hikayat klasik", "cerpen"],
        recommendedSubject: "Bahasa Indonesia",
        recommendedFase: "E",
        reason: "tata bahasa ekspresif & ilmiah kelas 10 SMA"
      },
      {
        keywords: ["teks prosedur", "eksplanasi", "majas", "personifikasi", "hiperbola", "lho", "laporan hasil observasi", "surat lamaran sekolah", "novel remaja"],
        recommendedSubject: "Bahasa Indonesia",
        recommendedFase: "D",
        reason: "struktur teks & gaya bahasa level SMP"
      },
      {
        keywords: ["fakta vs opini", "berita", "surat resmi", "undangan", "teks narasi", "eksposisi", "kalimat majemuk", "ringkasan pidato"],
        recommendedSubject: "Bahasa Indonesia",
        recommendedFase: "C",
        reason: "literasi kritis draf administrasi kelas 5-6 SD"
      },
      {
        keywords: ["gagasan pokok", "tokoh", "watak", "amanat", "cerita rakyat", "pengalaman liburan", "kalimat aktif", "imbuhan me"],
        recommendedSubject: "Bahasa Indonesia",
        recommendedFase: "B",
        reason: "literasi awal membaca & menulis paragraf kelas 3-4 SD"
      },
      {
        keywords: ["suku kata", "ba-bi-bu", "dongeng rakyat bergambar", "huruf kapital", "tanda titik", "membaca nyaring", "perkenalan diri"],
        recommendedSubject: "Bahasa Indonesia",
        recommendedFase: "A",
        reason: "fondasi calistung awal membaca menulis kelas 1-2 SD"
      },
      {
        keywords: ["identitas diri", "silsilah keluarga", "tata tertib", "sikap disiplin", "denah jalan", "uang kertas", "uang logam"],
        recommendedSubject: "IPS",
        recommendedFase: "A",
        reason: "materi IPS dasar pengenalan diri & keluarga kelas 1-2 SD"
      },
      {
        keywords: ["kerjasama ekonomi", "pd i", "pd ii", "kebijakan moneter", "pasar modal", "g20", "perjanjian multilateral", "inflasi", "fiskal"],
        recommendedSubject: "IPS",
        recommendedFase: "F",
        reason: "ekonomi & geopolitik internasional kelas 11-12 SMA"
      },
      {
        keywords: ["pancasila", "uud", "ham", "kebinekaan", "norma", "gotong royong", "bhineka", "toleransi", "kewajiban"],
        recommendedSubject: "Pendidikan Pancasila",
        recommendedFase: "D",
        reason: "materi bela negara & tata hukum kewarganegaraan tingkat SMP"
      }
    ];

    // Search for a keyword match
    for (const mapping of keywordMapping) {
      if (mapping.keywords.some(kw => tLower.includes(kw))) {
        // If there's a match, check if it's already aligned with the current subject and fase
        const isSubjectMatch = subject === mapping.recommendedSubject;
        const isFaseMatch = fase === mapping.recommendedFase;
        
        if (!isSubjectMatch || !isFaseMatch) {
          return {
            aligned: false,
            recommendedSubject: mapping.recommendedSubject,
            recommendedFase: mapping.recommendedFase,
            reason: mapping.reason
          };
        } else {
          return {
            aligned: true,
            reason: "Sangat cocok untuk " + mapping.reason
          };
        }
      }
    }
    
    return null; // No keyword pattern detected, assume neutral custom entry
  };

  // Generate Questions via backend proxy API
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setError("Mohon isi atau pilih Topik / Materi terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);
    setStudentAnswers({});
    setRevealedAnswers({});
    setShowScore(false);

    // Dynamic step words for teacher feedback
    const steps = [
      "Menganalisis parameter Kurikulum Merdeka...",
      "Menentukan tingkat kognitif Bloom...",
      "Menyusun stimulus edukatif cerdas...",
      "Merumuskan soal ujian adaptif...",
      "Menyusun kunci jawaban & pembahasan rinci..."
    ];

    let currentStep = 0;
    setLoadingStep(steps[0]);
    
    // Rotate loading text every 1.5 seconds
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
      setLoadingStep(steps[currentStep]);
    }, 1500);

    try {
      const resolvedSubject = subject === "Lainnya" ? (customSubject || "Mata Pelajaran Kustom") : subject;

      const configPayload: GeneratorConfig = {
        subject: resolvedSubject,
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
        visualCount
      };

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(configPayload)
      });

      const data = await response.json();
      clearInterval(interval);

      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);

        // Save generated quiz to package history
        const newPackage = {
          id: `pkg-${Date.now()}`,
          date: new Date().toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          subject: resolvedSubject,
          topic,
          questions: data.questions
        };

        const updatedHistory = [newPackage, ...savedPackages].slice(0, 30); // Keep last 30
        setSavedPackages(updatedHistory);
        localStorage.setItem("soalgen_history", JSON.stringify(updatedHistory));
      } else {
        setError(data.error || "Gagal menghasilkan soal ujian. Mohon coba beberapa saat lagi.");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setError("Koneksi gagal atau server terputus. Pastikan server dev berjalan.");
    } finally {
      setLoading(false);
    }
  };

  // Set the preview questions package from history
  const loadFromHistory = (pkg: typeof savedPackages[0]) => {
    setQuestions(pkg.questions);
    setSubject(pkg.subject);
    setTopic(pkg.topic);
    setStudentAnswers({});
    setRevealedAnswers({});
    setShowScore(false);
    setActiveTab('editor');
  };

  // Delete an item from history
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedPackages.filter(item => item.id !== id);
    setSavedPackages(filtered);
    localStorage.setItem("soalgen_history", JSON.stringify(filtered));
  };

  // Interactive UI testing handlers
  const handleSelectAnswer = (qId: string, value: any) => {
    setStudentAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleToggleReveal = (qId: string) => {
    setRevealedAnswers(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const calculateTotalCorrect = () => {
    let score = 0;
    questions.forEach(q => {
      const studentAns = studentAnswers[q.id];
      if (!studentAns) return;

      if (q.type === 'Pilihan Ganda') {
        const letter = studentAns.split('.')[0].trim().toUpperCase();
        const correctLetter = String(q.correctAnswer).split('.')[0].trim().toUpperCase();
        if (letter === correctLetter) score++;
      } else if (q.type === 'Benar / Salah') {
        if (String(studentAns).toLowerCase() === String(q.correctAnswer).toLowerCase()) score++;
      } else if (q.type === 'Isian Singkat') {
        if (studentAns.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
          score++;
        }
      } else if (q.type === 'PG Kompleks') {
        // expect studentAns to be string array
        const corrArr = (q as any).correctAnswers || [q.correctAnswer];
        const isAllCorrect = Array.isArray(studentAns) &&
          studentAns.length === corrArr.length &&
          studentAns.every(v => corrArr.includes(v));
        if (isAllCorrect) score++;
      }
    });
    return score;
  };

  // Copy all questions formatted for easy paste (Markdown)
  const handleCopyMarkdown = () => {
    if (questions.length === 0) return;

    let text = `# SOAL EVALUASI: ${topic.toUpperCase()}\n`;
    text += `Mata Pelajaran: ${subject} | Fase: ${fase} | Kesulitan: ${difficulty}\n`;
    text += `Dibuat secara otomatis dengan SoalGen AI pada ${new Date().toLocaleDateString("id-ID")}\n\n`;
    text += `==================================================\n\n`;

    questions.forEach((q, idx) => {
      text += `${idx + 1}. [${q.type}] - ${q.questionText} (${q.points} Poin)\n`;
      
      if (q.stimulus) {
        text += `   [Stimulus: ${q.stimulus.type} - ${q.stimulus.title || 'Data'}]\n`;
        text += `   "${q.stimulus.description}"\n`;
        if (q.stimulus.tableHeaders && q.stimulus.tableRows) {
          text += `   Tabel:\n`;
          text += `   | ${q.stimulus.tableHeaders.join(" | ")} |\n`;
          text += `   | ${q.stimulus.tableHeaders.map(() => "---").join(" | ")} |\n`;
          q.stimulus.tableRows.forEach(row => {
            text += `   | ${row.join(" | ")} |\n`;
          });
        }
        if (q.stimulus.chartData) {
          text += `   Grafik:\n`;
          q.stimulus.chartData.forEach(item => {
            text += `   - ${item.label}: ${item.value}\n`;
          });
        }
        text += `\n`;
      }

      if (q.options && q.options.length > 0) {
        q.options.forEach(opt => {
          text += `   ${opt}\n`;
        });
      }

      if (q.type === 'Menjodohkan' && q.matchingPairs) {
        text += `   Pasangkan bagian Kiri dengan Kanan:\n`;
        q.matchingPairs.forEach((pair, pIdx) => {
          text += `   [ Kolom Kiri ${pIdx + 1} ]: ${pair.left}  <=====>  [ Kolom Kanan ]: (Mencari Pasangan Cocok)\n`;
        });
      }

      text += `\n   Kunci Jawaban: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : (q as any).correctAnswers ? (q as any).correctAnswers.join(", ") : q.correctAnswer}\n`;
      text += `   Pembahasan: ${q.explanation}\n`;
      text += `\n--------------------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(text);
    alert("Berhasil menyalin seluruh paket soal dalam format teks rapi / Markdown!");
  };

  // Direct offline download as a Microsoft Word file (.doc)
  const handleDownloadWordMode = (mode: 'all' | 'questions' | 'answers' | 'blueprint') => {
    let docHtml = "";
    const currentSubjectStr = subject === "Lainnya" ? (customSubject || "Kustom") : subject;
    
    if (mode === 'questions') {
      docHtml = generateQuestionsHtml(currentSubjectStr, fase, topic, difficulty, bloomLevel, questions);
    } else if (mode === 'blueprint') {
      docHtml = generateBlueprintHtml(currentSubjectStr, fase, topic, bloomLevel, difficulty, questions);
    } else if (mode === 'answers') {
      docHtml = generateAnswersHtml(currentSubjectStr, fase, topic, questions);
    } else {
      docHtml = generateQuestionsHtml(currentSubjectStr, fase, topic, difficulty, bloomLevel, questions) + 
                `<br/><br/><hr style="page-break-before:always;"/><br/><br/>` + 
                generateBlueprintHtml(currentSubjectStr, fase, topic, bloomLevel, difficulty, questions) + 
                `<br/><br/><hr style="page-break-before:always;"/><br/><br/>` + 
                generateAnswersHtml(currentSubjectStr, fase, topic, questions);
    }

    // Wrap in standard Microsoft Word compatible HTML template with print-layout configured
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${mode === 'questions' ? 'Soal' : mode === 'blueprint' ? 'Kisi' : 'Jawaban'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11.0in;
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header-margin: .5in;
            mso-footer-margin: .5in;
            mso-paper-source: 0;
          }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111111; line-height: 1.4; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
          th, td { border: 1px solid #777777; padding: 6px 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          h1, h2, h3, h4 { font-family: 'Arial', sans-serif; font-weight: bold; margin-top: 15px; margin-bottom: 8px; }
          h1 { font-size: 15pt; text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; text-transform: uppercase; }
          .stimulus-box { border: 1px dashed #7f8c8d; padding: 12px; margin-bottom: 12px; font-style: italic; background-color: #f9f9f9; font-size: 10pt; border-radius: 6px; }
        </style>
      </head>
      <body>
        ${docHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const fileLabel = mode === 'questions' ? 'Naskah_Soal' : mode === 'blueprint' ? 'Kisi_Kisi' : mode === 'answers' ? 'Kunci_Jawaban' : 'Paket_Lengkap';
    const cleanTopic = topic.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    a.download = `${fileLabel}_${cleanTopic}.doc`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger browser print of the questions panel with print-specific styling
  const handlePrint = () => {
    window.print();
  };

  const handlePrintSpecificMode = (mode: 'all' | 'questions' | 'answers' | 'blueprint') => {
    setPrintMode(mode);
    // Give direct setTimeout feedback so the browser layout updates prior to printing
    setTimeout(() => {
      window.print();
    }, 280);
  };

  // Start editing single question
  const startEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditQuestionText(q.questionText);
    setEditExplanationText(q.explanation);
    setEditOptions(q.options ? [...q.options] : []);
    setEditCorrectAnswer(String(q.correctAnswer));
  };

  // Save the edited single question
  const saveEditedQuestion = (qId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          questionText: editQuestionText,
          explanation: editExplanationText,
          options: q.options ? editOptions : undefined,
          correctAnswer: editCorrectAnswer
        };
      }
      return q;
    }));
    setEditingQuestionId(null);
  };

  const currentSubjectColor = SUBJECT_PRESETS.find(p => p.id === subject)?.color || "violet";

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex flex-col items-center justify-center p-4 selection:bg-purple-200 selection:text-purple-900 font-sans relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-violet-200/30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-indigo-200/30 blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 animate-show-explanation">
          {/* Logo & Subheading */}
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 items-center justify-center text-white font-bold text-2xl shadow-md mb-3.5 mx-auto">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="font-extrabold text-2xl tracking-tight text-slate-800">
              SoalGen AI
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Sistem Generator Soal Cerdas Kurikulum Merdeka
            </p>
          </div>

          {/* Login Card wrapper */}
          <div className="bg-white border border-slate-200/75 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            {/* Soft decor accent strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500"></div>

            <div className="mb-6">
              <h2 className="font-bold text-lg text-slate-800">Masuk sebagai Admin</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Silakan gunakan kredensial standard admin untuk mengakses generator.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs px-3 py-2.5 rounded-xl flex items-start gap-2 animate-show-explanation">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{loginError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5 animate-show-explanation">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-xs transition-all outline-hidden text-slate-800 font-medium font-sans placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 animate-show-explanation">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-xs transition-all outline-hidden text-slate-800 font-medium font-sans placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Tips Banner with professional motto as requested */}
              <div className="bg-gradient-to-r from-violet-50/70 to-indigo-50/70 border border-indigo-100/60 rounded-xl p-3.5 text-center space-y-1.5 shadow-3xs">
                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                  "Objektif, Jujur, Transparan, cerminan kompetensi profesional"
                </p>
                <div className="text-[10px] text-indigo-800 font-extrabold flex items-center justify-center gap-1 mt-1 font-mono">
                  <span>✨</span>
                  <span>created by</span>
                  <a 
                    href="https://hermanwahani.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline text-indigo-650 hover:text-indigo-800 transition-colors"
                  >
                    hermanwahani.com
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>MASUK KE DASHBOARD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
              SoalGen AI © {new Date().getFullYear()} • KREASI ALGORITMA CERDAS
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-purple-200 selection:text-purple-900">
      
      {/* HEADER BAR - Styled precisely to resemble the reference layout */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <Sparkles className="w-5.5 h-5.5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-800">SoalGen AI</span>
              <span className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded-sm">V2.0</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Generator Soal Cerdas berbasis Kurikulum Merdeka</p>
          </div>
        </div>

        {/* Global Nav & Badge status */}
        <div className="flex items-center gap-4">
          <nav className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold mr-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Generator
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md flex items-center gap-1.5 transition-all relative ${
                activeTab === 'history'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Riwayat Soal
              {savedPackages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-[9px] text-white flex items-center justify-center rounded-full font-bold">
                  {savedPackages.length}
                </span>
              )}
            </button>
          </nav>

          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>● AI Online</span>
          </div>

          {/* Admin Profile & Logout Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] bg-slate-100 text-slate-700 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider text-center">ADMINISTRATOR</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs active:scale-95 shadow-3xs"
              title="Keluar dari sesi administrator"
            >
              🚪 Keluar
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6">
        
        {/* TAB 1: GENERATOR LAB */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT CONFIGURATION PANEL (12 cols on mobile, 5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
              
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
                {/* Visual badge top */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-600"></div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                    <Settings className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Konfigurasi Soal</h2>
                    <p className="text-xs text-slate-400">Atur parameter untuk AI menghasikan soal sesuai kebutuhan.</p>
                  </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-5 text-sm">
                  
                  {/* Subject Dropdown Select */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Mata Pelajaran</span>
                      <span className="text-[10px] text-slate-400 font-normal">Pilih mapel utama soal</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                      className="w-full bg-slate-50 hover:bg-slate-100/85 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between font-semibold text-slate-700 transition-all text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xl">
                          {SUBJECT_PRESETS.find(p => p.id === subject)?.icon}
                        </span>
                        <span>{subject}</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${subjectDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {subjectDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto p-1.5">
                        {SUBJECT_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSubjectChange(p.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-xs font-semibold hover:bg-slate-50 transition-all ${
                              subject === p.id ? 'bg-purple-55/70 text-purple-700' : 'text-slate-650'
                            }`}
                          >
                            <span className="text-lg">{p.icon}</span>
                            <div>
                              <span>{p.name}</span>
                              <span className="block text-[10px] text-slate-400 font-normal truncate">
                                Contoh: {p.topics.slice(0, 2).join(", ")}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {subject === "Lainnya" && (
                    <div className="animate-show-explanation">
                      <label className="block text-custom-label text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Tulis Mata Pelajaran Kustom
                      </label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Contoh: Seni Rupa, Kimia, PJOK, Fisika..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-all text-xs"
                        required
                      />
                    </div>
                  )}

                  {/* Fase Kurikulum Merdeka Tabs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Fase Kurikulum Merdeka</span>
                      <span className="text-[10px] text-slate-400 font-normal">Kelas 1 - Kelas 12</span>
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((f) => {
                        const levelDetails: { [key: string]: string } = {
                          A: "Kls 1-2 SD",
                          B: "Kls 3-4 SD",
                          C: "Kls 5-6 SD",
                          D: "Kls 7-9 SMP",
                          E: "Kls 10 SMA / SMK",
                          F: "Kls 11-12 SMA / SMK",
                        };

                        const isSelected = fase === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              handleFaseChange(f);
                            }}
                            title={levelDetails[f]}
                            className={`py-2 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {f}
                            <span className="block text-[8px] font-normal opacity-75 truncate">{f === 'D' ? 'SMP' : f === 'E' || f === 'F' ? 'SMA / SMK' : 'SD'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topic / Materi Input with autocomplete suggestions */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Topik / Materi Pokok</span>
                      <span className="text-[10px] text-slate-400 font-normal">Ketik bebas atau pilih rekomendasi</span>
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Contoh: Bilangan Pecahan dan Operasinya..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all text-xs shadow-3xs"
                      required
                    />

                    {/* Dynamic Real-time Alignment Analyzer Banner */}
                    {(() => {
                      const analysis = analyzeTopicAlignment();
                      if (!analysis) return null;
                      if (!analysis.aligned) {
                        return (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 animate-show-explanation shadow-3xs transition-all duration-300">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">Ketidakselarasan Deteksi Kurikulum</p>
                                <p className="text-[11px] text-amber-700 leading-snug mt-0.5">
                                  Topik ini berasosiasi dengan <span className="font-bold text-amber-900">{analysis.recommendedSubject}</span> di <span className="font-bold text-amber-900">Fase {analysis.recommendedFase}</span> ({analysis.reason}).
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSubject(analysis.recommendedSubject);
                                setFase(analysis.recommendedFase);
                              }}
                              className="text-[11px] font-black bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap px-3.5 py-2 rounded-lg border border-amber-600 cursor-pointer shadow-3xs leading-none transition-all active:scale-95 text-center mt-1 sm:mt-0"
                            >
                              SINKRONKAN PARAMETER
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-850 animate-show-explanation transition-all duration-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold">
                              Status: <span className="opacity-80 underline decoration-emerald-400 decoration-wavy">Kurikulum Linear & Selaras</span> ({analysis.reason})
                            </span>
                          </div>
                        );
                      }
                    })()}

                    {/* Interactive suggestions panel */}
                    <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-150 relative overflow-hidden">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span>💡 Ide Topik Kurikulum Merdeka (Fase {fase})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShuffleSeed(prev => prev + 1)}
                          className="text-indigo-650 hover:text-indigo-800 flex items-center gap-1 font-black cursor-pointer transition-all active:scale-90 hover:underline bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs"
                        >
                          <RefreshCw className="w-2.5 h-2.5 text-indigo-500 animate-spin-once" /> Acak Rekomendasi
                        </button>
                      </div>

                      {/* Grid of Dynamic, PHASE-AWARE Topic Pill Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getSuggestions().map((item, idx) => {
                          const isSelected = topic === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setTopic(item)}
                              className={`p-2.5 rounded-xl border text-left text-[11px] transition-all cursor-pointer flex items-center gap-2 group relative hover:shadow-2xs active:scale-98 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-indigo-400 text-white font-extrabold shadow-3xs'
                                  : 'bg-white border-slate-150 text-slate-650 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <span className={`text-sm shrink-0 p-1 rounded-md transition-all ${isSelected ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                {getTopicIcon(subject, idx)}
                              </span>
                              <span className="flex-1 truncate leading-snug">
                                {item}
                              </span>
                              {isSelected ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse"></span>
                              ) : (
                                <span className="text-[10px] text-slate-350 font-bold group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all">+ Pilih</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mode Pilihan Format Soal (Tunggal vs Campuran) */}
                  <div className="space-y-1.5 pt-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mode Format Soal
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setIsMixedFormat(false)}
                        className={`py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                          !isMixedFormat
                            ? 'bg-white text-violet-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        🎯 Format Tunggal
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMixedFormat(true)}
                        className={`py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                          isMixedFormat
                            ? 'bg-white text-violet-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        🔀 Campuran (Variatif)
                      </button>
                    </div>
                  </div>

                  {/* Format Soal / Question Type Controls */}
                  {!isMixedFormat ? (
                    /* SINGLE FORMAT VIEW */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Pilih Format Soal</span>
                          <span className="text-[10px] text-slate-400 font-normal">Dukung format AKM & Ujian Sekolah</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            "Pilihan Ganda",
                            "PG Kompleks",
                            "Benar / Salah",
                            "Menjodohkan",
                            "Isian Singkat",
                            "Uraian / Esai"
                          ] as QuestionType[]).map((type) => {
                            const isSelected = format === type;
                            const glyph: { [key: string]: string } = {
                              "Pilihan Ganda": "🟣",
                              "PG Kompleks": "🔲",
                              "Benar / Salah": "✅",
                              "Menjodohkan": "🔗",
                              "Isian Singkat": "✏️",
                              "Uraian / Esai": "🖋️"
                            };

                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setFormat(type)}
                                className={`py-2 px-3 text-left rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-violet-50 border-violet-300 text-violet-700 shadow-3xs'
                                    : 'bg-white border-slate-250 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <span>{glyph[type]}</span>
                                <span className="truncate">{type}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Jumlah Soal Horizontal Slider for Single Format */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Jumlah Soal
                          </label>
                          <span className="bg-violet-100 text-violet-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                            {count} Butir
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={count}
                          onChange={(e) => setCount(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 px-0.5 mt-1 font-semibold">
                          <span>1 Butir</span>
                          <span>15 Butir</span>
                          <span>30 Butir</span>
                        </div>

                        {/* Quick Presets for Jumlah Soal */}
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 mr-1">Pintasan:</span>
                          {([3, 5, 10, 15, 20, 25] as const).map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setCount(num)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                count === num
                                  ? 'bg-violet-600 text-white border-violet-600 shadow-3xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                              }`}
                            >
                              {num} Soal
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* MIXED FORMATS (VARIATIF WITH QUANTITY BUTTONS) */
                    <div className="space-y-3 bg-slate-55/40 border border-slate-200 rounded-2xl p-3.5">
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-700">Set Kuantitas Per Tipe Soal</h4>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Soal ujian akan bervariasi teratur sesuai jumlah berikut</p>
                        </div>
                        <span className="bg-violet-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-3xs">
                          📊 Total: {count} Butir
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {([
                          "Pilihan Ganda",
                          "PG Kompleks",
                          "Benar / Salah",
                          "Menjodohkan",
                          "Isian Singkat",
                          "Uraian / Esai"
                        ] as QuestionType[]).map((type) => {
                          const qty = mixedFormats[type] || 0;
                          const glyph: { [key: string]: string } = {
                            "Pilihan Ganda": "🟣",
                            "PG Kompleks": "🔲",
                            "Benar / Salah": "✅",
                            "Menjodohkan": "🔗",
                            "Isian Singkat": "✏️",
                            "Uraian / Esai": "🖋️"
                          };

                          const updateQty = (change: number) => {
                            setMixedFormats(prev => {
                              const newVal = Math.max(0, Math.min(25, (prev[type] || 0) + change));
                              return { ...prev, [type]: newVal };
                            });
                          };

                          const setQtyDirectly = (value: number) => {
                            setMixedFormats(prev => ({ ...prev, [type]: value }));
                          };

                          return (
                            <div
                              key={type}
                              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                                qty > 0
                                  ? 'bg-violet-50/70 border-violet-300 shadow-3xs'
                                  : 'bg-white border-slate-150 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 truncate" title={type}>
                                  <span>{glyph[type]}</span>
                                  <span className="truncate">{type}</span>
                                </div>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${qty > 0 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  {qty} Soal
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateQty(-1)}
                                    className="w-5.5 h-5.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center cursor-pointer select-none"
                                    disabled={qty <= 0}
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateQty(1)}
                                    className="w-5.5 h-5.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center cursor-pointer select-none"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Quick selection counters */}
                                <div className="flex gap-0.5">
                                  {([0, 2, 5, 10] as const).map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => setQtyDirectly(preset)}
                                      className={`px-1 rounded-xs text-[9px] font-bold border transition-all cursor-pointer ${
                                        qty === preset
                                          ? 'bg-violet-600 border-violet-600 text-white'
                                          : 'bg-slate-50 border-slate-205 text-slate-550 hover:bg-slate-100'
                                      }`}
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tingkat Kesulitan Tabs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Tingkat Kesulitan
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Mudah', 'Sedang', 'Sulit', 'Campuran'] as const).map((level) => {
                        const isSelected = difficulty === level;
                        const themeMap: { [key: string]: string } = {
                          Mudah: 'bg-emerald-500 text-white border-emerald-500',
                          Sedang: 'bg-amber-500 text-white border-amber-500',
                          Sulit: 'bg-rose-500 text-white border-rose-500',
                          Campuran: 'bg-indigo-500 text-white border-indigo-500'
                        };

                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setDifficulty(level)}
                            className={`py-2 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                              isSelected
                                ? `${themeMap[level]} shadow-sm`
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level Kognitif Bloom Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Level Kognitif (Bloom)
                    </label>
                    <div className="space-y-1">
                      <select
                        value={bloomLevel}
                        onChange={(e) => setBloomLevel(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 text-xs outline-hidden focus:border-violet-400"
                      >
                        {BLOOM_LEVELS.map((bloom) => (
                          <option key={bloom.value} value={bloom.value}>
                            {bloom.value}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 pl-1 font-medium italic">
                        Arti: {BLOOM_LEVELS.find(b => b.value === bloomLevel)?.desc}
                      </p>
                    </div>
                  </div>

                  {/* Gunakan Media Visual Checkbox & Suboptions */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="relative flex items-center gap-2.5 cursor-pointer py-1.5 select-none text-slate-700">
                      <input
                        type="checkbox"
                        checked={useVisual}
                        onChange={(e) => setUseVisual(e.target.checked)}
                        className="w-4.5 h-4.5 rounded-sm border-slate-300 text-violet-600 focus:ring-violet-500 accent-violet-600"
                      />
                      <div className="text-xs font-bold text-slate-700">
                        Sertakan Stimulus Media Visual
                      </div>
                    </label>

                    {useVisual && (
                      <div className="mt-2 pl-7 space-y-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          {([
                            { type: "Gambar Ilustrasi", icon: "🖼️" },
                            { type: "Infografis", icon: "📊" },
                            { type: "Grafik / Diagram", icon: "📈" },
                            { type: "Tabel Data", icon: "📋" },
                            { type: "Peta", icon: "🗺️" }
                          ] as const).map(({ type, icon }) => {
                            const isSel = visualType === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setUseVisual(true) || setVisualType(type)}
                                className={`py-1.5 px-2 text-left rounded-md text-[10px] font-bold border transition-all truncate cursor-pointer ${
                                  isSel
                                    ? 'bg-purple-100 border-purple-300 text-purple-700 pr-1.5'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                              >
                                <span className="mr-1">{icon}</span> {type}
                              </button>
                            );
                          })}
                        </div>

                        {/* Tombol jumlah media visual */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-2">
                          <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            Jumlah Soal dengan Media Visual:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {([1, 2, 3, 5, 'Semua'] as const).map((qty) => {
                              const isSel = visualCount === qty;
                              return (
                                <button
                                  key={qty}
                                  type="button"
                                  onClick={() => setVisualCount(qty)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                    isSel
                                      ? 'bg-violet-600 border-violet-600 text-white shadow-3xs'
                                      : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-100'
                                  }`}
                                >
                                  {qty === 'Semua' ? '🌌 Semua' : `📝 ${qty} Soal`}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[9px] text-slate-400 italic">
                            *Hanya {visualCount === 'Semua' ? 'semua' : `${visualCount}`} butir soal yang akan memiliki stimulus visual berkualitas tinggi, sisanya berupa teks murni agar variatif.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BIG GENERATE BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300 transform active:scale-98 ${
                      loading
                        ? 'bg-gradient-to-r from-slate-400 to-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-lg shadow-violet-200'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Menghasilkan Soal ({count} Soal)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5 text-yellow-300" />
                        <span>Hasilkan Soal AI ({count} Butir)</span>
                      </>
                    )}
                  </button>

                </form>
              </div>

              {/* TIPS PRO SECTION - Exactly matches image banner */}
              <div className="bg-gradient-to-tr from-violet-700 to-purple-800 rounded-[24px] text-white p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                  <Coffee className="w-40 h-40 transform translate-x-12 translate-y-12" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-4.5 h-4.5 text-yellow-300" />
                  </div>
                  <h3 className="font-bold text-sm">Petunjuk Penggunaan SoalGen AI</h3>
                </div>
                <ul className="space-y-2 text-xs text-purple-100 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 mt-0.5">•</span>
                    <span>Tulis topik secara spesifik (Contoh: "Hukum Newton I" atau "Pecahan Campuran") untuk hasil kurikulum yang optimal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 mt-0.5">•</span>
                    <span>Pilih tingkatan Bloom <strong>C3 - C5</strong> untuk menghasilkan soal bernuansa HOTS (Analytical Skills).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300 mt-0.5">•</span>
                    <span>Gunakan stimulus <strong>Grafik / Diagram</strong> untuk mendorong literasi numerik tingkat lanjut bagi murid.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* RIGHT PREVIEW / RESULTS WORKSPACE (12 cols on mobile, 7 cols on lg) */}
            <div className="lg:col-span-7 print:col-span-12">
              
              {/* DISPLAY ERROR IF ANY */}
              {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex items-start gap-3 print:hidden">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Gagal Menghasilkan Soal</h4>
                    <p className="text-xs text-amber-700 mt-1">{error}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleGenerate()}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Coba Lagi
                      </button>
                      <button
                        onClick={() => setError(null)}
                        className="bg-white border border-amber-300 text-amber-800 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LOADING STATE VIEW */}
              {loading && (
                <div className="bg-white border border-slate-100 rounded-[28px] p-12 text-center shadow-md pb-16 flex flex-col items-center justify-center min-h-[500px] print:hidden">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-10 h-10 text-indigo-500 animate-spin duration-3000" />
                    </div>
                    <div className="absolute top-0 right-0 w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-ping"></div>
                  </div>
                  
                  <h3 className="font-extrabold text-xl text-slate-800">Menyusun Naskah Soal Anda...</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-sm font-medium">
                    AI kami sedang menganalisis instrumen Kurikulum Merdeka untuk menghasilkan naskah soal terbaik dan akurat.
                  </p>

                  <div className="w-full max-w-xs bg-slate-150 h-2 rounded-full mt-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full w-4/5 animate-infinite-loading rounded-full"></div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 bg-slate-50 text-slate-500 px-4 py-2 rounded-md text-xs font-mono font-medium border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping"></span>
                    <span>Status: {loadingStep}</span>
                  </div>
                </div>
              )}

              {/* EMPTY STATE - Shown right after loading when no questions generated yet */}
              {!loading && questions.length === 0 && (
                <div className="bg-white border border-dashed border-slate-200 rounded-[28px] p-12 text-center shadow-2xs py-16 flex flex-col items-center justify-center min-h-[500px] print:hidden">
                  
                  <div className="w-20 h-20 rounded-3xl bg-violet-50 flex items-center justify-center text-violet-600 mb-6 font-bold text-3xl">
                    🎓
                  </div>

                  <h3 className="font-extrabold text-xl text-slate-800">Siap Membuat Soal Ujian?</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed font-semibold">
                    Silakan atur parameter di panel kiri &mdash; mulai dari mata pelajaran, fase kurikulum, topik utama, hingga tingkat kesulitan &mdash; lalu tekan tombol <span className="text-violet-600">Hasilkan Soal AI</span>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 w-full max-w-2xl">
                    <div className="bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-2xl p-4.5 text-left transition-all">
                      <div className="text-lg mb-1">🎯</div>
                      <h4 className="font-extrabold text-slate-800 text-xs">Sesuai Kurikulum</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">Berdasarkan Fase A hingga F standar Kurikulum Merdeka Kemdikbudristek.</p>
                    </div>

                    <div className="bg-pink-50/50 hover:bg-pink-50 border border-pink-100 rounded-2xl p-4.5 text-left transition-all">
                      <div className="text-lg mb-1">🧠</div>
                      <h4 className="font-extrabold text-slate-800 text-xs">Taksonomi Bloom</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">C1 hingga C6 terstruktur untuk melatih HOTS & LOTS siswa.</p>
                    </div>

                    <div className="bg-sky-50/50 hover:bg-sky-50 border border-sky-100 rounded-2xl p-4.5 text-left transition-all">
                      <div className="text-lg mb-1">📊</div>
                      <h4 className="font-extrabold text-slate-800 text-xs">Stimulus & Visual</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">Grafik kustom, data tabel terstruktur, peta & infografis interaktif.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTIONS RESULT CONTAINER (Main Workpiece) */}
              {!loading && questions.length > 0 && (
                <div className="space-y-6">
                  
                  {/* UTILITIES BAR - Only displays on layout view */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4.5 flex flex-wrap gap-3 items-center justify-between shadow-2xs print:hidden">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse"></span>
                      <h3 className="font-extrabold text-slate-800 text-xs truncate max-w-[200px]" title={topic}>
                        Naskah Ujian: {topic}
                      </h3>
                    </div>

                    {/* Mode Cetak/Preview - Custom Segmented Tab Row */}
                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600 gap-1 sm:text-xs">
                      <button
                        type="button"
                        onClick={() => setPrintMode('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          printMode === 'all'
                            ? 'bg-white text-violet-700 shadow-xs'
                            : 'hover:text-slate-800'
                        }`}
                        title="Tampilkan naskah lengkap"
                      >
                        📄 Lengkap
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintMode('questions')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          printMode === 'questions'
                            ? 'bg-white text-violet-700 shadow-xs'
                            : 'hover:text-slate-800'
                        }`}
                        title="Tampilkan naskah ujian bagi siswa"
                      >
                        📝 Cetak Soal
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintMode('answers')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          printMode === 'answers'
                            ? 'bg-white text-violet-700 shadow-xs'
                            : 'hover:text-slate-800'
                        }`}
                        title="Tampilkan lembar jawaban"
                      >
                        🔑 Cetak Kunci
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintMode('blueprint')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          printMode === 'blueprint'
                            ? 'bg-white text-violet-700 shadow-xs'
                            : 'hover:text-slate-800'
                        }`}
                        title="Tampilkan kisi-kisi asessmen"
                      >
                        📋 Kisi-Kisi
                      </button>
                    </div>

                    <div className="space-y-4 pt-3 border-t border-slate-100">
                      {/* Row 1: Cetak & Simpan PDF */}
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          🖨️ Cetak atau Simpan sebagai PDF (Layar Sistem)
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintSpecificMode('questions')}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition-all cursor-pointer text-xs active:scale-95"
                            title="Cetak khusus naskah soal siswa atau simpan ke file PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-purple-100" />
                            📝 Cetak Soal / PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintSpecificMode('blueprint')}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition-all cursor-pointer text-xs active:scale-95"
                            title="Cetak khusus kisi-kisi evaluasi kurikulum atau simpan ke file PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-sky-100" />
                            📊 Cetak Kisi-Kisi / PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintSpecificMode('answers')}
                            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition-all cursor-pointer text-xs active:scale-95"
                            title="Cetak kunci jawaban lengkap analisis pembahasan atau simpan ke file PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-fuchsia-100" />
                            🔑 Cetak Kunci & Bahas / PDF
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Unduh Word Offline */}
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          💾 Unduh File Word Instan (.DOC Offline - Sangat Cepat & Ringan)
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadWordMode('questions')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition-all cursor-pointer text-xs active:scale-95"
                            title="Unduh naskah soal berformat Microsoft Word (.doc) secara offline dan instan"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-100" />
                            📂 Unduh Word Soal
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadWordMode('blueprint')}
                            className="bg-teal-650 hover:bg-teal-750 text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition-all cursor-pointer text-xs active:scale-95"
                            title="Unduh kisi-kisi asessmen berformat Microsoft Word (.doc) secara offline dan instan"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-100" />
                            📊 Unduh Word Kisi-Kisi
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadWordMode('answers')}
                            className="bg-cyan-650 hover:bg-cyan-750 text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition-all cursor-pointer text-xs active:scale-95"
                            title="Unduh kunci jawaban berformat Microsoft Word (.doc) secara offline dan instan"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-100" />
                            🔑 Unduh Word Jawaban
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyMarkdown}
                            className="bg-slate-55 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs active:scale-95 sm:ml-auto"
                            title="Salin isi paket soal ke clipboard"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            Salin Naskah
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Saran & Kelengkapan Cetak Administrasi Guru (Print-Hidden) */}
                  <div className="bg-amber-55/60 border border-amber-205 rounded-2xl p-4 text-xs font-semibold text-amber-900 leading-relaxed print:hidden flex gap-3 items-start my-2">
                    <span className="text-lg">💡</span>
                    <div>
                      <h4 className="font-extrabold text-amber-800 mb-0.5">Saran & Rekomendasi Cetak Guru:</h4>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-amber-800">
                        <li><strong>Cetak Soal</strong> ideal untuk dibagikan langsung ke siswa (tata letak bersih & formal tanpa kunci pembuka).</li>
                        <li><strong>Cetak Kisi-Kisi</strong> menghasilkan tabel matriks resmi Asesmen Kompetensi Dasar untuk dokumen administrasi guru.</li>
                        <li><strong>Cetak Kunci & Pembahasan</strong> memuat lembar rincian jawaban disertai analisis logis ilmiah untuk referensi guru.</li>
                        <li><strong>Pengaturan Browser</strong>: Sangat disarankan mengaktifkan <em>Background graphics</em> / <em>Grafik latar belakang</em> serta menonaktifkan <em>Headers and footers</em> pada layar cetak sistem Anda agar garis pembatas tampil utuh.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Google Drive Integration Dashboard Card - Print Hidden */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-3xs print:hidden space-y-4 my-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          ☁️
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-800">Workspace Google Drive</h4>
                          <p className="text-[10px] text-slate-400 font-bold leading-none mt-0.5">Simpan & Edit Naskah Ujian di Google Drive Anda</p>
                        </div>
                      </div>
                      
                      {driveUser && (
                        <button
                          onClick={handleDriveSignOut}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" /> Putuskan Koneksi
                        </button>
                      )}
                    </div>

                    {!driveUser ? (
                      <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="max-w-md">
                          <p className="text-[11px] text-slate-550 font-semibold leading-relaxed">
                            Hubungkan SoalGen AI dengan perangkat Google Drive Anda untuk langsung mengubah & mengekspor seluruh butir soal, kisi-kisi asesmen, dan rincian pembahasan menjadi <strong>Google Documents</strong> (.gdoc) resmi yang siap diedit kapan saja.
                          </p>
                        </div>

                        <div className="shrink-0">
                          {/* Official Styled Sign-In Button */}
                          <button
                            onClick={handleDriveSignIn}
                            disabled={isDriveLoading}
                            className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 border border-slate-250 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer text-xs shadow-3xs disabled:opacity-50"
                          >
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            </svg>
                            <span>{isDriveLoading ? "Menghubungkan..." : "Hubungkan ke Google"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4.5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {driveUser.photoURL ? (
                              <img
                                src={driveUser.photoURL}
                                alt={driveUser.displayName || "User"}
                                className="w-9 h-9 rounded-full border border-emerald-300 shadow-3xs"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-3xs">
                                {driveUser.displayName ? driveUser.displayName[0].toUpperCase() : "G"}
                              </div>
                            )}
                            <div>
                              <h5 className="text-[11px] font-black text-slate-800">
                                Terhubung: {driveUser.displayName || "Rekan Guru"}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-bold leading-none mt-0.5">{driveUser.email}</p>
                            </div>
                          </div>

                          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-full border border-emerald-150 shrink-0">
                            🟢 Akses Google Drive Aktif
                          </div>
                        </div>

                        <div className="border-t border-emerald-100/80 pt-3.5">
                          <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Simpan Dokumen Kurikulum Merdeka ke Google Docs:</span>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <button
                              onClick={() => handleSaveDocToDrive('questions')}
                              disabled={isDriveLoading}
                              className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 text-xs"
                            >
                              📂 {isDriveLoading ? "Sedang Menyimpan..." : "Simpan Soal Ujian (.gdoc)"}
                            </button>

                            <button
                              onClick={() => handleSaveDocToDrive('blueprint')}
                              disabled={isDriveLoading}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 text-xs"
                            >
                              📊 {isDriveLoading ? "Sedang Menyimpan..." : "Simpan Kisi-Kisi (.gdoc)"}
                            </button>

                            <button
                              onClick={() => handleSaveDocToDrive('answers')}
                              disabled={isDriveLoading}
                              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 text-xs"
                            >
                              🔑 {isDriveLoading ? "Sedang Menyimpan..." : "Simpan Kunci & Bahas (.gdoc)"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status/Success feedback banner */}
                    {driveStatusMessage && (
                      <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold ${
                        driveStatusMessage.type === 'success' 
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-250' 
                          : 'bg-rose-105 text-rose-950 border border-rose-250'
                      }`}>
                        <span className="text-base shrink-0">{driveStatusMessage.type === 'success' ? "🎉" : "❌"}</span>
                        <div className="flex-1">
                          <p className="font-bold leading-normal">{driveStatusMessage.text}</p>
                          {driveStatusMessage.link && (
                            <a
                              href={driveStatusMessage.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl hover:bg-emerald-850 transition-all cursor-pointer text-xs shadow-3xs"
                            >
                              Buka Dokumen di Google Docs <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PAPER MASTER - Looks like a high-end printed exam page */}
                  <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm p-8 relative overflow-hidden print:border-none print:shadow-none print:p-0">
                    
                    {/* Header Blank - Visible on print & view */}
                    <div className="border-b-2 border-slate-800 pb-5 mb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight uppercase">
                            {printMode === 'blueprint'
                              ? "KISI-KISI ASESMEN SUMATIF / FORMATIF"
                              : printMode === 'answers'
                              ? "KUNCI JAWABAN & PEMBAHASAN ASESSMEN"
                              : "ASESSMEN SUMATIF / FORMATIF SISWA"}
                          </h1>
                          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">
                            MATA PELAJARAN: {subject === "Lainnya" ? (customSubject || "KUSTOM") : subject} | TOPIK: {topic}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-400 font-mono font-semibold print:hidden">
                          <span>SOALGEN AI EXAM SHEET</span>
                        </div>
                      </div>

                      {/* Student identities blocks (Print Friendly) - Hidden when printing Blueprint */}
                      {printMode !== 'blueprint' && (
                        <div className="grid grid-cols-3 gap-4 border border-slate-300 mt-4 p-3 bg-slate-50 text-xs font-semibold rounded-md print:bg-white">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Nama Lengkap Siswa</span>
                            <span className="border-b border-dashed border-slate-400 block w-full h-5 mt-1"></span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Kelas / Semester</span>
                            <span className="border-b border-dashed border-slate-400 block w-full h-5 mt-1">{`Fase ${fase} / Ganjil`}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Tanggal Ujian</span>
                            <span className="border-b border-dashed border-slate-400 block w-full h-5 mt-1"></span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata summary (Print Friendly) */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600 mb-6 print:hidden">
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-100">
                        🎯 Fase: {fase === 'E' || fase === 'F' ? `${fase} (SMA / SMK)` : fase}
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-100">
                        📶 Kesulitan: {difficulty}
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-100">
                        🧠 Kognitif: {bloomLevel}
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-100">
                        🔥 Total Skor: {questions.reduce((sum, q) => sum + (q.points || 10), 0)} Poin
                      </span>
                    </div>

                    {/* THE INTRINSIC QUESTIONS */}
                    {printMode === 'blueprint' ? (
                      /* KISI-KISI ASSESSMENT MATRIX TABLE */
                      <div className="space-y-6 pt-2">
                        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200">
                          <h3 className="font-extrabold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
                            <span className="text-base">📊</span> Penjelasan Kisi-Kisi Instrumen Asesmen (Assessment Blueprint)
                          </h3>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                            Tabel matriks kisi-kisi ini disusun secara teratur menggunakan kecerdasan buatan SoalGen AI, mereferensikan capaian Kognitif Bloom level <strong>{bloomLevel}</strong> serta kompetensi materi pokok <strong>{topic}</strong> untuk Fase {fase === 'E' || fase === 'F' ? `${fase} (SMA / SMK)` : fase}. Tabel ini dapat dicetak langsung sebagai instrumen administrasi resmi guru.
                          </p>
                        </div>
                        
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="min-w-full border-collapse bg-white text-xs font-semibold">
                            <thead>
                              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-left">
                                <th className="px-4 py-3 font-bold text-center w-16">No Soal</th>
                                <th className="px-4 py-3 font-bold">Topik / Kompetensi Dasar</th>
                                <th className="px-4 py-3 font-bold w-32">Format Soal</th>
                                <th className="px-4 py-3 font-bold text-center font-mono w-20">Bloom</th>
                                <th className="px-4 py-3 font-bold text-center w-24">Kesulitan</th>
                                <th className="px-4 py-3 font-bold text-center w-36">Kunci Pembuka</th>
                                <th className="px-4 py-3 font-bold text-center w-20">Skor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                              {questions.map((q, qidx) => (
                                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">{qidx + 1}</td>
                                  <td className="px-4 py-3.5 text-slate-700">{topic}</td>
                                  <td className="px-4 py-3.5 text-purple-700 font-bold">{q.type}</td>
                                  <td className="px-4 py-3.5 text-center text-slate-600 font-mono font-bold text-[10px]">{bloomLevel}</td>
                                  <td className="px-4 py-3.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      difficulty === 'Mudah' ? 'bg-emerald-100 text-emerald-800' :
                                      difficulty === 'Sedang' ? 'bg-amber-100 text-amber-800' :
                                      difficulty === 'Sulit' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {difficulty}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-center font-mono text-[11px] font-extrabold text-slate-800 truncate max-w-[125px]">
                                    {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : String(q.correctAnswer)}
                                  </td>
                                  <td className="px-4 py-3.5 text-center font-mono text-slate-500 font-bold">{q.points || 10}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 divide-y divide-slate-100">
                        {questions.map((q, idx) => {
                          const isReplying = editingQuestionId === q.id;
                          const hasStimulus = q.stimulus;
                          const isAnswerRevealed = printMode === 'answers' || (printMode !== 'questions' && revealedAnswers[q.id]);

                        return (
                          <div key={q.id} className={`pt-6 ${idx === 0 ? 'pt-0 border-t-0' : ''} group`}>
                            
                            {/* Question Header Card: Badges and Admin Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 print:hidden">
                              <div className="flex items-center gap-1.5 text-[10px] font-extrabold">
                                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                                  {q.type}
                                </span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">
                                  {q.points || 10} Poin
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleReveal(q.id)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                    isAnswerRevealed
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-white text-slate-600 border-slate-205 hover:bg-slate-50'
                                  }`}
                                  title="Tampilkan Kunci Jawaban & Pembahasan"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Kunci ({isAnswerRevealed ? 'Buka' : 'Tutup'})
                                </button>

                                <button
                                  onClick={() => {
                                    if (isReplying) {
                                      saveEditedQuestion(q.id);
                                    } else {
                                      startEditQuestion(q);
                                    }
                                  }}
                                  className="bg-white border border-slate-205 hover:bg-amber-50 hover:text-amber-800 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  {isReplying ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      Selesai
                                    </>
                                  ) : (
                                    <>
                                      <Edit3 className="w-3 h-3 text-slate-500" />
                                      Edit
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* STIMULUS DISPLAY IF HAS ONE */}
                            {hasStimulus && (
                              <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4.5 mb-4 text-xs tracking-wide leading-relaxed print:bg-white print:border-slate-300">
                                <div className="flex items-center gap-2 mb-2 text-slate-550 border-b border-slate-100 pb-2">
                                  <span className="text-sm">📁</span>
                                  <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                                    Stimulus: {q.stimulus?.type}
                                  </span>
                                  <span className="text-slate-350 ml-auto font-mono text-[9px]">{q.stimulus?.title || 'Data Pengamatan'}</span>
                                </div>

                                <p className="text-slate-700 italic font-medium leading-relaxed mb-3">
                                  "{q.stimulus?.description}"
                                </p>

                                {/* STIMULUS GAMBAR / ILUSTRASI REAL VISUAL */}
                                {(q.stimulus?.type === 'Gambar Ilustrasi' || q.stimulus?.type === 'Infografis' || q.stimulus?.type === 'Peta') && (
                                  <div className="my-4 flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-2xl overflow-hidden p-3 sm:p-4 max-w-sm sm:max-w-md md:max-w-lg w-full mx-auto shadow-sm group/img relative print:break-inside-avoid">
                                    <div className="relative w-full bg-slate-50/70 rounded-xl overflow-hidden flex items-center justify-center min-h-[160px] sm:min-h-[220px] md:min-h-[260px] group">
                                      {/* Decorative target badge */}
                                      <span className="absolute top-2.5 left-2.5 z-15 bg-slate-900/85 text-white backdrop-blur-xs px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs select-none">
                                        <span className={`w-1.5 h-1.5 rounded-full ${imageLoadedStates[q.id] ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}></span>
                                        {imageLoadedStates[q.id] ? 'Stimulus Siap' : 'Menjana Ilustrasi...'}
                                      </span>

                                      {/* Regenerate Seed button to cycle design variations */}
                                      <button
                                        type="button"
                                        title="Dapatkan variasi gambar baru"
                                        onClick={() => {
                                          setImageLoadedStates(prev => ({ ...prev, [q.id]: false }));
                                          setImageSeeds(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }));
                                        }}
                                        className="absolute top-2.5 right-2.5 z-15 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-650 p-1.5 rounded-lg border border-slate-200/60 shadow-xs cursor-pointer transition-all active:scale-90 flex items-center gap-1 text-[10px] font-semibold"
                                      >
                                        🔄 <span className="hidden sm:inline">Variasi Baru</span>
                                      </button>

                                      {/* Shimmer skeleton screen shown while loading / generating */}
                                      {!imageLoadedStates[q.id] && (
                                        <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center animate-pulse p-4 text-center z-10 transition-all duration-300">
                                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-450 animate-bounce mb-2">
                                            🎨
                                          </div>
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Membuat Desain Ringan...
                                          </p>
                                          <p className="text-[9px] text-slate-400/80 mt-1 max-w-[220px] line-clamp-1 leading-normal">
                                            {q.stimulus.title || q.stimulus.description}
                                          </p>
                                          <div className="w-[120px] h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                                            <div className="h-full bg-indigo-500 animate-infinite-loading rounded-full" style={{ width: "60%" }}></div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <img
                                        src={`https://image.pollinations.ai/p/${encodeURIComponent(
                                          `academic textbook educational visual diagram illustration, simple flat vector school design, ${q.stimulus.description.replace(/["'()\[\]]/g, "").substring(0, 110)}, white background`
                                        )}?width=400&height=300&nologo=true&model=turbo&seed=${q.id}_seed${imageSeeds[q.id] || 0}`}
                                        alt={q.stimulus.title || "Stimulus Ilustrasi Visual"}
                                        referrerPolicy="no-referrer"
                                        onLoad={() => {
                                          setImageLoadedStates(prev => ({ ...prev, [q.id]: true }));
                                        }}
                                        className={`w-full h-auto max-h-[300px] sm:max-h-[360px] object-contain rounded-lg transition-all duration-700 hover:scale-[1.01] ${imageLoadedStates[q.id] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                                        loading="lazy"
                                      />
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold text-center mt-2.5 flex items-center gap-1.5 justify-center">
                                      <span className="text-xs">🖼️</span>
                                      <span>{q.stimulus.title || "Ilustrasi Pendukung Soal"}</span>
                                    </div>
                                  </div>
                                )}

                                {/* STIMULUS TABEL DATA */}
                                {q.stimulus?.type === 'Tabel Data' && q.stimulus?.tableHeaders && q.stimulus?.tableRows && (
                                  <div className="overflow-x-auto my-3.5">
                                    <table className="min-w-full border-collapse border border-slate-250 bg-white text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-100">
                                          {q.stimulus.tableHeaders.map((hdr, hIdx) => (
                                            <th key={hIdx} className="border border-slate-250 px-3 py-2 text-left font-bold text-slate-750">
                                              {hdr}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {q.stimulus.tableRows.map((row, rIdx) => (
                                          <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                                            {row.map((val, vIdx) => (
                                              <td key={vIdx} className="border border-slate-250 px-3 py-1.5 text-slate-650 font-medium font-mono">
                                                {val}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* STIMULUS GRAFIK / DIAGRAM (Generated via elegant SVG natively) */}
                                {q.stimulus?.type === 'Grafik / Diagram' && q.stimulus?.chartData && (
                                  <div className="bg-white border border-slate-150 rounded-xl p-4 my-3 max-w-md mx-auto">
                                    <div className="text-[10px] font-bold text-slate-500 text-center mb-3">
                                      📊 {q.stimulus.title || "Visualisasi Data Diagram"}
                                    </div>
                                    <div className="space-y-2.5">
                                      {q.stimulus.chartData.map((item, barIdx) => {
                                        const values = q.stimulus?.chartData?.map(d => d.value) || [1];
                                        const maxVal = Math.max(...values, 1);
                                        const widthPercent = Math.max((item.value / maxVal) * 100, 5);
                                        return (
                                          <div key={barIdx} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-650">
                                              <span>{item.label}</span>
                                              <span className="font-mono">{item.value} Satuan</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-4 rounded-xs overflow-hidden flex">
                                              <div 
                                                className="bg-indigo-500 h-full rounded-r-xs transition-all duration-1000"
                                                style={{ width: `${widthPercent}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* MAIN QUESTION BODY (With editing mode support) */}
                            <div className="text-slate-800 font-semibold leading-relaxed tracking-wide text-sm mb-4">
                              <span className="text-slate-500 mr-1.5 font-bold font-mono">{idx + 1}.</span>
                              {isReplying ? (
                                <textarea
                                  value={editQuestionText}
                                  onChange={(e) => setEditQuestionText(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-700 font-sans focus:outline-hidden focus:border-violet-500"
                                  rows={3}
                                />
                              ) : (
                                <span>{q.questionText}</span>
                              )}
                            </div>

                            {/* CHOICES / OPTIONS SELECT (PILIHAN GANDA & COMPLEKS) */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-6 my-4 select-none">
                                {q.options.map((option, optIdx) => {
                                  const letter = option.split('.')[0].trim().toUpperCase();
                                  const rawText = option.substring(option.indexOf(".") + 1).trim();
                                  
                                  const isCheckedForSingle = studentAnswers[q.id] === option;
                                  
                                  const multipleAnswersArray = studentAnswers[q.id] || [];
                                  const isCheckedForComplex = Array.isArray(multipleAnswersArray) && multipleAnswersArray.includes(letter);

                                  const isSinglePG = q.type === 'Pilihan Ganda';

                                  const handleOptionClick = () => {
                                    if (isSinglePG) {
                                      handleSelectAnswer(q.id, option);
                                    } else {
                                      // PG Kompleks multi choices
                                      if (isCheckedForComplex) {
                                        handleSelectAnswer(q.id, multipleAnswersArray.filter((l: string) => l !== letter));
                                      } else {
                                        handleSelectAnswer(q.id, [...multipleAnswersArray, letter]);
                                      }
                                    }
                                  };

                                  return (
                                    <div
                                      key={optIdx}
                                      onClick={handleOptionClick}
                                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer hover:bg-slate-50 active:scale-99 ${
                                        (isSinglePG && isCheckedForSingle) || (!isSinglePG && isCheckedForComplex)
                                          ? 'border-violet-500 bg-violet-50/50 text-violet-900 shadow-3xs'
                                          : 'border-slate-205 bg-white text-slate-650'
                                      }`}
                                    >
                                      <div className={`w-5 h-5 flex items-center justify-center font-bold shrink-0 text-[11px] ${
                                        isSinglePG 
                                          ? 'rounded-full bg-slate-100 text-slate-600 border' 
                                          : 'rounded-md bg-slate-100 text-slate-600 border'
                                      } ${
                                        ((isSinglePG && isCheckedForSingle) || (!isSinglePG && isCheckedForComplex))
                                          ? 'bg-violet-600 text-white border-violet-600'
                                          : ''
                                      }`}>
                                        {letter}
                                      </div>
                                      <span className="leading-tight">{rawText}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* BENAR OR SALAH OPTIONS */}
                            {q.type === 'Benar / Salah' && (
                              <div className="pl-6 flex items-center gap-3 my-4">
                                {(["Benar", "Salah"] as const).map((choice) => {
                                  const isSelected = studentAnswers[q.id] === choice;
                                  return (
                                    <button
                                      key={choice}
                                      type="button"
                                      onClick={() => handleSelectAnswer(q.id, choice)}
                                      className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer hover:bg-slate-50 ${
                                        isSelected
                                          ? choice === 'Benar'
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                            : 'bg-rose-50 border-rose-400 text-rose-800'
                                          : 'bg-white border-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {choice === 'Benar' ? '⭕ Benar' : '❌ Salah'}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* MENJODOHKAN (Interactive Matchmaking Drawer) */}
                            {q.type === 'Menjodohkan' && q.matchingPairs && (
                              <div className="my-4 pl-6 space-y-3 max-w-xl">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
                                  Pasangan Mencocokkan:
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Left elements column */}
                                  <div className="space-y-2">
                                    {q.matchingPairs.map((pair, pIdx) => (
                                      <div key={pIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <span className="block w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono">
                                          {pIdx + 1}
                                        </span>
                                        <span>{pair.left}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Right matching answer key targets */}
                                  <div className="space-y-2">
                                    {q.matchingPairs.map((pair, pIdx) => {
                                      const isRevealedObj = revealedAnswers[q.id];
                                      return (
                                        <div key={pIdx} className={`border border-dashed rounded-lg p-2.5 text-xs flex items-center justify-between font-bold ${
                                          isRevealedObj 
                                            ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800' 
                                            : 'bg-stone-50 border-stone-300 text-stone-500'
                                        }`}>
                                          <span>
                                            {isRevealedObj ? pair.right : "(Pasangkan di sini)"}
                                          </span>
                                          {isRevealedObj && (
                                            <span className="text-[10px] bg-fuchsia-100 text-fuchsia-800 px-1.5 py-0.5 rounded font-mono">
                                              Kunci {pIdx + 1}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ISIAN SINGKAT / ESSAY TEXT AREA (Interactive) */}
                            {['Isian Singkat', 'Uraian / Esai'].includes(q.type) && (
                              <div className="my-4 pl-6 max-w-xl">
                                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5 tracking-wider">
                                  Lembar Jawaban Siswa
                                </label>
                                {q.type === 'Isian Singkat' ? (
                                  <input
                                    type="text"
                                    value={studentAnswers[q.id] || ""}
                                    onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                                    placeholder="Tuliskan jawaban singkat Anda di sini..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-755 placeholder-slate-400 focus:outline-hidden"
                                  />
                                ) : (
                                  <textarea
                                    value={studentAnswers[q.id] || ""}
                                    onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                                    placeholder="Tuliskan uraian analisis atau jawaban esai lengkap Anda di sini..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-755 placeholder-slate-400 focus:outline-hidden"
                                    rows={3}
                                  />
                                )}
                              </div>
                            )}

                            {/* COLLAPSIBLE KUNCI & PEMBAHASAN ACCORDION BOX */}
                            {isAnswerRevealed && (
                              <div className="mt-4 bg-purple-55/65 rounded-2xl border border-purple-150 p-5 text-xs animate-show-explanation print:border-slate-350 print:bg-white print:p-0 print:border-none">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white">
                                    <Sparkles className="w-3 h-3 text-yellow-250" />
                                  </div>
                                  <span className="font-extrabold text-purple-900 tracking-wide">
                                    Kunci & Pembahasan Resmi Guru
                                  </span>
                                </div>

                                <div className="space-y-2 mt-2 font-medium text-slate-700 leading-relaxed">
                                  <div>
                                    <span className="font-extrabold text-purple-950 uppercase text-[10px] block mb-0.5 tracking-wider">Kunci Jawaban:</span>
                                    {q.type === 'PG Kompleks' && (q as any).correctAnswers ? (
                                      <div className="flex gap-1.5">
                                        {(q as any).correctAnswers.map((item: string) => (
                                          <span key={item} className="bg-purple-600 text-white font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="bg-purple-200 text-purple-950 px-2 py-0.5 rounded font-mono font-bold text-xs inline-block">
                                        {String(q.correctAnswer)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-purple-100/50">
                                    <span className="font-extrabold text-purple-950 uppercase text-[10px] block mb-0.5 tracking-wider">Pembahasan Rinci:</span>
                                    {isReplying ? (
                                      <textarea
                                        value={editExplanationText}
                                        onChange={(e) => setEditExplanationText(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-hidden"
                                        rows={3}
                                      />
                                    ) : (
                                      <p className="whitespace-pre-line text-purple-900 leading-relaxed italic">{q.explanation}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                    )}

                    {/* Printer specific footer indicator */}
                    <div className="hidden print:block border-t-2 border-slate-800 pt-3 mt-12 text-center text-[10px] font-bold text-slate-400">
                      Naskah Soal ini dihasilkan secara otomatis oleh SoalGen AI (Teknologi Kurikulum AI Adaptif Indonesia)
                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 2: HISTORY ARCHIVES VIEW */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm min-h-[500px]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Database className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Riwayat Generator Anda</h2>
                <p className="text-xs text-slate-400">Seluruh paket naskah soal yang pernah dihasilkan otomatis disimpan pada perangkat ini secara aman.</p>
              </div>
            </div>

            {savedPackages.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="text-4xl mb-3">📁</div>
                <h3 className="font-extrabold text-slate-700 text-sm">Belum Ada Riwayat Naskah</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Mulailah dengan mengatur instrumen dan buat soal pertama di tab Generator.</p>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs mt-6 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Mulai Buat Soal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => loadFromHistory(pkg)}
                    className="border border-slate-200 bg-white hover:border-violet-400 rounded-2xl p-5 shadow-3xs hover:shadow-2xs transition-all duration-200 text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                          {pkg.subject}
                        </span>
                        <span className="text-[10px] text-slate-450 font-semibold font-mono">{pkg.date}</span>
                      </div>

                      <h4 className="font-extrabold text-slate-800 text-xs tracking-tight line-clamp-2 leading-relaxed">
                        {pkg.topic}
                      </h4>

                      <p className="text-[10px] text-slate-400 font-bold mt-2">
                        Jumlah: {pkg.questions.length} Butir Soal Ujian
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50">
                      <span className="text-[10px] text-violet-600 font-extrabold flex items-center gap-1 group-hover:underline">
                        Buka Naskah <ChevronRight className="w-3 h-3" />
                      </span>

                      <button
                        onClick={(e) => deleteHistoryItem(pkg.id, e)}
                        className="text-slate-405 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                        title="Hapus naskah ini dari riwayat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-medium">
            &copy; 2026 <strong>SoalGen AI</strong>. Dirancang khusus untuk memajukan kualitas asesmen guru se-Indonesia.
          </p>
          <div className="flex gap-4 font-bold text-slate-400">
            <span className="hover:text-slate-600 transition-colors">Kurikulum Merdeka</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition-colors">AKM Mandiri</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition-colors">HOTS (Higher Order Thinking Skills)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
