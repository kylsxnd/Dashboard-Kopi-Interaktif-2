// 1. AMBIL DATA DARI STREAMLIT (BUKAN DARI 127.0.0.1 LOKAL LAGI)
const rawData = typeof INJECTED_DATA !== 'undefined' ? INJECTED_DATA : [];
const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

let provChartInstance = null;
let trendChartInstance = null;

// 2. FUNGSI FILTER DATA DARI BROWSER
function getFilteredData() {
    const yearEl = document.getElementById('year-filter');
    const monthEl = document.getElementById('month-filter');
    const year = yearEl ? yearEl.value : "";
    const month = monthEl ? monthEl.value : "";
    
    let filtered = rawData;
    if (year) filtered = filtered.filter(d => d.Tahun == year);
    if (month) filtered = filtered.filter(d => d.Bulan == month);
    return filtered;
}

// 3. ISI DROPDOWN TAHUN DAN BULAN OTOMATIS
function loadOptions() {
    const yearSet = new Set(rawData.map(d => d.Tahun));
    const years = Array.from(yearSet).sort((a,b) => a - b);
    const selectYear = document.getElementById('year-filter');
    
    if (selectYear && years.length > 0) {
        selectYear.innerHTML = '<option value="">🌎 Semua Tahun (2021-2026)</option>';
        years.forEach(year => {
            if(year) {
                const option = document.createElement('option');
                option.value = year; option.text = `🌎 Tahun ${year}`;
                selectYear.appendChild(option);
            }
        });
    }

    const monthOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const selectMonth = document.getElementById('month-filter');
    if (selectMonth) {
        selectMonth.innerHTML = '<option value="">🗓️ Semua Bulan</option>';
        monthOrder.forEach(month => {
            const option = document.createElement('option');
            option.value = month; option.text = `🗓️ ${month}`;
            selectMonth.appendChild(option);
        });
    }
}

// 4. MENGHITUNG KPI TOTAL
function fetchKPI() {
    const data = getFilteredData();
    const total_robusta = data.reduce((sum, item) => sum + (Number(item['Produksi Robusta (Ton)']) || 0), 0);
    const total_arabika = data.reduce((sum, item) => sum + (Number(item['Produksi Arabika (Ton)']) || 0), 0);
    const total_semua = total_robusta + total_arabika;

    document.getElementById('kpi-total').innerText = formatNumber(Math.round(total_semua));
    document.getElementById('kpi-robusta').innerText = formatNumber(Math.round(total_robusta));
    document.getElementById('kpi-arabika').innerText = formatNumber(Math.round(total_arabika));
}

// 5. MENGHITUNG KABUPATEN TERBANYAK
function fetchTopKabupaten() {
    const data = getFilteredData();
    let kabData = {};

    data.forEach(item => {
        let kab = item['Kabupaten/Kota'];
        if(kab) {
            if (!kabData[kab]) kabData[kab] = { robusta: 0, arabika: 0 };
            kabData[kab].robusta += (Number(item['Produksi Robusta (Ton)']) || 0);
            kabData[kab].arabika += (Number(item['Produksi Arabika (Ton)']) || 0);
        }
    });

    let topRobKab = "-", topRobVal = 0;
    let topAraKab = "-", topAraVal = 0;

    for (let kab in kabData) {
        if (kabData[kab].robusta > topRobVal) { topRobVal = kabData[kab].robusta; topRobKab = kab; }
        if (kabData[kab].arabika > topAraVal) { topAraVal = kabData[kab].arabika; topAraKab = kab; }
    }

    const elRobKab = document.getElementById('top-kab-robusta');
    const elRobVal = document.getElementById('top-val-robusta');
    const elAraKab = document.getElementById('top-kab-arabika');
    const elAraVal = document.getElementById('top-val-arabika');

    if(elRobKab) elRobKab.innerText = topRobKab;
    if(elRobVal) elRobVal.innerText = formatNumber(Math.round(topRobVal)) + " Ton";
    if(elAraKab) elAraKab.innerText = topAraKab;
    if(elAraVal) elAraVal.innerText = formatNumber(Math.round(topAraVal)) + " Ton";
}

