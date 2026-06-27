let dataTransaksi = JSON.parse(localStorage.getItem('transaksi_pkl')) || [];  
let keteranganFavorit = JSON.parse(localStorage.getItem('ket_favorit_pkl')) || ["Jajan Siang", "Ongkos", "Gaji PKL"];  
let batasAnggaranHarian = parseInt(localStorage.getItem('anggaran_harian_pkl')) || 50000;  
let dataHutang = JSON.parse(localStorage.getItem('hutang_pkl')) || [];
let daftarTargetTabungan = JSON.parse(localStorage.getItem('goals_pkl')) || [];
let hutangPotonganBesok = parseInt(localStorage.getItem('potongan_besok_pkl')) || 0;

let modeFormAktif = 'biasa';
let jenisTerpilih = 'pemasukan';
let akumulasiPengeluaranHariIniGlobal = 0;

let tanggalHariIniObj = new Date();
let bulanAktifView = tanggalHariIniObj.getMonth();
let tahunAktifView = tanggalHariIniObj.getFullYear();
let tanggalTerpilihYMD = `${tahunAktifView}-${String(bulanAktifView + 1).padStart(2, '0')}-${String(tanggalHariIniObj.getDate()).padStart(2, '0')}`;

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  const btnMap = { 'dashboard': 'nav-dashboard', 'rekap-page': 'nav-rekap', 'riwayat': 'nav-riwayat', 'hutang-page': 'nav-hutang' };
  if(btnMap[pageId]) document.getElementById(btnMap[pageId]).classList.add('active');
}

function gantiModeForm(mode) {
  modeFormAktif = mode;
  document.getElementById('tab-mode-biasa').classList.toggle('tab-active', mode === 'biasa');
  document.getElementById('tab-mode-transfer').classList.toggle('tab-active', mode === 'transfer');
  document.getElementById('form-bagian-biasa').style.display = mode === 'biasa' ? 'block' : 'none';
  document.getElementById('form-bagian-transfer').style.display = mode === 'transfer' ? 'none' : 'block';
  document.getElementById('tag-bar-area').style.display = mode === 'biasa' ? 'flex' : 'none';
  document.getElementById('btn-submit-text').innerText = mode === 'biasa' ? 'Amankan Transaksi' : 'Eksekusi Transfer Uang';
  cekDeteksiAlarmBahaya();
}

function pilihJenis(jenis) {
  jenisTerpilih = jenis;
  document.getElementById('btn-masuk').classList.toggle('masuk-aktif', jenis === 'pemasukan');
  document.getElementById('btn-keluar').classList.toggle('keluar-active', jenis === 'pengeluaran');
  cekDeteksiAlarmBahaya();
}

function renderFavorit() {
  const container = document.getElementById('quick-tags-container');
  if (!container) return;
  container.innerHTML = '';
  keteranganFavorit.forEach((text, index) => {
    container.innerHTML += `
      <div class="tag-pill">  
        <button type="button" class="tag-click" onclick="document.getElementById('keterangan').value='${text}'">${text}</button>  
        <button type="button" class="tag-clear" onclick="hapusFavorit(${index})">×</button>  
      </div>  
    `;  
  });  
}  

function satsetSimpanFavorit() {
  const keteranganInput = document.getElementById('keterangan').value.trim();
  if (!keteranganInput) {
    alert("Isi dulu kolom keterangan barang/item-nya gan!");
    return;
  }
  if (!keteranganFavorit.includes(keteranganInput)) {
    keteranganFavorit.push(keteranganInput);
    localStorage.setItem('ket_favorit_pkl', JSON.stringify(keteranganFavorit));
    renderFavorit();
  } else {
    alert("Tag ini sudah terdaftar di daftar Tag Cepat gan!");
  }
}

function hapusFavorit(index) {
  keteranganFavorit.splice(index, 1);
  localStorage.setItem('ket_favorit_pkl', JSON.stringify(keteranganFavorit));
  renderFavorit();
}

function ubahBatasAnggaran() {
  let promptNilai = prompt("Masukkan batas maksimal pengeluaran HARIAN lo baru:", batasAnggaranHarian);
  if(promptNilai) {
    batasAnggaranHarian = parseInt(promptNilai) || 0;
    localStorage.setItem('anggaran_harian_pkl', batasAnggaranHarian);
    updateTampilan();
  }
}

