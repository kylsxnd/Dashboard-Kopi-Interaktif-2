import streamlit as st
import streamlit.components.v1 as components
import pandas as pd
import json

st.set_page_config(layout="wide", page_title="Dashboard Produksi Kopi Sumatera")

st.markdown("""
    <style>
        .block-container {
            padding: 0rem !important;
            max-width: 100% !important;
        }
        header {visibility: hidden;}
        footer {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)

# 1. BACA DATA EXCEL LANGSUNG DI STREAMLIT
try:
    df = pd.read_excel('Dataset_Kopi_Sumatera_Lengkap.xlsx')
    df['Produksi Robusta (Ton)'] = pd.to_numeric(df['Produksi Robusta (Ton)'], errors='coerce').fillna(0)
    df['Produksi Arabika (Ton)'] = pd.to_numeric(df['Produksi Arabika (Ton)'], errors='coerce').fillna(0)
    
    # Ubah data mentah jadi JSON string biar bisa dibaca JavaScript
    df = df.fillna("")
    raw_data_json = df.to_json(orient="records")
except Exception as e:
    st.error(f"⚠️ GAGAL BACA EXCEL: {e}. Pastikan nama file Excel benar dan openpyxl ada di requirements.txt!")
    raw_data_json = "[]"

# 2. INJEKSI DATA KE DALAM HTML & JS
try:
    with open("frontend/index.html", "r", encoding="utf-8") as f:
        html_data = f.read()
    with open("frontend/style.css", "r", encoding="utf-8") as f:
        css_data = f.read()
    with open("frontend/script.js", "r", encoding="utf-8") as f:
        js_data = f.read()
        
    # Masukkan CSS ke dalam HTML
    html_data = html_data.replace('<link rel="stylesheet" href="style.css">', f"<style>{css_data}</style>")
    
    # SUNTIKKAN DATA EXCEL LANGSUNG KE JAVASCRIPT!
    js_data = f"const INJECTED_DATA = {raw_data_json};\n" + js_data
    
    # Masukkan JS ke dalam HTML
    html_data = html_data.replace('<script src="script.js"></script>', f"<script>{js_data}</script>")
    
    # Tampilkan di layar
    components.html(html_data, height=900, scrolling=True)
    
except Exception as e:
    st.error(f"Gagal memuat antarmuka frontend: {e}")