// 6. CHART PROVINSI & EDUGROWTH INSIGHT
function fetchChartProvinsi() {
    const data = getFilteredData();
    let provData = {};

    data.forEach(item => {
        let prov = item['Provinsi'];
        if(prov) {
            if (!provData[prov]) provData[prov] = { robusta: 0, arabika: 0, total: 0 };
            provData[prov].robusta += (Number(item['Produksi Robusta (Ton)']) || 0);
            provData[prov].arabika += (Number(item['Produksi Arabika (Ton)']) || 0);
            provData[prov].total = provData[prov].robusta + provData[prov].arabika;
        }
    });

    let sortedProv = Object.keys(provData).sort((a, b) => provData[b].total - provData[a].total);
    let labels = [], robusta = [], arabika = [];
    
    sortedProv.forEach(prov => {
        labels.push(prov);
        robusta.push(Math.round(provData[prov].robusta));
        arabika.push(Math.round(provData[prov].arabika));
    });

    const dynamicInsight = document.getElementById('dynamic-insight');
    if (labels.length > 0 && dynamicInsight) {
        let maxRobIdx = robusta.indexOf(Math.max(...robusta));
        let maxAraIdx = arabika.indexOf(Math.max(...arabika));

        dynamicInsight.innerHTML = `
            <p><strong>${labels[maxRobIdx] || "N/A"}</strong> memimpin sebagai produsen <strong>Kopi Robusta</strong> terbesar dengan <strong style="color: #f1c40f;">${formatNumber(robusta[maxRobIdx] || 0)} Ton</strong>.</p>
            <p>Di sisi lain, untuk pasar <strong>Kopi Arabika</strong>, wilayah <strong>${labels[maxAraIdx] || "N/A"}</strong> mendominasi dengan <strong style="color: #e67e22;">${formatNumber(arabika[maxAraIdx] || 0)} Ton</strong>.</p>
            <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
            <p style="font-size: 12.5px; color: #90a4ae;"><em>*Analisis dihasilkan secara otomatis berdasarkan filter.</em></p>
        `;
    }

    const chartDom = document.getElementById('provinsiChart');
    if (!chartDom) return;
    if (!provChartInstance) provChartInstance = echarts.init(chartDom);
    
    const option = {
        backgroundColor: 'transparent', tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Robusta', 'Arabika'], textStyle: { color: '#e0e0e0' } },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: labels, axisLabel: { color: '#e0e0e0', rotate: 25 } },
        yAxis: { type: 'value', axisLabel: { color: '#e0e0e0' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        series: [
            { name: 'Robusta', type: 'bar', data: robusta, itemStyle: { color: '#f1c40f', borderRadius: [4, 4, 0, 0] } },
            { name: 'Arabika', type: 'bar', data: arabika, itemStyle: { color: '#e67e22', borderRadius: [4, 4, 0, 0] } }
        ]
    };
    provChartInstance.setOption(option, true);
}

// 7. CHART TREND (TAHUN KE TAHUN / BULAN KE BULAN)
function fetchChartTrend() {
    const data = getFilteredData();
    const yearVal = document.getElementById('year-filter') ? document.getElementById('year-filter').value : "";
    
    let trendData = {};
    const monthOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    if (yearVal) {
        data.forEach(item => {
            let m = item['Bulan'];
            if(m) {
                if (!trendData[m]) trendData[m] = { robusta: 0, arabika: 0 };
                trendData[m].robusta += (Number(item['Produksi Robusta (Ton)']) || 0);
                trendData[m].arabika += (Number(item['Produksi Arabika (Ton)']) || 0);
            }
        });
        var labels = monthOrder.filter(m => trendData[m]);
    } else {
        data.forEach(item => {
            let y = item['Tahun'];
            if(y) {
                if (!trendData[y]) trendData[y] = { robusta: 0, arabika: 0 };
                trendData[y].robusta += (Number(item['Produksi Robusta (Ton)']) || 0);
                trendData[y].arabika += (Number(item['Produksi Arabika (Ton)']) || 0);
            }
        });
        var labels = Object.keys(trendData).sort((a,b) => a - b);
    }

    let robusta = [], arabika = [];
    labels.forEach(l => {
        robusta.push(Math.round(trendData[l].robusta));
        arabika.push(Math.round(trendData[l].arabika));
    });

    const chartDom = document.getElementById('trendChart');
    if (!chartDom) return;
    if (!trendChartInstance) trendChartInstance = echarts.init(chartDom);
    
    const option = {
        backgroundColor: 'transparent', tooltip: { trigger: 'axis' },
        legend: { data: ['Robusta', 'Arabika'], textStyle: { color: '#e0e0e0' } },
        grid: { left: '3%', right: '4%', bottom: '5%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: labels, axisLabel: { color: '#e0e0e0' } },
        yAxis: { type: 'value', axisLabel: { color: '#e0e0e0' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        series: [
            { name: 'Robusta', type: 'line', data: robusta, smooth: true, lineStyle: { width: 3, color: '#f1c40f' }, itemStyle: { color: '#f1c40f' } },
            { name: 'Arabika', type: 'line', data: arabika, smooth: true, lineStyle: { width: 3, color: '#e67e22' }, itemStyle: { color: '#e67e22' } }
        ]
    };
    trendChartInstance.setOption(option, true);
}

// 8. TABLE SPREADSHEET
function fetchTableData() {
    const data = getFilteredData();
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    if(!thead || !tbody) return;

    thead.innerHTML = ""; tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Tidak ada data ditemukan.</td></tr>`;
        return;
    }

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th'); th.innerText = header; thead.appendChild(th);
    });

    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            let val = row[header];
            if (typeof val === 'number' && header !== 'Tahun') val = formatNumber(val);
            td.innerText = val; tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function updateDashboardData() {
    fetchKPI(); fetchTopKabupaten(); fetchChartProvinsi(); fetchChartTrend(); fetchTableData(); 
}

// TABS MENU NAVIGATION
document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        const targetEl = document.getElementById(targetId);
        if(targetEl) targetEl.classList.add('active');

        setTimeout(() => {
            if (provChartInstance) provChartInstance.resize();
            if (trendChartInstance) trendChartInstance.resize();
        }, 100);
    });
});

window.addEventListener('resize', () => {
    if (provChartInstance) provChartInstance.resize();
    if (trendChartInstance) trendChartInstance.resize();
});

// STARTUP AWAL
window.onload = () => {
    // Beri jeda 0.3 detik agar HTML ter-load sempurna dulu sebelum ngisi data
    setTimeout(() => {
        loadOptions();
        updateDashboardData();
    }, 300);
};
