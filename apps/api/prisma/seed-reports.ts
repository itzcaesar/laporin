// Seed report definitions mapped to seed_photo directories
import type { Priority } from '@prisma/client'

export type SeedReport = {
  title: string
  desc: string
  catId: number
  lat: number
  lng: number
  addr: string
  status: 'new' | 'verified' | 'in_progress' | 'completed' | 'verified_complete'
  priority: Priority
  daysAgo: number
  photoDir: string
  photos: string[]
  citizenComments: string[]
  govComments: string[]
  reporterIdx: number
  aiDanger: number
  aiPriority: number
  aiBudget: number
  aiHoax: number
  aiImpact: string
}

export const SEED_REPORTS: SeedReport[] = [
  // ── Jalan Rusak (cat 1) ──
  {
    title: 'Jalan Berlubang Parah di Jl. Cihampelas',
    desc: 'Terdapat lubang besar berdiameter kurang lebih 80cm dengan kedalaman sekitar 20cm di badan jalan utama Jl. Cihampelas, tepat di depan pertokoan. Lubang ini sudah terisi air hujan sehingga sulit terlihat oleh pengendara motor. Dalam seminggu terakhir, setidaknya 3 pengendara motor terjatuh akibat menabrak lubang ini. Kondisi semakin parah karena aspal di sekitar lubang mulai retak dan terkelupas.',
    catId: 1, lat: -6.8936, lng: 107.6037, addr: 'Jl. Cihampelas No. 120, Cipaganti, Bandung',
    status: 'in_progress', priority: 'urgent', daysAgo: 7,
    photoDir: 'Jalan rusak',
    photos: ['jalan-berlubang.jpg', 'Jalan-berlubang (1).jpg', 'jV41q.jpg'],
    citizenComments: [
      'Sudah 2 minggu lubang ini dibiarkan. Kemarin malam ada ibu-ibu jatuh dari motor karena tidak terlihat. Tolong segera ditambal!',
      'Saya warga RT 05 di sekitar sini. Setiap hujan, lubang ini tergenang dan tidak kelihatan. Sangat berbahaya untuk pengendara.',
    ],
    govComments: [
      'Terima kasih atas laporannya. Tim Dinas PU Bina Marga sudah melakukan survei lokasi pada tanggal 22 April 2026. Perbaikan dijadwalkan menggunakan metode patching hotmix.',
      'Update: Material hotmix sudah disiapkan. Pengerjaan akan dilakukan pada hari Sabtu pagi untuk meminimalkan gangguan lalu lintas.',
    ],
    reporterIdx: 0, aiDanger: 4, aiPriority: 82, aiBudget: 15000000, aiHoax: 3,
    aiImpact: 'Lubang jalan di kawasan komersial padat ini berdampak pada keselamatan sekitar 5.000 pengendara per hari dan berpotensi menyebabkan kecelakaan serius.',
  },
  {
    title: 'Aspal Terkelupas Sepanjang 50 Meter di Jl. Dago',
    desc: 'Permukaan aspal di ruas Jl. Ir. H. Juanda (Dago) sepanjang kurang lebih 50 meter terkelupas hingga terlihat lapisan batu kerikil di bawahnya. Kondisi ini membuat kendaraan roda dua sangat rawan tergelincir terutama saat hujan. Beberapa pengendara terpaksa menggunakan jalur lawan arah untuk menghindari area rusak, menimbulkan risiko kecelakaan frontal.',
    catId: 1, lat: -6.8852, lng: 107.6168, addr: 'Jl. Ir. H. Juanda No. 75, Dago, Bandung',
    status: 'verified', priority: 'high', daysAgo: 4,
    photoDir: 'Jalan rusak',
    photos: ['0215_095937_f8f0_inilah_com_70252511f7.jpg', '1739251119_Jalan Berlubang.jpg'],
    citizenComments: [
      'Jalan Dago ini jalur wisata utama Bandung, memalukan kalau dibiarkan rusak begini. Wisatawan pasti kecewa melihat kondisi seperti ini.',
    ],
    govComments: [],
    reporterIdx: 1, aiDanger: 4, aiPriority: 72, aiBudget: 45000000, aiHoax: 2,
    aiImpact: 'Kerusakan jalan di koridor wisata utama berdampak pada citra kota dan keselamatan ribuan wisatawan yang berkunjung setiap akhir pekan.',
  },
  // ── Halte Kumuh (cat 2) ──
  {
    title: 'Halte Bus Vandalisme Parah di Jl. Soekarno-Hatta',
    desc: 'Halte bus di Jl. Soekarno-Hatta depan Komplek Perumahan dipenuhi coretan vandalisme pada seluruh permukaan kaca. Pintu halte rusak dan engselnya lepas, bangku penumpang patah, serta papan informasi rute sudah tidak terbaca. Halte ini juga dijadikan tempat tidur oleh tunawisma di malam hari sehingga kondisinya kumuh dan berbau tidak sedap. Lampu penerangan di dalam halte sudah mati total.',
    catId: 2, lat: -6.9308, lng: 107.5746, addr: 'Halte Jl. Soekarno-Hatta KM 5, Bandung',
    status: 'verified', priority: 'medium', daysAgo: 10,
    photoDir: 'Halte kumuh',
    photos: ['halte-bus-di-jalan-soekarno-hatta-bandung-rusak_169.jpeg', 'ang-halter-A-Yani-rusak-6JPG-3129201585.jpg', '647616b9297e4.jpg'],
    citizenComments: [
      'Halte ini sudah tidak layak pakai. Saya pengguna bus setiap hari dan terpaksa menunggu di pinggir jalan karena halte kotor dan berbau. Kasihan ibu-ibu yang harus berdiri di terik matahari.',
      'Kaca halte penuh coretan, bangku patah, lampu mati. Kapan diperbaiki? Kami bayar pajak untuk fasilitas publik yang layak.',
    ],
    govComments: [
      'Laporan diterima dan sudah diteruskan ke Dinas Perhubungan Kota Bandung. Akan dilakukan pendataan kondisi seluruh halte di koridor Soekarno-Hatta dalam 2 minggu ke depan.',
    ],
    reporterIdx: 2, aiDanger: 3, aiPriority: 55, aiBudget: 25000000, aiHoax: 5,
    aiImpact: 'Halte kumuh di jalan protokol menurunkan kualitas layanan transportasi publik dan kenyamanan sekitar 800 penumpang bus per hari.',
  },
  // ── Trotoar Rusak (cat 5) ──
  {
    title: 'Trotoar Rusak Parah di Jl. Gatot Subroto',
    desc: 'Kondisi trotoar di sepanjang Jl. Gatot Subroto mulai dari persimpangan Jl. PHH Mustofa hingga Jl. Surapati mengalami kerusakan parah. Paving block terangkat dan pecah akibat akar pohon besar yang tumbuh di bawahnya. Guiding block untuk penyandang disabilitas sudah hilang di beberapa titik. Pejalan kaki, termasuk anak-anak sekolah, terpaksa berjalan di badan jalan karena trotoar tidak bisa dilalui.',
    catId: 5, lat: -6.9090, lng: 107.5990, addr: 'Jl. Gatot Subroto, Bandung',
    status: 'in_progress', priority: 'medium', daysAgo: 15,
    photoDir: 'trotoar rusak',
    photos: ['kondisi-trotoar-rusak-di-bandung_169.jpeg', 'F-TROTOAR-c3-2-edit-3794061593.jpg', '5d95d3abf7be50a4c647ed4e0d711ba9.jpg'],
    citizenComments: [
      'Trotoar ini sudah bertahun-tahun rusak. Anak saya harus berjalan di pinggir jalan setiap berangkat sekolah. Sangat berbahaya karena kendaraan lewat sangat cepat.',
      'Saya pengguna kursi roda dan sama sekali tidak bisa melewati trotoar ini. Guiding block juga sudah hilang semua. Tolong perhatikan hak penyandang disabilitas.',
    ],
    govComments: [
      'Tim Dinas PU Cipta Karya sudah melakukan survei lapangan. Perbaikan trotoar di Jl. Gatot Subroto masuk dalam program Penataan Trotoar Ramah Disabilitas TA 2026.',
      'Progress: Pekerjaan pembongkaran paving lama sudah dimulai pada segmen pertama (200m). Estimasi penyelesaian seluruh segmen: 45 hari kerja.',
    ],
    reporterIdx: 3, aiDanger: 3, aiPriority: 58, aiBudget: 120000000, aiHoax: 2,
    aiImpact: 'Kerusakan trotoar di jalan utama berdampak pada aksesibilitas pejalan kaki dan penyandang disabilitas, serta meningkatkan risiko kecelakaan pejalan kaki.',
  },
  // ── JPO Rusak (cat 8) ──
  {
    title: 'JPO Berkarat dan Lantai Berlubang di Jl. Soekarno-Hatta',
    desc: 'Jembatan Penyeberangan Orang (JPO) di depan Terminal Leuwipanjang dalam kondisi sangat memprihatinkan. Struktur besi penopang berkarat parah, lantai berlubang di beberapa titik hingga terlihat jalan di bawahnya. Pegangan tangga goyang dan beberapa sudah lepas. Meskipun berbahaya, JPO ini masih ramai digunakan oleh pejalan kaki karena merupakan satu-satunya akses penyeberangan di area tersebut.',
    catId: 8, lat: -6.9480, lng: 107.5920, addr: 'JPO Terminal Leuwipanjang, Jl. Soekarno-Hatta, Bandung',
    status: 'completed', priority: 'urgent', daysAgo: 21,
    photoDir: 'JPO rusak',
    photos: ['JPO-Rusak-Di-Kediri-290719-pf-2.jpg', '393380_650.jpg', 'jpo-rusak-gihl-dom.jpg'],
    citizenComments: [
      'JPO ini mengerikan! Lantainya berlubang, besinya karatan. Tapi mau tidak mau harus lewat sini karena tidak ada zebra cross. Nyawa kami seperti tidak dihargai.',
      'Alhamdulillah sudah diperbaiki. Sekarang aman dan bersih. Terima kasih Dinas PU! Semoga rutin dirawat.',
    ],
    govComments: [
      'Perbaikan struktural JPO Terminal Leuwipanjang telah selesai dilaksanakan. Meliputi penggantian plat lantai, pengecatan anti-karat, dan pemasangan pegangan tangga baru.',
    ],
    reporterIdx: 0, aiDanger: 5, aiPriority: 90, aiBudget: 250000000, aiHoax: 1,
    aiImpact: 'JPO rusak berat di depan terminal bus utama mengancam keselamatan ribuan pejalan kaki per hari dan berpotensi menyebabkan korban jiwa.',
  },
  // ── Kabel Semrawut (cat 9) ──
  {
    title: 'Kabel Semrawut Berbahaya di Jl. Mampang',
    desc: 'Tiang listrik di perempatan Jl. Mampang dipenuhi gulungan kabel yang sangat semrawut dari berbagai provider telekomunikasi dan PLN. Beberapa kabel menjuntai rendah hingga hampir menyentuh atap truk yang lewat. Terdapat juga kabel yang sudah terkelupas isolasinya dan dibiarkan menggantung. Saat hujan, warga sekitar khawatir terjadi korsleting yang membahayakan.',
    catId: 9, lat: -6.9200, lng: 107.6050, addr: 'Perempatan Jl. Mampang, Bandung',
    status: 'new', priority: 'medium', daysAgo: 2,
    photoDir: 'Kabel semraut',
    photos: ['kabel-semrawut-di-mampang-belum-juga-diturunkan_169.jpeg', '8b29b76767e8a59026f647867d4d0f5e.jpg'],
    citizenComments: [
      'Kabel-kabel ini sudah bertahun-tahun dibiarkan semrawut. Siapa yang bertanggung jawab? PLN? Telkom? Provider internet? Tidak ada yang mau mengurus.',
    ],
    govComments: [],
    reporterIdx: 1, aiDanger: 3, aiPriority: 48, aiBudget: 35000000, aiHoax: 4,
    aiImpact: 'Kabel semrawut di area permukiman padat meningkatkan risiko kebakaran dan sengatan listrik, terutama saat musim hujan.',
  },
  // ── Saluran Air Rusak (cat 11) ──
  {
    title: 'Saluran Drainase Rusak dan Tersumbat di Jl. Kiaracondong',
    desc: 'Saluran drainase sepanjang 100 meter di Jl. Kiaracondong mengalami kerusakan berat. Dinding beton saluran retak dan ambles di beberapa titik. Saluran dipenuhi sampah plastik dan lumpur sehingga aliran air tersumbat total. Setiap hujan, air meluap ke jalan dan masuk ke rumah-rumah warga di RT 03 dan RT 04. Genangan bisa mencapai 40cm dan baru surut setelah 6-8 jam.',
    catId: 11, lat: -6.9280, lng: 107.6450, addr: 'Jl. Kiaracondong No. 55, Bandung',
    status: 'verified_complete', priority: 'high', daysAgo: 30,
    photoDir: 'saluran air rusak',
    photos: ['images.jpg', 'images (1).jpg', 'img-20221213-wa0004.jpg'],
    citizenComments: [
      'Setiap hujan deras rumah saya kebanjiran karena drainase ini tersumbat. Sudah lapor ke RT dan kelurahan tapi tidak ada tindakan.',
      'Alhamdulillah drainase sudah dibersihkan dan diperbaiki. Kemarin hujan deras tapi tidak banjir lagi. Terima kasih Pemkot Bandung!',
    ],
    govComments: [
      'Tim Dinas PU Pengairan telah menyelesaikan normalisasi saluran drainase di Jl. Kiaracondong. Pekerjaan meliputi pengerukan lumpur, perbaikan dinding beton, dan pemasangan trash screen.',
    ],
    reporterIdx: 2, aiDanger: 4, aiPriority: 75, aiBudget: 85000000, aiHoax: 2,
    aiImpact: 'Drainase tersumbat menyebabkan banjir berulang yang berdampak pada sekitar 120 KK dan mengancam kesehatan warga akibat genangan air kotor.',
  },
  // ── Jembatan Umum Rusak (cat 12) ──
  {
    title: 'Jembatan Gantung Rusak Berat di Kampung Ciburuy',
    desc: 'Jembatan gantung penghubung Kampung Ciburuy dengan Desa Ciwidey dalam kondisi sangat berbahaya. Papan lantai kayu banyak yang lapuk dan berlubang, tali baja penopang sudah berkarat dan beberapa helai putus. Meskipun demikian, jembatan ini masih digunakan oleh anak-anak sekolah setiap hari karena merupakan satu-satunya akses menyeberangi sungai. Warga sudah memasang pagar bambu darurat sebagai pengaman.',
    catId: 12, lat: -7.0450, lng: 107.3980, addr: 'Jembatan Gantung Kampung Ciburuy, Ciwidey, Bandung',
    status: 'in_progress', priority: 'urgent', daysAgo: 12,
    photoDir: 'jembatan umum rusak',
    photos: ['20120120lebak64.jpg', 'images.jpg', 'images (1).jpg'],
    citizenComments: [
      'Ini jembatan satu-satunya untuk anak-anak kami pergi sekolah. Setiap hari kami was-was. Sudah bertahun-tahun minta perbaikan tapi tidak digubris.',
      'Mohon prioritaskan perbaikan jembatan ini. Nyawa anak-anak kami yang jadi taruhannya. Kalau jembatan ambruk, anak-anak harus jalan memutar 5km.',
    ],
    govComments: [
      'Dinas PU Bina Marga telah mengalokasikan anggaran darurat untuk pembangunan kembali jembatan ini. Tim konstruksi sudah mulai membangun pondasi jembatan pengganti.',
    ],
    reporterIdx: 3, aiDanger: 5, aiPriority: 95, aiBudget: 500000000, aiHoax: 1,
    aiImpact: 'Jembatan rusak berat mengancam keselamatan puluhan anak sekolah yang melintas setiap hari dan mengisolasi akses warga ke fasilitas publik.',
  },
  // ── Sampah Berantakan (cat 14) ──
  {
    title: 'TPS Liar Menumpuk di Dekat Pasar Kosambi',
    desc: 'Lahan kosong di samping Pasar Kosambi telah berubah menjadi TPS liar yang menampung sampah dari pedagang pasar dan warga sekitar. Tumpukan sampah sudah setinggi 2 meter dan menyebar ke badan jalan. Bau sangat menyengat terutama saat siang hari. Lalat dan tikus berkeliaran di sekitar tumpukan. Petugas kebersihan dari DLH hanya mengangkut sebagian kecil, sementara volume sampah baru yang masuk jauh lebih besar.',
    catId: 14, lat: -6.9190, lng: 107.5990, addr: 'Samping Pasar Kosambi, Jl. Ahmad Yani, Bandung',
    status: 'in_progress', priority: 'high', daysAgo: 5,
    photoDir: 'Sampah berantakan',
    photos: ['viral-tumpukan-sampah-berserakan-di-pasar-rubuh-tangerang-ini-kata-walkot_169.jpeg', 'd283cb9dfa2052825775353d56952fa5.jpg', 'IMG-20210806-WA0003.jpg'],
    citizenComments: [
      'Bau sampah ini sudah tidak tertahankan! Anak-anak di sekitar sini banyak yang sakit diare dan ISPA. Kapan masalah sampah ini selesai?',
      'Setiap hari truk sampah datang tapi cuma angkut sedikit. Yang buang sampah baru malah lebih banyak. Perlu ada tindakan tegas!',
    ],
    govComments: [
      'Dinas Lingkungan Hidup sudah menerjunkan 2 armada truk tambahan untuk pengangkutan. Kami juga sedang berkoordinasi dengan Satpol PP untuk penertiban pembuang sampah liar.',
    ],
    reporterIdx: 0, aiDanger: 4, aiPriority: 70, aiBudget: 30000000, aiHoax: 3,
    aiImpact: 'TPS liar di dekat pasar berdampak pada kesehatan masyarakat sekitar dan mencemari lingkungan, berpotensi menjadi sumber penyakit.',
  },
  // ── Penutup Saluran Hilang (cat 11) ──
  {
    title: 'Penutup Saluran Hilang di Jl. Wastukencana',
    desc: 'Penutup saluran drainase (manhole cover) di trotoar Jl. Wastukencana hilang di 3 titik berbeda sepanjang 200 meter. Lubang saluran yang terbuka berukuran sekitar 40x40cm dengan kedalaman lebih dari 1 meter. Tidak ada tanda peringatan atau pembatas di sekitar lubang. Pada malam hari, lubang ini sangat berbahaya karena tidak terlihat. Seorang pejalan kaki dilaporkan terperosok minggu lalu dan mengalami cedera kaki.',
    catId: 11, lat: -6.9080, lng: 107.6070, addr: 'Jl. Wastukencana, Bandung',
    status: 'completed', priority: 'high', daysAgo: 18,
    photoDir: 'penutup saluran hilang',
    photos: ['IMG-20260113-WA0016_copy_1330x997.jpg', '64a296f58edcf.jpg', 'images.jpg'],
    citizenComments: [
      'Tetangga saya terperosok ke lubang ini malam Jumat kemarin. Kakinya terkilir parah dan harus ke IGD. Lubang terbuka tanpa penutup sangat berbahaya!',
      'Penutup saluran sudah dipasang kembali. Terima kasih atas respon cepatnya. Semoga tidak hilang lagi, mungkin perlu dipasang yang anti-maling.',
    ],
    govComments: [
      'Pemasangan penutup saluran baru sudah selesai dilaksanakan di 3 titik. Menggunakan material besi cor dengan sistem pengunci untuk mencegah pencurian.',
    ],
    reporterIdx: 1, aiDanger: 4, aiPriority: 78, aiBudget: 12000000, aiHoax: 2,
    aiImpact: 'Lubang saluran terbuka di trotoar kawasan bisnis mengancam keselamatan pejalan kaki dan berpotensi menyebabkan cedera serius.',
  },
]
