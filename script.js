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
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('rekap-page').style.display = 'none';
  document.getElementById('riwayat').style.display = 'none';
  document.getElementById('hutang-page').style.display = 'none';
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = 'block';
    targetPage.classList.add('active');
  }
  
  const btnMap = { 'dashboard': 'nav-dashboard', 'rekap-page': 'nav-rekap', 'riwayat': 'nav-riwayat', 'hutang-page': 'nav-hutang' };
  if(btnMap[pageId] && document.getElementById(btnMap[pageId])) {
    document.getElementById(btnMap[pageId]).classList.add('active');
  }
  updateTampilan();
}

function gantiModeForm(mode) {
  modeFormAktif = mode;
  document.getElementById('tab-mode-biasa').classList.toggle('tab-active', mode === 'biasa');
  document.getElementById('tab-mode-transfer').classList.toggle('tab-active', mode === 'transfer');
  document.getElementById('form-bagian-biasa').style.display = mode === 'biasa' ? 'block' : 'none';
  document.getElementById('form-bagian-transfer').style.display = mode === 'transfer' ? 'block' : 'none';
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
      <div class="tag-pill" style="display:inline-flex; background:#eee; padding:4px 8px; border-radius:20px; font-size:12px; margin-right:5px; margin-bottom:5px;">  
        <button type="button" class="tag-click" style="border:none; background:none; cursor:pointer;" onclick="document.getElementById('keterangan').value='${text}'">${text}</button>  
        <button type="button" class="tag-clear" style="border:none; background:none; color:red; margin-left:5px; font-weight:bold; cursor:pointer;" onclick="hapusFavorit(${index})">×</button>  
      </div>`;  
  });  
}  

function satsetSimpanFavorit() {
  const keteranganInput = document.getElementById('keterangan').value.trim();
  if (!keteranganInput) return alert("Isi dulu kolom keterangan barang!");
  if (!keteranganFavorit.includes(keteranganInput)) {
    keteranganFavorit.push(keteranganInput);
    localStorage.setItem('ket_favorit_pkl', JSON.stringify(keteranganFavorit));
    renderFavorit();
  }
}

function hapusFavorit(index) {
  keteranganFavorit.splice(index, 1);
  localStorage.setItem('ket_favorit_pkl', JSON.stringify(keteranganFavorit));
  renderFavorit();
}

function ubahBatasAnggaran() {
  let promptNilai = prompt("Masukkan batas maksimal pengeluaran HARIAN baru:", batasAnggaranHarian);
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
  
  for (let i = 0; i < shiftHari; i++) container.innerHTML += `<div class="calendar-date-empty"></div>`;
  
  let tglSkg = new Date();
  for (let d = 1; d <= totalHari; d++) {
    let loopYMD = `${tahunAktifView}-${String(bulanAktifView + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let kelasTambahan = '';
    if (d === tglSkg.getDate() && bulanAktifView === tglSkg.getMonth() && tahunAktifView === tglSkg.getFullYear()) kelasTambahan += ' tanggal-hari-ini';
    if (loopYMD === tanggalTerpilihYMD) kelasTambahan += ' tanggal-terpilih';
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
  alert(`Tanggal operasional diganti ke: ${tanggalTerpilihYMD}`);
}

function cekDeteksiAlarmBahaya() {
  const inputJumlah = parseInt(document.getElementById('jumlah').value) || 0;
  const msgEl = document.getElementById('panic-alert-msg');
  const formEl = document.getElementById('form-main-block');
  
  if (modeFormAktif === 'biasa' && jenisTerpilih === 'pengeluaran') {
    let sisaRealtimeHarian = (batasAnggaranHarian - hutangPotonganBesok) - akumulasiPengeluaranHariIniGlobal;
    if (inputJumlah > sisaRealtimeHarian && sisaRealtimeHarian > 0) {
      if(msgEl) msgEl.style.display = 'block';
      if(formEl) formEl.classList.add('panic-mode');
    } else {
      if(msgEl) msgEl.style.display = 'none';
      if(formEl) formEl.classList.remove('panic-mode');
    }
  } else {
    if(msgEl) msgEl.style.display = 'none';
    if(formEl) formEl.classList.remove('panic-mode');
  }
}

function tambahTargetImpian() {
  const namaEl = document.getElementById('goalNama');
  const targetEl = document.getElementById('goalTarget');
  const nama = namaEl.value.trim();
  const target = parseInt(targetEl.value);

  if(!nama || isNaN(target) || target <= 0) {
    alert("Isi data impian & nominal target dengan benar!");
    return;
  }

  daftarTargetTabungan.push({ nama, target, terkumpul: 0 });
  localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
  namaEl.value = '';
  targetEl.value = '';
  updateTampilan();
}

function aksiTabung(idx) {
  const item = daftarTargetTabungan[idx];
  const sisaKebutuhan = item.target - item.terkumpul;
  if (sisaKebutuhan <= 0) return alert("Celengan impian ini udah lunas 100%, bro!");
  
  const asalKantong = prompt("Ambil duitnya dari kantong mana? (Ketik Angka):\n1 = Uang Tunai\n2 = Bank (ATM)\n3 = E-Wallet");
  let slug = asalKantong === '1' ? 'cash' : asalKantong === '2' ? 'bank' : asalKantong === '3' ? 'wallet' : '';
  if(!slug) return alert("Pilihan kantong salah!");

  let saldoKantongTerpilih = 0;
  dataTransaksi.forEach(t => {
    if (t.jenis === 'transfer') {
      if (t.dari === slug) saldoKantongTerpilih -= t.jumlah;
      if (t.ke === slug) saldoKantongTerpilih += t.jumlah;
    } else {
      const d = t.dompet || 'cash';
      if (d === slug) {
        if (t.jenis === 'pemasukan') saldoKantongTerpilih += t.jumlah;
        else if (t.jenis === 'pengeluaran') saldoKantongTerpilih -= t.jumlah;
      }
    }
  });

  if (saldoKantongTerpilih <= 0) {
    return alert(`🚨 Transaksi Ditolak! Saldo di kantong ${formatNamaDompet(slug)} lo kosong atau Rp 0.`);
  }

  const inputNominal = prompt(`[TAMBAH] Mau nabung berapa untuk: ${item.nama}?\n(Sisa butuh: Rp ${sisaKebutuhan.toLocaleString('id-ID')})\n(Saldo tersedia di ${formatNamaDompet(slug)}: Rp ${saldoKantongTerpilih.toLocaleString('id-ID')})`);
  if (!inputNominal) return;
  const nominal = parseInt(inputNominal);
  if (isNaN(nominal) || nominal <= 0 || nominal > sisaKebutuhan) return alert("Nominal tidak sah!");

  if (nominal > saldoKantongTerpilih) {
    return alert(`🚨 Gak bisa, bro! Saldo ${formatNamaDompet(slug)} lo cuma ada Rp ${saldoKantongTerpilih.toLocaleString('id-ID')}, sedangkan lo mau nabung Rp ${nominal.toLocaleString('id-ID')}. Duitnya kurang!`);
  }

  dataTransaksi.push({ tanggal: tanggalTerpilihYMD, keterangan: `[Nabung] ${item.nama}`, jenis: 'pengeluaran', jumlah: nominal, dompet: slug });
  daftarTargetTabungan[idx].terkumpul += nominal;
  
  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
  updateTampilan();
  alert(`Mantap! Rp ${nominal.toLocaleString('id-ID')} masuk celengan.`);
}

function aksiKurangTabung(idx) {
  const item = daftarTargetTabungan[idx];
  if (item.terkumpul <= 0) return alert("Tabungan lo masih kosong, bro! Gak ada duit yang bisa ditarik.");

  const inputKurang = prompt(`[KURANGI] Mau tarik berapa dari celengan: ${item.nama}?\n(Maksimal tersedia: Rp ${item.terkumpul.toLocaleString('id-ID')})`);
  if (!inputKurang) return;
  const nominalKurang = parseInt(inputKurang);
  if (isNaN(nominalKurang) || nominalKurang <= 0 || nominalKurang > item.terkumpul) return alert("Nominal salah atau melebihi isi celengan!");

  const tujuanKembali = prompt("Kembalikan duitnya ke kantong mana? (Ketik Angka):\n1 = Uang Tunai\n2 = Bank (ATM)\n3 = E-Wallet");
  let slug = tujuanKembali === '1' ? 'cash' : tujuanKembali === '2' ? 'bank' : tujuanKembali === '3' ? 'wallet' : '';
  if(!slug) return alert("Pilihan kantong salah!");

  dataTransaksi.push({ tanggal: tanggalTerpilihYMD, keterangan: `[Tarik Celengan] ${item.nama}`, jenis: 'pemasukan', jumlah: nominalKurang, dompet: slug });
  daftarTargetTabungan[idx].terkumpul -= nominalKurang;

  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
  updateTampilan();
  alert(`Berhasil ditarik Rp ${nominalKurang.toLocaleString('id-ID')} ke kantong lo.`);
}

function hapusGoal(idx) {
  if(confirm("Hapus impian ini secara permanen?")) {
    daftarTargetTabungan.splice(idx, 1);
    localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
    updateTampilan();
  }
}

function simpanTransaksi(e) {
  e.preventDefault();
  const keteranganInput = document.getElementById('keterangan').value.trim();
  const jumlah = parseInt(document.getElementById('jumlah').value);

  if (modeFormAktif === 'biasa') {
    const dompet = document.getElementById('dompet').value;
    if (jenisTerpilih === 'pengeluaran') {
      let sisaRealtimeHarian = (batasAnggaranHarian - hutangPotonganBesok) - akumulasiPengeluaranHariIniGlobal;
      if (jumlah > sisaRealtimeHarian) {
        let kelebihan = jumlah - sisaRealtimeHarian;
        let konfirmasi = confirm(`🚨 OVER BUDGET Rp ${kelebihan.toLocaleString('id-ID')}!\nPotong anggaran hari esok?`);
        if (confirmasi) {
          hutangPotonganBesok += kelebihan;
          localStorage.setItem('potongan_besok_pkl', hutangPotonganBesok);
        } else return;
      }
    }
    dataTransaksi.push({ tanggal: tanggalTerpilihYMD, keterangan: keteranganInput, jenis: jenisTerpilih, jumlah, dompet });
  } else {
    const dari = document.getElementById('transfer-dari').value;
    const ke = document.getElementById('transfer-ke').value;
    if (dari === ke) return alert("Kantong asal & tujuan tidak boleh sama!");
    dataTransaksi.push({ tanggal: tanggalTerpilihYMD, keterangan: `[Mutasi] Transfer internal`, jenis: 'transfer', jumlah, dari, ke });
  }

  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  document.getElementById('transaksiForm').reset();
  gantiModeForm('biasa');
  switchPage('dashboard');
}

function hapusTransaksi(index) {
  if (confirm("Hapus catatan transaksi ini?")) {
    const item = dataTransaksi[index];
    if (item.jenis === 'pengeluaran') {
      hutangPotonganBesok = 0;
      localStorage.setItem('potongan_besok_pkl', 0);
    }
    dataTransaksi.splice(index, 1);
    localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
    updateTampilan();
  }
}

function simpanHutangBaru(e) {
  e.preventDefault();
  const tipe = document.getElementById('hutang-tipe').value;
  const nama = document.getElementById('hutang-nama').value.trim();
  const ket = document.getElementById('hutang-ket').value.trim();
  const jumlah = parseInt(document.getElementById('hutang-jumlah').value);

  dataHutang.push({ id: Date.now(), tanggal: tanggalTerpilihYMD, tipe, nama, ket, jumlah });
  localStorage.setItem('hutang_pkl', JSON.stringify(dataHutang));
  document.getElementById('hutangForm').reset();
  updateTampilan();
}

function bayarAtauCicilHutang(id) {
  const idx = dataHutang.findIndex(h => h.id === id);
  if (idx === -1) return;
  const item = dataHutang[idx];
  const inputNominal = prompt(`Masukkan nominal cicilan (Maksimal Rp ${item.jumlah.toLocaleString('id-ID')}):`);
  if (!inputNominal) return;
  const nominal = parseInt(inputNominal);

  const jenisKas = item.tipe === 'piutang' ? 'pemasukan' : 'pengeluaran';
  dataTransaksi.push({ tanggal: tanggalTerpilihYMD, keterangan: `[Hutang/Piutang] ${item.nama}`, jenis: jenisKas, jumlah: nominal, dompet: 'cash' });

  dataHutang[idx].jumlah -= nominal;
  if (dataHutang[idx].jumlah <= 0) dataHutang.splice(idx, 1);

  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  localStorage.setItem('hutang_pkl', JSON.stringify(dataHutang));
  updateTampilan();
}

function hapusArsipHutang(id) {
  if (confirm("Hapus catatan ini?")) {
    dataHutang = dataHutang.filter(h => h.id !== id);
    localStorage.setItem('hutang_pkl', JSON.stringify(dataHutang));
    updateTampilan();
  }
}

function dapetWarnaAcak(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  let warna = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    value = Math.floor((value + 150) / 2);
    warna += ('00' + value.toString(16)).substr(-2);
  }
  return warna;
}

function formatNamaDompet(slug) {
  return slug === 'bank' ? 'Bank' : slug === 'wallet' ? 'E-Wallet' : 'Tunai';
}

function bersihkanSemuaData() {
  if (confirm("Hapus total seluruh database aplikasi?")) {
    localStorage.clear();
    location.reload();
  }
}

function updateTampilan() {
  let totalPemasukan = 0, totalPengeluaran = 0, totalKeluarBulanIni = 0;
  let saldoCash = 0, saldoBank = 0, saldoWallet = 0;
  let htmlRiwayat = '';
  
  // Penampung perhitungan filter waktu lengkap (Harian, Mingguan, Bulanan, Tahunan)
  let subHarian = { masuk: 0, keluar: 0 };
  let subMingguan = { masuk: 0, keluar: 0 };
  let subBulanan = { masuk: 0, keluar: 0 };
  let subTahunan = { masuk: 0, keluar: 0 };
  let groupPengeluaranBulanIni = {};

  const hariIni = new Date();
  const strHariIniYMD = `${hariIni.getFullYear()}-${String(hariIni.getMonth()+1).padStart(2,'0')}-${String(hariIni.getDate()).padStart(2,'0')}`;

  const batasTujuhHariLalu = new Date();
  batasTujuhHariLalu.setDate(hariIni.getDate() - 7);

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
      let tdTipe = '', tdJumlah = '';
      if (item.jenis === 'transfer') {
        tdTipe = `<span class="txt-transfer">Transfer</span> (${formatNamaDompet(item.dari)} ➔ ${formatNamaDompet(item.ke)})`;
        tdJumlah = `<span class="txt-transfer">Rp ${item.jumlah.toLocaleString('id-ID')}</span>`;
      } else {
        tdTipe = `<span class="${item.jenis === 'pemasukan' ? 'txt-masuk' : 'txt-keluar'}">${item.jenis === 'pemasukan' ? 'Masuk' : 'Keluar'}</span> (${formatNamaDompet(item.dompet || 'cash')})`;
        tdJumlah = `<span class="${item.jenis === 'pemasukan' ? 'txt-masuk' : 'txt-keluar'}">${item.jenis === 'pemasukan' ? 'Rp ' : 'Rp -'}${item.jumlah.toLocaleString('id-ID')}</span>`;
      }
      htmlRiwayat = `<tr><td>${item.tanggal}</td><td>${item.keterangan}</td><td>${tdTipe}</td><td>${tdJumlah}</td><td style="text-align:center;"><button class="btn-del-row" onclick="hapusTransaksi(${i})">X</button></td></tr>` + htmlRiwayat;
    }

    // Hitung Akumulasi Berdasarkan Waktu
    if (item.jenis !== 'transfer') {
      // 1. Harian
      if (item.tanggal === strHariIniYMD) {
        if (item.jenis === 'pemasukan') subHarian.masuk += item.jumlah;
        else if (item.jenis === 'pengeluaran') subHarian.keluar += item.jumlah;
      }
      
      // 2. Mingguan (7 Hari Terakhir)
      if (tglItem >= batasTujuhHariLalu && tglItem <= hariIni) {
        if (item.jenis === 'pemasukan') subMingguan.masuk += item.jumlah;
        else if (item.jenis === 'pengeluaran') subMingguan.keluar += item.jumlah;
      }

      // 3. Bulan Ini
      if (tglItem.getMonth() === hariIni.getMonth() && tglItem.getFullYear() === hariIni.getFullYear()) {
        if (item.jenis === 'pemasukan') subBulanan.masuk += item.jumlah; 
        else if (item.jenis === 'pengeluaran') subBulanan.keluar += item.jumlah;
        
        if (item.jenis === 'pengeluaran') {
          totalKeluarBulanIni += item.jumlah;
          let key = item.keterangan.toLowerCase().trim();
          if (!groupPengeluaranBulanIni[key]) groupPengeluaranBulanIni[key] = { nama: item.keterangan, total: 0 };
          groupPengeluaranBulanIni[key].total += item.jumlah;
        }
      }

      // 4. TAHUNAN (Menyaring Transaksi Berdasarkan Tahun Berjalan)
      if (tglItem.getFullYear() === hariIni.getFullYear()) {
        if (item.jenis === 'pemasukan') subTahunan.masuk += item.jumlah;
        else if (item.jenis === 'pengeluaran') subTahunan.keluar += item.jumlah;
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

  if (document.getElementById('tabel-body')) document.getElementById('tabel-body').innerHTML = htmlRiwayat || '<tr><td colspan="5" style="text-align:center;color:#999;">Kosong</td></tr>';

  // RENDER REKAP ARUS BERSIH: HARIAN, MINGGUAN, BULANAN, & TAHUNAN
  if(document.getElementById('tabel-rekap-bersih-body')) {
    let selisihHari = subHarian.masuk - subHarian.keluar;
    let selisihMinggu = subMingguan.masuk - subMingguan.keluar;
    let selisihBulan = subBulanan.masuk - subBulanan.keluar;
    let selisihTahun = subTahunan.masuk - subTahunan.keluar;

    document.getElementById('tabel-rekap-bersih-body').innerHTML = `
      <tr>
        <td><b>Hari Ini</b></td>
        <td class="txt-masuk">Rp ${subHarian.masuk.toLocaleString('id-ID')}</td>
        <td class="txt-keluar">Rp ${subHarian.keluar.toLocaleString('id-ID')}</td>
        <td class="${selisihHari >= 0 ? 'txt-masuk' : 'txt-keluar'}"><b>Rp ${selisihHari.toLocaleString('id-ID')}</b></td>
      </tr>  
      <tr>
        <td><b>Minggu Ini (7 hr)</b></td>
        <td class="txt-masuk">Rp ${subMingguan.masuk.toLocaleString('id-ID')}</td>
        <td class="txt-keluar">Rp ${subMingguan.keluar.toLocaleString('id-ID')}</td>
        <td class="${selisihMinggu >= 0 ? 'txt-masuk' : 'txt-keluar'}"><b>Rp ${selisihMinggu.toLocaleString('id-ID')}</b></td>
      </tr>
      <tr>
        <td><b>Bulan Ini</b></td>
        <td class="txt-masuk">Rp ${subBulanan.masuk.toLocaleString('id-ID')}</td>
        <td class="txt-keluar">Rp ${subBulanan.keluar.toLocaleString('id-ID')}</td>
        <td class="${selisihBulan >= 0 ? 'txt-masuk' : 'txt-keluar'}"><b>Rp ${selisihBulan.toLocaleString('id-ID')}</b></td>
      </tr>
      <tr>
        <td><b>Tahun Ini (${hariIni.getFullYear()})</b></td>
        <td class="txt-masuk">Rp ${subTahunan.masuk.toLocaleString('id-ID')}</td>
        <td class="txt-keluar">Rp ${subTahunan.keluar.toLocaleString('id-ID')}</td>
        <td class="${selisihTahun >= 0 ? 'txt-masuk' : 'txt-keluar'}"><b>Rp ${selisihTahun.toLocaleString('id-ID')}</b></td>
      </tr>`;  
  }

  const goalsContainer = document.getElementById('goals-container');
  if (goalsContainer) {
    goalsContainer.innerHTML = daftarTargetTabungan.length === 0 ? '<div style="text-align:center;color:#999;padding:10px;font-size:11px;">Belum ada impian.</div>' : '';
    daftarTargetTabungan.forEach((item, idx) => {
      const persenGoal = Math.min(Math.round((item.terkumpul / item.target) * 100), 100);
      goalsContainer.innerHTML += `
        <div class="goal-card-item" style="border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:8px; background:#fff;">  
          <div class="goal-meta" style="display:flex; justify-content:between; font-weight:bold; margin-bottom:5px;"><span>🎯 ${item.nama}</span><span style="color:#0066cc; margin-left:auto;">${persenGoal}%</span></div>  
          <div class="bar-track" style="height:6px; background:#eee; border-radius:3px; margin-bottom:8px; overflow:hidden;"><div class="bar-fill" style="width:${persenGoal}%; background-color:#0066cc; height:100%;"></div></div>  
          <div class="goal-actions" style="display:flex; justify-content:space-between; align-items:center;">  
            <span style="font-size:11px; color:#666;">Rp ${item.terkumpul.toLocaleString('id-ID')} / ${item.target.toLocaleString('id-ID')}</span>  
            <div style="display: flex; gap: 4px;">  
              <button type="button" style="background:#0066cc; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;" onclick="aksiTabung(${idx})">+</button>  
              <button type="button" style="background:#f39c12; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;" onclick="aksiKurangTabung(${idx})">-</button>  
              <button type="button" class="btn-del-row" style="background:red; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;" onclick="hapusGoal(${idx})">×</button>  
            </div>  
          </div>  
        </div>`;
    });  
  }

  let sumPiutang = 0, sumHutang = 0, htmlHutangRows = '';
  dataHutang.forEach((item) => {
    if (item.tipe === 'piutang') sumPiutang += item.jumlah; else sumHutang += item.jumlah;
    let labelStatus = item.tipe === 'piutang' ? '<span class="badge-hutang piutang">Menagih</span>' : '<span class="badge-hutang hutang">Membayar</span>';
    htmlHutangRows += `<tr><td>${item.tanggal}</td><td><strong>${item.nama}</strong></td><td>${labelStatus}</td><td>${item.ket}</td><td><strong>Rp ${item.jumlah.toLocaleString('id-ID')}</strong></td><td><button class="btn-action-hutang" onclick="bayarAtauCicilHutang(${item.id})">Aksi</button><button class="btn-del-row" onclick="hapusArsipHutang(${item.id})">×</button></td></tr>`;
  });

  if (document.getElementById('total-piutang-box')) document.getElementById('total-piutang-box').innerText = `Rp ${sumPiutang.toLocaleString('id-ID')}`;
  if (document.getElementById('total-hutang-box')) document.getElementById('total-hutang-box').innerText = `Rp ${sumHutang.toLocaleString('id-ID')}`;
  if (document.getElementById('tabel-hutang-body')) document.getElementById('tabel-hutang-body').innerHTML = htmlHutangRows || '<tr><td colspan="6" style="text-align:center;color:#999;padding:15px;">Kosong</td></tr>';

  const alokasiContainer = document.getElementById('alokasi-container');
  const chartContainer = document.getElementById('chart-container');
  if (alokasiContainer && chartContainer) {
    alokasiContainer.innerHTML = ''; chartContainer.innerHTML = '';
    if (totalKeluarBulanIni === 0) {
      alokasiContainer.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">Kosong</div>';
      chartContainer.innerHTML = '<div style="margin:auto;color:#999;">Kosong</div>';
    } else {
      let maxTotal = 0;
      for (let k in groupPengeluaranBulanIni) { if (groupPengeluaranBulanIni[k].total > maxTotal) maxTotal = groupPengeluaranBulanIni[k].total; }
      for (let k in groupPengeluaranBulanIni) {
        let g = groupPengeluaranBulanIni[k]; let p = (g.total / totalKeluarBulanIni) * 100; let h = (g.total / maxTotal) * 100; let warna = dapetWarnaAcak(g.nama);
        alokasiContainer.innerHTML += `<div class="alokasi-row"><div class="alokasi-labels"><span>📌 ${g.nama}</span><span>Rp ${g.total.toLocaleString('id-ID')}</span></div><div class="bar-track"><div class="bar-fill" style="width:${p}%;background-color:${warna};"></div></div></div>`;
        let sv = g.total >= 1000 ? (g.total/1000).toFixed(0)+'k' : g.total;
        chartContainer.innerHTML += `<div class="chart-column"><div class="column-fill" style="height:${h}%;background-color:${warna};"><span class="column-pop-val">${sv}</span></div><span class="column-title">${g.nama}</span></div>`;  
      }  
    }  
  }  
}  

window.onload = function() {
  generateKalenderVisual();
  renderFavorit();
  updateTampilan();
};
