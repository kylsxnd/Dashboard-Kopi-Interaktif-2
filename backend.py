from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_data():
    file_name = 'Dataset_Kopi_Sumatera_Lengkap.xlsx'
    if not os.path.exists(file_name):
        raise HTTPException(status_code=404, detail="Dataset Excel tidak ditemukan!")
    df = pd.read_excel(file_name)
    df['Produksi Robusta (Ton)'] = pd.to_numeric(df['Produksi Robusta (Ton)'], errors='coerce').fillna(0)
    df['Produksi Arabika (Ton)'] = pd.to_numeric(df['Produksi Arabika (Ton)'], errors='coerce').fillna(0)
    return df

@app.get("/api/years")
def get_years():
    df = load_data()
    years = sorted(df['Tahun'].dropna().unique().astype(int).tolist())
    return {"years": years}

@app.get("/api/kpi")
def get_kpi(year: int = None, month: str = None):
    df = load_data()
    if year:
        df = df[df['Tahun'] == year]
    if month and month != "Semua Bulan":
        df = df[df['Bulan'] == month]
        
    total_robusta = df['Produksi Robusta (Ton)'].sum()
    total_arabika = df['Produksi Arabika (Ton)'].sum()
    return {
        "total_robusta": round(total_robusta),
        "total_arabika": round(total_arabika),
        "total_semua": round(total_robusta + total_arabika)
    }

# ENDPOINT BARU: Buat nyari Kabupaten Terbanyak
@app.get("/api/top-kabupaten")
def get_top_kabupaten(year: int = None, month: str = None):
    df = load_data()
    if year:
        df = df[df['Tahun'] == year]
    if month and month != "Semua Bulan":
        df = df[df['Bulan'] == month]
        
    # Gabungkan data berdasarkan Kabupaten
    df_kab = df.groupby('Kabupaten/Kota')[['Produksi Robusta (Ton)', 'Produksi Arabika (Ton)']].sum().reset_index()
    
    if df_kab.empty:
        return {"robusta_kab": "-", "robusta_val": 0, "arabika_kab": "-", "arabika_val": 0}

    # Cari yang angkanya paling tinggi (Max)
    top_rob = df_kab.loc[df_kab['Produksi Robusta (Ton)'].idxmax()]
    top_ara = df_kab.loc[df_kab['Produksi Arabika (Ton)'].idxmax()]
    
    return {
        "robusta_kab": top_rob['Kabupaten/Kota'],
        "robusta_val": round(top_rob['Produksi Robusta (Ton)']),
        "arabika_kab": top_ara['Kabupaten/Kota'],
        "arabika_val": round(top_ara['Produksi Arabika (Ton)'])
    }

@app.get("/api/chart/provinsi")
def get_chart_provinsi(year: int = None, month: str = None):
    df = load_data()
    if year:
        df = df[df['Tahun'] == year]
    if month and month != "Semua Bulan":
        df = df[df['Bulan'] == month]
        
    df['Total Produksi'] = df['Produksi Robusta (Ton)'] + df['Produksi Arabika (Ton)']
    df_grouped = df.groupby('Provinsi')[['Produksi Robusta (Ton)', 'Produksi Arabika (Ton)', 'Total Produksi']].sum().reset_index()
    df_top = df_grouped.sort_values(by='Total Produksi', ascending=False)
    return {
        "labels": df_top['Provinsi'].tolist(),
        "robusta": df_top['Produksi Robusta (Ton)'].tolist(),
        "arabika": df_top['Produksi Arabika (Ton)'].tolist()
    }

@app.get("/api/chart/trend")
def get_chart_trend(year: int = None, month: str = None):
    df = load_data()
    if year:
        df = df[df['Tahun'] == year]
        df_grouped = df.groupby('Bulan')[['Produksi Robusta (Ton)', 'Produksi Arabika (Ton)']].sum().reset_index()
        month_order = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        df_grouped['Bulan'] = pd.Categorical(df_grouped['Bulan'], categories=month_order, ordered=True)
        df_grouped = df_grouped.sort_values('Bulan')
        labels = df_grouped['Bulan'].tolist()
    else:
        if month and month != "Semua Bulan":
            df = df[df['Bulan'] == month]
        df_grouped = df.groupby('Tahun')[['Produksi Robusta (Ton)', 'Produksi Arabika (Ton)']].sum().reset_index()
        df_grouped = df_grouped.sort_values('Tahun')
        labels = df_grouped['Tahun'].astype(int).tolist()

    return {
        "labels": labels,
        "robusta": df_grouped['Produksi Robusta (Ton)'].tolist(),
        "arabika": df_grouped['Produksi Arabika (Ton)'].tolist()
    }

@app.get("/api/raw-data")
def get_raw_data(year: int = None, month: str = None):
    df = load_data()
    if year:
        df = df[df['Tahun'] == year]
    if month and month != "Semua Bulan":
        df = df[df['Bulan'] == month]
    df = df.fillna("")
    return df.to_dict(orient="records")