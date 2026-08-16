import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(layout="wide", page_title="Dashboard Produksi Kopi Sumatera")

# Injeksi CSS untuk menghilangkan batas bawaan Streamlit
st.markdown("""
    <style>
        .block-container {
            padding-top: 0rem !important;
            padding-bottom: 0rem !important;
            padding-left: 0rem !important;
            padding-right: 0rem !important;
            max-width: 100% !important;
        }
        header {visibility: hidden;}
        footer {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)

try:
    # 1. Membaca file HTML, CSS, dan JS mentah dari folder frontend
    with open("frontend/index.html", "r", encoding="utf-8") as f:
        html_data = f.read()
        
    with open("frontend/style.css", "r", encoding="utf-8") as f:
        css_data = f.read()
        
    with open("frontend/script.js", "r", encoding="utf-8") as f:
        js_data = f.read()
        
    # 2. Menggabungkan (Inject) CSS dan JS langsung ke dalam HTML
    # Ini yang bikin desain lu balik lagi!
    html_data = html_data.replace('<link rel="stylesheet" href="style.css">', f"<style>{css_data}</style>")
    html_data = html_data.replace('<script src="script.js"></script>', f"<script>{js_data}</script>")
    
    # 3. Tampilkan di Streamlit
    components.html(html_data, height=900, scrolling=True)
    
except Exception as e:
    st.error(f"Gagal memuat antarmuka frontend: {e}")