function generateKalenderVisual() {
  const container = document.getElementById('calendar-dates');
  const labelBulan = document.getElementById('calendar-month-year');
  if(!container) return;
  container.innerHTML = '';
  
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  labelBulan.innerText = `${namaBulan[bulanAktifView]} ${tahunAktifView}`;
  
  let hariPertama = new Date(tahunAktifView, bulanAktifView, 1).getDay();
  let shiftHari = hariPertama === 0 ? 6 : hariPertama - 1; 
  let totalHari = new Date(tahunAktifView, bulanAktifView + 1, 0).getDate();
  
  for (let i = 0; i < shiftHari; i++) {
    container.innerHTML += `<div class="calendar-date-empty"></div>`;
  }
  
  let tglSkg = new Date();
  for (let d = 1; d <= totalHari; d++) {
    let loopYMD = `${tahunAktifView}-${String(bulanAktifView + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let kelasTambahan = '';
    if (d === tglSkg.getDate() && bulanAktifView === tglSkg.getMonth() && tahunAktifView === tglSkg.getFullYear()) {
      kelasTambahan += ' tanggal-hari-ini';
    }
    if (loopYMD === tanggalTerpilihYMD) {
      kelasTambahan += ' tanggal-terpilih';
    }
    container.innerHTML += `<div class="calendar-date-cell${kelasTambahan}" onclick="pilihTanggalKalender(${d})">${d}</div>`;
  }
}

function gantiBulanKalender(arah) {
  bulanAktifView += arah;
  if(bulanAktifView < 0) { bulanAktifView = 11; tahunAktifView--; }
  else if(bulanAktifView > 11) { bulanAktifView = 0; tahunAktifView++; }
  generateKalenderVisual();
}

function pilihTanggalKalender(tgl) {
  tanggalTerpilihYMD = `${tahunAktifView}-${String(bulanAktifView + 1).padStart(2, '0')}-${String(tgl).padStart(2, '0')}`;
  generateKalenderVisual();
  alert(`Tanggal bertugas dialihkan ke: ${tanggalTerpilihYMD}`);
}

function cekDeteksiAlarmBahaya() {
  const inputJumlah = parseInt(document.getElementById('jumlah').value) || 0;
  const msgEl = document.getElementById('panic-alert-msg');
  const formEl = document.getElementById('form-main-block');
  
  if (modeFormAktif === 'biasa' && jenisTerpilih === 'pengeluaran') {
    let sisaRealtimeHarian = (batasAnggaranHarian - hutangPotonganBesok) - akumulasiPengeluaranHariIniGlobal;
    if (inputJumlah > sisaRealtimeHarian && sisaRealtimeHarian > 0) {
      msgEl.style.display = 'block';
      formEl.classList.add('panic-mode');
    } else {
      msgEl.style.display = 'none';
      formEl.classList.remove('panic-mode');
    }
  } else {
    msgEl.style.display = 'none';
    formEl.classList.remove('panic-mode');
  }
}

function tambahTargetImpian() {
  const namaEl = document.getElementById('goalNama');
  const targetEl = document.getElementById('goalTarget');
  const nama = namaEl.value.trim();
  const target = parseInt(targetEl.value);

  if(!nama || isNaN(target) || target <= 0) {
    alert("Isi data impian & target dana benar gan!");
    return;
  }

  daftarTargetTabungan.push({ nama, target, terkumpul: 0 });
  localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
  namaEl.value = '';
  targetEl.value = '';
  updateTampilan();
}

function tabungKeGoal(idx) {
  const item = daftarTargetTabungan[idx];
  const sisaKebutuhan = item.target - item.terkumpul;

  if (sisaKebutuhan <= 0) {
    alert("Target impian ini udah lunas 100% gan!");
    return;
  }

  const inputNominal = prompt(`Mau nabung berapa buat [${item.nama}]? (Sisa butuh: Rp ${sisaKebutuhan.toLocaleString('id-ID')})`);
  if (!inputNominal) return;
  const nominal = parseInt(inputNominal);

  if(isNaN(nominal) || nominal <= 0) {
    alert("Salah nominal!");
    return;
  }
  if (nominal > sisaKebutuhan) {
    alert("Nominal kelebihan dari sisa target!");
    return;
  }

  const asalKantong = prompt("Ambil duit dari mana? Ketik kodenya:\n1 = Uang Tunai\n2 = Bank (ATM)\n3 = Dompet Elektronik");
  let slugDompet = '';
  if(asalKantong === '1') slugDompet = 'cash';
  else if(asalKantong === '2') slugDompet = 'bank';
  else if(asalKantong === '3') slugDompet = 'wallet';
  else {
    alert("Pilihan kantong tidak valid!");
    return;
  }

  const tglSkg = new Date();
  const formatYMD = `${tglSkg.getFullYear()}-${String(tglSkg.getMonth()+1).padStart(2,'0')}-${String(tglSkg.getDate()).padStart(2,'0')}`;

  dataTransaksi.push({
    tanggal: formatYMD,
    keterangan: `[Tujuan Nabung] ${item.nama}`,
    jenis: 'tabungan',
    jumlah: nominal,
    dompet: slugDompet
  });

  daftarTargetTabungan[idx].terkumpul += nominal;

  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
  updateTampilan();
}

function hapusGoal(idx) {
  if(confirm("Hapus target tabungan ini?")) {
    daftarTargetTabungan.splice(idx, 1);
    localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
    updateTampilan();
  }
}

function simpanHutangBaru(e) {
  e.preventDefault();
  const tipe = document.getElementById('hutang-tipe').value;
  const nama = document.getElementById('hutang-nama').value.trim();
  const ket = document.getElementById('hutang-ket').value.trim();
  const jumlah = parseInt(document.getElementById('hutang-jumlah').value);

  if (!nama || !ket || isNaN(jumlah) || jumlah <= 0) {
    alert("Mohon isi formulir data utang dengan lengkap!");
    return;
  }

  const tglSkg = new Date();
  const formatYMD = `${tglSkg.getFullYear()}-${String(tglSkg.getMonth()+1).padStart(2,'0')}-${String(tglSkg.getDate()).padStart(2,'0')}`;

  dataHutang.push({ id: Date.now(), tanggal: formatYMD, tipe, nama, ket, jumlah });
  localStorage.setItem('hutang_pkl', JSON.stringify(dataHutang));

  document.getElementById('hutangForm').reset();
  updateTampilan();
  alert("Dokumen transaksi hutang berhasil diamankan gan!");
}

function bayarAtauCicilHutang(id) {
  const idx = dataHutang.findIndex(h => h.id === id);
  if (idx === -1) return;
  const item = dataHutang[idx];

  const aksi = item.tipe === 'piutang' ? 'Diterima/Ditagih' : 'Dibayarkan';
  const inputNominal = prompt(`Masukkan jumlah nominal uang yang ${aksi} (Maksimal Rp ${item.jumlah.toLocaleString('id-ID')}):`);
  if (!inputNominal) return;

  const nominal = parseInt(inputNominal);
  if (isNaN(nominal) || nominal <= 0 || nominal > item.jumlah) {
    alert("Nominal pengisian tidak sah atau melebihi sisa beban hutang!");
    return;
  }

  const asalKantong = prompt("Pilih kantong penyesuaian saldo:\n1 = Uang Tunai\n2 = Bank\n3 = Dompet Elektronik");
  let slugDompet = '';
  if(asalKantong === '1') slugDompet = 'cash';
  else if(asalKantong === '2') slugDompet = 'bank';
  else if(asalKantong === '3') slugDompet = 'wallet';
  else {
    alert("Pilihan kantong tidak valid!");
    return;
  }

  const tglSkg = new Date();
  const formatYMD = `${tglSkg.getFullYear()}-${String(tglSkg.getMonth()+1).padStart(2,'0')}-${String(tglSkg.getDate()).padStart(2,'0')}`;

  const jenisKas = item.tipe === 'piutang' ? 'pemasukan' : 'pengeluaran';
  const labelKeterangan = item.tipe === 'piutang' ? `[Piutang Kembali] Dari ${item.nama} - ${item.ket}` : `[Bayar Hutang] Ke ${item.nama} - ${item.ket}`;

  dataTransaksi.push({
    tanggal: formatYMD,
    keterangan: labelKeterangan,
    jenis: jenisKas,
    jumlah: nominal,
    dompet: slugDompet
  });

  dataHutang[idx].jumlah -= nominal;
  if (dataHutang[idx].jumlah <= 0) {
    dataHutang.splice(idx, 1); 
    alert("Mantap! Beban tanggungan hutang ini sudah lunas sepenuhnya!");
  } else {
    alert(`Pembayaran berhasil dicatat. Sisa hutang: Rp ${dataHutang[idx].jumlah.toLocaleString('id-ID')}`);
  }

  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  localStorage.setItem('hutang_pkl', JSON.stringify(dataHutang));
  updateTampilan();
}

function hapusArsipHutang(id) {
  if (confirm("Hapus catatan hutang ini secara paksa? (Tidak akan mempengaruhi arus kas)")) {
    dataHutang = dataHutang.filter(h => h.id !== id);
    localStorage.setItem('hutang_pkl', JSON.stringify(dataHutang));
    updateTampilan();
  }
}

function simpanTransaksi(e) {
  e.preventDefault();
  const tanggal = tanggalTerpilihYMD;
  const keteranganInput = document.getElementById('keterangan').value.trim();
  const jumlah = parseInt(document.getElementById('jumlah').value);

  if (modeFormAktif === 'biasa') {
    const dompet = document.getElementById('dompet').value;

    if (jenisTerpilih === 'pengeluaran') {
      let sisaRealtimeHarian = (batasAnggaranHarian - hutangPotonganBesok) - akumulasiPengeluaranHariIniGlobal;
      if (jumlah > sisaRealtimeHarian) {
        let kelebihan = jumlah - sisaRealtimeHarian;
        let konfirmasiUang = confirm(
          `🚨 PERINGATAN MELEBIHI ANGGARAN! 🚨\n\n` +
          `Pengeluaran ini melebihi sisa anggaran harian lo sebesar Rp ${kelebihan.toLocaleString('id-ID')}.\n\n` +
          `Mau lanjut dengan konsekuensi MEMOTONG anggaran esok hari?\n` +
          `[OK] = Ya, Potong Anggaran Besok.\n` +
          `[Batal] = Gak Jadi (Batalkan Transaksi).`
        );

        if (konfirmasiUang) {
          hutangPotonganBesok += kelebihan;
          localStorage.setItem('potongan_besok_pkl', hutangPotonganBesok);
        } else {
          return;
        }
      }
    }
    dataTransaksi.push({ tanggal, keterangan: keteranganInput, jenis: jenisTerpilih, jumlah, dompet });
  } else {
    const dari = document.getElementById('transfer-dari').value;
    const ke = document.getElementById('transfer-ke').value;
    if (dari === ke) return alert("Kantong asal & tujuan gak boleh sama!");
    dataTransaksi.push({ tanggal, keterangan: `[Mutasi] Transfer internal`, jenis: 'transfer', jumlah, dari, ke });
  }

  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  document.getElementById('transaksiForm').reset();
  gantiModeForm('biasa');
  switchPage('dashboard');
  updateTampilan();
}

function hapusTransaksi(index) {
  if (confirm("Hapus transaksi ini?")) {
    const item = dataTransaksi[index];
    if (item.jenis === 'pengeluaran') {
      hutangPotonganBesok = 0;
      localStorage.setItem('potongan_besok_pkl', 0);
    }

    if (item.jenis === 'tabungan') {
      let namaTarget = item.keterangan.replace("[Tujuan Nabung] ", "");
      let tIdx = daftarTargetTabungan.findIndex(g => g.nama === namaTarget);
      if (tIdx !== -1) {
        daftarTargetTabungan[tIdx].terkumpul = Math.max(0, daftarTargetTabungan[tIdx].terkumpul - item.jumlah);
        localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
      }
    }

    dataTransaksi.splice(index, 1);
    localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
    updateTampilan();
  }
}

function dapetWarnaAcak(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let warna = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    value = Math.floor((value + 150) / 2);
    warna += ('00' + value.toString(16)).substr(-2);
  }
  return warna;
}

function bersihkanSemuaData() {
  if (confirm("Hapus total seluruh data aplikasi?")) {
    localStorage.clear();
    location.reload();
  }
}

function formatNamaDompet(slug) {
  return slug === 'bank' ? 'Bank' : slug === 'wallet' ? 'E-Wallet' : 'Tunai';
}

function updateTampilan() {
  let totalPemasukan = 0, totalPengeluaran = 0, totalKeluarBulanIni = 0;
  let saldoCash = 0, saldoBank = 0, saldoWallet = 0;
  let htmlRiwayat = '', htmlHarian = '', htmlMingguan = '', htmlTahunan = '';
  let subHarian = { masuk: 0, keluar: 0 }, subMingguan = { masuk: 0, keluar: 0 }, subBulanan = { masuk: 0, keluar: 0 };
  let groupPengeluaranBulanIni = {};

  const hariIni = new Date();
  const strHariIniYMD = `${hariIni.getFullYear()}-${String(hariIni.getMonth()+1).padStart(2,'0')}-${String(hariIni.getDate()).padStart(2,'0')}`;

  const tempHariIni = new Date();
  const awalMinggu = new Date(tempHariIni.setDate(tempHariIni.getDate() - tempHariIni.getDay() + (tempHariIni.getDay() === 0 ? -6 : 1)));
  awalMinggu.setHours(0,0,0,0);
  const resetHariIni = new Date();

  const searchVal = document.getElementById('filter-search') ? document.getElementById('filter-search').value.toLowerCase().trim() : '';
  const typeVal = document.getElementById('filter-type') ? document.getElementById('filter-type').value : 'semua';
  const dompetVal = document.getElementById('filter-dompet') ? document.getElementById('filter-dompet').value : 'semua';

  for (let i = 0; i < dataTransaksi.length; i++) {
    const item = dataTransaksi[i];
    const tglItem = new Date(item.tanggal);

    if (item.jenis === 'transfer') {
      if (item.dari === 'bank') saldoBank -= item.jumlah; else if (item.dari === 'wallet') saldoWallet -= item.jumlah; else saldoCash -= item.jumlah;
      if (item.ke === 'bank') saldoBank += item.jumlah; else if (item.ke === 'wallet') saldoWallet += item.jumlah; else saldoCash += item.jumlah;
    } else {
      const d = item.dompet || 'cash';
      if (item.jenis === 'pemasukan') {
        totalPemasukan += item.jumlah;
        if(d === 'bank') saldoBank += item.jumlah; else if(d === 'wallet') saldoWallet += item.jumlah; else saldoCash += item.jumlah;
      } else {
        totalPengeluaran += item.jumlah;
        if(d === 'bank') saldoBank -= item.jumlah; else if(d === 'wallet') saldoWallet -= item.jumlah; else saldoCash -= item.jumlah;
      }
    }

    let lolosSearch = item.keterangan.toLowerCase().includes(searchVal);
    let lolosType = (typeVal === 'semua') || (item.jenis === typeVal);
    let lolosDompet = (dompetVal === 'semua') || (item.jenis === 'transfer' ? (item.dari === dompetVal || item.ke === dompetVal) : ((item.dompet || 'cash') === dompetVal));

    if (lolosSearch && lolosType && lolosDompet) {
      let tdTipe = '';
      let tdJumlah = '';
      if (item.jenis === 'transfer') {
        tdTipe = `<span class="txt-transfer">Transfer</span> (${formatNamaDompet(item.dari)} ➔ ${formatNamaDompet(item.ke)})`;
        tdJumlah = `<span class="txt-transfer">Rp ${item.jumlah.toLocaleString('id-ID')}</span>`;
      } else if (item.jenis === 'tabungan') {
        tdTipe = `<span class="txt-tabungan">Tabungan</span> (${formatNamaDompet(item.dompet || 'cash')})`;
        tdJumlah = `<span class="txt-tabungan">Rp -${item.jumlah.toLocaleString('id-ID')}</span>`;
      } else {
        tdTipe = `<span class="${item.jenis === 'pemasukan' ? 'txt-masuk' : 'txt-keluar'}">${item.jenis === 'pemasukan' ? 'Masuk' : 'Keluar'}</span> (${formatNamaDompet(item.dompet || 'cash')})`;
        tdJumlah = `<span class="${item.jenis === 'pemasukan' ? 'txt-masuk' : 'txt-keluar'}">${item.jenis === 'pemasukan' ? 'Rp ' : 'Rp -'}${item.jumlah.toLocaleString('id-ID')}</span>`;
      }
      htmlRiwayat = `<tr><td>${item.tanggal}</td><td>${item.keterangan}</td><td>${tdTipe}</td><td>${tdJumlah}</td><td style="text-align:center;"><button class="btn-del-row" onclick="hapusTransaksi(${i})">X</button></td></tr>` + htmlRiwayat;
    }

    if (item.jenis !== 'transfer') {
      let classWarna = item.jenis === 'pemasukan' ? 'txt-masuk' : (item.jenis === 'tabungan' ? 'txt-tabungan' : 'txt-keluar');
      let simbol = item.jenis === 'pemasukan' ? 'Rp ' : 'Rp -';

      if (item.tanggal === strHariIniYMD) {
        htmlHarian += `<tr><td>${item.keterangan}</td><td class="${classWarna}">${simbol}${item.jumlah.toLocaleString('id-ID')}</td></tr>`;
        if (item.jenis === 'pemasukan') subHarian.masuk += item.jumlah;
        else if (item.jenis === 'pengeluaran') subHarian.keluar += item.jumlah;
      }
      if (tglItem >= awalMinggu && tglItem <= resetHariIni) {
        htmlMingguan += `<tr><td>${item.keterangan}</td><td class="${classWarna}">${simbol}${item.jumlah.toLocaleString('id-ID')}</td></tr>`;
        if (item.jenis === 'pemasukan') subMingguan.masuk += item.jumlah;
        else if (item.jenis === 'pengeluaran') subMingguan.keluar += item.jumlah;
      }
      if (tglItem.getMonth() === resetHariIni.getMonth() && tglItem.getFullYear() === resetHariIni.getFullYear()) {
        if (item.jenis === 'pemasukan') subBulanan.masuk += item.jumlah;
        else subBulanan.keluar += item.jumlah;

        if (item.jenis === 'pengeluaran') {
          totalKeluarBulanIni += item.jumlah;
          let key = item.keterangan.toLowerCase().trim();
          if (!groupPengeluaranBulanIni[key]) groupPengeluaranBulanIni[key] = { nama: item.keterangan, total: 0 };
          groupPengeluaranBulanIni[key].total += item.jumlah;
        }
      }
      if (tglItem.getFullYear() === resetHariIni.getFullYear()) {
        if (item.jenis === 'pemasukan') htmlTahunan += `<tr><td>${item.keterangan}</td><td class="txt-masuk">Rp ${item.jumlah.toLocaleString('id-ID')}</td></tr>`;
        else htmlTahunan += `<tr><td>${item.keterangan}</td><td class="txt-keluar">Rp -${item.jumlah.toLocaleString('id-ID')}</td></tr>`;
      }
    }
  }

  document.getElementById('saldo-box').innerText = `Rp ${(saldoCash + saldoBank + saldoWallet).toLocaleString('id-ID')}`;
  document.getElementById('masuk-box').innerText = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
  document.getElementById('keluar-box').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
  document.getElementById('wallet-cash-box').innerText = `Rp ${saldoCash.toLocaleString('id-ID')}`;
  document.getElementById('wallet-bank-box').innerText = `Rp ${saldoBank.toLocaleString('id-ID')}`;
  document.getElementById('wallet-wallet-box').innerText = `Rp ${saldoWallet.toLocaleString('id-ID')}`;

  acumulasiPengeluaranHariIniGlobal = subHarian.keluar;
  let sisaAnggaranHarian = (batasAnggaranHarian - hutangPotonganBesok) - subHarian.keluar;
  let totalBebanHarian = subHarian.keluar + hutangPotonganBesok;
  let persenBudget = Math.min((totalBebanHarian / batasAnggaranHarian) * 100, 100);

  document.getElementById('budget-box').innerText = `Rp ${sisaAnggaranHarian.toLocaleString('id-ID')}`;
  document.getElementById('budget-bar').style.width = `${persenBudget}%`;
  document.getElementById('budget-box').style.color = sisaAnggaranHarian < 0 ? '#ee3333' : (persenBudget >= 80 ? '#ff9900' : '#00aa66');
  document.getElementById('budget-bar').style.backgroundColor = persenBudget >= 80 ? '#ee3333' : '#00aa66';

  const infoPotongan = document.getElementById('info-potongan-besok');
  if (hutangPotonganBesok > 0) {
    infoPotongan.style.display = 'block';
    infoPotongan.innerText = `⚠ Anggaran hari ini terpotong Rp ${hutangPotonganBesok.toLocaleString('id-ID')} akibat over-budget kemarin.`;
  } else {
    infoPotongan.style.display = 'none';
  }

  if (document.getElementById('tabel-body')) {
    document.getElementById('tabel-body').innerHTML = htmlRiwayat || '<tr><td colspan="5" style="text-align:center;color:#999;">Kosong</td></tr>';
  }

  if(document.getElementById('tabel-rekap-bersih-body')) {
    document.getElementById('tabel-rekap-bersih-body').innerHTML = `
      <tr><td>Akumulasi Siklus Hari Ini (Belanja)</td><td class="${subHarian.masuk >= subHarian.keluar ? 'txt-masuk':'txt-keluar'}">${subHarian.masuk >= subHarian.keluar ? '+':'-'} Rp ${Math.abs(subHarian.masuk - subHarian.keluar).toLocaleString('id-ID')}</td></tr>  
      <tr><td>Akumulasi Siklus Minggu Ini (Belanja)</td><td class="${subMingguan.masuk >= subMingguan.keluar ? 'txt-masuk':'txt-keluar'}">${subMingguan.masuk >= subMingguan.keluar ? '+':'-'} Rp ${Math.abs(subMingguan.masuk - subMingguan.keluar).toLocaleString('id-ID')}</td></tr>  
      <tr><td>Akumulasi Siklus Bulan Ini (Total)</td><td class="${subBulanan.masuk >= subBulanan.keluar ? 'txt-masuk':'txt-keluar'}">${subBulanan.masuk >= subBulanan.keluar ? '+':'-'} Rp ${Math.abs(subBulanan.masuk - subBulanan.keluar).toLocaleString('id-ID')}</td></tr>  
    `;  
  }

  const goalsContainer = document.getElementById('goals-container');
  if (goalsContainer) {
    goalsContainer.innerHTML = daftarTargetTabungan.length === 0 ? '<div style="text-align:center;color:#999;padding:10px;font-size:11px;">Belum ada impian.</div>' : '';
    daftarTargetTabungan.forEach((item, idx) => {
      const persenGoal = Math.min(Math.round((item.terkumpul / item.target) * 100), 100);
      goalsContainer.innerHTML += `
        <div class="goal-card-item">  
          <div class="goal-meta"><span>🎯 ${item.nama}</span><span style="color:#0066cc;">${persenGoal}%</span></div>  
          <div class="bar-track" style="height:4px; margin-bottom:4px;"><div class="bar-fill" style="width:${persenGoal}%; background-color:#0066cc;"></div></div>  
          <div class="goal-actions">  
            <span style="font-size:10px; color:#666;">Rp ${item.terkumpul.toLocaleString('id-ID')} / ${item.target.toLocaleString('id-ID')}</span>  
            <div>  
              <button type="button" class="btn-goal-add" onclick="tabungKeGoal(${idx})">+ Tabung</button>  
              <button type="button" class="btn-del-row" style="padding:1px 4px; font-size:9px; margin-left:2px;" onclick="hapusGoal(${idx})">×</button>  
            </div>  
          </div>  
        </div>  
      `;  
    });  
  }

  let sumPiutang = 0;
  let sumHutang = 0;
  let htmlHutangRows = '';

  dataHutang.forEach((item) => {
    if (item.tipe === 'piutang') sumPiutang += item.jumlah;
    else sumHutang += item.jumlah;

    let labelStatus = item.tipe === 'piutang' ? '<span class="badge-hutang piutang">Menagih</span>' : '<span class="badge-hutang hutang">Membayar</span>';
    let txtAksi = item.tipe === 'piutang' ? '💰 Ambil Tagihan' : '💸 Angsur/Bayar';

    htmlHutangRows += `
      <tr>  
        <td>${item.tanggal}</td>  
        <td><strong>${item.nama}</strong></td>  
        <td>${labelStatus}</td>  
        <td>${item.ket}</td>  
        <td><strong>Rp ${item.jumlah.toLocaleString('id-ID')}</strong></td>  
        <td>  
          <button class="btn-action-hutang" onclick="bayarAtauCicilHutang(${item.id})">${txtAksi}</button>  
          <button class="btn-del-row" onclick="hapusArsipHutang(${item.id})">×</button>  
        </td>  
      </tr>  
    `;  
  });

  if (document.getElementById('total-piutang-box')) document.getElementById('total-piutang-box').innerText = `Rp ${sumPiutang.toLocaleString('id-ID')}`;
  if (document.getElementById('total-hutang-box')) document.getElementById('total-hutang-box').innerText = `Rp ${sumHutang.toLocaleString('id-ID')}`;
  if (document.getElementById('tabel-hutang-body')) {
    document.getElementById('tabel-hutang-body').innerHTML = htmlHutangRows || '<tr><td colspan="6" style="text-align:center;color:#999;padding:15px;">Mantap gan! Bersih... Gak ada beban hutang-piutang aktif!</td></tr>';
  }

  if(document.getElementById('tabel-harian')) document.getElementById('tabel-harian').innerHTML = htmlHarian || '<tr><td colspan="2" style="text-align:center;color:#999;padding:5px;">Kosong</td></tr>';
  if(document.getElementById('tabel-mingguan')) document.getElementById('tabel-mingguan').innerHTML = htmlMingguan || '<tr><td colspan="2" style="text-align:center;color:#999;padding:5px;">Kosong</td></tr>';
  if(document.getElementById('tabel-tahunan')) document.getElementById('tabel-tahunan').innerHTML = htmlTahunan || '<tr><td colspan="2" style="text-align:center;color:#999;padding:5px;">Kosong</td></tr>';

  const alokasiContainer = document.getElementById('alokasi-container');
  const chartContainer = document.getElementById('chart-container');

  if (alokasiContainer && chartContainer) {
    alokasiContainer.innerHTML = '';
    chartContainer.innerHTML = '';

    if (totalKeluarBulanIni === 0) {
      alokasiContainer.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">Belum ada data pengeluaran bulan ini.</div>';
      chartContainer.innerHTML = '<div style="margin:auto;color:#999;">Kosong</div>';
    } else {
      let maxTotal = 0;
      for (let k in groupPengeluaranBulanIni) {
        if (groupPengeluaranBulanIni[k].total > maxTotal) maxTotal = groupPengeluaranBulanIni[k].total;
      }
      for (let k in groupPengeluaranBulanIni) {
        let g = groupPengeluaranBulanIni[k];
        let p = (g.total / totalKeluarBulanIni) * 100;
        let h = (g.total / maxTotal) * 100;
        let warna = dapetWarnaAcak(g.nama);

        alokasiContainer.innerHTML += `
          <div class="alokasi-row">  
            <div class="alokasi-labels">  
              <span>📌 ${g.nama}</span>  
              <span style="color:#ee3333;">Rp ${g.total.toLocaleString('id-ID')} (${p.toFixed(1)}%)</span>  
            </div>  
            <div class="bar-track">  
              <div class="bar-fill" style="width:${p}%;background-color:${warna};"></div>  
            </div>  
          </div>`;

        let sv = g.total >= 1000000 ? (g.total/1000000).toFixed(1)+'M' : g.total >= 1000 ? (g.total/1000).toFixed(0)+'k' : g.total;
        chartContainer.innerHTML += `
          <div class="chart-column">  
            <div class="column-fill" style="height:${h}%;background-color:${warna};">  
              <span class="column-pop-val">${sv}</span>  
            </div>  
            <span class="column-title" title="${g.nama}">${g.nama}</span>  
          </div>`;  
      }  
    }  
  }  
  cekDeteksiAlarmBahaya();
}  

window.onload = function() {
  generateKalenderVisual();
  renderFavorit();
  updateTampilan();
};
