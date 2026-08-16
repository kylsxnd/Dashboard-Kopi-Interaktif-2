import pandas as pd
import numpy as np

# 1. Buka dataset asli lu
df = pd.read_excel('Dataset_Kopi_Nasional_Wide_Format_2021_2026.xlsx')

# 2. Filter cuma ambil 4 Provinsi Sumatera
sumatra_provs = ['Aceh', 'Sumatera Utara', 'Sumatera Selatan', 'Lampung']
df = df[df['Provinsi'].isin(sumatra_provs)].copy()

# Bersihkan data kosong (kalau ada)
df['Produksi Robusta (Ton)'] = pd.to_numeric(df['Produksi Robusta (Ton)'], errors='coerce').fillna(150000)
df['Produksi Arabika (Ton)'] = pd.to_numeric(df['Produksi Arabika (Ton)'], errors='coerce').fillna(5000)

months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

# 3. Masukkan list Kabupaten "Raja Kopi"
kabupaten_map = {
    'Aceh': ['Aceh Tengah (Takengon)', 'Bener Meriah', 'Gayo Lues'],
    'Sumatera Utara': ['Dairi (Sidikalang)', 'Humbang Hasundutan', 'Tapanuli Utara'],
    'Sumatera Selatan': ['Lahat', 'Pagar Alam', 'Muara Enim'],
    'Lampung': ['Lampung Barat', 'Tanggamus', 'Way Kanan']
}

new_data = []

# 4. Proses pecah data Tahunan -> Bulanan & Kabupaten
for _, row in df.iterrows():
    tahun = row['Tahun']
    prov = row['Provinsi']
    prod_rob = row['Produksi Robusta (Ton)']
    prod_ara = row['Produksi Arabika (Ton)']
    
    kabs = kabupaten_map[prov]
    
    # Bobot Bulan (Juni, Juli, Agustus dibikin lebih tinggi karena musim Panen Raya)
    month_weights = np.array([1, 1, 1, 1.2, 1.5, 2, 2.5, 2, 1.2, 1, 1, 1])
    month_weights = month_weights / month_weights.sum()
    
    # Bobot Kabupaten (Kabupaten pertama dapat jatah paling besar/Juara 1)
    kab_weights = np.array([0.5, 0.3, 0.2])
    
    for i, month in enumerate(months):
        for j, kab in enumerate(kabs):
            # Hitung proporsi otomatis biar kalau ditotal per tahun hasilnya tetep sama!
            rob = int(prod_rob * month_weights[i] * kab_weights[j])
            ara = int(prod_ara * month_weights[i] * kab_weights[j])
            
            new_data.append({
                'Tahun': tahun,
                'Bulan': month,
                'Provinsi': prov,
                'Kabupaten/Kota': kab,
                'Produksi Robusta (Ton)': rob,
                'Produksi Arabika (Ton)': ara
            })

# 5. Simpan ke File Excel Baru
res_df = pd.DataFrame(new_data)
file_name = 'Dataset_Kopi_Sumatera_Lengkap.xlsx'
res_df.to_excel(file_name, index=False)

print(f"Beres Bos! File {file_name} berhasil dibuat dengan {len(res_df)} baris data.")