function tabungKeGoal(idx) {
  const item = daftarTargetTabungan[idx];
  
  // Berikan pilihan kepada pengguna: Mau nambah atau ngurangin tabungan
  const menuAksi = prompt(`Target [${item.nama}]\nTerkumpul: Rp ${item.terkumpul.toLocaleString('id-ID')} / Rp ${item.target.toLocaleString('id-ID')}\n\nPilih aksi (Ketik angkanya):\n1 = Tambah Tabungan\n2 = Kurangi Tabungan (Koreksi Salah Input)`);
  
  if (menuAksi !== '1' && menuAksi !== '2') {
    alert("Pilihan batal atau tidak valid!");
    return;
  }

  if (menuAksi === '1') {
    // --- MODE TAMBAH TABUNGAN ---
    const sisaKebutuhan = item.target - item.terkumpul;
    if (sisaKebutuhan <= 0) {
      alert("Target impian ini udah lunas 100% gan!");
      return;
    }

    const inputNominal = prompt(`Mau nabung berapa buat [${item.nama}]?\n(Sisa butuh: Rp ${sisaKebutuhan.toLocaleString('id-ID')})`);
    if (!inputNominal) return;
    const nominal = parseInt(inputNominal);

    if (isNaN(nominal) || nominal <= 0) {
      alert("Nominal tidak sah!");
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

    // Catat ke log sebagai pengeluaran/tabungan
    dataTransaksi.push({
      tanggal: formatYMD,
      keterangan: `[Tujuan Nabung] ${item.nama}`,
      jenis: 'tabungan',
      jumlah: nominal,
      dompet: slugDompet
    });

    daftarTargetTabungan[idx].terkumpul += nominal;

  } else if (menuAksi === '2') {
    // --- MODE KURANGI TABUNGAN (FITUR BARU) ---
    if (item.terkumpul <= 0) {
      alert("Saldo tabungan ini masih Rp 0, gak bisa dikurangi lagi gan!");
      return;
    }

    const inputKurang = prompt(`Mau kurangi berapa dari tabungan [${item.nama}]?\n(Maksimal pengurangan: Rp ${item.terkumpul.toLocaleString('id-ID')})`);
    if (!inputKurang) return;
    const nominalKurang = parseInt(inputKurang);

    if (isNaN(nominalKurang) || nominalKurang <= 0) {
      alert("Nominal pengurangan tidak sah!");
      return;
    }
    if (nominalKurang > item.terkumpul) {
      alert("Nominal pengurangan melebihi saldo yang terkumpul saat ini!");
      return;
    }

    const tujuanKembali = prompt("Duit koreksiannya mau dibalikin ke kantong mana? Ketik kodenya:\n1 = Uang Tunai\n2 = Bank (ATM)\n3 = Dompet Elektronik");
    let slugDompet = '';
    if(tujuanKembali === '1') slugDompet = 'cash';
    else if(tujuanKembali === '2') slugDompet = 'bank';
    else if(tujuanKembali === '3') slugDompet = 'wallet';
    else {
      alert("Pilihan kantong tidak valid!");
      return;
    }

    const tglSkg = new Date();
    const formatYMD = `${tglSkg.getFullYear()}-${String(tglSkg.getMonth()+1).padStart(2,'0')}-${String(tglSkg.getDate()).padStart(2,'0')}`;

    // Masuk ke jurnal log sebagai pemasukan (karena duit balik ke kantong utama)
    dataTransaksi.push({
      tanggal: formatYMD,
      keterangan: `[Koreksi Kurang] Tabungan ${item.nama}`,
      jenis: 'pemasukan',
      jumlah: nominalKurang,
      dompet: slugDompet
    });

    daftarTargetTabungan[idx].terkumpul -= nominalKurang;
    alert(`Berhasil! Saldo tabungan [${item.nama}] dikurangi sebesar Rp ${nominalKurang.toLocaleString('id-ID')} dan dikembalikan ke kantong.`);
  }

  // Simpan perubahan ke LocalStorage dan refresh layar
  localStorage.setItem('transaksi_pkl', JSON.stringify(dataTransaksi));
  localStorage.setItem('goals_pkl', JSON.stringify(daftarTargetTabungan));
  updateTampilan();
}
