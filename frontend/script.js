const API_URL = "http://127.0.0.1:8000/api";
const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

let provChartInstance = null;
let trendChartInstance = null;

function getQueryParams() {
    const yearEl = document.getElementById('year-filter');
    const monthEl = document.getElementById('month-filter');
    const year = yearEl ? yearEl.value : "";
    const month = monthEl ? monthEl.value : "";
    
    let params = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${encodeURIComponent(month)}`);
    return params.length > 0 ? `?${params.join('&')}` : "";
}

async function loadYearOptions() {
    try {
        const res = await fetch(`${API_URL}/years`);
        const data = await res.json();
        const select = document.getElementById('year-filter');
        data.years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.text = `🌎 Tahun ${year}`;
            select.appendChild(option);
        });
    } catch (err) { console.error("Gagal load tahun:", err); }
}

async function fetchKPI() {
    try {
        const query = getQueryParams();
        const response = await fetch(`${API_URL}/kpi${query}`);
        const data = await response.json();
        
        document.getElementById('kpi-total').innerText = formatNumber(data.total_semua);
        document.getElementById('kpi-robusta').innerText = formatNumber(data.total_robusta);
        document.getElementById('kpi-arabika').innerText = formatNumber(data.total_arabika);
    } catch (error) { console.error("Gagal load KPI:", error); }
}

// FUNGSI BARU: Nampilin Raja Kabupaten
async function fetchTopKabupaten() {
    try {
        const query = getQueryParams();
        const response = await fetch(`${API_URL}/top-kabupaten${query}`);
        const data = await response.json();
        
        document.getElementById('top-kab-robusta').innerText = data.robusta_kab;
        document.getElementById('top-val-robusta').innerText = formatNumber(data.robusta_val) + " Ton";
        
        document.getElementById('top-kab-arabika').innerText = data.arabika_kab;
        document.getElementById('top-val-arabika').innerText = formatNumber(data.arabika_val) + " Ton";
    } catch (error) { console.error("Gagal load Top Kabupaten:", error); }
}

async function fetchChartProvinsi() {
    try {
        const query = getQueryParams();
        const response = await fetch(`${API_URL}/chart/provinsi${query}`);
        const data = await response.json();
        
        const year = document.getElementById('year-filter') ? document.getElementById('year-filter').value : "";
        const month = document.getElementById('month-filter') ? document.getElementById('month-filter').value : "";

        if(data.labels && data.labels.length > 0) {
            const labels = data.labels;
            const robusta = data.robusta;
            const arabika = data.arabika;

            let maxRobIdx = robusta.indexOf(Math.max(...robusta));
            let maxAraIdx = arabika.indexOf(Math.max(...arabika));

            let topRobProv = labels[maxRobIdx] || "N/A";
            let topRobVal = robusta[maxRobIdx] || 0;
            let topAraProv = labels[maxAraIdx] || "N/A";
            let topAraVal = arabika[maxAraIdx] || 0;

            let periodeTeks = "";
            if (year && month) {
                periodeTeks = `pada <strong>${month} ${year}</strong>`;
            } else if (year) {
                periodeTeks = `pada tahun <strong>${year}</strong>`;
            } else if (month) {
                periodeTeks = `pada bulan <strong>${month}</strong> (Semua Tahun)`;
            } else {
                periodeTeks = `selama periode <strong>2021-2026</strong>`;
            }
            
            let insightHTML = `
                <p>Berdasarkan data ${periodeTeks}, <strong>${topRobProv}</strong> memimpin sebagai provinsi penghasil <strong>Kopi Robusta</strong> terbesar dengan total produksi mencapai <strong style="color: #f1c40f;">${formatNumber(topRobVal)} Ton</strong>.</p>
                <p>Di sisi lain, untuk pasar <strong>Kopi Arabika</strong>, wilayah provinsi <strong>${topAraProv}</strong> mendominasi dengan angka produksi sebesar <strong style="color: #e67e22;">${formatNumber(topAraVal)} Ton</strong>.</p>
                <p>Secara umum, provinsi-provinsi di Pulau Sumatera mendominasi sentra kopi regional, menjadikannya tulang punggung suplai komoditas kopi.</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">
                <p style="font-size: 12.5px; color: #90a4ae;">
                    <em>*Teks analisis ini dihasilkan secara otomatis (AI-Generated) berdasarkan filter data yang dipilih.</em>
                </p>
            `;
            document.getElementById('dynamic-insight').innerHTML = insightHTML;
        }

        const chartDom = document.getElementById('provinsiChart');
        if (!provChartInstance) provChartInstance = echarts.init(chartDom);
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['Robusta', 'Arabika'], textStyle: { color: '#e0e0e0' }, top: 0 },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            toolbox: { feature: { magicType: { show: true, type: ['line', 'bar'] }, saveAsImage: { show: true, title: 'Download PNG' } }, iconStyle: { borderColor: '#fff' }, top: 0 },
            dataZoom: [{ type: 'inside' }, { type: 'slider', textStyle: { color: '#fff' }, bottom: 0 }],
            xAxis: { type: 'category', data: data.labels, axisLabel: { color: '#e0e0e0', rotate: 25 } },
            yAxis: { type: 'value', axisLabel: { color: '#e0e0e0' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            series: [
                { name: 'Robusta', type: 'bar', data: data.robusta, itemStyle: { color: '#f1c40f', borderRadius: [4, 4, 0, 0] }, animationEasing: 'elasticOut', animationDelay: (idx) => idx * 30 },
                { name: 'Arabika', type: 'bar', data: data.arabika, itemStyle: { color: '#e67e22', borderRadius: [4, 4, 0, 0] }, animationEasing: 'elasticOut', animationDelay: (idx) => idx * 30 + 100 }
            ]
        };
        provChartInstance.setOption(option, true);
    } catch (error) { console.error("Gagal load Chart Provinsi:", error); }
}

async function fetchChartTrend() {
    try {
        const query = getQueryParams();
        const response = await fetch(`${API_URL}/chart/trend${query}`);
        const data = await response.json();
        
        const chartDom = document.getElementById('trendChart');
        if (!trendChartInstance) trendChartInstance = echarts.init(chartDom);
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: { data: ['Robusta', 'Arabika'], textStyle: { color: '#e0e0e0' } },
            grid: { left: '3%', right: '4%', bottom: '5%', containLabel: true },
            toolbox: { feature: { saveAsImage: { title: 'Download PNG' } }, iconStyle: { borderColor: '#fff' } },
            xAxis: { type: 'category', boundaryGap: false, data: data.labels, axisLabel: { color: '#e0e0e0' } },
            yAxis: { type: 'value', axisLabel: { color: '#e0e0e0' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            series: [
                { name: 'Robusta', type: 'line', data: data.robusta, smooth: true, lineStyle: { width: 3, color: '#f1c40f' }, symbolSize: 8, itemStyle: { color: '#f1c40f' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(241,196,15,0.4)' }, { offset: 1, color: 'rgba(241,196,15,0)' }]) } },
                { name: 'Arabika', type: 'line', data: data.arabika, smooth: true, lineStyle: { width: 3, color: '#e67e22' }, symbolSize: 8, itemStyle: { color: '#e67e22' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(230,126,34,0.4)' }, { offset: 1, color: 'rgba(230,126,34,0)' }]) } }
            ]
        };
        trendChartInstance.setOption(option, true);
    } catch (error) { console.error("Gagal load Chart Tren:", error); }
}

async function fetchTableData() {
    try {
        const query = getQueryParams();
        const response = await fetch(`${API_URL}/raw-data${query}`);
        const data = await response.json();

        const thead = document.getElementById('table-head');
        const tbody = document.getElementById('table-body');
        
        thead.innerHTML = "";
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Tidak ada data ditemukan.</td></tr>`;
            return;
        }

        const headers = Object.keys(data[0]);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.innerText = header;
            thead.appendChild(th);
        });

        data.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                let val = row[header];
                if (typeof val === 'number' && header !== 'Tahun') val = formatNumber(val);
                td.innerText = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Gagal load tabel:", error); }
}

// Fungsi Utama: Eksekusi Semua Update!
function updateDashboardData() {
    fetchKPI();
    fetchTopKabupaten(); // <-- Panggil fungsi baru disini
    fetchChartProvinsi();
    fetchTableData();
    fetchChartTrend(); 
}

document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');

        setTimeout(() => {
            if (targetId === 'overview-tab' && provChartInstance) provChartInstance.resize();
            if (targetId === 'trend-tab' && trendChartInstance) trendChartInstance.resize();
        }, 100);
    });
});

window.addEventListener('resize', () => {
    if (provChartInstance) provChartInstance.resize();
    if (trendChartInstance) trendChartInstance.resize();
});

window.onload = async () => {
    await loadYearOptions();
    updateDashboardData();
};